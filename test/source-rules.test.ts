import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { JWT_SHAPE, hasJwt, jwtSpans } from "../src/secret-shape.js";
import { hasHomePath } from "../src/activity-rules.js";
import {
  BLOCKING_KINDS,
  CREDENTIAL_FILE,
  CREDENTIAL_FILE_OK,
  KEY_SHAPE_SOURCES,
  KEY_SHAPES,
  NEUTRAL_HOMES,
  SOURCE_HOME_PATHS,
  TOKEN_FILE,
  URL_SECRET_VALUE,
  SYNTHETIC,
  SLOT_KINDS,
  SOURCE_FILE,
  SOURCE_FILE_PATH,
  SOURCE_FORMAT,
  SOURCE_PATH,
  WARNING_KINDS,
  checkSourceTree,
  excludedFolderTest,
  isSourcePath,
  isUncheckedPath,
  longRunAt,
  masked,
  nestedInSource,
  patchPathsAllowed,
  pathHoldsFinding,
  sourceFolderTest,
  sourcePackageFindings,
  sourceRules,
  sourceTreeProblems
} from "../src/source-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { buildSourceTreeVectors } from "../tools/vectors/source-tree.js";
import { PACKAGE_FILE, checkPackageFolder, sha256Of } from "../src/package-rules.js";

// DEC-0149: an agent's source (fabric.source.json, fabric-source/1) kept apart from its instance; the tree check
// (FAC-SEM-158, FAC-SEM-159), the manifest's own rules (FAC-SEM-156, FAC-SEM-157) and the package pair (FAC-SEM-160).
type Json = Record<string, any>;

/** This process's processor time in ms: a loaded machine's other work does not inflate it as it does the wall clock. */
const cpuMs = (): number => { const used = process.cpuUsage(); return (used.user + used.system) / 1000; };
/** One call's processor time: repeated until a trial lasts 20 ms, the best of three trials. */
const cpuOf = (run: () => unknown): number => {
  run();
  return Math.min(...[0, 1, 2].map(() => {
    const started = cpuMs();
    let calls = 0;
    do { run(); calls += 1; } while (cpuMs() - started < 20);
    return (cpuMs() - started) / calls;
  }));
};
/**
 * A text's check at full size against the same text at a sixteenth, measured in the same test: linear work grows about
 * 16 times and quadratic work about 256, so the ratio is held under 64 instead of a fixed time, which a loaded machine
 * can exceed.
 */
