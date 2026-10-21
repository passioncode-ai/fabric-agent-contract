import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { exitCodeOf, historyMessage, isDatedRecord, lockProblems, main, pinHistory, runIfEntry, type PinCheckIo } from "../src/pin-check.js";

// REQ-07 (contract review 2026-10-21): the pin:check CLI on a missing lock, a lock its schema refuses, a malformed
// commit, the dated records versioning.md excludes, and the success line that only exit 0 prints.
const root = projectRoot();
const ON_MAIN = execFileSync("git", ["-C", root, "rev-parse", "63bb296"], { encoding: "utf8" }).trim();
const OTHER = "20a818e648a4c09a60df0126d11626922e8b9094";
const pinOf = (commit: string) => ({ contract: "fabric-agent-contract", version: "0.1.0", repository: "https://github.com/passioncode-ai/fabric-agent-contract", commit });
const scratch = mkdtempSync(path.join(tmpdir(), "pin-check-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

let serial = 0;
/** A consumer checkout: its files by repository-relative path; `lock` is written as the lock file unless it is null. */
function consumer(files: Record<string, string>, lock: unknown = pinOf(ON_MAIN)): string {
  const dir = path.join(scratch, `consumer-${(serial += 1)}`);
  mkdirSync(dir);
  if (lock !== null) writeFileSync(path.join(dir, "fabric-contract.lock.json"), typeof lock === "string" ? lock : JSON.stringify(lock));
  for (const [relative, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, relative)), { recursive: true });
    writeFileSync(path.join(dir, relative), text);
  }
  return dir;
}

/** A git that answers as a contract checkout would: the pin on origin/main's history, or not. */
const fakeGit = (ancestor: boolean) => (args: string[]) => {
  if (args[0] === "merge-base" && !ancestor) throw new Error("not an ancestor");
  return "abc\n";
};

/** Runs main with captured output; `git: "real"` asks this kit's own git instead of the fake one. */
async function run(args: string[], options: { git?: ((args: string[]) => string) | "real"; contractRoot?: string } = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const io: PinCheckIo = { out: (line) => out.push(line), err: (line) => err.push(line) };
  if (options.git !== "real") io.git = options.git ?? fakeGit(true);
  if (options.contractRoot !== undefined) io.contractRoot = options.contractRoot;
  const code = await main(args, io);
  return { code, out, err };
}

describe("pin:check: the lock file", () => {
  it("names a missing lock, says what to put in it, and exits 2 without a stack trace", async () => {
    const dir = consumer({ "README.md": "x" }, null);
    const result = await run([dir]);
    expect(result).toEqual({ code: 2, out: [], err: [`no fabric-contract.lock.json at ${path.join(dir, "fabric-contract.lock.json")}; create one: {contract, version, repository, commit} (schemas/contract-pin.schema.json)`] });
  });

  it("names the file --pin points at when it is missing", async () => {
    const dir = consumer({});
    const result = await run([dir, "--pin", "pins/lock.json"]);
    expect(result.code).toBe(2);
    expect(result.err).toEqual([`no lock.json at ${path.join(dir, "pins/lock.json")}; create one: {contract, version, repository, commit} (schemas/contract-pin.schema.json)`]);
  });

  it("reads the repository from the working directory when none is named", async () => {
    const result = await run([]);
    expect(result.code).toBe(2);
    expect(result.err[0]).toContain(`no fabric-contract.lock.json at ${path.resolve("fabric-contract.lock.json")}`);
  });

  it("refuses a lock that is not JSON", async () => {
    const result = await run([consumer({}, "{ not json")]);
    expect(result.code).toBe(2);
    expect(result.err[0]).toMatch(/is not JSON \(.+\); a pin is \{contract, version, repository, commit\}/);
  });

  it("validates the lock against contract-pin.schema.json and lists each problem", async () => {
    const result = await run([consumer({}, { ...pinOf(ON_MAIN), contract: "other-contract", extra: 1, profile: "rest", version: "one" })]);
    expect(result.code).toBe(2);
    expect(result.err[0]).toMatch(/is not a contract pin \(schemas\/contract-pin\.schema\.json\):$/);
    expect(result.err.slice(1)).toEqual([
      '  the lock: "extra" is not a member of a pin',
      '  /contract: it must be "fabric-agent-contract"',
      expect.stringMatching(/^ {2}\/version must match pattern/),
      '  /profile: one of "mcp", "a2a", "local-runner"'
    ]);
    const { commit: _commit, ...withoutCommit } = pinOf(ON_MAIN);
    expect(await lockProblems(withoutCommit)).toEqual(["the lock must have required property 'commit'"]);
    expect(await lockProblems(pinOf(ON_MAIN))).toEqual([]);
  });
});

