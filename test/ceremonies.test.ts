import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { deviceKeyFingerprint, deviceKeyRef, estateRecordDigest, verifyEstateRecord } from "../src/estate-record-rules.js";
import { estateFingerprint } from "../src/pairing.js";
import { relayAdmissionSet } from "../src/relay.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0084: removing and re-keying a machine — what a revision drops it revokes (FAC-SEM-114), a device key revoked by
// its own reference (`<kid>@sha256:<hex>`, FAC-SEM-076), and the relay that subtracts it.
type Json = Record<string, any>;
const root = projectRoot();
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const load = (relative: string) => JSON.parse(read(`fixtures/${relative}`)) as Json;
const first = load("positive/estate-record-first.json");
const replaced = load("positive/estate-record-key-replaced.json");
const validator = await createValidator();
const schemaValid = (record: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/estate-record.schema.json`, record).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const AT = new Date("2026-10-21T00:00:00Z");
const spec = read("docs/specification/ceremonies.md");
const estateSpec = read("docs/specification/estate-record.md");

describe("a device key's fingerprint and reference (DEC-0084)", () => {
  const key = replaced.machines[1].deviceKeys[0] as Json;

  it("is sha256: over the key's octets, and the reference is <kid>@<fingerprint>", () => {
    const hex = createHash("sha256").update(Buffer.from(key.publicKey, "base64")).digest("hex");
    expect(deviceKeyFingerprint(key)).toBe(`sha256:${hex}`);
    expect(deviceKeyRef(key)).toBe(`m-9a07#sig@sha256:${hex}`);
  });

  it("refuses a key that is not in canonical padded base64, and anything that is not a key", () => {
    for (const publicKey of [key.publicKey.replace(/=+$/, ""), `${key.publicKey}\n`, "", "A===", "AB=C", 7]) expect(deviceKeyFingerprint({ ...key, publicKey }), String(publicKey)).toBeUndefined();
    // Base64 whose last character carries bits its padding drops is not the canonical form of its bytes.
    expect(deviceKeyFingerprint({ ...key, publicKey: "AB==" })).toBeUndefined();
    expect(deviceKeyFingerprint({ ...key, publicKey: "AA==" })).toBe(`sha256:${createHash("sha256").update(Buffer.from([0])).digest("hex")}`);
    for (const junk of [null, 7, "x", [], {}]) {
      expect(deviceKeyFingerprint(junk)).toBeUndefined();
      expect(deviceKeyRef(junk)).toBeUndefined();
    }
    expect(deviceKeyRef({ ...key, kid: 7 })).toBeUndefined();
  });
});

describe("FAC-SEM-114 and the key reference in FAC-SEM-076 (fixtures)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => /^estate-(revision-(key|kem|machine-id|remove|hub)|device-key|key-replaced)/.test(name));

  it("covers removal, replacement, a dropped #kem, a changed id and a re-certified hub key, passing and failing", () => {
    expect(files.length).toBe(15);
    const expected = files.map((name) => load(`semantic/${name}`).expect as string[]);
    expect(expected.filter((codes) => codes.length === 0).length).toBe(4);
    expect([...new Set(expected.flat())].sort()).toEqual(["FAC-SEM-073", "FAC-SEM-076", "FAC-SEM-114"]);
  });

  it.each(files)("%s yields exactly its expected codes, and every record in it is schema-valid", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
    const records = fixture.kind === "estate-record" ? [fixture.input] : [fixture.input.parent, fixture.input.next];
    // The schema already refuses an unpadded P-256 key; the rule refuses it too, for a reader without the schema (DEC-0084).
    for (const record of records) expect(schemaValid(record), name).toBe(name !== "estate-device-key-not-canonical.json");
  });

  it("names the parent's member that was dropped", () => {
    const paths = (name: string) => evaluateSemanticRules("estate-record-revision", load(`semantic/${name}`).input).map((finding) => finding.instancePath);
    expect(paths("estate-revision-remove-machine-unrevoked.json")).toEqual(["/parent/machines/1/id"]);
    expect(paths("estate-revision-key-replaced-unrevoked.json")).toEqual(["/parent/machines/1/deviceKeys/0", "/parent/machines/1/deviceKeys/1"]);
    expect(paths("estate-revision-key-replaced-kem-unrevoked.json")).toEqual(["/parent/machines/1/deviceKeys/1"]);
    expect(paths("estate-revision-remove-hub-machine-hub-unrevoked.json")).toEqual(["/parent/machines/0/hubKey/kid"]);
    expect(paths("estate-revision-hub-key-changed-same-kid.json")).toEqual(["/parent/machines/0/hubKey/kid"]);
  });

  it("reads the machine id and every key exactly, and tolerates malformed members", () => {
    const pair = load("semantic/estate-revision-key-replaced-ok.json").input as Json;
    // A second listing of one id in next does not hide the first; a parent key with no fingerprint is not judged.
    const doubled = { ...pair, next: { ...pair.next, machines: [...pair.next.machines, { id: "m-9a07", deviceKeys: [] }] } };
    expect(codes("estate-record-revision", doubled)).toEqual([]);
    const noKey = { ...pair, parent: { ...pair.parent, machines: [pair.parent.machines[0], { ...pair.parent.machines[1], deviceKeys: [{ kid: "m-9a07#sig", publicKey: 7 }] }] } };
    expect(codes("estate-record-revision", noKey)).toEqual(["FAC-SEM-072"]);
    for (const junk of [null, 7, [], { machines: 7 }, { machines: [7, { id: 1, deviceKeys: 2, hubKey: 3 }] }]) expect(() => evaluateSemanticRules("estate-record-revision", { parent: junk, next: junk })).not.toThrow();
  });
});

