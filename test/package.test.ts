import { createPrivateKey, createPublicKey, generateKeyPairSync, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { isSmallOrderKey } from "../src/ed25519.js";
import {
  PACKAGE_ALGORITHMS,
  PACKAGE_FILE,
  PLUGIN_MANIFEST,
  SIGNATURE_STATEMENT,
  agentRefOf,
  checkPackageFolder,
  packageDigest,
  packageSigningInput,
  sha256Of,
  verifyPackage
} from "../src/package-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0050 (format and digest) and DEC-0051 (signatures): fabric-package/1, its digest over RFC 8785, the folder check,
// the publisher's signature and the organization's countersignature, and agentRef.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const load = (relative: string) => read(`fixtures/${relative}`);
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const validator = await createValidator();
const valid = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/fabric-package.schema.json`, value).valid;
const codes = (value: unknown) => evaluateSemanticRules("package", value).map((finding) => finding.code);
const vectors = load("vectors/package.json");
const agent = load("positive/fabric-package-agent.json");
const spec = readFileSync(path.join(root, "docs/specification/package.md"), "utf8");
const schema = read("schemas/fabric-package.schema.json");
/** Re-digest a changed package, so a test isolates the one rule it means. */
const redigest = (pkg: Json): Json => ({ ...pkg, digest: packageDigest(pkg) });
const folderOf = (files: Record<string, string>) => new Map(Object.entries(files).map(([name, text]) => [name, Buffer.from(text, "utf8")] as const));

describe("the format (DEC-0050)", () => {
  it("accepts an agent, a skill set and an unsigned person-layer skill set, and every one passes the rules", () => {
    for (const f of ["positive/fabric-package-agent.json", "positive/fabric-package-skill-set.json", "positive/fabric-package-unsigned-person.json"]) {
      expect(valid(load(f)), f).toBe(true);
      expect(codes(load(f)), f).toEqual([]);
    }
  });

  it("types every item of v4 §12's package row", () => {
    for (const field of ["provider", "service", "secrets", "requires", "costPresets", "resultSignal", "state", "evals", "dependencies", "files", "digest", "signatures"]) {
      expect(schema.properties, field).toHaveProperty(field);
    }
    expect(schema.properties.costPresets.$ref).toBe("manifest.schema.json#/properties/costPresets");
    expect(Object.keys(schema.properties.secrets.items.properties).sort()).toEqual(["name", "optional", "purpose"]);
    expect(schema.properties.secrets.items.additionalProperties).toBe(false);
  });

  it("refuses a secret value, an agent without its result signal or receipt, a path that leaves the folder, a skill set with an agent's fields and a dotted id", () => {
    for (const f of ["secret-value", "agent-without-result-signal", "agent-without-receipt", "path-escapes", "skill-set-with-secrets", "scoped-reverse-id"]) {
      expect(valid(load(`negative/fabric-package-${f}.json`)), f).toBe(false);
    }
    for (const bad of ["/abs", "~/x", "a/../b", "..", "./a", "a//b", "a/", "C:/x", "a\\b", "a/./b", "a\u0001b"]) {
      const pkg = clone(agent);
      pkg.files[0].path = bad;
      expect(valid(pkg), bad).toBe(false);
    }
    for (const good of [".claude-plugin/plugin.json", "a/.hidden", "..a/b", "skills/x/SKILL.md"]) {
      const pkg = clone(agent);
      pkg.files[0].path = good;
      expect(valid(pkg), good).toBe(true);
    }
  });

  it("reads the cost presets in the manifest's shape, so the spend policy computes L1 options from them", () => {
    const manifest = load("positive/manifest-cost-presets.json");
    const pkg = clone(agent);
    pkg.costPresets = manifest.costPresets;
    expect(valid(pkg)).toBe(true);
    pkg.costPresets = [{ id: "quick", capability: "digest.write", label: "Quick" }];
    expect(valid(pkg)).toBe(false);
  });
});

describe("FAC-SEM-064: a package is whole", () => {
  const whole = ["digest-mismatch", "file-twice", "lists-itself", "entry-not-listed", "provider-not-listed", "suite-not-listed", "receipt-other-suite", "vendored-not-listed", "vendored-mismatch", "state-twice", "skill-set-without-plugin"];

  it.each(whole)("refuses %s, and nothing else in it", (name) => {
    const fixture = load(`semantic/package-${name}.json`);
    expect(valid(fixture)).toBe(true);
    expect(codes(fixture)).toEqual(["FAC-SEM-064"]);
  });

  it("names the digest it computed, and refuses a package that has no RFC 8785 form", () => {
    const changed = load("semantic/package-digest-mismatch.json");
    expect(evaluateSemanticRules("package", changed)[0]?.message).toContain(packageDigest(changed));
    expect(evaluateSemanticRules("package", { ...agent, listingChars: Number.NaN })[0]?.message).toMatch(/no RFC 8785 form/);
  });

  it("does not throw on a package of the wrong shape", () => {
    expect(codes({ kind: "agent", digest: 1, files: "x", evals: { suite: 3, receipt: 1 }, service: { entry: "x" }, dependencies: [null, { path: 4 }], state: [1] })).toEqual(["FAC-SEM-064"]);
    expect(codes({ evals: { suite: "missing.json", receipt: { suite: "sha256:x" } } }).filter((code) => code === "FAC-SEM-064")).toHaveLength(2);
    expect(codes(redigest({ files: [{ path: "a", sha256: "sha256:1" }], evals: {} }))).toEqual([]);
  });
});

describe("FAC-SEM-065: a package carries no secret (DEC-0013)", () => {
  it.each(["secret-slot-twice", "secret-shaped-name", "secret-in-purpose", "secret-in-entry"])("refuses %s", (name) => {
    const fixture = load(`semantic/package-${name}.json`);
    expect(valid(fixture)).toBe(true);
    expect(codes(fixture)).toEqual(["FAC-SEM-065"]);
  });

  it("never repeats the value it refuses", () => {
    for (const name of ["secret-shaped-name", "secret-in-purpose", "secret-in-entry"]) {
      const fixture = load(`semantic/package-${name}.json`);
      const text = JSON.stringify(evaluateSemanticRules("package", fixture));
      for (const value of ["AKIAIOSFODNN7EXAMPLE", "sk-proj-0123456789abcdefABCDEF", "ghp_0123456789abcdefABCDEF0123456789abcd"]) expect(text).not.toContain(value);
    }
  });

  it("refuses a secret value by schema, before any rule: a slot has no member to hold one", () => {
    const fixture = load("negative/fabric-package-secret-value.json");
    expect(valid(fixture)).toBe(false);
    expect(codes(fixture)).toEqual([]);
  });
});

describe("FAC-SEM-066: agentRef names one agent across its versions", () => {
  it("is derived from publisher and id, and refused when it is not", () => {
    expect(agentRefOf("example", "inbox-digest")).toBe("urn:fabric:agent:example:inbox-digest");
    expect(agent.agentRef).toBe(agentRefOf(agent.publisher, agent.id));
    const fixture = load("semantic/package-agent-ref-mismatch.json");
    expect(codes(fixture)).toEqual(["FAC-SEM-066"]);
    expect(evaluateSemanticRules("package", fixture)[0]?.message).toContain("urn:fabric:agent:example:inbox-digest");
  });

  it("stays the same across versions, and a skill set or a package without names has none to check", () => {
    const next = redigest({ ...clone(agent), version: "1.3.0" });
    expect(codes(next)).toEqual([]);
    expect(next.agentRef).toBe(agent.agentRef);
    expect(codes(redigest({ kind: "agent", publisher: 1, id: "x", files: [] }))).toEqual([]);
    expect(codes(load("positive/fabric-package-skill-set.json"))).toEqual([]);
  });

  it("is one pattern every document that names an agent can reference", () => {
    const pattern = new RegExp(schema.$defs.agentRef.pattern as string, "u");
    expect(pattern.test(agent.agentRef)).toBe(true);
    for (const bad of ["urn:fabric:agent:example", "urn:fabric:agent:example:inbox.digest", "urn:fabric:agent:Example:x", "urn:fabric:agent:example:x:1.2.0"]) expect(pattern.test(bad), bad).toBe(false);
  });
});

describe("the digest (DEC-0050, DEC-0043)", () => {
  it("is SHA-256 over RFC 8785 of the package without digest and signatures, as the vector says", () => {
    const { digest: _digest, signatures: _signatures, ...covered } = vectors.digest.package;
    expect(rfc8785(covered)).toBe(vectors.digest.canonical);
    expect(sha256Of(Buffer.from(vectors.digest.canonical, "utf8"))).toBe(vectors.digest.expected);
    expect(packageDigest(vectors.digest.package)).toBe(vectors.digest.expected);
    expect(vectors.digest.package).toEqual(agent);
  });

  it("does not move when a countersignature is added or removed, and moves with any other change", () => {
    expect(packageDigest({ ...agent, signatures: [] })).toBe(agent.digest);
    expect(packageDigest({ ...agent, signatures: undefined })).toBe(agent.digest);
    expect(packageDigest({ ...agent, digest: "sha256:0" })).toBe(agent.digest);
    for (const change of [{ version: "1.2.1" }, { files: agent.files.slice(1) }, { listingChars: 97 }]) expect(packageDigest({ ...agent, ...change })).not.toBe(agent.digest);
  });

  it("signs a typed statement with the role inside, in RFC 8785", () => {
    expect(SIGNATURE_STATEMENT).toBe("fabric-package-signature/1");
    const bytes = packageSigningInput(vectors.signingInput.digest, vectors.signingInput.role);
    expect(bytes.toString("utf8")).toBe(vectors.signingInput.utf8);
    expect(bytes.toString("utf8")).toBe(`{"digest":"${agent.digest}","role":"publisher","type":"fabric-package-signature/1"}`);
    expect(packageSigningInput(agent.digest, "organization").equals(bytes)).toBe(false);
  });

  it("is in the canonical-forms register", () => {
    const conformance = readFileSync(path.join(root, "docs/specification/conformance.md"), "utf8");
    expect(conformance).toMatch(/\| a package's `digest`[^\n]*\| RFC 8785 \| `packageDigest` \|/);
    expect(conformance).toMatch(/\| a package signature's statement[^\n]*\| RFC 8785 \| `packageSigningInput` \|/);
  });
});

describe("the folder check (DEC-0050)", () => {
  const files = folderOf(vectors.folder.files);
  const check = (mutate: (folder: Map<string, Uint8Array>, pkg: Json) => void) => {
    const folder = new Map(files);
    const pkg = clone(vectors.digest.package);
    mutate(folder, pkg);
    return checkPackageFolder(pkg, folder);
  };

  it("passes the vector's folder, with fabric.package.json in it", () => {
    expect(checkPackageFolder(vectors.digest.package, files)).toEqual(vectors.folder.expected);
    expect(check((folder) => folder.set(PACKAGE_FILE, Buffer.from("{}")))).toEqual([]);
    // A folder with neither a plugin manifest nor a provider manifest has neither to check.
    expect(checkPackageFolder({ files: [{ path: "skills/a/SKILL.md", sha256: sha256Of("a") }] }, folderOf({ "skills/a/SKILL.md": "a" }))).toEqual([]);
  });

  it("finds a missing, a changed and an unlisted file", () => {
    expect(check((folder) => folder.delete("bin/serve.mjs"))).toEqual([{ problem: "file-missing", path: "bin/serve.mjs" }]);
    expect(check((folder) => folder.set("bin/serve.mjs", Buffer.from("changed")))).toEqual([{ problem: "file-digest", path: "bin/serve.mjs" }]);
    expect(check((folder) => folder.set("bin/extra.sh", Buffer.from("x")))).toEqual([{ problem: "file-unlisted", path: "bin/extra.sh" }]);
  });

  it("holds the plugin manifest to the package's id and version", () => {
    const relist = (pkg: Json, folder: Map<string, Uint8Array>, name: string) => {
      pkg.files = pkg.files.map((entry: Json) => (entry.path === name ? { path: name, sha256: sha256Of(folder.get(name) as Uint8Array) } : entry));
    };
    for (const text of [JSON.stringify({ name: "other", version: "1.2.0" }), JSON.stringify({ name: "inbox-digest", version: "9.9.9" }), "not json", "[]"]) {
      expect(check((folder, pkg) => { folder.set(PLUGIN_MANIFEST, Buffer.from(text)); relist(pkg, folder, PLUGIN_MANIFEST); }), text).toEqual([{ problem: "plugin-manifest", path: PLUGIN_MANIFEST }]);
    }
    for (const text of [JSON.stringify({ costPresets: [] }), "not json"]) {
      expect(check((folder, pkg) => { folder.set("fabric-agent.json", Buffer.from(text)); relist(pkg, folder, "fabric-agent.json"); }), text).toEqual([{ problem: "provider-manifest", path: "fabric-agent.json" }]);
    }
    // A provider manifest without cost presets leaves the package's the only ones.
    expect(check((folder, pkg) => { folder.set("fabric-agent.json", Buffer.from("{}")); relist(pkg, folder, "fabric-agent.json"); })).toEqual([]);
    // A missing provider manifest is reported once, as a missing file.
    expect(check((folder) => folder.delete("fabric-agent.json"))).toEqual([{ problem: "file-missing", path: "fabric-agent.json" }]);
  });
});

describe("signatures and the verifier (DEC-0051)", () => {
  it.each(vectors.cases as Json[])("$name", (entry) => {
    expect(verifyPackage(entry.package, entry.trust, entry.options)).toEqual(entry.expected);
  });

  it("holds one vector case per problem in package.md's PK table, and the table names every problem the verifier answers", () => {
    const table = [...spec.matchAll(/^\| PK-\d+ \| ([^|]+) \|/gm)].flatMap((match) => [...(match[1] ?? "").matchAll(/`([a-z-]+)`/g)].map((m) => m[1]));
    const answered = new Set((vectors.cases as Json[]).filter((entry) => !entry.expected.ok).map((entry) => entry.expected.problem));
    expect([...answered].sort()).toEqual([...table].sort());
  });

  it("reproduces every signature from the test keys' seeds: Ed25519 is deterministic, so a port's signer can be checked byte for byte", () => {
    const keyOf = (seed: string) => createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed, "hex")]), format: "der", type: "pkcs8" });
    for (const role of ["publisher", "organization"] as const) {
      const key = keyOf(vectors.keys[role].seed);
      expect((createPublicKey(key).export({ format: "jwk" }) as Json).x).toBe(vectors.keys[role].jwk.x);
      const signed = agent.signatures.find((entry: Json) => entry.role === role);
      expect(sign(null, packageSigningInput(agent.digest, role), key).toString("base64url")).toBe(signed.sig);
    }
  });

  it("admits EdDSA only until Fabric records D2, in the schema and the verifier alike", () => {
    expect(PACKAGE_ALGORITHMS).toEqual(["EdDSA"]);
    expect(schema.properties.signatures.items.properties.alg.enum).toEqual([...PACKAGE_ALGORITHMS]);
    expect(valid(load("negative/fabric-package-unknown-algorithm.json"))).toBe(false);
    expect(valid(load("negative/fabric-package-two-publisher-signatures.json"))).toBe(false);
  });

  it("refuses the small-order key before verifying, whatever this Node's crypto.verify answers", () => {
    const forged = (vectors.cases as Json[]).find((entry) => entry.expected.problem === "small-order-key") as Json;
    expect(isSmallOrderKey(Buffer.from(vectors.keys.smallOrder.jwk.x, "base64url"))).toBe(true);
    expect(forged.package.signatures[0].sig).toBe(Buffer.concat([Buffer.from("5866666666666666666666666666666666666666666666666666666666666666", "hex"), Buffer.from([1]), Buffer.alloc(31)]).toString("base64url"));
    expect(verifyPackage(forged.package, forged.trust)).toEqual({ ok: false, problem: "small-order-key", signature: 0 });
  });

  it("refuses rather than throws on input of the wrong shape", () => {
    const publisher = vectors.keys.publisher.jwk;
    const signed = vectors.cases[1].package as Json;
    const trust = { publisher: [publisher] };
    const malformed = { ok: false, problem: "malformed" };
    expect(verifyPackage(null, trust)).toEqual(malformed);
    expect(verifyPackage({ ...signed, digest: 1 }, trust)).toEqual(malformed);
    expect(verifyPackage({ ...signed, listingChars: Number.NaN }, trust)).toEqual(malformed);
    expect(verifyPackage({ ...signed, signatures: "x" }, trust)).toEqual(malformed);
    expect(verifyPackage({ ...signed, signatures: [] }, trust)).toEqual({ ok: false, problem: "unsigned" });
    const sig = signed.signatures[0];
    expect(verifyPackage({ ...signed, signatures: [sig, null] }, trust)).toEqual({ ...malformed, signature: 1 });
    for (const broken of [{ role: "admin" }, { alg: 1 }, { kid: 2 }, { sig: 3 }]) {
      expect(verifyPackage({ ...signed, signatures: [sig, { ...sig, role: "organization", ...broken }] }, trust), JSON.stringify(broken)).toEqual({ ...malformed, signature: 1 });
    }
    // An organization countersignature with no organization keys pinned is under an unknown key.
    // An organization entry under a kid the organization set does not pin is set aside unless a countersignature is asked.
    expect(verifyPackage({ ...signed, signatures: [sig, { ...sig, role: "organization" }] }, trust)).toMatchObject({ ok: true, unverified: [{ role: "organization" }] });
    expect(verifyPackage({ ...signed, signatures: [sig, { ...sig, role: "organization" }] }, trust, { countersigned: true })).toEqual({ ok: false, problem: "unknown-key", signature: 1 });
    // Only an unpinned kid is set aside: a pinned organization key that cannot be used still refuses the package.
    const pinnedBadly = { ...trust, organization: [{ ...(trust.publisher as Json[])[0], alg: "ES256" }] };
    expect(verifyPackage({ ...signed, signatures: [sig, { ...sig, role: "organization" }] }, pinnedBadly)).toEqual({ ok: false, problem: "key-algorithm-mismatch", signature: 1 });
    // Two publisher signatures.
    expect(verifyPackage({ ...signed, signatures: [sig, sig] }, trust)).toEqual({ ok: false, problem: "no-publisher-signature" });
  });

  it("refuses a key that is not a public Ed25519 signing key", () => {
    const publisher = vectors.keys.publisher.jwk;
    const signed = vectors.cases[1].package as Json;
    const other = generateKeyPairSync("ec", { namedCurve: "P-256" }).publicKey.export({ format: "jwk" }) as Json;
    for (const key of [
      { ...publisher, kty: "EC" },
      { ...publisher, crv: "Ed448" },
      { ...publisher, x: 7 },
      { ...publisher, x: "not base64url!" },
      { ...publisher, x: Buffer.alloc(31, 1).toString("base64url") },
      { ...publisher, use: "enc" },
      { ...other, kid: publisher.kid, alg: "EdDSA" }
    ]) {
      expect(verifyPackage(signed, { publisher: [key] }), JSON.stringify(key)).toEqual({ ok: false, problem: "unusable-key", signature: 0 });
    }
    expect(verifyPackage(signed, { publisher: [{ ...publisher, use: "sig" }] }).ok).toBe(true);
    expect(verifyPackage(signed, { publisher: [null, publisher] }).ok).toBe(true);
    const short = { ...signed, signatures: [{ ...signed.signatures[0], sig: Buffer.alloc(63).toString("base64url") }] };
    expect(verifyPackage(short, { publisher: [publisher] })).toEqual({ ok: false, problem: "bad-signature", signature: 0 });
  });
});

describe("the package in the repository's checks", () => {
  it("has a semantic fixture per sub-check of its three rules", () => {
    const named = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("package-"));
    expect(named).toHaveLength(16);
  });
});
