import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mermaid from "mermaid";
import { CONTRACT_VERSION, SCHEMA_PREFIX, loadSchemas, projectRoot } from "./contract.js";
import { foreignExtensionKeys } from "./extensions.js";
import { ruleCodeFindings } from "./rule-codes.js";
import { trackedFiles } from "./tracked-files.js";

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

export function markdownLinks(text: string): string[] {
  return [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1] ?? "");
}

export function mermaidBodies(text: string): string[] {
  return [...text.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map((match) => match[1] ?? "");
}

/** The tracked files under `directory` (src/tracked-files.ts): another session's worktree is never measured. */
async function walk(directory: string): Promise<string[]> {
  return trackedFiles(directory);
}

/** `text` split at its fenced code blocks: what lies outside them, and the line of a fence never closed. */
export interface FenceScan {
  outside: string;
  /** The 1-based line of the first opening fence that no closing fence matches. */
  unclosed?: number;
}

/**
 * `text` without its fenced code blocks (CommonMark 0.31.2 §4.5): a fence of three or more backticks or tildes, at
 * most three spaces in, closed by a line of the same character at least as long and nothing else. A backtick line
 * whose info string holds a backtick (```` ```code``` text ````) opens no fence: it is inline code. A fence never
 * closed is reported, and the text after it is still read, so a typo in a fence cannot hide a broken link.
 */
export function scanFences(text: string): FenceScan {
  const lines = text.split("\n");
  const kept: string[] = [];
  let fence: { marker: string; line: number } | undefined;
  for (const [index, line] of lines.entries()) {
    const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    const marker = open?.[1];
    if (fence === undefined) {
      if (marker !== undefined && !(marker[0] === "`" && (open?.[2] ?? "").includes("`"))) fence = { marker, line: index + 1 };
      else kept.push(line);
    } else if (marker !== undefined && marker[0] === fence.marker[0] && marker.length >= fence.marker.length && line.trim() === marker) {
      fence = undefined;
    }
  }
  if (fence === undefined) return { outside: kept.join("\n") };
  // The opening line was not a fence after all: read on from the line after it, fences included.
  const rest = scanFences(lines.slice(fence.line).join("\n"));
  return { outside: [...kept, rest.outside].join("\n"), unclosed: fence.line };
}

/** `text` without its fenced code blocks (`scanFences`). */
export function outsideFences(text: string): string {
  return scanFences(text).outside;
}

/**
 * A heading's anchor as GitHub renders it (github-slugger 2.0): the heading's rendered text in lower case, every
 * character that is not a letter, a mark, a digit, a space, `-` or `_` dropped, each space a `-`. Inline code, links,
 * emphasis and HTML tags render to their text first.
 */
const NAMED_ENTITIES: Readonly<Record<string, string>> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", copy: "\u00a9", reg: "\u00ae", hellip: "\u2026", ndash: "\u2013", mdash: "\u2014", lsquo: "\u2018", rsquo: "\u2019", ldquo: "\u201c", rdquo: "\u201d", middot: "\u00b7", times: "\u00d7", rarr: "\u2192", larr: "\u2190" };

/** A character reference as its character: a decimal or hexadecimal one, or a named one of `NAMED_ENTITIES`; any other is left as written. */
function decodeEntity(whole: string, body: string): string {
  const numeric = /^#(?:x([0-9a-f]{1,6})|([0-9]{1,7}))$/i.exec(body);
  if (numeric) {
    const code = numeric[1] !== undefined ? Number.parseInt(numeric[1], 16) : Number(numeric[2]);
    return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "\ufffd";
  }
  return Object.hasOwn(NAMED_ENTITIES, body) ? (NAMED_ENTITIES[body] as string) : whole;
}

export function headingSlug(heading: string): string {
  // A code span renders its text as written, `<id>` included; HTML outside one renders without its tags, and an entity
  // as its character. The span's text is set aside before tags are dropped, so `<id>` in code is not read as a tag.
  const spans: string[] = [];
  const rendered = heading
    .replace(/`+([^`]*)`+/g, (_whole, code: string) => `\u0000${spans.push(code) - 1}\u0000`)
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z][a-z0-9]*);/gi, (whole, body: string) => decodeEntity(whole, body))
    .replace(/\u0000(\d+)\u0000/g, (_whole, index: string) => spans[Number(index)] ?? "")
    .replace(/\*/g, "")
    .replace(/(^|\s)_+|_+(?=\s|$)/g, "$1")
    .trim()
    .toLowerCase();
  return rendered.replace(/[^\p{L}\p{M}\p{N} _-]/gu, "").replace(/ /g, "-");
}

/**
 * The fragments a Markdown file answers on GitHub: each heading's slug outside fenced code (a repeated slug gains
 * `-1`, `-2`, …), ATX (`# x`) and setext (a paragraph line underlined by `===` or `---`, CT-193), and every explicit
 * `id` or `name` of an HTML element. A YAML front matter block at the top is no heading.
 */
export function markdownAnchors(text: string): Set<string> {
  const anchors = new Set<string>();
  const seen = new Map<string, number>();
  const lines = outsideFences(text).split("\n");
  // Front matter: `---` on the first line up to the next `---`, which is not a setext underline.
  let start = 0;
  if (lines[0]?.trim() === "---") {
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (end > 0) start = end + 1;
  }
  // A GFM table: a row with `|` over a delimiter row that holds `|` or `:` (a run of `-` alone is a thematic break or an
  // underline, micromark-extension-gfm-table), and its rows up to a blank line. Its lines are no paragraph's.
  const table = new Set<number>();
  const delimiter = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;
  for (let index = start; index + 1 < lines.length; index += 1) {
    const head = lines[index] as string;
    const next = lines[index + 1] as string;
    if (table.has(index) || !head.includes("|") || !delimiter.test(next) || !/[|:]/.test(next)) continue;
    for (let row = index; row < lines.length && (lines[row] as string).trim() !== ""; row += 1) table.add(row);
  }
  const paragraphLine = (at: number) => {
    const line = lines[at];
    return line !== undefined && at >= start && !table.has(at) && line.trim() !== "" && !/^ {0,3}(?:#{1,6}(?:[ \t]|$)|[-*+][ \t]|\d{1,9}[.)][ \t]|>|(?:[-*_][ \t]*){3,}$|<)/.test(line);
  };
  for (let index = start; index < lines.length; index += 1) {
    const line = lines[index] as string;
    const atx = /^ {0,3}#{1,6}[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/.exec(line);
    let setext: string | undefined;
    if (!atx && !table.has(index) && /^ {0,3}(?:=+|-+)[ \t]*$/.test(line) && paragraphLine(index - 1)) {
      // A setext heading's text is its whole paragraph, its lines joined by a line break the slug then drops.
      let first = index - 1;
      while (paragraphLine(first - 1)) first -= 1;
      setext = lines.slice(first, index).map((part) => part.trim()).join("\n");
    }
    const heading = atx ? atx[1] ?? "" : setext;
    if (heading !== undefined) {
      const slug = headingSlug(heading);
      const count = seen.get(slug) ?? 0;
      seen.set(slug, count + 1);
      anchors.add(count === 0 ? slug : `${slug}-${count}`);
    }
    for (const match of line.matchAll(/<[a-z][a-z0-9]*\b[^>]*?\b(?:id|name)=["']([^"']+)["']/gi)) anchors.add((match[1] ?? "").toLowerCase());
  }
  return anchors;
}

const anchorCache = new Map<string, Set<string>>();

async function anchorsOf(file: string): Promise<Set<string>> {
  const cached = anchorCache.get(file);
  if (cached) return cached;
  const anchors = markdownAnchors(await readFile(file, "utf8"));
  anchorCache.set(file, anchors);
  return anchors;
}

/** `file`'s name relative to the project, with `/` on every platform. */
function shownName(file: string): string {
  return path.relative(projectRoot(), file).split(path.sep).join("/");
}

/**
 * Every relative link outside fenced code names a file that exists, and a fragment on a link to a Markdown file names
 * one of its headings or explicit anchors as GitHub renders them (CT-167). A line fragment (`#L12`, `#L12-L20`) and a
 * fragment on any other file are not checked.
 */
export async function checkLinks(file: string, text: string): Promise<string[]> {
  const findings: string[] = [];
  const name = shownName(file);
  const { outside, unclosed } = scanFences(text);
  if (unclosed !== undefined) findings.push(`${name}:${unclosed}: code fence never closed`);
  // A link quoted in inline code is text, not a link. A code span closes by a run of as many backticks, within its own
  // paragraph (CommonMark §6.1): a run that never closes is literal text, and the links after it are still read (CT-193).
  const spanless = outside.split(/(\n[ \t]*\n)/).map((block) => block.replace(/(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g, "")).join("");
  for (const raw of markdownLinks(spanless)) {
    // `<a b.md>` (CommonMark's angle destination) may hold spaces; otherwise the destination ends at the first space,
    // and what follows is the link's title.
    const angle = /^\s*<([^>]*)>/.exec(raw);
    const link = angle ? (angle[1] ?? "") : (raw.trim().split(/\s+/, 1)[0] ?? "");
    const hash = link.indexOf("#");
    const target = hash < 0 ? link : link.slice(0, hash);
    const fragment = hash < 0 ? undefined : link.slice(hash + 1);
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (!target && fragment === undefined) continue;
    let decoded: string;
    let decodedFragment: string | undefined;
    try {
      decoded = decodeURIComponent(target);
      decodedFragment = fragment === undefined ? undefined : decodeURIComponent(fragment);
    } catch { findings.push(`${name}: malformed link ${raw}`); continue; }
    const resolved = decoded ? path.resolve(path.dirname(file), decoded) : file;
    let isFile = false;
    try { isFile = (await stat(resolved)).isFile(); } catch { findings.push(`${name}: broken link ${raw}`); continue; }
    if (!decodedFragment || !isFile || !resolved.endsWith(".md") || /^L\d+(?:-L\d+)?$/.test(decodedFragment)) continue;
    if (!(await anchorsOf(resolved)).has(decodedFragment.toLowerCase())) findings.push(`${name}: broken anchor ${raw}`);
  }
  return findings;
}

export async function checkMermaid(file: string, text: string): Promise<string[]> {
  const findings: string[] = [];
  let index = 0;
  for (const body of mermaidBodies(text)) {
    index += 1;
    try {
      await mermaid.parse(body);
    } catch (error) {
      const message = String(error);
      // Mermaid 11 parses these diagram types in Node, then its browser-only
      // sanitizer throws. Parser errors are different and remain fatal.
      if (!/DOMPurify\.(?:addHook|sanitize) is not a function/.test(message)) {
        findings.push(`${shownName(file)}: Mermaid block ${index}: ${message}`);
      }
    }
  }
  return findings;
}

// #region glossary-profiles — docs: CONTEXT.md#language
/** G-12: the profile names the glossary gives, from its **Profile** entry. */
export function contextProfileNames(context: string): string[] {
  const paragraph = /^\*\*Profile\*\*:([\s\S]*?)(?:\n\s*\n|(?![\s\S]))/m.exec(context)?.[1] ?? "";
  const sentence = paragraph.split(/(?<=\.)\s/)[0] ?? "";
  return [...new Set([...sentence.matchAll(/`([a-z][a-z0-9-]*)`/g)].map((match) => match[1] ?? ""))].sort();
}

/** G-12: the profile kinds manifest.schema.json accepts: each branch the profile selects on its kind (REQ-03). */
export function schemaProfileKinds(manifest: unknown): string[] {
  const branches = (manifest as { $defs?: { profile?: { allOf?: Array<{ if?: { properties?: { kind?: { const?: string } } } }> } } }).$defs?.profile?.allOf ?? [];
  return branches.map((branch) => branch.if?.properties?.kind?.const ?? "").sort();
}
// #endregion glossary-profiles

/** G-13: one allocation and one definition of every semantic rule code (src/rule-codes.ts). */
export async function checkRuleCodes(root = projectRoot()): Promise<string[]> {
  // A path with `/` on every platform: the register is matched by `endsWith("/<file>")`.
  const read = async (file: string) => ({ path: path.relative(root, file).split(path.sep).join("/"), text: await readFile(file, "utf8") });
  const specDir = path.join(root, "docs", "specification");
  const specs = await Promise.all((await readdir(specDir)).filter((name) => name.endsWith(".md")).map((name) => read(path.join(specDir, name))));
  const sourceDir = path.join(root, "src");
  const sources = await Promise.all((await readdir(sourceDir)).filter((name) => name.endsWith(".ts")).map((name) => read(path.join(sourceDir, name))));
  const register = specs.find((spec) => spec.path.endsWith("conformance.md"));
  if (!register) return ["docs/specification/conformance.md: the semantic rule code register is missing (G-13)"];
  return ruleCodeFindings(register, specs.filter((spec) => spec !== register), sources);
}

/**
 * A decision's named paths resolve (DOCMAP: a decision's *Consequences / affects* is checked by `docs:check`).
 * Inside a decision's `Consequences / affects` bullet — which names this repository's files; another repository's
 * paths live in `Source` and `Why` — every backticked token starting `docs/`, `schemas/`, `src/`, `test/` or
 * `fixtures/` must name a tracked file, or match one when it is a glob (`*`) or a folder (`…/`). An anchor (`#…`)
 * or a line number (`:12`) is dropped first; a token holding a placeholder (`<…>`, `{…}`) names no file.
 */
export function decisionPathFindings(text: string, files: readonly string[]): string[] {
  const findings: string[] = [];
  let decision = "";
  let affects = false;
  // The register is append-only: a wrong path is corrected by an erratum line in its section, not by a rewrite.
  let errata = new Map<string, string>();
  text.split("\n").forEach((line, index) => {
    const heading = /^### (DEC-\d{4})/.exec(line);
    if (heading) { decision = heading[1] as string; affects = false; errata = new Map(); return; }
    const erratum = /^- \*\*Erratum[^*]*:\*\* the affected path `([^`]+)` is `([^`]+)`/.exec(line);
    if (erratum) errata.set(erratum[1] as string, erratum[2] as string);
    if (/^- \*\*/.test(line)) affects = /^- \*\*Consequences/.test(line);
    if (!decision || !affects) return;
    for (const match of line.matchAll(/`((?:docs|schemas|src|test|fixtures)\/[^`\s]+)`/g)) {
      const written = (match[1] as string).replace(/#.*$/, "").replace(/:\d+(?:-\d+)?$/, "").replace(/[),.;]+$/, "");
      const raw = errata.get(written) ?? written;
      if (/[<>{}]/.test(raw)) continue;
      const pattern = new RegExp(`^${raw.replace(/[.+?^$()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*")}$`);
      const directory = raw.endsWith("/") ? raw : undefined;
      // `schemas/comms-common` names a schema by its short name: `schemas/comms-common.schema.json`.
      const schemaName = raw.startsWith("schemas/") && !raw.includes(".") ? `${raw}.schema.json` : undefined;
      const found = directory ? files.some((file) => file.startsWith(directory)) : files.some((file) => pattern.test(file) || file === schemaName);
      if (!found) findings.push(`docs/DECISIONS.md:${index + 1}: ${decision}: missing path ${raw}`);
    }
  });
  return findings;
}

export async function runDocsCheck(): Promise<string[]> {
  anchorCache.clear();
  const root = projectRoot();
  const files = (await walk(root)).filter((file) => file.endsWith(".md"));
  const findings: string[] = [];
  for (const file of files) {
    const text = await readFile(file, "utf8");
    findings.push(...await checkLinks(file, text));
    findings.push(...await checkMermaid(file, text));
  }
  const keyed = (await walk(root)).filter((file) => /\.(md|json)$/.test(file) && !file.includes(`${path.sep}test${path.sep}`));
  for (const file of keyed) {
    for (const key of foreignExtensionKeys(await readFile(file, "utf8"))) findings.push(`${shownName(file)}: extension key ${key} is not one of EXTENSION_KEYS (G-08)`);
  }
  const context = contextProfileNames(await readFile(path.join(root, "CONTEXT.md"), "utf8"));
  const kinds = schemaProfileKinds(JSON.parse(await readFile(path.join(root, "schemas/manifest.schema.json"), "utf8")));
  if (context.join(",") !== kinds.join(",")) findings.push(`CONTEXT.md: profile names ${context.join(", ")} differ from manifest.schema.json ${kinds.join(", ")} (G-12)`);
  findings.push(...await checkRuleCodes(root));
  const tracked = (await walk(root)).map((file) => path.relative(root, file).split(path.sep).join("/"));
  findings.push(...decisionPathFindings(await readFile(path.join(root, "docs/DECISIONS.md"), "utf8"), tracked));
  const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8")) as { version?: string };
  if (packageJson.version !== CONTRACT_VERSION) findings.push(`package.json: expected version ${CONTRACT_VERSION}`);
  for (const schema of await loadSchemas()) {
    if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") findings.push(`${schema.$id}: wrong schema dialect`);
    if (!schema.$id.startsWith(SCHEMA_PREFIX)) findings.push(`${schema.$id}: wrong canonical prefix`);
  }
  return findings;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const findings = await runDocsCheck();
  if (findings.length) {
    console.error(findings.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Documentation checks passed");
  }
}
