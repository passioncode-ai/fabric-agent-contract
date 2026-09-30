// #region pin-check — docs: docs/specification/versioning.md#one-contract-pin
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** A consumer's one pin (`fabric-contract.lock.json`, schema `contract-pin.schema.json`). */
export interface ContractPin {
  contract: "fabric-agent-contract" | string;
  version: string;
  repository: string;
  commit: string;
}

export interface PinDrift {
  path: string;
  line: number;
  found: string;
  message: string;
}

// A line is about this contract when it names it (or its pin) — a bare "contract"
// is too common a word — or when it sits under a Markdown heading that does.
const MENTIONS_CONTRACT = /fabric[- ]agent[- ]contract|contract[-_ ]?(pin|commit|revision)|CONTRACT_COMMIT/i;
const HEADING = /^#{1,6}\s/;
const HEX = /(?<![0-9a-zA-Z:])[0-9a-f]{7,40}(?![0-9a-zA-Z])/g;

/**
 * Every commit-like hash on a line that talks about the contract, and that is not
 * the pinned commit (in full or abbreviated to at least seven characters).
 */
export function findPinDrift(files: Array<{ path: string; text: string }>, pin: ContractPin): PinDrift[] {
  const drift: PinDrift[] = [];
  for (const file of files) {
    let section = false;
    file.text.split("\n").forEach((text, index) => {
      if (HEADING.test(text)) section = MENTIONS_CONTRACT.test(text);
      if (!section && !MENTIONS_CONTRACT.test(text)) return;
      for (const match of text.matchAll(HEX)) {
        const found = match[0];
        if (!/[a-f]/.test(found) || !/[0-9]/.test(found)) continue; // words and plain numbers are not commits
        if (pin.commit.startsWith(found)) continue;
        drift.push({ path: file.path, line: index + 1, found, message: `${file.path}:${index + 1} names contract revision ${found}, but the pin is ${pin.commit}` });
      }
    });
  }
  return drift;
}

async function walk(root: string, directory: string, excluded: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    const relative = path.relative(root, target);
    if (excluded.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`))) continue;
    if (entry.isDirectory()) out.push(...await walk(root, target, excluded));
    else if (/\.(md|json|ya?ml|py|m?js|ts|toml|txt)$/.test(entry.name)) out.push(target);
  }
  return out;
}

/** CLI: `tsx src/pin-check.ts <repository> [--pin fabric-contract.lock.json] [--exclude <path>]...` */
async function main(argv: string[]): Promise<number> {
  const root = path.resolve(argv[0] ?? ".");
  const pinIndex = argv.indexOf("--pin");
  const pinFile = path.resolve(root, pinIndex >= 0 ? argv[pinIndex + 1] ?? "" : "fabric-contract.lock.json");
  const excluded = argv.flatMap((value, index) => (argv[index - 1] === "--exclude" ? [value] : []));
  const pin = JSON.parse(await readFile(pinFile, "utf8")) as ContractPin;
  const files = await Promise.all((await walk(root, root, [path.relative(root, pinFile), ...excluded])).map(async (file) => ({ path: path.relative(root, file), text: await readFile(file, "utf8") })));
  const drift = findPinDrift(files, pin);
  for (const item of drift) console.error(item.message);
  console.log(drift.length ? `${drift.length} mention(s) drift from the pin` : `every contract mention equals the pin ${pin.commit}`);
  return drift.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
// #endregion pin-check
