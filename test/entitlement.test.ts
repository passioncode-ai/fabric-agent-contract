import { createPrivateKey, sign } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { rfc8785 } from "../src/canonical.js";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  CLOCK_SKEW_SECONDS,
  ENTITLEMENT_ALGORITHMS,
  ENTITLEMENT_KEY_SET_TYPE,
  ENTITLEMENT_TYPE,
  GRACE_SECONDS,
  HOSTING_PRODUCTS,
  MAX_AGENTS,
  MAX_ENTITLEMENT_SECONDS,
  MAX_KEYS,
  MAX_MEMBERS,
  MAX_REVOKED,
  REFRESH_SECONDS,
  SUPPORT_TIERS,
  entitlementKeySetSigningInput,
  entitlementSigningInput,
  verifyEntitlement,
  verifyEntitlementKeySet
} from "../src/entitlement.js";
import { strictTime } from "../src/rfc3339.js";
import { schemaClosure } from "../src/schema-closure.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { ENTITLEMENT_FIELDS, ENTITLEMENT_KEY_SET_FIELDS } from "../src/signing-challenges.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildEntitlementVectors } from "../tools/vectors/entitlement.js";

// DEC-0085: entitlement/1 and entitlement-key-set/1 — what one signed order entitles one subject to, the issuer's root
// and key set, the windows, one entitlement held per subject, and the two verifiers.
const root = projectRoot();
type Json = Record<string, any>;
const read = (relative: string) => JSON.parse(readFileSync(path.join(root, relative), "utf8")) as Json;
const load = (relative: string) => read(`fixtures/${relative}`);
const validator = await createValidator();
const valid = (value: unknown, schema = "entitlement") => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}.schema.json`, value).valid;
const codes = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((finding) => finding.code))];
const vectors = read(VECTOR_FILE);
const schema = read("schemas/entitlement.schema.json");
const keySetSchema = read("schemas/entitlement-key-set.schema.json");
const spec = readFileSync(path.join(root, "docs/specification/entitlement.md"), "utf8");
const BASE = load("positive/entitlement.json");
const PERSONAL = load("positive/entitlement-personal.json");
const KEY_SET = load("positive/entitlement-key-set.json");
const SETS: Json = { ...vectors.keySets, ...vectors.handedKeySets };
/** A vector's clock, read strictly: an unparseable one is an unreadable clock (`Invalid Date`). */
const clock = (text: unknown) => new Date(strictTime(text));
const trustOf = (trust: Json | null) => (trust === null ? null : { ...trust, now: clock(trust.now), keySet: SETS[trust.keySet] });
const setOf = (set: unknown) => (typeof set === "string" ? vectors.keySets[set] : set);
const keyFrom = (seed: string) => createPrivateKey({ key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), Buffer.from(seed, "hex")]), format: "der", type: "pkcs8" });
const K2 = keyFrom(vectors.keys.k2.seed);
const ROOT = keyFrom(vectors.keys.root.seed);
/** A document re-signed over its RFC 8785 form without `sig`, whatever its members: the test's signer, not the reference's. */
const resign = (doc: Json, key = K2) => {
  const { sig: _sig, ...fields } = doc;
  return { ...doc, sig: sign(null, Buffer.from(rfc8785(fields), "utf8"), key).toString("base64url") };
};
const NOW = new Date("2026-10-25T12:00:00Z");
const ORG_TRUST = { now: NOW, subject: "org:org-a", keySet: KEY_SET };
const PERSONAL_TRUST = { now: NOW, subject: "personal", estate: "estate-5d0f1a", keySet: KEY_SET };
const PIN = { root: vectors.root };

describe("the documents (DEC-0085)", () => {
  it("accepts the organization's, the personal and the key set's positive fixtures, and the rules pass them", () => {
    expect(valid(BASE)).toBe(true);
    expect(valid(PERSONAL)).toBe(true);
    expect(valid(KEY_SET, "entitlement-key-set")).toBe(true);
    expect(codes("entitlement", BASE)).toEqual([]);
    expect(codes("entitlement", PERSONAL)).toEqual([]);
    expect(codes("entitlement-key-set", KEY_SET)).toEqual([]);
  });

  it("lists every member always, closed, with the register's field list", () => {
    expect(schema.required).toEqual(["type", "issuer", "subject", "estate", "order", "issuedAt", "notBefore", "expiresAt", "licence", "hosting", "support", "agents", "alg", "kid", "sig"]);
    expect([...ENTITLEMENT_FIELDS, "type", "sig"].sort()).toEqual([...schema.required].sort());
    expect(keySetSchema.required).toEqual(["type", "issuer", "revision", "issuedAt", "keys", "revoked", "alg", "kid", "sig"]);
    expect([...ENTITLEMENT_KEY_SET_FIELDS, "type", "sig"].sort()).toEqual([...keySetSchema.required].sort());
    expect(schema.additionalProperties).toBe(false);
    expect(keySetSchema.additionalProperties).toBe(false);
    for (const line of ["order", "licence", "hosting", "support"]) {
      const object = schema.properties[line].type === "object" ? schema.properties[line] : schema.properties[line].anyOf[0];
      expect(object.additionalProperties, line).toBe(false);
    }
    expect(schema.properties.agents.items.additionalProperties).toBe(false);
    expect(keySetSchema.properties.keys.items.additionalProperties).toBe(false);
  });

  it("reuses the contract's context id, opaque id and agentRef, and names its constants as the schema does", () => {
    expect(schema.properties.subject.$ref).toBe("common.schema.json#/$defs/contextId");
    expect(schema.properties.estate.anyOf[0].$ref).toBe("activity-common.schema.json#/$defs/opaqueId");
    expect(schema.properties.order.properties.id.$ref).toBe("activity-common.schema.json#/$defs/opaqueId");
    expect(schema.properties.agents.items.properties.agentRef.$ref).toBe("fabric-package.schema.json#/$defs/agentRef");
    expect(schema.properties.type.const).toBe(ENTITLEMENT_TYPE);
    expect(keySetSchema.properties.type.const).toBe(ENTITLEMENT_KEY_SET_TYPE);
    expect(schema.properties.alg.enum).toEqual([...ENTITLEMENT_ALGORITHMS]);
    expect(keySetSchema.properties.alg.enum).toEqual([...ENTITLEMENT_ALGORITHMS]);
    expect(keySetSchema.properties.keys.items.properties.alg.enum).toEqual([...ENTITLEMENT_ALGORITHMS]);
    expect(schema.properties.hosting.anyOf[0].properties.product.enum).toEqual([...HOSTING_PRODUCTS]);
    expect(schema.properties.support.anyOf[0].properties.tier.enum).toEqual([...SUPPORT_TIERS]);
    expect(schema.properties.licence.anyOf[0].properties.members.maximum).toBe(MAX_MEMBERS);
    expect(schema.properties.agents.maxItems).toBe(MAX_AGENTS);
    expect(keySetSchema.properties.keys.maxItems).toBe(MAX_KEYS);
    expect(keySetSchema.properties.revoked.maxItems).toBe(MAX_REVOKED);
    expect([MAX_ENTITLEMENT_SECONDS, REFRESH_SECONDS, GRACE_SECONDS, CLOCK_SKEW_SECONDS]).toEqual([3_024_000, 604_800, 1_209_600, 60]);
    expect([MAX_MEMBERS, MAX_AGENTS, MAX_KEYS, MAX_REVOKED]).toEqual([1_000_000, 256, 32, 256]);
  });

  it("refuses its negative fixtures, and a consumer vendors their whole $ref closure", () => {
    const negatives = readdirSync(path.join(root, "fixtures/negative")).filter((name) => name.startsWith("entitlement-"));
    expect(negatives.length).toBeGreaterThanOrEqual(17);
    for (const name of negatives) expect(valid(load(`negative/${name}`), name.startsWith("entitlement-key-set-") ? "entitlement-key-set" : "entitlement"), name).toBe(false);
    expect(schemaClosure(path.join(root, "schemas"), "entitlement.schema.json")).toEqual([
      "activity-common.schema.json", "common.schema.json", "entitlement.schema.json", "fabric-package.schema.json", "interop-capability.schema.json", "manifest.schema.json", "service-common.schema.json"
    ]);
    expect(schemaClosure(path.join(root, "schemas"), "entitlement-key-set.schema.json")).toEqual([
      "activity-common.schema.json", "common.schema.json", "entitlement-key-set.schema.json", "entitlement.schema.json", "fabric-package.schema.json", "interop-capability.schema.json", "manifest.schema.json", "service-common.schema.json"
    ]);
  });

  it("names no amount, price, currency or person anywhere in either schema", () => {
    const names = JSON.stringify([schema, keySetSchema]).match(/"([a-zA-Z]+)":/g)?.map((match) => match.slice(1, -2)) ?? [];
    for (const forbidden of ["amount", "price", "currency", "unit", "person", "user", "email", "member"]) expect(names, forbidden).not.toContain(forbidden);
  });
});

describe("the signature (DEC-0085, the register's entitlement/1 and entitlement-key-set/1)", () => {
  it("signs the RFC 8785 form of the document without sig, which ports reproduce from the seeds", () => {
    expect(entitlementSigningInput(vectors.signingInput.entitlement.document)?.toString("utf8")).toBe(vectors.signingInput.entitlement.input);
    expect(vectors.signingInput.entitlement.input.startsWith('{"agents":[{"agentRef":"urn:fabric:agent:example-publisher:notes"}')).toBe(true);
    expect(vectors.signingInput.entitlement.input).toContain('"type":"entitlement/1"');
    expect(vectors.signingInput.entitlement.input).toContain('"estate":null');
    expect(vectors.signingInput.entitlement.input).not.toContain('"sig"');
    expect(sign(null, entitlementSigningInput(BASE) as Buffer, K2).toString("base64url")).toBe(BASE.sig);
    expect(entitlementKeySetSigningInput(vectors.signingInput.keySet.document)?.toString("utf8")).toBe(vectors.signingInput.keySet.input);
    expect(vectors.signingInput.keySet.input).toContain('"type":"entitlement-key-set/1"');
    expect(sign(null, entitlementKeySetSigningInput(KEY_SET) as Buffer, ROOT).toString("base64url")).toBe(KEY_SET.sig);
    expect(vectors.keys.k2.x).toBe(KEY_SET.keys[1].x);
    expect(vectors.root).toEqual({ issuer: "https://platform.example", kid: "root-2026-1", x: vectors.keys.root.x });
  });

  it("has no signing input for another type, a missing or extra member, or a value RFC 8785 has no form for", () => {
    expect(entitlementSigningInput({ ...BASE, type: "entitlement/2" })).toBeUndefined();
    expect(entitlementSigningInput({ ...BASE, amount: "1" })).toBeUndefined();
    const { estate: _estate, ...noEstate } = BASE;
    expect(entitlementSigningInput(noEstate)).toBeUndefined();
    expect(entitlementSigningInput({ ...BASE, licence: { members: Number.NaN } })).toBeUndefined();
    expect(entitlementSigningInput("entitlement")).toBeUndefined();
    expect(entitlementKeySetSigningInput({ ...KEY_SET, type: "entitlement/1" })).toBeUndefined();
    expect(entitlementKeySetSigningInput(null)).toBeUndefined();
  });
});

describe("the vectors (DEC-0085)", () => {
  const zone = process.env.TZ;
  afterAll(() => {
    if (zone === undefined) delete process.env.TZ;
    else process.env.TZ = zone;
  });

  it("are exactly what the generator writes (tools/vectors/entitlement.ts)", () => {
    expect(buildEntitlementVectors()).toBe(readFileSync(path.join(root, VECTOR_FILE), "utf8"));
  });

  it.each(vectors.keySetCases as Json[])("key set: $name", (entry) => {
    expect(verifyEntitlementKeySet(setOf(entry.keySet), entry.trust)).toEqual(entry.expected);
  });

  it.each(vectors.verify as Json[])("verify: $name", (entry) => {
    expect(verifyEntitlement(entry.entitlement, trustOf(entry.trust) as never)).toEqual(entry.expected);
  });

  it("holds the same answers in UTC, in Asia/Tokyo and in America/St_Johns", () => {
    for (const [name, offset] of [["UTC", 0], ["Asia/Tokyo", -540], ["America/St_Johns", 210]] as const) {
      process.env.TZ = name;
      expect(new Date(2026, 0, 1).getTimezoneOffset(), name).toBe(offset);
      for (const entry of vectors.verify as Json[]) expect(verifyEntitlement(entry.entitlement, trustOf(entry.trust) as never), `${name}: ${entry.name}`).toEqual(entry.expected);
    }
  });

  it("holds a case per problem of entitlement.md's EN and EK tables, and the tables name every problem the vectors answer", () => {
    const table = (prefix: string) => [...new Set([...spec.matchAll(new RegExp(`^\\| ${prefix}-\\d+ \\| ([^|]+) \\|`, "gm"))].flatMap((match) => [...(match[1] ?? "").matchAll(/`([a-z-]+)`/g)].map((m) => m[1] as string)))].sort();
    const answered = (cases: Json[]) => [...new Set(cases.filter((entry) => !entry.expected.ok).map((entry) => entry.expected.problem as string))].sort();
    expect(answered(vectors.verify)).toEqual(table("EN"));
    expect(answered(vectors.keySetCases)).toEqual(table("EK"));
    expect(table("EN")).toHaveLength(17);
    expect(table("EK")).toHaveLength(9);
  });

  it("covers the decision's vector matrix by name (REQ-05)", () => {
    const names = [...(vectors.verify as Json[]), ...(vectors.keySetCases as Json[])].map((entry) => entry.name as string);
    for (const needed of [
      "valid:", "wrong subject: organization A's entitlement at organization B", "wrong subject: a personal entitlement at another person's estate",
      "wrong key:", "unknown kid:", "grace:", "lapsed:", "not yet valid:", "too long:", "replay: a lower revision", "replay: the held revision with other bytes",
      "redelivery:", "replay: an older order", "supersede: a newer order", "rotated key: K1, rotated out, issuedAt inside its window", "rotated key: K1 after its window",
      "revoked key:", "small-order key:", "stale:", "conflict:", "one person in two organizations:"
    ]) expect(names.some((name) => name.startsWith(needed)), needed).toBe(true);
  });

  it("accepts only documents the schemas accept (the standing instruction)", () => {
    const accepted = (vectors.verify as Json[]).filter((entry) => entry.expected.ok);
    expect(accepted.length).toBeGreaterThan(15);
    for (const entry of accepted) {
      expect(valid(entry.entitlement), entry.name).toBe(true);
      expect(codes("entitlement", entry.entitlement), entry.name).toEqual([]);
      expect(valid(SETS[entry.trust.keySet], "entitlement-key-set"), entry.name).toBe(true);
    }
    for (const entry of (vectors.keySetCases as Json[]).filter((c) => c.expected.ok)) {
      expect(valid(setOf(entry.keySet), "entitlement-key-set"), entry.name).toBe(true);
      expect(codes("entitlement-key-set", setOf(entry.keySet)), entry.name).toEqual([]);
    }
    for (const set of Object.values(vectors.keySets) as Json[]) expect(valid(set, "entitlement-key-set")).toBe(true);
  });
});

/** Changes to a valid document; each result is re-signed, so only its shape can refuse it. */
const ENTITLEMENT_MUTATIONS: Array<[string, (doc: Json) => unknown]> = [
  ["another type", (d) => ({ ...d, type: "entitlement/2" })],
  ["an extra member", (d) => ({ ...d, amount: "120" })],
  ["a currency", (d) => ({ ...d, currency: "USD" })],
  ["no estate member", ({ estate: _e, ...d }) => d],
  ["no agents member", ({ agents: _a, ...d }) => d],
  ["an upper-case issuer", (d) => ({ ...d, issuer: "https://Platform.example" })],
  ["an issuer with a port", (d) => ({ ...d, issuer: "https://platform.example:443" })],
  ["an issuer with a path", (d) => ({ ...d, issuer: "https://platform.example/v1" })],
  ["an issuer with a trailing slash", (d) => ({ ...d, issuer: "https://platform.example/" })],
  ["an http issuer", (d) => ({ ...d, issuer: "http://platform.example" })],
  ["a one-label issuer", (d) => ({ ...d, issuer: "https://localhost" })],
  ["an issuer label ending in a hyphen", (d) => ({ ...d, issuer: "https://platform-.example" })],
  ["an issuer too long", (d) => ({ ...d, issuer: `https://${"a".repeat(63)}.${"b".repeat(63)}.${"c".repeat(63)}.${"d".repeat(63)}.example` })],
  ["a numeric issuer", (d) => ({ ...d, issuer: 7 })],
  ["a person subject", (d) => ({ ...d, subject: "person:p-1" })],
  ["an upper-case personal", (d) => ({ ...d, subject: "Personal" })],
  ["an org id with a dot", (d) => ({ ...d, subject: "org:org.a" })],
  ["an estate on an organization", (d) => ({ ...d, estate: "estate-5d0f1a" })],
  ["a numeric estate", (d) => ({ ...d, estate: 7 })],
  ["an order without revision", (d) => ({ ...d, order: { id: d.order.id } })],
  ["an order with an extra member", (d) => ({ ...d, order: { ...d.order, amount: 1 } })],
  ["an order id with a space", (d) => ({ ...d, order: { ...d.order, id: "ord a" } })],
  ["an order id with an @", (d) => ({ ...d, order: { ...d.order, id: "a@b" } })],
  ["revision 0", (d) => ({ ...d, order: { ...d.order, revision: 0 } })],
  ["a fractional revision", (d) => ({ ...d, order: { ...d.order, revision: 1.5 } })],
  ["a string revision", (d) => ({ ...d, order: { ...d.order, revision: "3" } })],
  ["a revision above 2^53 − 1", (d) => ({ ...d, order: { ...d.order, revision: 2 ** 53 } })],
  ["an order that is a string", (d) => ({ ...d, order: "ord-1" })],
  ["a time without an offset", (d) => ({ ...d, issuedAt: "2026-10-20T00:00:00" })],
  ["a time on 31 November", (d) => ({ ...d, expiresAt: "2026-11-31T00:00:00Z" })],
  ["a time with an offset of 24 hours", (d) => ({ ...d, notBefore: "2026-10-20T00:00:00+24:00" })],
  ["a time as a number", (d) => ({ ...d, notBefore: 1_792_000_000_000 })],
  ["a date without a time", (d) => ({ ...d, expiresAt: "2026-11-24" })],
  ["no members", (d) => ({ ...d, licence: {} })],
  ["members 0", (d) => ({ ...d, licence: { members: 0 } })],
  ["members above a million", (d) => ({ ...d, licence: { members: 1_000_001 } })],
  ["fractional members", (d) => ({ ...d, licence: { members: 2.5 } })],
  ["members as a string", (d) => ({ ...d, licence: { members: "25" } })],
  ["a licence with a price", (d) => ({ ...d, licence: { members: 25, price: "10" } })],
  ["a licence that is a number", (d) => ({ ...d, licence: 25 })],
  ["an unknown hosting product", (d) => ({ ...d, hosting: { product: "edge-cloud", size: "s-2" } })],
  ["personal-cloud for an organization", (d) => ({ ...d, hosting: { product: "personal-cloud", size: "s-2" } })],
  ["hosting without size", (d) => ({ ...d, hosting: { product: "org-cloud" } })],
  ["hosting with a size that has a space", (d) => ({ ...d, hosting: { product: "org-cloud", size: "s 2" } })],
  ["hosting with an extra member", (d) => ({ ...d, hosting: { ...d.hosting, region: "eu" } })],
  ["an unknown support tier", (d) => ({ ...d, support: { tier: "full" } })],
  ["support with an extra member", (d) => ({ ...d, support: { tier: "assist", hours: 4 } })],
  ["support as a string", (d) => ({ ...d, support: "assist" })],
  ["an agent listed twice", (d) => ({ ...d, agents: [d.agents[0], d.agents[0]] })],
  ["257 agents", (d) => ({ ...d, agents: Array.from({ length: 257 }, (_, i) => ({ agentRef: `urn:fabric:agent:example-publisher:a${i}` })) })],
  ["an agentRef in upper case", (d) => ({ ...d, agents: [{ agentRef: "urn:fabric:agent:Example:notes" }] })],
  ["an agentRef too long", (d) => ({ ...d, agents: [{ agentRef: `urn:fabric:agent:p:${"a".repeat(140)}` }] })],
  ["an agent with a price", (d) => ({ ...d, agents: [{ ...d.agents[0], price: "5" }] })],
  ["an agent that is a string", (d) => ({ ...d, agents: ["urn:fabric:agent:example-publisher:notes"] })],
  ["agents as an object", (d) => ({ ...d, agents: {} })],
  ["ES256", (d) => ({ ...d, alg: "ES256" })],
  ["a numeric alg", (d) => ({ ...d, alg: 7 })],
  ["an empty kid", (d) => ({ ...d, kid: "" })],
  ["a kid with a space", (d) => ({ ...d, kid: "ent 2026" })],
  ["a kid of 129 characters", (d) => ({ ...d, kid: "k".repeat(129) })],
  ["a __proto__ member", (d) => ({ ...JSON.parse(`{"__proto__": {"x": 1}}`), ...d })]
];

