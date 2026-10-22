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

export async function checkLinks(file: string, text: string): Promise<string[]> {
  const findings: string[] = [];
  const name = path.relative(projectRoot(), file);
  const { outside, unclosed } = scanFences(text);
  if (unclosed !== undefined) findings.push(`${name}:${unclosed}: code fence never closed`);
  for (const raw of markdownLinks(outside)) {
    const target = raw.replace(/^<|>$/g, "").split("#", 1)[0] ?? "";
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    let decoded: string;
    try { decoded = decodeURIComponent(target); } catch { findings.push(`${name}: malformed link ${raw}`); continue; }
    try { await stat(path.resolve(path.dirname(file), decoded)); } catch { findings.push(`${name}: broken link ${raw}`); }
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
        findings.push(`${path.relative(projectRoot(), file)}: Mermaid block ${index}: ${message}`);
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
  const read = async (file: string) => ({ path: path.relative(root, file), text: await readFile(file, "utf8") });
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
    for (const key of foreignExtensionKeys(await readFile(file, "utf8"))) findings.push(`${path.relative(root, file)}: extension key ${key} is not one of EXTENSION_KEYS (G-08)`);
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
