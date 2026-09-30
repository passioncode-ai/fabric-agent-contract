import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import mermaid from "mermaid";
import { CONTRACT_VERSION, SCHEMA_PREFIX, loadSchemas, projectRoot } from "./contract.js";
import { foreignExtensionKeys } from "./extensions.js";

mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

export function markdownLinks(text: string): string[] {
  return [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((match) => match[1] ?? "");
}

export function mermaidBodies(text: string): string[] {
  return [...text.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)].map((match) => match[1] ?? "");
}

async function walk(directory: string): Promise<string[]> {
  const output: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(target));
    else output.push(target);
  }
  return output;
}

export async function checkLinks(file: string, text: string): Promise<string[]> {
  const findings: string[] = [];
  for (const raw of markdownLinks(text)) {
    const target = raw.replace(/^<|>$/g, "").split("#", 1)[0] ?? "";
    if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    try { await stat(resolved); } catch { findings.push(`${path.relative(projectRoot(), file)}: broken link ${raw}`); }
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

/** G-12: the profile kinds manifest.schema.json accepts. */
export function schemaProfileKinds(manifest: unknown): string[] {
  const variants = (manifest as { $defs?: { profile?: { oneOf?: Array<{ properties?: { kind?: { const?: string } } }> } } }).$defs?.profile?.oneOf ?? [];
  return variants.map((variant) => variant.properties?.kind?.const ?? "").sort();
}
// #endregion glossary-profiles

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
