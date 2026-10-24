// #region pin-check — docs: docs/specification/versioning.md#one-contract-pin
import { execFileSync } from "node:child_process";
import type { Dirent } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { SCHEMA_PREFIX } from "./contract.js";
import { createValidator, validateDocument } from "./validator.js";

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

export const LOCK_FILE = "fabric-contract.lock.json";
const PIN_SCHEMA = `${SCHEMA_PREFIX}schemas/contract-pin.schema.json`;
/** A commit as the lock writes it: the full 40-character id in lower-case hex (`contract-pin.schema.json`). */
const FULL_COMMIT = /^[0-9a-f]{40}$/;

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

/** How a pin stands against the contract's history: on it, off it, not checkable here, or not a commit id at all. */
export type PinHistory =
  | { state: "on-history"; base: string }
  | { state: "off-history"; base: string }
  | { state: "absent"; base: string }
  | { state: "unreadable"; reason: string }
  | { state: "malformed"; commit: string };

/**
 * Whether `commit` is a commit of the contract's published history: an ancestor of `origin/main` in the contract
 * checkout at `contractRoot` (or of `HEAD` where it has no `origin/main`). A pin that is not a full 40-character
 * lower-case hex id is `malformed` and git is not asked; a pin that no checkout holds, or that a rewritten history left
 * behind, is `off-history`; a checkout git cannot read is `unreadable`, which the CLI fails on too. `git` is injected
 * for tests.
 */
export function pinHistory(commit: string, contractRoot: string, git: (args: string[]) => string = (args) => execFileSync("git", ["-C", contractRoot, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })): PinHistory {
  if (!FULL_COMMIT.test(commit)) return { state: "malformed", commit };
  let base: string;
  try {
    base = git(["rev-parse", "--verify", "--quiet", "origin/main"]).trim() ? "origin/main" : "HEAD";
  } catch {
    base = "HEAD";
  }
  try {
    git(["rev-parse", "--verify", "--quiet", `${base}^{commit}`]);
  } catch {
    return { state: "unreadable", reason: `the contract checkout at ${contractRoot} has no ${base}` };
  }
  try {
    git(["cat-file", "-e", `${commit}^{commit}`]);
  } catch {
    // Not in this checkout: a newer commit it has not fetched, or one no history holds. Fetching tells them apart.
    return { state: "absent", base };
  }
  try {
    git(["merge-base", "--is-ancestor", commit, base]);
    return { state: "on-history", base };
  } catch {
    return { state: "off-history", base };
  }
}

/** What the CLI says about a history state that fails; `on-history` says nothing here (the success line does). */
export function historyMessage(history: PinHistory, commit: string): string | undefined {
  switch (history.state) {
    case "on-history":
      return undefined;
    case "malformed":
      return `the pin's commit ${JSON.stringify(history.commit)} is not a commit id: write the full 40-character lower-case hex commit (git rev-parse <ref> in the contract checkout prints it)`;
    case "off-history":
      return `the pin ${commit} is in this contract checkout but not on its history (${history.base}): repin to a commit of ${history.base}`;
    case "absent":
      return `the pin ${commit} is not in this contract checkout: run git fetch in the contract and check again; if it is still absent, no published history holds it`;
    case "unreadable":
      return `the pin cannot be checked against the contract's history: ${history.reason}`;
  }
}

/**
 * Dated records name the revision of their day, and a consumer excludes them (versioning.md, "One contract pin"):
 * changelogs, handoffs, evidence and task-pipeline runs. `--include-dated` scans them too.
 */
export const DATED_RECORDS: readonly string[] = ["docs/handoffs", "docs/evidence", ".task-pipeline"];
const DATED_FILE = /^CHANGELOG/;

/** Whether `relative` (to the repository root, `/`-separated) is a dated record the check skips by default. */
export function isDatedRecord(relative: string): boolean {
  if (DATED_FILE.test(path.basename(relative))) return true;
  const posix = relative.split(path.sep).join("/");
  return DATED_RECORDS.some((prefix) => posix === prefix || posix.startsWith(`${prefix}/`));
}