describe("verifyEstateRecord runs FAC-SEM-114 whenever it has a parent", () => {
  it("accepts the signed key replacement against revision 1", () => {
    expect(verifyEstateRecord(replaced, { parent: first, at: AT })).toMatchObject({ ok: true, revision: 2 });
  });

  it("refuses a signed revision that drops a machine or replaces a key without revoking it", () => {
    for (const name of ["estate-revision-remove-machine-unrevoked.json", "estate-revision-key-replaced-unrevoked.json", "estate-revision-hub-key-changed-same-kid.json"]) {
      const { parent, next } = load(`semantic/${name}`).input;
      expect(verifyEstateRecord(next, { parent, at: AT }), name).toEqual({ ok: false, problem: "rule-violation", codes: ["FAC-SEM-114"] });
    }
  });

  it("reads FAC-SEM-114 in ER-11 and in the ceremonies' rule table", () => {
    expect(estateSpec).toContain("`FAC-SEM-114`");
    expect(spec).toMatch(/^\| `FAC-SEM-114` \| `estate-record-revision` \|/m);
    expect(spec).toMatch(/^\| `FAC-SEM-113` \| `enroll-token` \|/m);
  });
});

describe("the relay subtracts a key revoked by its reference (DEC-0084)", () => {
  const pinned = first.authorities;
  const newSig = replaced.machines[1].deviceKeys[0] as Json;
  const oldSig = first.machines[0].deviceKeys[0] as Json;
  const admit = (extraRevocations: Json[], held: Json = replaced) => relayAdmissionSet({ held, pinned, at: AT, schemaValid, extraRevocations });

  it("admits the replaced machine's new key, and drops it when a delta entry revokes it by reference", () => {
    const set = admit([]);
    expect(set.ok && [...set.set.keys()].sort()).toEqual(["m-4c1e#sig", "m-9a07#sig"]);
    const revoked = admit([{ kind: "device-key", ref: deviceKeyRef(newSig) as string }]);
    expect(revoked.ok && [...revoked.set.keys()]).toEqual(["m-4c1e#sig"]);
  });

  it("keeps the new key when the old key under the same kid is revoked by reference", () => {
    const old = first.machines[1].deviceKeys[0] as Json;
    const set = admit([{ kind: "device-key", ref: deviceKeyRef(old) as string }]);
    expect(set.ok && [...set.set.keys()].sort()).toEqual(["m-4c1e#sig", "m-9a07#sig"]);
  });

  it("matches a key with no canonical fingerprint by its kid alone", () => {
    const loose = { ...first, machines: [{ ...first.machines[0], deviceKeys: [{ ...oldSig, publicKey: `${oldSig.publicKey}\n` }, first.machines[0].deviceKeys[1]] }] };
    const held = { ...loose, digest: estateRecordDigest(loose) };
    const set = admit([], held);
    expect(set.ok && [...set.set.keys()]).toEqual(["m-4c1e#sig"]);
    const byKid = admit([{ kind: "device-key", ref: "m-4c1e#sig" }], held);
    expect(byKid.ok && [...byKid.set.keys()]).toEqual([]);
  });
});

describe("the estate fingerprint of a real revision 1", () => {
  it("is computed from the record's own digest", () => {
    const answer = estateFingerprint(estateRecordDigest(first));
    expect(answer.ok && answer.fingerprint).toMatch(/^\d{5}( \d{5}){4}$/);
    expect(estateFingerprint(first.digest)).toEqual(answer);
  });
});