const SIG_MUTATIONS: Array<[string, (doc: Json) => unknown]> = [
  ["a signature of 63 bytes", (d) => ({ ...d, sig: d.sig.slice(0, -2) })],
  ["a non-canonical last character", (d) => ({ ...d, sig: `${d.sig.slice(0, -1)}B` })],
  ["a padded signature", (d) => ({ ...d, sig: `${d.sig}==` })],
  ["a signature with a plus", (d) => ({ ...d, sig: `+${d.sig.slice(1)}` })],
  ["no signature", ({ sig: _s, ...d }) => d],
  ["a numeric signature", (d) => ({ ...d, sig: 7 })]
];

const KEY_SET_MUTATIONS: Array<[string, (set: Json) => unknown]> = [
  ["another type", (s) => ({ ...s, type: "entitlement/1" })],
  ["an extra member", (s) => ({ ...s, note: "x" })],
  ["an issuer with a path", (s) => ({ ...s, issuer: "https://platform.example/keys" })],
  ["revision 0", (s) => ({ ...s, revision: 0 })],
  ["a string revision", (s) => ({ ...s, revision: "2" })],
  ["an issuedAt without an offset", (s) => ({ ...s, issuedAt: "2026-10-15T00:00:00" })],
  ["no keys", (s) => ({ ...s, keys: [] })],
  ["33 keys", (s) => ({ ...s, keys: Array.from({ length: 33 }, (_, i) => ({ ...s.keys[1], kid: `k-${i}` })) })],
  ["a key with a private member", (s) => ({ ...s, keys: [{ ...s.keys[0], d: s.keys[0].x }] })],
  ["a key without a window end", (s) => ({ ...s, keys: [(({ notAfter: _n, ...k }) => k)(s.keys[0])] })],
  ["a key of small order", (s) => ({ ...s, keys: [{ ...s.keys[0], x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" }] })],
  ["a key of small order with its sign bit set", (s) => ({ ...s, keys: [{ ...s.keys[0], x: "7f________________________________________8" }] })],
  ["a key of 31 bytes", (s) => ({ ...s, keys: [{ ...s.keys[0], x: s.keys[0].x.slice(0, -1) }] })],
  ["a key in base64 with a slash", (s) => ({ ...s, keys: [{ ...s.keys[0], x: `/${s.keys[0].x.slice(1)}` }] })],
  ["a key under ES256", (s) => ({ ...s, keys: [{ ...s.keys[0], alg: "ES256" }] })],
  ["a key that is a string", (s) => ({ ...s, keys: ["ent-2026-09"] })],
  ["a kid listed twice in revoked", (s) => ({ ...s, revoked: ["ent-2026-08", "ent-2026-08"] })],
  ["a revoked kid with a space", (s) => ({ ...s, revoked: ["ent 2026"] })],
  ["revoked as a string", (s) => ({ ...s, revoked: "ent-2026-08" })],
  ["the set under ES256", (s) => ({ ...s, alg: "ES256" })],
  ["an empty kid", (s) => ({ ...s, kid: "" })]
];

describe("every input the schema refuses, the verifiers refuse (the standing instruction)", () => {
  it("refuses each re-signed entitlement the schema refuses, and the change is the only reason", () => {
    let refusedBySchema = 0;
    for (const [what, change] of ENTITLEMENT_MUTATIONS) {
      const changed = change(structuredClone(BASE)) as Json;
      const document = resign(changed);
      if (valid(document)) continue;
      refusedBySchema += 1;
      expect(verifyEntitlement(document, ORG_TRUST).ok, what).toBe(false);
    }
    expect(refusedBySchema).toBe(ENTITLEMENT_MUTATIONS.length);
    for (const [what, change] of SIG_MUTATIONS) {
      const document = change(structuredClone(BASE));
      expect(valid(document), what).toBe(false);
      expect(verifyEntitlement(document, ORG_TRUST), what).toEqual({ ok: false, problem: "malformed" });
    }
    // The base re-signed by the test's signer is the base: the mutations above stand alone.
    expect(resign(BASE).sig).toBe(BASE.sig);
    expect(verifyEntitlement(resign(BASE), ORG_TRUST).ok).toBe(true);
  });

  it("refuses a personal entitlement whose lines disagree, as the schema does", () => {
    for (const [what, change] of [
      ["a licence", { licence: { members: 1 } }],
      ["a support tier", { support: { tier: "observe" } }],
      ["no estate", { estate: null }],
      ["org-cloud", { hosting: { product: "org-cloud", size: "p-1" } }]
    ] as const) {
      const document = resign({ ...PERSONAL, ...change });
      expect(valid(document), what).toBe(false);
      expect(verifyEntitlement(document, PERSONAL_TRUST), what).toEqual({ ok: false, problem: "malformed" });
    }
    expect(verifyEntitlement(resign({ ...PERSONAL, hosting: null }), PERSONAL_TRUST).ok).toBe(true);
  });

  it("refuses each re-signed negative fixture", () => {
    for (const name of readdirSync(path.join(root, "fixtures/negative")).filter((file) => file.startsWith("entitlement-") && !file.startsWith("entitlement-key-set-"))) {
      const fixture = load(`negative/${name}`);
      const document = name.includes("short-sig") ? fixture : resign(fixture);
      expect(valid(document), name).toBe(false);
      expect(verifyEntitlement(document, fixture.subject === "personal" ? PERSONAL_TRUST : ORG_TRUST).ok, name).toBe(false);
    }
    for (const name of readdirSync(path.join(root, "fixtures/negative")).filter((file) => file.startsWith("entitlement-key-set-"))) {
      const document = resign(load(`negative/${name}`), ROOT);
      expect(valid(document, "entitlement-key-set"), name).toBe(false);
      expect(verifyEntitlementKeySet(document, PIN).ok, name).toBe(false);
    }
  });

  it("refuses each re-signed key set the schema refuses", () => {
    for (const [what, change] of KEY_SET_MUTATIONS) {
      const document = resign(change(structuredClone(KEY_SET)) as Json, ROOT);
      expect(valid(document, "entitlement-key-set"), what).toBe(false);
      expect(verifyEntitlementKeySet(document, PIN).ok, what).toBe(false);
      // Handed to the entitlement verifier as applied, it is not a key set it can use.
      expect(verifyEntitlement(BASE, { ...ORG_TRUST, keySet: document }).ok, what).toBe(false);
    }
    expect(resign(KEY_SET, ROOT).sig).toBe(KEY_SET.sig);
    expect(verifyEntitlementKeySet(resign(KEY_SET, ROOT), PIN).ok).toBe(true);
  });
});

describe("the verifiers' contexts and edges (DEC-0085)", () => {
  const hostile: unknown[] = [null, 7, "x", true, [], {}, { toString: 1 }, JSON.parse('{"__proto__": {"ok": true}}'), JSON.parse('{"constructor": {"prototype": 1}}'), 2 ** 64, -0];

  it("answers every hostile document and context, and never throws", () => {
    for (const value of hostile) {
      expect(() => verifyEntitlement(value, ORG_TRUST)).not.toThrow();
      expect(verifyEntitlement(value, ORG_TRUST).ok).toBe(false);
      expect(() => verifyEntitlement(BASE, value as never)).not.toThrow();
      expect(verifyEntitlement(BASE, value as never).ok).toBe(false);
      expect(verifyEntitlementKeySet(value, PIN).ok).toBe(false);
      expect(verifyEntitlementKeySet(KEY_SET, value as never)).toEqual({ ok: false, problem: "context-invalid" });
      for (const member of ["subject", "estate", "keySet", "held"]) {
        expect(() => verifyEntitlement(BASE, { ...ORG_TRUST, [member]: value } as never), member).not.toThrow();
      }
      expect(() => verifyEntitlement({ ...BASE, order: value, agents: [value], licence: value, hosting: value }, ORG_TRUST)).not.toThrow();
      expect(() => verifyEntitlementKeySet({ ...KEY_SET, keys: [value, { ...KEY_SET.keys[0], kid: value }] }, PIN)).not.toThrow();
    }
  });

  it("refuses a context it cannot use before reading the entitlement", () => {
    for (const bad of [
      { ...ORG_TRUST, subject: 7 },
      { ...ORG_TRUST, subject: "org:" },
      { ...ORG_TRUST, estate: "estate-5d0f1a" },
      { ...PERSONAL_TRUST, estate: undefined },
      { ...PERSONAL_TRUST, estate: "a b" },
      { ...ORG_TRUST, keySet: null },
      { ...ORG_TRUST, keySet: { ...KEY_SET, keys: [{ ...KEY_SET.keys[0], kid: KEY_SET.kid }] } },
      { ...ORG_TRUST, held: "held" },
      { ...ORG_TRUST, held: { orderId: "ord-org-a-0001", revision: 2 ** 53, issuedAt: "2026-10-20T00:00:00Z", digest: `sha256:${"0".repeat(64)}` } },
      { ...ORG_TRUST, held: { orderId: "ord-org-a-0001", revision: 3, issuedAt: "2026-10-20", digest: `sha256:${"0".repeat(64)}` } },
      { ...ORG_TRUST, held: { orderId: "a b", revision: 3, issuedAt: "2026-10-20T00:00:00Z", digest: `sha256:${"0".repeat(64)}` } }
    ]) expect(verifyEntitlement(BASE, bad as never)).toEqual({ ok: false, problem: "context-invalid" });
    expect(verifyEntitlement(BASE, { ...ORG_TRUST, now: "2026-10-25T12:00:00Z" } as never)).toEqual({ ok: false, problem: "no-clock" });
    expect(verifyEntitlement(BASE, { ...ORG_TRUST, now: new Date(Number.NaN) })).toEqual({ ok: false, problem: "no-clock" });
    for (const bad of [{ root: null }, { root: { ...vectors.root, issuer: "https://Platform.example" } }, { root: { ...vectors.root, kid: "" } }, { root: { ...vectors.root, x: 7 } }, { ...PIN, held: { revision: 1, digest: "sha256:x" } }]) {
      expect(verifyEntitlementKeySet(KEY_SET, bad as never)).toEqual({ ok: false, problem: "context-invalid" });
    }
  });

  it("refuses a revoked kid that a defective key set also lists, and an entitlement whose bytes a key set's kid cannot reach", () => {
    // A key set with a kid both listed and revoked is not well formed; the verifier refuses it as a context.
    expect(verifyEntitlement(BASE, { ...ORG_TRUST, keySet: { ...KEY_SET, revoked: [BASE.kid] } })).toEqual({ ok: false, problem: "context-invalid" });
    // An entitlement re-signed by K2 after its issuedAt left K2's window: the window, not the signature, refuses it.
    const late = resign({ ...BASE, issuedAt: "2027-01-01T00:00:00Z", notBefore: "2027-01-01T00:00:00Z", expiresAt: "2027-02-01T00:00:00Z" });
    expect(verifyEntitlement(late, { ...ORG_TRUST, now: new Date("2027-01-02T00:00:00Z") })).toEqual({ ok: false, problem: "key-not-valid" });
  });

  it("returns the held record a verifier stores, and accepts its own answer as redelivery", () => {
    const first = verifyEntitlement(BASE, ORG_TRUST);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.held).toEqual({ orderId: "ord-org-a-0001", revision: 3, issuedAt: "2026-10-20T00:00:00Z", digest: first.digest });
    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(verifyEntitlement(BASE, { ...ORG_TRUST, held: first.held })).toEqual({ ...first, unchanged: true });
    const applied = verifyEntitlementKeySet(KEY_SET, PIN);
    expect(applied.ok && verifyEntitlementKeySet(KEY_SET, { ...PIN, held: applied.held })).toEqual({ ...applied, unchanged: true });
  });
});

describe("entitlement semantic fixtures (FAC-SEM-115, FAC-SEM-116)", () => {
  const files = readdirSync(path.join(root, "fixtures/semantic")).filter((name) => name.startsWith("entitlement-"));

  it("has a passing and a failing input for each rule", () => {
    const fixtures = files.map((name) => load(`semantic/${name}`));
    for (const [kind, code] of [["entitlement", "FAC-SEM-115"], ["entitlement-key-set", "FAC-SEM-116"]]) {
      const own = fixtures.filter((fixture) => fixture.kind === kind);
      expect(own.some((fixture) => fixture.expect.length === 0), kind).toBe(true);
      expect(own.some((fixture) => fixture.expect.includes(code)), kind).toBe(true);
    }
  });

  it.each(files)("%s yields exactly its expected codes", (name) => {
    const fixture = load(`semantic/${name}`);
    expect(codes(fixture.kind, fixture.input)).toEqual(fixture.expect);
  });

  it("flags each problem of one entitlement where it is", () => {
    const at = (base: Json, change: Json) => evaluateSemanticRules("entitlement", { ...base, ...change }).map((finding) => `${finding.instancePath} ${finding.message}`);
    expect(at(PERSONAL, { licence: { members: 1 }, support: { tier: "assist" }, estate: null, hosting: { product: "org-cloud", size: "s" } })).toEqual([
      "/estate a personal entitlement names the person's estate, which binds it to one network",
      "/licence a personal entitlement has no licence: a personal-cloud order has no members",
      "/support a personal entitlement has no support tier",
      "/hosting/product a personal entitlement's hosting is personal-cloud"
    ]);
    expect(at(PERSONAL, { hosting: "x" })).toEqual([]);
    expect(at(BASE, { estate: "estate-5d0f1a", hosting: { product: "personal-cloud", size: "p" } })).toEqual([
      "/estate an organization's entitlement names no estate",
      "/hosting/product an organization's hosting is org-cloud"
    ]);
    expect(at(BASE, { hosting: null })).toEqual([]);
    expect(at(BASE, { subject: 7 })).toEqual(["/subject the subject is personal or org:<orgId>, never a person"]);
    expect(at(BASE, { issuedAt: "x", expiresAt: 3 })).toEqual([
      "/issuedAt a time is an RFC 3339 date-time with an offset, on a day that exists",
      "/expiresAt a time is an RFC 3339 date-time with an offset, on a day that exists"
    ]);
    expect(at(BASE, { notBefore: "2026-11-24T00:00:00Z", expiresAt: "2026-11-25T00:00:01Z" })).toEqual([
      "/expiresAt an entitlement expires at most 35 days after it is issued"
    ]);
    expect(at(BASE, { notBefore: "2026-10-19T00:00:00Z" })).toEqual(["/notBefore notBefore is at or after issuedAt"]);
    expect(at(BASE, { notBefore: "2026-11-24T00:00:00Z" })).toEqual(["/expiresAt expiresAt is after notBefore"]);
    expect(at(BASE, { agents: [null, BASE.agents[0], 7, BASE.agents[0]] })).toEqual(["/agents/3/agentRef agent urn:fabric:agent:example-publisher:notes is listed twice"]);
    expect(at(BASE, { agents: "x" })).toEqual([]);
  });

  it("flags each problem of one key set where it is", () => {
    const at = (change: Json) => evaluateSemanticRules("entitlement-key-set", { ...KEY_SET, ...change }).map((finding) => `${finding.instancePath} ${finding.message}`);
    const [k1, k2] = KEY_SET.keys as [Json, Json];
    expect(at({ keys: [k1, { ...k2, kid: k1.kid }] })).toEqual(["/keys/1/kid kid ent-2026-09 is listed twice"]);
    expect(at({ keys: [null, { ...k2, kid: KEY_SET.kid }] })).toEqual(["/keys/1/kid the root's kid signs key sets only and is never a signing key"]);
    expect(at({ revoked: [k2.kid] })).toEqual(["/keys/1/kid kid ent-2026-10 is revoked, so it is not listed among the keys"]);
    expect(at({ keys: [{ ...k1, notBefore: 7 }] })).toEqual(["/keys/0/notBefore a key's window is two RFC 3339 date-times with an offset"]);
    expect(at({ keys: [{ ...k1, notAfter: "2026-11-01" }] })).toEqual(["/keys/0/notAfter a key's window is two RFC 3339 date-times with an offset"]);
    expect(at({ keys: [{ ...k1, notAfter: "2026-08-01T00:00:00Z" }] })).toEqual(["/keys/0/notAfter a key's window ends after it starts"]);
    expect(at({ keys: [{ ...k1, x: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIA" }] })).toEqual(["/keys/0/x a key of small order lets anyone forge a signature (DEC-0045)"]);
    expect(at({ keys: [{ ...k1, x: "not a key" }], revoked: "x" })).toEqual([]);
  });
});