async function walk(root: string, directory: string, excluded: string[], includeDated: boolean): Promise<string[]> {
  const out: string[] = [];
  // A folder the walk cannot read (a mode-000 or root-owned folder) holds no mention it could check: skip it.
  let entries: Dirent[];
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    // The repository itself unreadable is no clean run: nothing was checked.
    if (directory === root) throw error;
    return out;
  }
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const target = path.join(directory, entry.name);
    const relative = path.relative(root, target);
    if (excluded.some((prefix) => relative === prefix || relative.startsWith(`${prefix}${path.sep}`))) continue;
    if (!includeDated && isDatedRecord(relative)) continue;
    if (entry.isDirectory()) out.push(...await walk(root, target, excluded, includeDated));
    else if (/\.(md|json|ya?ml|py|m?js|ts|toml|txt)$/.test(entry.name)) out.push(target);
  }
  return out;
}

/**
 * The CLI's exit code: 1 on any drifting mention, or when the pin is not a commit of the contract's history; 2 when
 * the pin is no commit id at all, which is a mistake in the lock (as a schema failure is), not a drift.
 */
export const exitCodeOf = (drift: PinDrift[], history: PinHistory): 0 | 1 | 2 => (history.state === "malformed" ? 2 : drift.length > 0 || history.state !== "on-history" ? 1 : 0);

/**
 * The lock's problems against `contract-pin.schema.json`, one line each; a commit of the wrong shape is `malformed`.
 * A member the schema does not define is not a problem here but a note (`lockExtras`): this command read locks
 * without their schema before 2026-10-21, and a consumer's lock carries such members (`adapter`, `kit`: not pin
 * members, DEC-0120).
 */
export async function lockProblems(lock: unknown): Promise<string[]> {
  const result = validateDocument(await createValidator(), PIN_SCHEMA, lock);
  const problems = new Set<string>();
  for (const error of result.errors) {
    if (error.keyword === "additionalProperties") continue;
    if (error.instancePath === "/commit") {
      const commit = (lock as { commit: unknown }).commit;
      problems.add(historyMessage({ state: "malformed", commit: typeof commit === "string" ? commit : JSON.stringify(commit) }, "") as string);
      continue;
    }
    const where = error.instancePath || "the lock";
    const allowed = error.keyword === "const" ? `: it must be ${JSON.stringify(error.params.allowedValue)}`
      : error.keyword === "enum" ? `: one of ${(error.params.allowedValues as unknown[]).map((value) => JSON.stringify(value)).join(", ")}`
        : ` ${error.message}`;
    problems.add(`${where}${allowed}`);
  }
  return [...problems];
}

/** The lock's members `contract-pin.schema.json` does not define, in the lock's order. */
export function lockExtras(lock: unknown): string[] {
  if (typeof lock !== "object" || lock === null || Array.isArray(lock)) return [];
  return Object.keys(lock).filter((member) => !PIN_MEMBERS.includes(member));
}
/** The members `contract-pin.schema.json` defines; a test holds this list equal to the schema's `properties`. */
export const PIN_MEMBERS: readonly string[] = ["contract", "version", "repository", "commit", "profile"];

export interface PinCheckIo {
  out: (line: string) => void;
  err: (line: string) => void;
  /** The contract checkout whose history the pin is checked against; default this kit's own. */
  contractRoot?: string;
  git?: (args: string[]) => string;
}

const USAGE = `usage: pin:check <repository> [--pin <file>] [--exclude <path>]... [--include-dated]`;
const defaultIo: PinCheckIo = { out: (line) => console.log(line), err: (line) => console.error(line) };