const growth = (make: (count: number) => string, count: number, check: (text: string) => unknown): number => {
  const large = make(count);
  const small = make(Math.ceil(count / 16));
  return cpuOf(() => check(large)) / Math.max(cpuOf(() => check(small)), 0.01);
};
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const load = (relative: string) => JSON.parse(read(`fixtures/${relative}`)) as Json;
const vectors = JSON.parse(read("fixtures/vectors/source-tree.json")) as { constants: Json; manifest: Json; tree: Json[]; patches: Json[] };
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/fabric-source.schema.json`, value).valid;
const schema = JSON.parse(read("schemas/fabric-source.schema.json")) as Json;
const packageSchema = JSON.parse(read("schemas/fabric-package.schema.json")) as Json;
const semantic = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("source-"));
const manifest = vectors.manifest;
// Assembled here, so no line of this file is shaped like a credential.
const KEY = ["sk", "-", "A1".repeat(12)].join("");

describe("the source-tree vectors (DEC-0149)", () => {
  it("are what the generator writes", () => {
    expect(read("fixtures/vectors/source-tree.json")).toBe(buildSourceTreeVectors());
  });

  it.each(vectors.tree.map((vector) => [vector.name, vector] as const))("sourceTreeProblems: %s", (_name, vector) => {
    expect(sourceTreeProblems(vector.input)).toEqual(vector.expected);
  });

  it.each(vectors.patches.map((vector) => [vector.name, vector] as const))("patchPathsAllowed: %s", (_name, vector) => {
    expect(patchPathsAllowed(vector.input.manifest, vector.input.paths)).toEqual(vector.expected);
  });

  it("carry the constants a port holds equal, as src/source-rules.ts exports them", () => {
    const pattern = (value: RegExp) => ({ source: value.source, flags: value.flags });
    expect(vectors.constants.NEUTRAL_HOMES).toEqual([...NEUTRAL_HOMES]);
    expect(vectors.constants.SYNTHETIC).toEqual([...SYNTHETIC]);
    expect(vectors.constants.SOURCE_HOME_PATHS).toEqual(SOURCE_HOME_PATHS.map(pattern));
    expect(vectors.constants.CREDENTIAL_FILE).toEqual(pattern(CREDENTIAL_FILE));
    expect(vectors.constants.CREDENTIAL_FILE_OK).toEqual(pattern(CREDENTIAL_FILE_OK));
    expect(vectors.constants.TOKEN_FILE).toEqual(pattern(TOKEN_FILE));
    expect(vectors.constants.KEY_SHAPE_SOURCES).toEqual([...KEY_SHAPE_SOURCES]);
    expect(vectors.constants.URL_SECRET_VALUE).toEqual(pattern(URL_SECRET_VALUE));
  });

  it("keep the tree check's own provider-key shapes, unbounded, written out and apart from the shared detector", () => {
    expect([...KEY_SHAPE_SOURCES]).toEqual(["sk-[A-Za-z0-9_-]{16,}", "gh[pousr]_[A-Za-z0-9]{20,}", "xox[abposr]-[A-Za-z0-9-]{10,}", "AKIA[0-9A-Z]{16}", "glpat-[A-Za-z0-9_-]{20,}"]);
    expect(URL_SECRET_VALUE.source).toBe(`(^bearer\\s.+|${KEY_SHAPE_SOURCES.join("|")})`);
    expect(URL_SECRET_VALUE.flags).toBe("i");
  });

  it("cover every kind the check reports", () => {
    const kinds = new Set(vectors.tree.flatMap((vector) => vector.expected.map((problem: Json) => problem.kind)));
    expect([...kinds].sort()).toEqual([...BLOCKING_KINDS, ...WARNING_KINDS].sort());
  });
});

describe("the hand-over's refusal details (DEC-0149)", () => {
  it("each fit a delegation refusal's error.data.detail under the code source.md gives it", () => {
    const page = readFileSync(path.join(root, "docs/specification/source.md"), "utf8");
    const section = page.slice(page.indexOf("## Handing over"), page.indexOf("## Import"));
    const details = [...new Set([...section.matchAll(/`((?:handover|decision|idempotency)-[a-z0-9-]+)`/g)].map((match) => match[1] as string))].filter((detail) => detail !== "decision-invalid");
    expect(details).toEqual(expect.arrayContaining(["handover-needs-operator", "handover-needs-estate-route", "handover-declined", "handover-in-flight", "decision-ap2", "decision-without-target", "decision-target-unbound", "decision-consumed", "idempotency-conflict"]));
    const codeOf = (detail: string) => (detail.startsWith("handover-in-flight") ? "unknown-state" : detail.startsWith("handover-") ? "operator-decision-required" : "decision-invalid");
    for (const detail of details) {
      const refusal = { error: { code: codeOf(detail), message: "refused", data: { detail } } };
      expect(validateDocument(validator, `${SCHEMA_PREFIX}schemas/delegation-refusal.schema.json`, refusal).valid, detail).toBe(true);
    }
  });
});

describe("the semantic fixtures", () => {
  it("hold a positive and a negative case of each rule", () => {
    expect(semantic).toHaveLength(27);
    for (const code of ["FAC-SEM-156", "FAC-SEM-157", "FAC-SEM-158", "FAC-SEM-159", "FAC-SEM-160"]) {
      expect(semantic.some((name) => [...load(`semantic/${name}`).expect, ...(load(`semantic/${name}`).accepted ?? [])].includes(code)), code).toBe(true);
    }
    for (const kind of ["source-manifest", "source-tree", "source-package"]) {
      expect(semantic.some((name) => load(`semantic/${name}`).kind === kind && load(`semantic/${name}`).expect.length === 0), kind).toBe(true);
    }
  });

  // A warning (FAC-SEM-159) is accepted: a note beside the result, never a failure, so a fixture lists it apart.
  it.each(semantic)("%s answers the codes it expects", (name) => {
    const fixture = load(`semantic/${name}`);
    const findings = evaluateSemanticRules(fixture.kind, fixture.input);
    expect(findings.filter((finding) => finding.severity !== "accepted").map((finding) => finding.code)).toEqual(fixture.expect);
    expect(findings.filter((finding) => finding.severity === "accepted").map((finding) => finding.code)).toEqual(fixture.accepted ?? []);
    if (fixture.kind === "source-manifest") expect(valid(fixture.input)).toBe(true);
    if (fixture.kind === "source-tree") expect(valid(fixture.input.manifest)).toBe(true);
    if (fixture.kind === "source-package") expect(valid(fixture.input.source)).toBe(true);
  });
});

describe("the schema", () => {
  it("repeats the package's path grammar for a file, and allows a trailing slash for a folder", () => {
    expect(schema.$defs.file.pattern).toBe(packageSchema.$defs.path.pattern);
    expect(SOURCE_FILE_PATH.source.replace(/\\\//g, "/")).toBe(schema.$defs.file.pattern);
    expect(SOURCE_PATH.source.replace(/\\\//g, "/")).toBe(schema.$defs.path.pattern);
    expect(schema.properties.format.const).toBe(SOURCE_FORMAT);
    expect(schema.$defs.slot.properties.kind.enum).toEqual(SLOT_KINDS);
    expect(schema.$defs.slot.properties.name.pattern).toBe(packageSchema.properties.secrets.items.properties.name.pattern);
  });

  it("has no member that could hold a slot's value", () => {
    expect(Object.keys(schema.$defs.slot.properties).sort()).toEqual(["kind", "name", "optional", "path", "purpose"]);
    expect(valid({ format: SOURCE_FORMAT, include: ["src/"], slots: [{ name: "MAIL_OAUTH", kind: "secret", purpose: "reads the mailbox", value: "x" }] })).toBe(false);
  });

  it("gives a store slot a path and no other slot one", () => {
    const slot = (kind: string, extra: Json = {}) => ({ format: SOURCE_FORMAT, include: ["src/"], slots: [{ name: "SLOT", kind, purpose: "a slot", ...extra }] });
    expect(valid(slot("store", { path: "journal.sqlite" }))).toBe(true);
    expect(valid(slot("store"))).toBe(false);
    for (const kind of ["secret", "config", "endpoint"]) {
      expect(valid(slot(kind)), kind).toBe(true);
      expect(valid(slot(kind, { path: "journal.sqlite" })), kind).toBe(false);
    }
  });
});

describe("which files are source", () => {
  it("reads include as default deny, exclude as holes, and never .git", () => {
    expect(isSourcePath(manifest, "src/main.ts")).toBe(true);
    expect(isSourcePath(manifest, "README.md")).toBe(true);
    expect(isSourcePath(manifest, "README.md.bak")).toBe(false);
    expect(isSourcePath(manifest, "src/generated/x.ts")).toBe(false);
    expect(isSourcePath(manifest, "tests/x.ts")).toBe(false);
    expect(isSourcePath({ ...manifest, include: [".git/"] }, ".git/config")).toBe(false);
    expect(isSourcePath(manifest, "src/vendor/.git/HEAD")).toBe(false);
  });

  it("keeps the manifest in the source, and refuses a path outside the grammar", () => {
    expect(isSourcePath({ include: [] }, SOURCE_FILE)).toBe(true);
    expect(isSourcePath(manifest, "src/../x")).toBe(false);
    expect(isSourcePath(manifest, "src/")).toBe(false);
    expect(isSourcePath(manifest, 7)).toBe(false);
    expect(isSourcePath(null, "src/main.ts")).toBe(false);
    expect(isSourcePath({ include: "src/" }, "src/main.ts")).toBe(false);
  });

  it("reads a nested repository as in the source when an include path reaches it and no exclude path names it", () => {
    expect(nestedInSource(manifest, "src/vendor/lib")).toBe(true);
    expect(nestedInSource(manifest, "src/vendor/lib/")).toBe(true);
    expect(nestedInSource({ include: ["src/vendor/lib/a.ts"] }, "src/vendor/lib")).toBe(true);
    expect(nestedInSource({ include: ["src/vendor/lib"] }, "src/vendor/lib")).toBe(true);
    expect(nestedInSource({ include: ["src/"], exclude: ["src/vendor/lib"] }, "src/vendor/lib")).toBe(false);
    expect(nestedInSource({ include: ["src/"], exclude: ["src/vendor/"] }, "src/vendor/lib")).toBe(false);
    expect(nestedInSource(manifest, "tests/sub")).toBe(false);
    for (const path of [7, "src/../x", "src/.git/x"]) expect(nestedInSource(manifest, path), String(path)).toBe(false);
    expect(nestedInSource(null, "src/vendor/lib")).toBe(false);
  });

  it("refuses a patch's paths given as anything but a list", () => {
    expect(patchPathsAllowed(manifest, "src/main.ts" as unknown as string[])).toEqual([]);
    expect(patchPathsAllowed(manifest, [3, "src/main.ts"])).toEqual(["3"]);
  });
});

describe("FAC-SEM-158 and FAC-SEM-159: the tree check", () => {
  const base = vectors.tree[0]?.input as Json;
  const tree = (files: Json[], extra: Json = {}) => ({ ...base, files: [...base.files, ...files], ...extra });

  it("blocks under FAC-SEM-158 and warns under FAC-SEM-159, accepted", () => {
    const findings = checkSourceTree(tree([{ path: "src/keys.ts", text: `const key = "${KEY}";` }, { path: "docs/team.md", text: "Ask someone@mail.org." }]));
    expect(findings.map((finding) => [finding.code, finding.severity, finding.instancePath])).toEqual([
      ["FAC-SEM-158", undefined, "/files/4"],
      ["FAC-SEM-159", "accepted", "/files/5"]
    ]);
    expect(findings[0]?.message).toBe("src/keys.ts line 1, column 14: credential: shaped like a credential: a key reaches the agent through its slot, never through the source");
  });

  it("labels a file whose path holds a finding files[<index>] even where its finding is an address in its text", () => {
    // A 44-character mixed-case run, assembled here.
    const longRun = Array.from({ length: 11 }, (_, index) => `Qm${index % 10}z`).join("");
    const findings = checkSourceTree(tree([{ path: `src/${longRun}.js`, text: `// ${["someone", "mail.org"].join("@")}` }]));
    expect(findings.length).toBeGreaterThan(0);
    expect(JSON.stringify(findings)).not.toContain(longRun);
    expect(findings.every((finding) => finding.message.startsWith("files[4]"))).toBe(true);
  });

  it("reads a long run per segment of a file's path: a path of ordinary names is named by its path", () => {
    const plain = "packages/CoreLib2/src/Components/Button3/Index.tsx";
    const findings = checkSourceTree({ ...tree([{ path: plain, text: `see ${["/Us", "ers/jdoe/notes"].join("")}` }]), manifest: { ...base.manifest, include: [...base.manifest.include, "packages/"] } });
    expect(findings.map((finding) => finding.message.split(" line ")[0])).toEqual([plain]);
    expect(pathHoldsFinding(plain)).toBe(false);
    // A segment that is itself a long run still holds one.
    expect(pathHoldsFinding(`src/${"Ab1".repeat(14)}.ts`)).toBe(true);
    expect(longRunAt("src/ok.ts")).toBe(-1);
    // A long run that does not mix cases and digits is passed over for the next one.
    expect(longRunAt(`${"a".repeat(45)} ${"Ab1".repeat(14)}`)).toBe(46);
  });

  it("never repeats what it found, and names a file by its index when its own path holds the finding", () => {
    const input = tree(
      [{ path: "docs/example-holding/notes.md", text: "example holding" }, { path: "src/keys.ts", text: `const key = "${KEY}"; // /Users/jdoe` }, { path: "src/.env", text: "x" }],
      { instanceStrings: ["example-holding", "example holding"] }
    );
    const findings = checkSourceTree(input);
    const text = JSON.stringify(findings);
    for (const found of [KEY, "example-holding", "example holding", "jdoe"]) expect(text).not.toContain(found);
    expect(findings.map((finding) => [finding.instancePath, finding.message])).toEqual([
      ["/files/4/path", "files[4], its path: instance-string: a string of the operator's list: the installation's own strings never travel (entry 0 of the operator's list)"],
      ["/files/4", "files[4] line 1, column 1: instance-string: a string of the operator's list: the installation's own strings never travel (entry 1 of the operator's list)"],
      ["/files/5", "src/keys.ts line 1, column 54: home-path: a path in a person's home folder belongs to the instance, never to the source"],
      ["/files/5", "src/keys.ts line 1, column 14: credential: shaped like a credential: a key reaches the agent through its slot, never through the source"],
      ["/files/6/path", "files[6], its path: credential: a credential file by its name (.env, a private key, a token file) is never source"]
    ]);
  });

  it("names the manifest's paths and the operator's list by index", () => {
    const missing = checkSourceTree({ manifest, files: [], instanceStrings: [7] });
    expect(missing.map((finding) => [finding.code, finding.instancePath])).toEqual([
      ["FAC-SEM-158", "/instanceStrings/0"],
      ["FAC-SEM-158", "/manifest/include/0"],
      ["FAC-SEM-158", "/manifest/include/1"],
      ["FAC-SEM-158", "/manifest/include/2"],
      ["FAC-SEM-158", "/manifest/include/3"],
      ["FAC-SEM-159", "/files"]
    ]);
    expect(missing[1]?.message).toBe("missing: an include path names no file of the tree (include[0])");
    expect(checkSourceTree({ manifest: {}, files: [] })[0]).toEqual({ code: "FAC-SEM-158", instancePath: "/manifest/include", message: "no-include: the source manifest names no include path, so nothing is source" });
    const binary = checkSourceTree(tree([{ path: "docs/diagram.png", binary: true, text: KEY }]));
    expect(binary).toEqual([{ code: "FAC-SEM-158", instancePath: "/files/4", message: "docs/diagram.png: binary: a binary file the manifest does not list in binaries: its content cannot be read, so it is source only when listed" }]);
  });

  it("reads a line's every kind, in order", () => {
    const line = `/Users/jdoe "${KEY}" example holding someone@mail.org [x](../../out.md)`;
    const problems = sourceTreeProblems(tree([{ path: "docs/all.md", text: line }], { instanceStrings: ["example holding"] }));
    expect(problems.map((problem) => problem.kind)).toEqual(["home-path", "credential", "instance-string", "email", "link-outside"]);
  });

  it("reads a home folder as the adapter's check does, not as the value scanner hasHomePath does (DEC-0149 item 8)", () => {
    const homes = (text: string) => sourceTreeProblems(tree([{ path: "src/h.txt", text }])).map((problem) => problem.column);
    for (const neutral of NEUTRAL_HOMES) expect(homes(`/Users/${neutral.toUpperCase()}`), neutral).toEqual([]);
    expect(NEUTRAL_HOMES).toHaveLength(38);
    // A neutral name first does not hide a named one later on the line.
    expect(homes("/Users/example and /home/jdoe")).toEqual([26]);
    for (const portable of ["~/x", "cd ~", "/users/123", "--home-dir", "/Users/a"]) {
      expect(homes(portable), portable).toEqual([]);
    }
    // hasHomePath, the scanner for values that hold no path at all, is unchanged and still refuses them.
    expect(hasHomePath("~/x")).toBe(true);
    expect(hasHomePath("/Users/example")).toBe(true);
  });

  it("reads lines split at LF with a trailing CR dropped, as the adapter does, and a file without text as empty", () => {
    const problems = sourceTreeProblems(tree([{ path: "src/a.ts", text: "a\r\nb\r/Users/jdoe\nc" }, { path: "src/b.ts" }, { path: "src/c.ts", text: 4 }]));
    expect(problems).toEqual([{ kind: "home-path", file: 4, line: 2, column: 10 }]);
  });

  it("follows a link root-relative, through dot segments, to a folder, and reads a link it cannot decode as written", () => {
    const links = (text: string) => sourceTreeProblems(tree([{ path: "docs/links.md", text }])).map((problem) => problem.kind);
    expect(links("[a](/src/main.ts) [b](./guide.md) [c](../src) [d](../docs/) [e](<guide.md>) [f](guide.md \"title\") [g](mailto:x) [h](//cdn.example/x) [i](./)")).toEqual([]);
    expect(links("[a](/tests/x.md)")).toEqual(["link-outside"]);
    expect(links("[a](../src/generated/x.ts)")).toEqual(["link-outside"]);
    expect(links("[a](../%E0%A4%A.md)")).toEqual(["link-outside"]);
    expect(links("[a](guide.md#part) [b](guide.md?x=1)")).toEqual([]);
  });

  it("passes the reserved example names and the listed addresses in any letter case", () => {
    const mail = (text: string) => sourceTreeProblems(tree([{ path: "docs/mail.md", text }])).map((problem) => problem.kind);
    expect(mail("SUPPORT@Inbox-Digest.example a@example.org b@mail.example.com c@host.invalid d@host.test e@host.example")).toEqual([]);
    expect(mail("a@example.company")).toEqual(["email"]);
  });

  it("refuses a credential shape only where the detector's shapes are", () => {
    const credential = (text: string) => sourceTreeProblems(tree([{ path: "src/a.ts", text }])).map((problem) => problem.kind);
    const run = "Ab1".repeat(14);
    expect(credential(`"secret": "${run}"`)).toEqual(["credential"]);
    expect(credential(`"signature": "${run}"`)).toEqual(["credential"]);
    expect(credential(`sig = "${"Ab1Cd2".repeat(14)}Ab"`)).toEqual(["credential"]);
    expect(credential(`"sig": "${"Ab1Cd2".repeat(14)}Ab"`)).toEqual([]);
    expect(credential(`"note": "${run}"`)).toEqual([]);
    expect(credential(`"secret": "${"ab".repeat(30)}"`)).toEqual([]);
  });

  it("passes a value that says it is synthetic, by the adapter's words, without regard to case", () => {
    expect(SYNTHETIC).toEqual(["example", "not-a-key", "notakey", "fake", "dummy", "placeholder", "redacted"]);
    const credential = (text: string) => sourceTreeProblems(tree([{ path: "src/a.ts", text }])).map((problem) => problem.kind);
    const run = "Ab1".repeat(14);
    for (const word of SYNTHETIC) expect(credential(`"secret": "${run}${word.toUpperCase()}"`), word).toEqual([]);
    expect(credential(`"secret": "${run}"`)).toEqual(["credential"]);
    expect(credential(`{"d": "${"Ab1Cd2".repeat(7)}FAKE"}`)).toEqual([]);
    expect(credential(`token = eyJhbGciOiJ${"Ab1".repeat(4)}.eyJleGFtcGxlIjp0cnVlfQ.dummy`)).toEqual([]);
    // A private key block is never synthetic.
    expect(credential(["-----BEGIN ", "PRIVATE KEY----- example"].join(""))).toEqual(["credential"]);
  });

  it("reads an instance string in NFC both ways, and an asset's name and an SSH remote are no address", () => {
    const found = (text: string, entry: string) => sourceTreeProblems(tree([{ path: "docs/x.md", text }], { instanceStrings: [entry] })).map((problem) => problem.kind);
    expect(found("Run by caf\u00e9 holding.", "cafe\u0301 holding")).toEqual(["instance-string"]);
    const mail = (text: string) => sourceTreeProblems(tree([{ path: "docs/m.md", text }])).map((problem) => problem.kind);
    expect(mail(["icon", "@2x.png and logo", "@3x.WEBP"].join(""))).toEqual([]);
    expect(mail(["git", "@host.org:owner/repo"].join(""))).toEqual([]);
    expect(mail(["git", "@host.org is an address"].join(""))).toEqual(["email"]);
    expect(mail([" ", "@host.org has no local part, a@b has no domain"].join(""))).toEqual([]);
  });

  it("reads a URL's password, query and fragment as the adapter does", () => {
    const credential = (text: string) => sourceTreeProblems(tree([{ path: "src/u.txt", text }])).map((problem) => problem.kind);
    const run = "Ab1".repeat(14);
    expect(credential(`https://app.example.org/cb#access_token=${run}`)).toEqual(["credential"]);
    expect(credential("file://app:Ab3dE5gH7k@host/x")).toEqual([]);
    expect(credential("https://app:Ab3dE5gH7kexample@host/x")).toEqual([]);
    expect(credential("https://app:short1@host/x")).toEqual([]);
    expect(credential(`https://app.example.org/?q=${KEY}`)).toEqual(["credential"]);
    expect(credential("https://app.example.org/?token=%FF%FE")).toEqual([]);
    expect(credential(`https://app.example.org/?q=${encodeURIComponent(`https://b.example.org/?c=${encodeURIComponent(`https://c.example.org/?token=${run}`)}`)}`)).toEqual(["credential"]);
    const deep = `https://d.example.org/?token=${run}`;
    expect(credential(`https://a.example.org/?q=${encodeURIComponent(`https://b.example.org/?q=${encodeURIComponent(`https://c.example.org/?q=${encodeURIComponent(deep)}`)}`)}`)).toEqual([]);
  });

  it("checks a one-line file of 1 MB in linear time, with an @, a scheme, an assignment or none", () => {
    const check = (text: string) => sourceTreeProblems(tree([{ path: "src/long.txt", text }]));
    for (const [make, count] of [[(n: number) => "a".repeat(n), 1_000_000], [(n: number) => `${"a".repeat(n)}@mail.org`, 999_990], [(n: number) => `${"a.".repeat(n)}@`, 500_000], [(n: number) => "Ab1-".repeat(n), 250_000], [(n: number) => "a@".repeat(n), 500_000], [(n: number) => "a://".repeat(n), 250_000], [(n: number) => "x=".repeat(n), 500_000]] as const) {
      expect(growth(make, count, check), make(2)).toBeLessThan(64);
    }
  }, 180_000);

  it("finds JWTs in one pass, exactly where JWT_SHAPE finds them", () => {
    const alphabet = ["e", "y", "J", "eyJ", ".", "a", "B", "1", "-", "_", " ", "/", "eyJx", "ab", ".."];
    let seed = 7;
    const next = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed; };
    const all = new RegExp(JWT_SHAPE.source, "g");
    for (let sample = 0; sample < 20_000; sample += 1) {
      const text = Array.from({ length: next() % 24 }, () => alphabet[next() % alphabet.length]).join("");
      expect(hasJwt(text), text).toBe(JWT_SHAPE.test(text));
      expect(jwtSpans(text), text).toEqual([...text.matchAll(all)].map((match) => [match.index, (match.index as number) + match[0].length]));
    }
    for (const text of ["", "eyJab.cd.", "xeyJab.cd.ef", "eyJa.cd.ef", "eyJab.c.ef", "eyJab.cd", "eyJeyJab.cd.e eyJxy.zz.q"]) {
      expect(jwtSpans(text), text).toEqual([...text.matchAll(all)].map((match) => [match.index, (match.index as number) + match[0].length]));
    }
  });

  it("checks a 1 MB line of JWT openings or assignments in linear time", () => {
    const check = (text: string) => sourceTreeProblems(tree([{ path: "src/long.txt", text }]));
    for (const [make, count] of [[(n: number) => "eyJ".repeat(n), 333_333], [(n: number) => `https://h/?q=${"eyJ".repeat(n)}`, 333_000], [(n: number) => `${"a=" + "Ab1".repeat(13) + "A "}`.repeat(n), 46_500]] as const) {
      expect(growth(make, count, check), make(2)).toBeLessThan(64);
    }
  }, 180_000);

  it("checks a 1 MB line of trailing punctuation or repeated query parameters in linear time", () => {
    const check = (text: string) => sourceTreeProblems(tree([{ path: "src/long.txt", text }]));
    for (const [make, count] of [[(n: number) => `http://a${".".repeat(n)}x`, 1_000_000], [(n: number) => `http://a/${")".repeat(n)}q`, 1_000_000], [(n: number) => `http://a/?${"a=b&".repeat(n)}`, 250_000], [(n: number) => JSON.stringify(`http://a/?${"a=b&".repeat(n)}`).replace(/\//g, "\\/"), 250_000]] as const) {
      expect(growth(make, count, check), make(2)).toBeLessThan(64);
    }
  }, 180_000);

  it("checks a 1 MB line of key prefixes in linear time, each prefix's run found by bisection", () => {
    const check = (text: string) => sourceTreeProblems(tree([{ path: "src/long.txt", text }]));
    for (const [make, count] of [[(n: number) => "sk-".repeat(n), 350_000], [(n: number) => `${"sk-".repeat(n)}${"A1b2C3d4".repeat(3)}`, 330_000], [(n: number) => "ghp_".repeat(n), 250_000], [(n: number) => "xoxb-".repeat(n), 200_000], [(n: number) => "glpat-".repeat(n), 170_000], [(n: number) => "AKIA".repeat(n), 250_000], [(n: number) => `${"Bearer ".repeat(n)}x`, 140_000]] as const) {
      expect(growth(make, count, check), make(2)).toBeLessThan(64);
    }
  }, 180_000);

  it("reads an AKIA key only when sixteen upper-case letters or digits follow it", () => {
    const kinds = (text: string) => sourceTreeProblems(tree([{ path: "src/k.ts", text }])).map((problem) => problem.kind);
    expect(kinds(`id = AKIA${"Q7".repeat(3)}`)).toEqual([]);
    expect(kinds(`id = AKIA${"Q7".repeat(8)}`)).toEqual(["credential"]);
  });

  it("reads a token or credential file whose name holds a line or paragraph separator, as Python's dot reads it", () => {
    const paths = (names: string[]) => sourceTreeProblems(tree(names.map((path) => ({ path, text: "x" })))).map((problem) => problem.kind);
    expect(paths(["src/a\u2028b.token", "src/a\u2029b.credential", "src/a\u0085b.token"])).toEqual(["credential", "credential", "credential"]);
    expect(paths(["src/a\nb.token"])).toEqual([]);
  });

  it("resolves a 1 MB line of links in a 4,000-file tree in time linear in the line", () => {
    const many = Array.from({ length: 4000 }, (_, index) => ({ path: `src/d${index % 50}/f${index}.ts`, text: "x" }));
    expect(growth((n) => "](/z)".repeat(n), 200_000, (text) => sourceTreeProblems(tree([...many, { path: "src/a.md", text }])))).toBeLessThan(64);
  }, 180_000);

  it("scans a Markdown line of many link openings in linear time", () => {
    const check = (text: string) => sourceTreeProblems(tree([{ path: "src/a.md", text }]));
    for (const [make, count] of [[(n: number) => "](".repeat(n), 200_000], [(n: number) => "]( x".repeat(n), 100_000]] as const) {
      expect(growth(make, count, check), make(2)).toBeLessThan(64);
    }
  }, 180_000);

  it("reads the character before a key as a code point: a letter outside the BMP starts no word, a lone surrogate is none", () => {
    const keys = (text: string) => sourceTreeProblems(tree([{ path: "src/k.ts", text }])).map((problem) => problem.kind);
    const run = "A1b2C3d4".repeat(3);
    expect(keys(`\u{1d400}sk-${run}`)).toEqual([]);
    expect(keys(`\udc00sk-${run}`)).toEqual(["credential"]);
    expect(keys(`x\udc00sk-${run}`)).toEqual(["credential"]);
  });

  it("warns on no e-mail address inside a credential URL found only once the line's JSON escapes are undone", () => {
    const kinds = (text: string) => sourceTreeProblems(tree([{ path: "src/db.json", text }])).map((problem) => problem.kind);
    expect(kinds(`{"u": "postgres:\\/\\/app:${["Ab3dE5", "gH7k"].join("")}@db.example.internal\\/app"}`)).toEqual(["credential"]);
    expect(kinds("{\"u\": \"see someone@db.example.internal\\/x\"}")).toEqual(["email"]);
    expect(kinds(`url: postgres:\\/\\/app:${["Ab3dE5", "gH7k"].join("")}@db.example.internal\\/app`)).toEqual(["credential"]);
  });

  it("derive each key shape's prefix, run and least length from its source", () => {
    expect(KEY_SHAPES.map((shape) => (shape.whole !== undefined ? shape.whole.source : `${shape.prefix.source}${(shape.run as RegExp).source.replace(/\+$/, "")}{${shape.least},}`))).toEqual([...KEY_SHAPE_SOURCES]);
    expect(KEY_SHAPES.map((shape) => shape.least)).toEqual([16, 20, 10, undefined, 20]);
  });

  it("hold a provider key glued after a letter in a path with its own shapes, whatever bound the shared detector takes", () => {
    const glued = ["src/xsk", "-", "AbCdEfGh1234567890.ts"].join("");
    expect(pathHoldsFinding(glued)).toBe(true);
  });

  it("read a line holding a run of millions of characters without throwing", () => {
    const base64 = "QUJDRGVmZ2gxMjM0".repeat(375_000);
    const mixed = "Ab1Cd2Ef3Gh4".repeat(500_000);
    const problems = (text: string) => sourceTreeProblems({ manifest: { include: ["a.txt"] }, files: [{ path: "a.txt", text }] }).filter((problem) => problem.kind !== "no-license");
    expect(problems(`export const wasm = "${base64}";`)).toEqual([]);
    expect(problems(`token = "${mixed}"`)).toEqual([{ kind: "credential", file: 0, line: 1, column: 10 }]);
    expect(problems(`token = "${"%41%62%31".repeat(2_000_000)}"`)).toEqual([{ kind: "credential", file: 0, line: 1, column: 10 }]);
  }, 180_000);

  it("decode percent escapes by hand: lower-case hex, a stray % left as written", () => {
    const kinds = (text: string) => sourceTreeProblems({ manifest: { include: ["a.md"] }, files: [{ path: "a.md", text }] }).map((problem) => problem.kind);
    // `%6a` is `j`: the value decodes to a long mixed run under a credential's name.
    expect(kinds(`token = "${"Ab1Cd2Ef3%6a".repeat(5)}"`)).toEqual(["credential", "no-license"]);
    // A `%` with no escape after it stays as written, and the parameter holds nothing.
    expect(kinds("https://api.example.org/v1?q=100%zz%25")).toEqual(["no-license"]);
  });

  it("read a slot's purpose as a package secret's, and the description as prose", () => {
    const purpose = (text: string) => evaluateSemanticRules("source-manifest", { ...manifest, slots: [{ name: "BOARD", kind: "secret", purpose: text }] });
    const description = (text: string) => evaluateSemanticRules("source-manifest", { ...manifest, description: text });
    // The description is prose: a sentence that starts with the word Bearer is no credential, a bearer token inside it is.
    expect(description("Bearer token for the board API")).toEqual([]);
    // A key shape inside a word, or under a synthetic word, is no key, as the tree check reads it in a line.
    expect(description("desk-booking-service-api")).toEqual([]);
    expect(description("uses sk-example-key-0123456789abcdef")).toEqual([]);
    expect(description(["Bearer ", "ab12cd34ef56"].join("")).map((finding) => finding.instancePath)).toEqual(["/description"]);
    // A slot's purpose is read as FAC-SEM-065 reads a package secret's (so pack copies it unchanged and it packs
    // cleanly) and as the tree check reads a line: FAC-SEM-156 blocks every purpose either blocks.
    const packed = (text: string) => evaluateSemanticRules("package", { schema: "fabric-package/1", secrets: [{ name: "BOARD", purpose: text }] }).some((finding) => finding.code === "FAC-SEM-065");
    const treeBlocks = (text: string) => sourceTreeProblems({ manifest: { include: ["a.txt", "LICENSE"] }, files: [{ path: "LICENSE", text: "x" }, { path: "a.txt", text }] }).some((problem) => problem.kind === "credential");
    const cases = ["Bearer token for the board API", ["Bearer ", "ab12cd34ef56"].join(""), "sk-learn-experiments-2026", ["the key for ", "sk", "-learn-experiments-2026", " runs"].join(""), "reads the board", ["SK", "-", "Ab1Cd2Ef3Gh4Ij5Kl6Mn"].join(""), ["token = ", "Ab1Cd2Ef3Gh4".repeat(4)].join("")];
    for (const text of cases) {
      if (packed(text) || treeBlocks(text)) expect(purpose(text).length > 0, text).toBe(true);
    }
    expect(purpose("reads the board")).toEqual([]);
    // A purpose that becomes a JWK's private member only once the manifest quotes it is caught in that form too.
    const quoted = ["d", '": "', "a1b2c3d4".repeat(5), "e5f"].join("");
    expect(treeBlocks(quoted)).toBe(false);
    expect(treeBlocks(JSON.stringify({ purpose: quoted }))).toBe(true);
    expect(purpose(quoted).map((finding) => finding.instancePath)).toEqual(["/slots/0/purpose"]);
  });

  it("skip a folder in a walk when an exclude folder is it or holds it, unless an include path lies under it", () => {
    const skipped = excludedFolderTest({ include: ["src/", "src/cache/keep/"], exclude: ["src/cache/", "src/tmp/"] });
    expect(["src/tmp", "src/tmp/x"].map(skipped)).toEqual([true, true]);
    expect(["src", "src/cache", "src/a"].map(skipped)).toEqual([false, false, false]);
    expect(excludedFolderTest(7)("src")).toBe(false);
  });

  it("skip folders in time linear in the include paths", () => {
    const manifestOf = (count: number) => ({ include: Array.from({ length: count }, (_, index) => `src/d${index}/`), exclude: Array.from({ length: count }, (_, index) => `src/d${index}/cache/`) });
    const probe = (count: number) => {
      const skipped = excludedFolderTest(manifestOf(count));
      for (let index = 0; index < count; index += 1) skipped(`src/d${index}/cache`);
    };
    // Sixteen times the includes, each looked up once: linear about 16, a scan of every include per folder about 256.
    expect(cpuOf(() => probe(16_000)) / Math.max(cpuOf(() => probe(1000)), 0.01)).toBeLessThan(64);
  });

  it("judge a folder in the source as a whole: an include folder holds it, no exclude folder does", () => {
    const inSource = sourceFolderTest({ include: ["src/", "lib/a/", "README.md"], exclude: ["src/vendor/"] });
    expect(["src", "src/x", "lib/a", "lib/a/b"].map(inSource)).toEqual([true, true, true, true]);
    expect(["", "lib", "README.md", "src/vendor", "src/vendor/x", "src/.git"].map(inSource)).toEqual([false, false, false, false, false, false]);
    expect(sourceFolderTest(7)("src")).toBe(false);
  });

  it("name a package secret with no name as (none), never as a value", () => {
    const findings = evaluateSemanticRules("source-package", { source: { ...manifest, slots: [] }, package: { secrets: [{ purpose: "x" }] } });
    expect(findings.map((finding) => finding.message)).toContain("secret (none) is no secret slot of the source");
  });

  it("give the description and a line the same verdict on a provider key, whatever the shared detector reads", () => {
    const mixedKey = ["SK", "-", "Ab1Cd2Ef3Gh4Ij5Kl6Mn"].join("");
    for (const value of ["sk-learn-experiments-2026", mixedKey, "a plain description"]) {
      const prose = evaluateSemanticRules("source-manifest", { ...manifest, description: value }).length > 0;
      const line = sourceTreeProblems({ manifest: { include: ["a.txt", "LICENSE"] }, files: [{ path: "LICENSE", text: "x" }, { path: "a.txt", text: `about ${value}` }] }).length > 0;
      expect(prose, value).toBe(line);
      expect(prose, value).toBe(value !== "a plain description");
    }
  });

  it("reads no whole-value bearer branch in a line: its own key shapes have none", () => {
    expect(KEY_SHAPE_SOURCES.some((source) => /bearer/i.test(source))).toBe(false);
    expect(sourceTreeProblems(tree([{ path: "docs/bonds.md", text: "Bearer bonds are a topic here." }])).map((problem) => problem.kind)).toEqual([]);
  });

  it("answers input of every wrong shape without throwing", () => {
    for (const value of [null, 7, "x", [], {}, { manifest: 1, files: 2, instanceStrings: 3 }, { manifest: { include: [1, "src/"], exclude: "x" }, files: [null, 1, { path: 3 }, { path: "src/a.ts", text: "x" }] }]) {
      expect(() => checkSourceTree(value)).not.toThrow();
      expect(() => sourceTreeProblems(value)).not.toThrow();
    }
    expect(sourceTreeProblems(7)).toEqual([{ kind: "no-include" }, { kind: "no-license" }]);
  });
});

describe("FAC-SEM-156 and FAC-SEM-157: the manifest", () => {
  const check = (value: Json) => evaluateSemanticRules("source-manifest", value);

  it("accepts its positive fixtures", () => {
    for (const name of ["fabric-source-agent", "fabric-source-skill-set"]) expect(check(load(`positive/${name}.json`)), name).toEqual([]);
  });

  it("refuses a slot named twice, a name or purpose shaped like a credential, a store path twice, never repeating the value", () => {
    const findings = check({
      ...manifest,
      slots: [
        { name: "MAIL", kind: "secret", purpose: "reads the mailbox" },
        { name: "MAIL", kind: "config", purpose: `use ${KEY}` },
        { name: KEY, kind: "secret", purpose: 7 },
        { name: "JOURNAL", kind: "store", purpose: "the journal", path: "journal.sqlite" },
        { name: "INDEX", kind: "store", purpose: "the index", path: "journal.sqlite" },
        { name: "LOOSE", kind: "store", purpose: "no path" }
      ]
    });
    expect(findings.map((finding) => [finding.code, finding.instancePath])).toEqual([
      ["FAC-SEM-156", "/slots/1/name"],
      ["FAC-SEM-156", "/slots/1/purpose"],
      ["FAC-SEM-156", "/slots/2/name"],
      ["FAC-SEM-156", "/slots/4/path"]
    ]);
    expect(JSON.stringify(findings)).not.toContain(KEY);
  });

  it("refuses a manifest description shaped like a credential at /description, never repeating it", () => {
    // Assembled here, so no line of this file is shaped like a credential.
    const github = ["ghp", "_", "Ab1Cd2Ef3Gh4".repeat(3)].join("");
    const findings = check({ ...manifest, description: github });
    expect(findings).toEqual([{ code: "FAC-SEM-156", instancePath: "/description", message: "a manifest never holds a value: this looks like a credential" }]);
    expect(JSON.stringify(findings)).not.toContain(github);
    expect(check({ ...manifest, description: "Writes one digest of a mailbox each morning." })).toEqual([]);
  });

  it("refuses a path twice, in .git, an exclude outside include or equal to it, and a binary outside the source", () => {
    const findings = check({
      format: SOURCE_FORMAT,
      include: ["src/", "src/", ".git/hooks/", "README.md"],
      exclude: ["src/gen/", "src/gen/", "README.md", "docs/", "src/.git/"],
      binaries: ["src/icon.png", "src/gen/icon.png", "docs/icon.png", ".git/x.png"]
    });
    expect(findings.map((finding) => [finding.code, finding.instancePath, finding.message])).toEqual([
      ["FAC-SEM-157", "/include/1", "include[1] is listed twice"],
      ["FAC-SEM-157", "/include/2", "include[2] lies in .git, which is never source"],
      ["FAC-SEM-157", "/exclude/1", "exclude[1] is listed twice"],
      ["FAC-SEM-157", "/exclude/4", "exclude[4] lies in .git, which is never source"],
      ["FAC-SEM-157", "/binaries/3", "binaries[3] lies in .git, which is never source"],
      ["FAC-SEM-157", "/exclude/2", "exclude[2] is an include path: it would remove it whole, so leave both out"],
      ["FAC-SEM-157", "/exclude/3", "exclude[3] lies inside no include folder, so it removes nothing"],
      ["FAC-SEM-157", "/binaries/1", "binaries[1] is not a file of the source"],
      ["FAC-SEM-157", "/binaries/2", "binaries[2] is not a file of the source"]
    ]);
  });

  it("holds unchecked paths to the source: a file of it or a folder in it, each listed once", () => {
    const findings = check({
      format: SOURCE_FORMAT,
      include: ["src/", "LICENSE"],
      exclude: ["src/gen/"],
      unchecked: [
        { path: "LICENSE", reason: "the holder's name" },
        { path: "src/vectors/", reason: "synthetic" },
        { path: "src/", reason: "the whole folder" },
        { path: "src/vectors/", reason: "again" },
        { path: "tests/", reason: "outside" },
        { path: "src/gen/x/", reason: "excluded" },
        { path: ".git/", reason: "never source" },
        { path: "README.md", reason: "not included" },
        { reason: "no path" }
      ]
    });
    expect(findings.map((finding) => [finding.code, finding.instancePath, finding.message])).toEqual([
      ["FAC-SEM-157", "/unchecked/3/path", "unchecked[3] is listed twice"],
      ["FAC-SEM-157", "/unchecked/4/path", "unchecked[4] is not in the source"],
      ["FAC-SEM-157", "/unchecked/5/path", "unchecked[5] is not in the source"],
      ["FAC-SEM-157", "/unchecked/6/path", "unchecked[6] is not in the source"],
      ["FAC-SEM-157", "/unchecked/7/path", "unchecked[7] is not in the source"]
    ]);
    const manifestWith = { include: ["src/"], unchecked: [{ path: "src/vectors/" }] };
    expect(isUncheckedPath(manifestWith, "src/vectors/a.json")).toBe(true);
    expect(isUncheckedPath(manifestWith, "src/a.json")).toBe(false);
    expect(isUncheckedPath(manifestWith, "tests/vectors/a.json")).toBe(false);
    expect(isUncheckedPath(null, "src/vectors/a.json")).toBe(false);
  });

  it("names a credential-shaped slot or path by its place, never by its value", () => {
    const findings = check({ ...manifest, slots: [{ name: KEY, kind: "secret", purpose: "a" }, { name: KEY, kind: "secret", purpose: "b" }, { name: "J", kind: "store", purpose: "c", path: KEY }, { name: "K", kind: "store", purpose: "d", path: KEY }] });
    expect(findings.map((finding) => finding.message)).toContain("slot slots[1] is declared twice");
    expect(findings.map((finding) => finding.message)).toContain("store path slots[3].path is declared twice");
    expect(JSON.stringify(findings)).not.toContain(KEY);
  });

  it("names a slot by its place when a bearer token in its name runs across a space, and masks such a message", () => {
    const run = ["abcdef", "1234567890qq"].join("");
    const name = `x Bearer ${run}`;
    const findings = check({ ...manifest, slots: [{ name, kind: "config", purpose: "a" }, { name, kind: "config", purpose: "b" }] });
    expect(findings.map((finding) => finding.message)).toContain("slot slots[1] is declared twice");
    expect(JSON.stringify(findings)).not.toContain(run);
    const mark = "<a value the tree check reads as the instance's, at /x>";
    expect(masked(`must NOT have additional properties "Authorization: Bearer ${run}" here`, "/x")).toBe(`must NOT have additional properties "Authorization: ${mark}" here`);
    expect(masked(`member Authorization: Bearer ${run} found`, "/x")).toBe(`member Authorization: ${mark}`);
    expect(masked("plain words only", "/x")).toBe("plain words only");
    // A whole message the shared detector reads as a bearer value, with no span to cut, is masked whole.
    expect(masked("Bearer of the news", "/x")).toBe(mark);
    // More findings than the passes it takes are masked whole too.
    expect(masked(`a "Bearer ${run}" b "Bearer ${run}" c`, "/x")).toBe(`a "${mark}" b "${mark}" c`);
    // A quote a backslash escapes neither opens nor closes a value; a quote in the place never reaches the mark.
    expect(masked(`a \\"x "Bearer ${run} \\" y" z`, "/x")).toBe(`a \\"x "${mark}" z`);
    expect(masked(`m "Bearer ${run}" n`, '/a"b')).toBe(`m "<a value the tree check reads as the instance's, at /a?b>" n`);
    // A quote opened and never closed is masked to the end of the message.
    expect(masked(`m "Bearer ${run} n`, "/x")).toBe(`m "${mark}`);
    expect(masked(Array.from({ length: 17 }, () => `"Bearer ${run}"`).join(" "), "/x")).toBe(mark);
    // A finding no span locates (a long run under a credential name) masks the whole message.
    expect(masked(`x token ${["Ab1", "Cd2"].join("").repeat(8)}`, "/x")).not.toContain("Cd2");
  });

  it("names a slot by its place when its name is long, or holds a finding once its white space is folded", () => {
    const twice = (long: string) => check({ ...manifest, slots: [{ name: long, kind: "config", purpose: "a" }, { name: long, kind: "config", purpose: "b" }] });
    expect(growth((n) => `${")".repeat(n)}a`, 1_000_000, twice)).toBeLessThan(64);
    expect(twice(`${")".repeat(1_000_000)}a`).map((finding) => finding.message)).toContain("slot slots[1] is declared twice");
    const header = ["-----BEGIN RSA", "PRIVATE KEY-----"].join("\n");
    const folded = check({ ...manifest, slots: [{ name: header, kind: "config", purpose: "a" }, { name: header, kind: "config", purpose: "b" }] });
    expect(folded.map((finding) => finding.message)).toContain("slot slots[1] is declared twice");
  });

  it("reads an entry outside the path grammar as naming nothing: an exclude path that removes nothing", () => {
    const findings = check({ ...manifest, include: ["src/", "LICENSE"], exclude: ["src\\vendor/"], binaries: [] });
    expect(findings.map((finding) => [finding.code, finding.message])).toEqual([["FAC-SEM-157", "exclude[0] lies inside no include folder, so it removes nothing"]]);
  });

  it("reads a path of 129 to 256 code points outside the BMP as in the grammar, in every list", () => {
    const face = String.fromCodePoint(0x1f600);
    const name = `docs/${face.repeat(60)}/${face.repeat(60)}/${face.repeat(20)}.md`;
    expect([...name].length).toBeGreaterThan(128);
    expect([...name].length).toBeLessThanOrEqual(256);
    expect(name.length).toBeGreaterThan(256);
    const kinds = (manifestValue: Json, file: Json) => sourceTreeProblems({ manifest: manifestValue, files: [{ path: "LICENSE", text: "x" }, file] }).map((problem) => problem.kind);
    expect(kinds({ include: ["docs/", "LICENSE"] }, { path: name, text: "/home/jdoe" })).toEqual(["home-path"]);
    expect(kinds({ include: [name, "LICENSE"] }, { path: name, text: "/home/jdoe" })).toEqual(["home-path"]);
    expect(kinds({ include: ["docs/", "LICENSE"], unchecked: [{ path: name, reason: "r" }] }, { path: name, text: "/home/jdoe" })).toEqual([]);
    expect(kinds({ include: ["docs/", "LICENSE"], binaries: [name] }, { path: name, binary: true })).toEqual([]);
    expect(kinds({ include: ["docs/", "LICENSE"] }, { path: name, binary: true })).toEqual(["binary"]);
    expect(isSourcePath({ include: ["docs/"] }, name)).toBe(true);
  });

  it("reads members of the wrong type without throwing", () => {
    expect(check({ include: "src/", exclude: [1, null], binaries: {}, unchecked: [1, { path: 2 }], slots: [null, 1, { name: 3, purpose: [] }] })).toEqual([]);
  });
});

describe("the rules over long lists (DEC-0149)", () => {
  // The time of one call: after a warm-up, the call is repeated until a trial lasts 20 ms, and the best of three trials
  // is kept, so a small case is never measured below a timer's grain and a collection does not read as growth. Each
  // test steps the size sixteen times: a linear rule grows about sixteen times, a quadratic one about 256; the bound
  // of 64 leaves room for a loaded machine's noise and fails a quadratic rule.
  // Processor time (this process's user and system time), which a loaded machine's other work does not inflate.
  const cpu = () => { const used = process.cpuUsage(); return (used.user + used.system) / 1000; };
  const timed = (run: () => unknown): number => {
    run();
    return Math.min(...[0, 1, 2].map(() => {
      const started = cpu();
      let calls = 0;
      do { run(); calls += 1; } while (cpu() - started < 20);
      return (cpu() - started) / calls;
    }));
  };
  const manifestOf = (size: number) => ({
    format: "fabric-source/1",
    include: [...Array.from({ length: size }, (_, index) => `src/d${index % 97}/f${index}.ts`), ...Array.from({ length: size / 4 }, (_, index) => `lib${index}/`)],
    exclude: Array.from({ length: size }, (_, index) => `lib${index % (size / 4)}/x${index}.ts`),
    binaries: Array.from({ length: size }, (_, index) => `src/d${index % 97}/f${index}.ts`),
    slots: Array.from({ length: size }, (_, index) => ({ name: `S${index}`, kind: index % 2 === 0 ? "secret" : "store", purpose: "p", ...(index % 2 === 0 ? {} : { path: `s${index}` }) }))
  });
  const treeOf = (size: number) => {
    const manifestValue = manifestOf(size);
    return { manifest: manifestValue, files: manifestValue.include.filter((path) => !path.endsWith("/")).map((path) => ({ path, text: "" })) };
  };
  const pairOf = (size: number) => {
    const source = manifestOf(size);
    const secrets = source.slots.filter((slot) => slot.kind === "secret").map((slot) => ({ name: slot.name, purpose: "p" }));
    const state = source.slots.filter((slot) => slot.kind === "store").map((slot) => ({ path: (slot as { path: string }).path, purpose: "p" }));
    return { source, package: { secrets, state } };
  };

  it.each([
    ["source-manifest", (size: number) => evaluateSemanticRules("source-manifest", { format: "fabric-source/1", include: ["a/".repeat(size)], exclude: ["a/".repeat(size)] })],
    ["source-tree", (size: number) => evaluateSemanticRules("source-tree", { manifest: { include: ["a/".repeat(size)], exclude: ["a/".repeat(size)] }, files: [{ path: "a/b.ts", text: "x" }] })]
  ] as const)("reads %s with one entry far longer than the path grammar in time linear in its length", (_kind, check) => {
    const small = timed(() => check(2000));
    const large = timed(() => check(32_000));
    expect(large / small).toBeLessThan(64);
  });

  it("answers patchPathsAllowed in time linear in the paths", () => {
    const manifestValue = manifestOf(4000);
    const paths = (size: number) => Array.from({ length: size }, (_, index) => `src/d${index % 97}/p${index}.ts`);
    const small = timed(() => patchPathsAllowed(manifestValue, paths(500)));
    const large = timed(() => patchPathsAllowed(manifestValue, paths(8000)));
    expect(large / small).toBeLessThan(64);
  });

  // A tree's files carry no text, so the per-file linear part is small and a cheap scan per file shows. At 4k to 64k
  // files (a 16 times step, like the manifest test) the real tree's ratio is measured well under the bound of 64; a
  // quadratic scan grows about 256 times. The ratio is asserted first, so a planted scan fails on it rather than on the
  // test's timeout.
  it("reads source-tree in time linear in its files", () => {
    const small = timed(() => evaluateSemanticRules("source-tree", treeOf(4000)));
    const large = timed(() => evaluateSemanticRules("source-tree", treeOf(64_000)));
    expect(large / small).toBeLessThan(64);
  }, 180_000);

  // Every file a symbolic link with an absolute target: each says link-outside once, never scanning what was found. A
  // 32 times step: a scan of the problems found so far reads about 110 against the bound of 64, the real check about 16.
  it("reads a tree of absolute links in time linear in its files", () => {
    const linksOf = (count: number) => ({ manifest: { include: ["src/", "LICENSE"] }, files: Array.from({ length: count }, (_, index) => ({ path: `src/d${index % 97}/l${index}`, text: "/srv/x", link: true })) });
    const small = timed(() => evaluateSemanticRules("source-tree", linksOf(4000)));
    const large = timed(() => evaluateSemanticRules("source-tree", linksOf(128_000)));
    expect(large / small).toBeLessThan(64);
  }, 180_000);

  // At 1k to 16k entries the real manifest read about 9, an `include.filter` scan planted per include entry about 210.
  it.each([
    ["source-manifest", (size: number) => evaluateSemanticRules("source-manifest", manifestOf(size))],
    ["source-package", (size: number) => evaluateSemanticRules("source-package", pairOf(size))]
  ] as const)("reads %s in time linear in its lists", (_kind, check) => {
    const small = timed(() => check(1000));
    const large = timed(() => check(16_000));
    expect(large / small).toBeLessThan(64);
  }, 180_000);
});

describe("FAC-SEM-160: the package beside the source", () => {
  const source = load("semantic/source-package-ok.json").input.source as Json;
  const pkg = load("semantic/source-package-ok.json").input.package as Json;
  const pair = (packageValue: Json, sourceValue: Json = source) => sourcePackageFindings({ source: sourceValue, package: packageValue });

  it("lets a package carry fabric.source.json as an ordinary listed file, packed in place, and still pairs the two", () => {
    const bytes = (text: string) => new TextEncoder().encode(text);
    const sourceBytes = bytes(JSON.stringify(source));
    const skill = bytes("---\nname: a\n---\n");
    const packed = { ...pkg, files: [{ path: SOURCE_FILE, sha256: sha256Of(sourceBytes) }, { path: "skills/a/SKILL.md", sha256: sha256Of(skill) }] };
    const folderFiles = new Map([[PACKAGE_FILE, bytes(JSON.stringify(packed))], [SOURCE_FILE, sourceBytes], ["skills/a/SKILL.md", skill]]);
    expect(checkPackageFolder(packed, folderFiles)).toEqual([]);
    expect(pair(packed)).toEqual([]);
  });

  it("compares secrets by name and optional, and state by path, as sets", () => {
    expect(pair(pkg)).toEqual([]);
    expect(pair({ ...pkg, secrets: [...pkg.secrets].reverse(), state: [...pkg.state] })).toEqual([]);
    expect(pair({ ...pkg, secrets: [{ name: 4 }, { name: "MAIL_OAUTH", optional: true }] }).map((finding) => [finding.instancePath, finding.message])).toEqual([
      ["/package/secrets/0/name", "secret 4 is no secret slot of the source"],
      ["/package/secrets/1/optional", "secret MAIL_OAUTH is not optional in the source"]
    ]);
    const optional = { ...source, slots: [{ name: "MAIL_OAUTH", kind: "secret", purpose: "reads the mailbox", optional: true }] };
    expect(pair({ ...pkg, state: [] }, optional).map((finding) => [finding.instancePath, finding.message])).toEqual([
      ["/package/secrets/0/optional", "secret MAIL_OAUTH is optional in the source"]
    ]);
    expect(pair({ ...pkg, state: [{ path: 3 }] }).map((finding) => finding.instancePath)).toEqual(["/package/state", "/package/state/0/path"]);
  });

  it("names a credential-shaped name or path by its place in the pair's messages", () => {
    const shaped = { ...source, slots: [{ name: KEY, kind: "secret", purpose: "a" }, { name: "S", kind: "store", purpose: "b", path: KEY }] };
    const findings = pair({ secrets: [{ name: `${KEY}2`, optional: false }], state: [{ path: `${KEY}2` }] }, shaped);
    expect(findings.map((finding) => finding.message)).toEqual([
      "the source's secret slot slots[0] is not in the package's secrets[]",
      "secret secrets[0] is no secret slot of the source",
      "the source's store path slots[1].path is not in the package's state[]",
      "state state[0] is no store slot of the source"
    ]);
    expect(JSON.stringify(findings)).not.toContain(KEY);
    const optional = pair({ secrets: [{ name: KEY, optional: true }], state: [{ path: KEY }] }, shaped);
    expect(optional.map((finding) => finding.message)).toEqual(["secret secrets[0] is not optional in the source"]);
  });

  it("says nothing without both documents", () => {
    expect(sourcePackageFindings({ source: 1, package: pkg })).toEqual([]);
    expect(sourcePackageFindings({ source, package: null })).toEqual([]);
    expect(sourceRules("package", {})).toBeUndefined();
    // A source with no slots gives the package no secret and no state.
    expect(sourcePackageFindings({ source: { format: SOURCE_FORMAT, include: ["src/"] }, package: pkg }).map((finding) => finding.instancePath)).toEqual(["/package/secrets/0/name", "/package/state/0/path"]);
  });
});