describe("pin:check: a malformed commit is its own state", () => {
  for (const commit of ["main", ON_MAIN.toUpperCase(), ON_MAIN.slice(0, 7), `${ON_MAIN}0`]) {
    it(`calls ${JSON.stringify(commit)} malformed, asks git nothing, and exits 2`, async () => {
      expect(pinHistory(commit, ".", () => { throw new Error("git must not be asked"); })).toEqual({ state: "malformed", commit });
      const result = await run([consumer({}, pinOf(commit))]);
      expect(result.code).toBe(2);
      expect(result.out).toEqual([]);
      expect(result.err.slice(1)).toEqual([`  the pin's commit ${JSON.stringify(commit)} is not a commit id: write the full 40-character lower-case hex commit (git rev-parse <ref> in the contract checkout prints it)`]);
      expect(result.err.join("\n")).not.toContain("in this contract checkout");
    });
  }

  it("names a commit that is not a string, once, though the schema reports it twice", async () => {
    expect(await lockProblems(pinOf(42 as unknown as string))).toEqual([expect.stringContaining('the pin\'s commit "42" is not a commit id')]);
  });

  it("exits 2 on the malformed state, 1 on drift or any other failing state, 0 only on the history", () => {
    expect(exitCodeOf([], { state: "malformed", commit: "main" })).toBe(2);
    expect(historyMessage({ state: "on-history", base: "HEAD" }, ON_MAIN)).toBeUndefined();
    expect(historyMessage({ state: "malformed", commit: "main" }, "main")).not.toContain("checkout but");
  });
});

describe("pin:check: dated records", () => {
  const dated = {
    "CHANGELOG.md": `Fabric Agent Contract at ${OTHER}`,
    "packages/kit/CHANGELOG-2026.md": `contract pin ${OTHER}`,
    "docs/handoffs/2026-09-01.md": `contract commit ${OTHER}`,
    "docs/evidence/run/proof.md": `contract revision ${OTHER}`,
    ".task-pipeline/run/state.json": `{"contract_commit": "${OTHER}"}`
  };

  it("skips changelogs, handoffs, evidence and task-pipeline runs by default", async () => {
    const result = await run([consumer({ ...dated, "README.md": `Fabric Agent Contract \`${ON_MAIN.slice(0, 7)}\`` })]);
    expect(result).toEqual({ code: 0, err: [], out: [`every contract mention equals the pin ${ON_MAIN}, and the pin is on the contract's history (origin/main)`] });
  });

  it("scans them with --include-dated", async () => {
    const result = await run([consumer(dated), "--include-dated"]);
    expect(result.code).toBe(1);
    expect(result.out).toEqual([]);
    expect(result.err.filter((line) => line.includes("names contract revision")).map((line) => line.split(":")[0]).sort()).toEqual(Object.keys(dated).sort());
    expect(result.err.at(-1)).toBe("5 mention(s) drift from the pin");
  });

  it("still takes --exclude paths, beside the dated records", async () => {
    const dir = consumer({ "vendor/notes.md": `fabric-agent-contract ${OTHER}`, "docs/handoffs/old.md": `contract pin ${OTHER}` });
    expect((await run([dir])).code).toBe(1);
    expect((await run([dir, "--exclude", "vendor/"])).code).toBe(0);
    expect((await run([dir, "--exclude", "vendor", "--include-dated"])).code).toBe(1);
  });

  it("knows a dated record by its path", () => {
    expect(["CHANGELOG", "CHANGELOG.md", "a/b/CHANGELOG.txt", "docs/handoffs", "docs/handoffs/x.md", "docs/evidence/a/b.json", ".task-pipeline/x"].filter(isDatedRecord)).toHaveLength(7);
    expect(["README.md", "docs/handoffs-old/x.md", "docs/specification/x.md", "changelog.md", "src/evidence/x.ts"].filter(isDatedRecord)).toEqual([]);
  });
});