/** CLI: `tsx src/pin-check.ts <repository> [--pin fabric-contract.lock.json] [--exclude <path>]... [--include-dated]` */
export async function main(argv: string[], io: PinCheckIo = defaultIo): Promise<0 | 1 | 2> {
  const positional: string[] = [];
  const excluded: string[] = [];
  let pinArgument: string | undefined;
  let includeDated = false;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index] as string;
    if (value === "--include-dated") includeDated = true;
    else if (value === "--pin" || value === "--exclude") {
      const next = argv[index + 1];
      if (next === undefined || next.startsWith("--")) {
        io.err(`${value} needs a path; ${USAGE}`);
        return 2;
      }
      if (value === "--pin") pinArgument = next;
      else excluded.push(path.normalize(next).replace(/[\\/]+$/, ""));
      index += 1;
    } else if (value.startsWith("--")) {
      io.err(`unknown option ${value}; ${USAGE}`);
      return 2;
    } else positional.push(value);
  }
  if (positional.length > 1) {
    io.err(`one repository, not ${positional.length}; ${USAGE}`);
    return 2;
  }
  // `pnpm --dir <contract checkout> pin:check .` runs in the checkout; a relative path is the consumer's, from where
  // pnpm was run (INIT_CWD), as `pnpm validate` reads it.
  const base = process.env.npm_lifecycle_event === "pin:check" && process.env.INIT_CWD !== undefined ? process.env.INIT_CWD : process.cwd();
  const root = path.resolve(base, positional[0] ?? ".");
  if (!(await stat(root).then((entry) => entry.isDirectory(), () => false))) {
    io.err(`no repository folder at ${root}; ${USAGE}`);
    return 2;
  }
  const pinFile = path.resolve(root, pinArgument ?? LOCK_FILE);
  let text: string;
  try {
    text = await readFile(pinFile, "utf8");
  } catch {
    io.err(`no ${path.basename(pinFile)} at ${pinFile}; create one: {contract, version, repository, commit} (schemas/contract-pin.schema.json)`);
    return 2;
  }
  let lock: unknown;
  try {
    lock = JSON.parse(text);
  } catch (error) {
    io.err(`${pinFile} is not JSON (${(error as Error).message}); a pin is {contract, version, repository, commit} (schemas/contract-pin.schema.json)`);
    return 2;
  }
  const problems = await lockProblems(lock);
  if (problems.length > 0) {
    io.err(`${pinFile} is not a contract pin (schemas/contract-pin.schema.json):`);
    for (const problem of problems) io.err(`  ${problem}`);
    return 2;
  }
  for (const member of lockExtras(lock)) io.out(`note: ${JSON.stringify(member)} in ${path.basename(pinFile)} is not a member of a pin (schemas/contract-pin.schema.json); this check ignores it`);
  const pin = lock as ContractPin;
  // A file the walk lists but cannot be read (a broken link, a folder named like a file) holds no mention: skip it.
  let listed: string[];
  try {
    listed = await walk(root, root, [path.relative(root, pinFile), ...excluded], includeDated);
  } catch (error) {
    io.err(`cannot read ${root}: ${String((error as NodeJS.ErrnoException).code)}`);
    return 2;
  }
  const files = (await Promise.all(listed.map(async (file) => {
    try {
      return [{ path: path.relative(root, file).split(path.sep).join("/"), text: await readFile(file, "utf8") }];
    } catch {
      return [];
    }
  }))).flat();
  const drift = findPinDrift(files, pin);
  for (const item of drift) io.err(item.message);
  const history = pinHistory(pin.commit, io.contractRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), io.git);
  const failure = historyMessage(history, pin.commit);
  if (failure) io.err(failure);
  if (drift.length > 0) io.err(`${drift.length} mention(s) drift from the pin`);
  const code = exitCodeOf(drift, history);
  // Exit 0 means no drift and a pin on the history, so `history` is `on-history` here and carries its base.
  if (code === 0) io.out(`every contract mention equals the pin ${pin.commit}, and the pin is on the contract's history (${(history as { base: string }).base})`);
  return code;
}

/** Runs `main` when this file is the process's entry point; a test calls it with another entry to see it stay idle. */
export async function runIfEntry(moduleUrl: string, argv: string[], run: (args: string[]) => Promise<number> = main): Promise<void> {
  if (argv[1] !== undefined && moduleUrl === pathToFileURL(argv[1]).href) process.exitCode = await run(argv.slice(2));
}

await runIfEntry(import.meta.url, process.argv);
// #endregion pin-check