describe("pin:check: what it prints", () => {
  it("prints the success line, with the history it checked, only on exit 0", async () => {
    const dir = consumer({ "README.md": `fabric-agent-contract ${ON_MAIN}` });
    expect(await run([dir])).toEqual({ code: 0, err: [], out: [`every contract mention equals the pin ${ON_MAIN}, and the pin is on the contract's history (origin/main)`] });
  });

  it("reads only text files outside .git and node_modules, and takes words and plain numbers for no commit", async () => {
    const elsewhere = { ".git/notes.md": `fabric-agent-contract ${OTHER}`, "node_modules/kit/README.md": `fabric-agent-contract ${OTHER}`, "logo.png": `fabric-agent-contract ${OTHER}` };
    const result = await run([consumer({ ...elsewhere, "README.md": "fabric-agent-contract deadbeefcafe at 1234567890" })]);
    expect(result).toMatchObject({ code: 0, err: [] });
  });

  it("checks against HEAD when the contract checkout has no origin/main", async () => {
    const result = await run([consumer({})], { git: (args) => (args.includes("origin/main") ? "" : "abc\n") });
    expect(result.out).toEqual([`every contract mention equals the pin ${ON_MAIN}, and the pin is on the contract's history (HEAD)`]);
  });

  it("prints no success line when the pin is off the history, though no mention drifts", async () => {
    const result = await run([consumer({ "README.md": `fabric-agent-contract ${ON_MAIN}` })], { git: fakeGit(false) });
    expect(result).toEqual({ code: 1, out: [], err: [`the pin ${ON_MAIN} is in this contract checkout but not on its history (origin/main): repin to a commit of origin/main`] });
  });

  it("prints the drift and its count, and no success line", async () => {
    const result = await run([consumer({ "README.md": `fabric-agent-contract ${OTHER}` })]);
    expect(result).toEqual({ code: 1, out: [], err: [`README.md:1 names contract revision ${OTHER}, but the pin is ${ON_MAIN}`, "1 mention(s) drift from the pin"] });
  });

  it("names a pin this checkout does not hold, and a checkout git cannot read", async () => {
    const absent = await run([consumer({})], { git: (args) => { if (args[0] === "cat-file") throw new Error("missing"); return "abc\n"; } });
    expect(absent.code).toBe(1);
    expect(absent.err).toEqual([expect.stringContaining("is not in this contract checkout: run git fetch")]);
    const unreadable = await run([consumer({})], { git: () => { throw new Error("no git"); } });
    expect(unreadable.code).toBe(1);
    expect(unreadable.err).toEqual([expect.stringContaining("the pin cannot be checked against the contract's history: the contract checkout at")]);
  });

  it("checks against this kit's own checkout by default", async () => {
    const result = await run([consumer({})], { git: "real" });
    expect(result).toEqual({ code: 0, err: [], out: [expect.stringMatching(/^every contract mention equals the pin [0-9a-f]{40}, and the pin is on the contract's history \((origin\/main|HEAD)\)$/)] });
    expect((await run([consumer({})], { git: "real", contractRoot: scratch })).code).toBe(1);
  });
});

describe("pin:check: usage", () => {
  it("exits 2 on a missing option value, an unknown option, two repositories or no repository folder", async () => {
    const dir = consumer({});
    expect(await run([dir, "--pin"])).toMatchObject({ code: 2, err: [expect.stringContaining("--pin needs a path; usage: pin:check")] });
    expect(await run([dir, "--exclude", "--include-dated"])).toMatchObject({ code: 2, err: [expect.stringContaining("--exclude needs a path")] });
    expect(await run([dir, "--strict"])).toMatchObject({ code: 2, err: [expect.stringContaining("unknown option --strict")] });
    expect(await run([dir, dir])).toMatchObject({ code: 2, err: [expect.stringContaining("one repository, not 2")] });
    expect(await run([path.join(scratch, "nowhere")])).toMatchObject({ code: 2, err: [expect.stringContaining("no repository folder at")] });
  });

  it("runs main only when the file is the process's entry point", async () => {
    const calls: string[][] = [];
    const record = async (args: string[]) => { calls.push(args); return 2; };
    const entry = path.join(root, "src/pin-check.ts");
    const before = process.exitCode;
    try {
      await runIfEntry(pathToFileURL(entry).href, ["node"], record);
      await runIfEntry(pathToFileURL(entry).href, ["node", path.join(root, "src/other.ts")], record);
      expect(calls).toEqual([]);
      await runIfEntry(pathToFileURL(entry).href, ["node", entry, "repo", "--include-dated"], record);
      expect(calls).toEqual([["repo", "--include-dated"]]);
      expect(process.exitCode).toBe(2);
    } finally {
      process.exitCode = before;
    }
  });

  it("is the pnpm pin:check entry point: the CLI exits 2 on a missing lock", () => {
    const dir = consumer({}, null);
    let status = 0;
    let stderr = "";
    try {
      execFileSync(process.execPath, ["--import", "tsx", path.join(root, "src/pin-check.ts"), dir], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 20000 });
    } catch (error) {
      status = (error as { status: number }).status;
      stderr = (error as { stderr: string }).stderr;
    }
    expect(status).toBe(2);
    expect(stderr.trim()).toBe(`no fabric-contract.lock.json at ${path.join(dir, "fabric-contract.lock.json")}; create one: {contract, version, repository, commit} (schemas/contract-pin.schema.json)`);
  }, 30000);
});
