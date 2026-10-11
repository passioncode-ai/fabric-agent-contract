import { generateKeyPairSync, sign as cryptoSign } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import * as delegation from "../src/delegation.js";
import { DELEGATION_TYP, verifyDelegation, type Jwks } from "../src/delegation.js";
import * as links from "../src/fabric-links.js";
import { parseFabricLink } from "../src/fabric-links.js";
import * as projection from "../src/grant-projection.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";

// DEC-0041 (Fabric ADR-0144 amendment 1): the call window, the task claim, the meter's read of the hub's grant
// projection, and fabric:// credential names matched by whole words (CO-260 (1)).
type Json = Record<string, unknown>;
const root = projectRoot();
const load = (relative: string) => JSON.parse(readFileSync(path.join(root, "fixtures", relative), "utf8")) as Json;
const read = (relative: string) => readFileSync(path.join(root, relative), "utf8");
const validator = await createValidator();
const valid = (name: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${name}`, value).valid;
const codes = (kind: string, value: unknown) => evaluateSemanticRules(kind, value).map((f) => f.code);
const paths = (kind: string, value: unknown) => [...new Set(evaluateSemanticRules(kind, value).map((f) => f.instancePath))].sort();

describe("1 — the call window: a grant's per-call maximum (DEC-0041)", () => {
  it("is a refusal window of a denied grant check and of a refusal, always at level L3", () => {
    expect(valid("grant-check.schema.json", load("positive/grant-check-denied-call.json"))).toBe(true);
    expect(valid("grant-check.schema.json", load("negative/grant-check-call-not-l3.json"))).toBe(false);
    expect(valid("delegation-refusal.schema.json", load("positive/delegation-refusal-limit-call.json"))).toBe(true);
    expect(valid("delegation-refusal.schema.json", load("negative/delegation-refusal-call-not-l3.json"))).toBe(false);
    const refusal = load("positive/delegation-refusal-limit-call.json");
    const data = ((refusal.error as Json).data as Json);
    const withoutLevel = { error: { ...(refusal.error as Json), data: { detail: data.detail, window: "call" } } };
    expect(valid("delegation-refusal.schema.json", withoutLevel)).toBe(false);
  });

  it("is not a grant limit window: a grant's limits and a token's remaining spend stay total…month", () => {
    expect(valid("governance.schema.json", load("negative/grant-spend-call-window.json"))).toBe(false);
    const claims = load("positive/delegation-token-claims.json");
    const spend = { mode: "limited", remaining: [{ window: "call", remainingUsd: 0.5 }] };
    expect(valid("delegation-token.schema.json", { ...claims, spend })).toBe(false);
  });

  it("is stated in the spend policy and in the refusal table", () => {
    const policy = read("docs/specification/spend-policy.md");
    expect(policy).toMatch(/`perCallMaxUsd`[^\n]*`limit-reached` with window `call`/);
    expect(policy).toMatch(/window `call` is a refusal window, not a grant limit window/);
    expect(read("docs/specification/delegation.md")).toMatch(/\| `limit-reached` \|[^\n]*`call`[^\n]*L3/);
  });
});

describe("2 — the task claim (DEC-0041)", () => {
  const estate = generateKeyPairSync("ed25519");
  const jwks: Jwks = { keys: [{ ...(estate.publicKey.export({ format: "jwk" }) as Json), kid: "estate-new", use: "sig", alg: "EdDSA" } as Jwks["keys"][number]] };
  const segment = (value: Json) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const sign = (payload: Json) => {
    const signing = `${segment({ alg: "EdDSA", typ: DELEGATION_TYP, kid: "estate-new" })}.${segment(payload)}`;
    return `${signing}.${cryptoSign(null, Buffer.from(signing), estate.privateKey).toString("base64url")}`;
  };
  const claims = load("positive/delegation-token-claims-task.json");
  const call = { audience: "example-writer", jwks, now: (claims.iat as number) + 30, capability: "writer.write", effect: "draft" as const };

  it("is an optional id with the session's grammar", () => {
    expect(valid("delegation-token.schema.json", claims)).toBe(true);
    expect(valid("delegation-token.schema.json", load("negative/delegation-token-task-not-an-id.json"))).toBe(false);
    expect(valid("delegation-token.schema.json", { ...claims, task: "t".repeat(129) })).toBe(false);
    expect(valid("delegation-token.schema.json", { ...claims, task: "" })).toBe(false);
  });

  it("is a typed claim to the verifier: a task that is not an id is unauthenticated", () => {
    expect(verifyDelegation(sign(claims), call)).toMatchObject({ ok: true, claims: { task: "task:01JA7Z0K4M" } });
    for (const task of [42, "", "two words", "t".repeat(129)]) {
      expect(verifyDelegation(sign({ ...claims, task }), call), String(task)).toMatchObject({ ok: false, code: "unauthenticated", detail: "malformed-claims" });
    }
  });

  it("FAC-SEM-050: an onward token keeps the parent's task or none, never another; the meter's keeps it", () => {
    const kept = load("semantic/delegation-mint-task-kept.json");
    for (const part of ["parent", "token"]) expect(valid("delegation-token.schema.json", kept[part]), part).toBe(true);
    expect(codes("delegation-mint", kept)).toEqual([]);
    const dropped = { ...kept, token: { ...(kept.token as Json) } };
    delete (dropped.token as Json).task;
    expect(codes("delegation-mint", dropped)).toEqual([]);
    expect(paths("delegation-mint", load("semantic/delegation-mint-task-other.json"))).toEqual(["/token/task"]);
    const unparented = { ...kept, parent: { ...(kept.parent as Json) } };
    delete (unparented.parent as Json).task;
    expect(paths("delegation-mint", unparented)).toEqual(["/token/task"]);
    const meter = load("semantic/delegation-mint-meter-drops-task.json");
    expect(paths("delegation-mint", meter)).toEqual(["/token/task"]);
    const meterKept = { ...meter, token: { ...(meter.token as Json), task: (meter.parent as Json).task } };
    expect(codes("delegation-mint", meterKept)).toEqual([]);
  });

  it("keys the meter's task window on task, else on the first session along the actor chain, else on the grant", () => {
    const meterToken = load("semantic/delegation-mint-meter-ok.json").token as delegation.DelegationClaims;
    const ref = meterToken.grant[0] as string;
    expect(delegation.taskWindowKey({ ...meterToken, task: "task:01JA7Z0K4M" }, ref)).toBe("task:task:01JA7Z0K4M");
    const inSession = { ...meterToken, act: { sub: "example-writer", act: { sub: "example-media", session: "s-7", act: { sub: "example-agent.default" } } } };
    expect(delegation.taskWindowKey(inSession, ref)).toBe("session:example-media:s-7");
    // No task and no session: one window for the whole grant (Fabric ADR-0144 amendment 2), never a jti.
    expect(delegation.taskWindowKey(meterToken, ref)).toBe(`grant:${ref}`);
    // The walk starts at the outermost actor, the callee: its own session wins over its caller's.
    const calleeSession = { ...meterToken, act: { ...meterToken.act, session: "callee-1" } };
    expect(delegation.taskWindowKey(calleeSession, ref)).toBe(`session:${meterToken.act?.sub}:callee-1`);
    const bothSessions = { ...meterToken, act: { sub: "example-writer", session: "w-1", act: { sub: "example-media", session: "s-7" } } };
    expect(delegation.taskWindowKey(bothSessions, ref)).toBe("session:example-writer:w-1");
    // A session three actors deep is still found.
    const deep = { ...meterToken, act: { sub: "a", act: { sub: "b", act: { sub: "c", session: "c-1" } } } };
    expect(delegation.taskWindowKey(deep, ref)).toBe("session:c:c-1");
  });

  it("never keys the task window on a jti: a fresh token or a fresh tokenJti opens no new window", () => {
    const meterToken = load("semantic/delegation-mint-meter-ok.json").token as delegation.DelegationClaims;
    const ref = meterToken.grant[0] as string;
    const request = load("positive/grant-check-request.json");
    // The request's tokenJti is unsigned; the callee may send any. Two checks that differ in it share one window.
    const again = { ...request, tokenJti: "01JA7ZZZZZZZZZZZZZZZZZZZZZ" };
    expect(valid("grant-check-request.schema.json", again)).toBe(true);
    const keyFor = (claims: delegation.DelegationClaims, checked: Json) => delegation.taskWindowKey(claims, typeof checked.grantRef === "string" ? checked.grantRef : ref);
    expect(keyFor(meterToken, again)).toBe(keyFor(meterToken, request));
    expect(keyFor({ ...meterToken, jti: "01JA7ZZZZZZZZZZZZZZZZZZZZZ" }, request)).toBe(keyFor(meterToken, request));
    expect(keyFor(meterToken, request)).not.toMatch(/jti|01JA7Y/);
    // A reference the token does not name keys nothing: the meter checks only a grant the signed token names.
    expect(() => delegation.taskWindowKey(meterToken, "urn:grant:project-a:another#1")).toThrow(RangeError);
  });

  it("is stated in the delegation profile and in the spend policy", () => {
    const profile = read("docs/specification/delegation.md");
    expect(profile).toMatch(/\| `task` \| no \|/);
    expect(profile).toMatch(/keeps the parent's `task` or none, never another/);
    const policy = read("docs/specification/spend-policy.md");
    expect(policy).toMatch(/`task` window[^\n]*keyed on the token's `task`/);
    // DL-24's rule, word for word where it names the key: the first session along the actor chain, else the grant.
    for (const [name, text] of [["delegation.md", profile], ["spend-policy.md", policy], ["CONTEXT.md", read("CONTEXT.md")], ["DECISIONS.md", read("docs/DECISIONS.md")], ["conformance.md", read("docs/specification/conformance.md")]] as const) {
      const flat = text.replace(/\s+/g, " ");
      expect(flat, name).toMatch(/first `session` met walking the [^.]*actor chain from (its|the) outermost actor/);
      expect(flat, name).toMatch(/else on the grant itself \(`grant:<ref>`\)/);
      expect(flat, name).not.toMatch(/session of the agent that called the callee|the calling agent's session|else on the call's `jti`|else the call's `jti`|else on the `jti` of the callee's own token/);
    }
  });
});

describe("3 — the meter reads the hub's projection of a grant (DEC-0041)", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "fac-grants-"));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));
  const grant = load("positive/governance-grant-delegation.json");
  const meta = grant.meta as Json;
  const ref = `${String(meta.id)}#${String(meta.revision)}`;
  const NOW = Date.parse("2026-10-12T09:00:00Z") / 1000;
  let n = 0;
  /** A grants directory as the hub writes it: 0700, each file 0600, named `<meta.id>.json`. */
  function hubDir(files: Record<string, Json | string>, mode = 0o700): string {
    const dir = path.join(scratch, `grants-${n++}`);
    mkdirSync(dir, { mode: 0o700 });
    for (const [name, value] of Object.entries(files)) {
      const file = path.join(dir, name);
      writeFileSync(file, typeof value === "string" ? value : JSON.stringify(value), { mode: 0o600 });
      chmodSync(file, 0o600);
    }
    chmodSync(dir, mode);
    return dir;
  }
  const at = (dir: string, value: string) => projection.readProjectedGrant(dir, value, { now: NOW });
  const result = (dir: string, value: string = ref) => {
    const answer = at(dir, value);
    return answer.ok ? "ok" : `${answer.code}/${answer.detail}`;
  };
  const file = `${String(meta.id)}.json`;
  const revised = (changes: Json) => ({ ...grant, ...changes });

  it("returns the grant when the file is there, at the token's revision and active", () => {
    const answer = at(hubDir({ [file]: grant }), ref);
    expect(answer).toMatchObject({ ok: true, ref });
    if (answer.ok) expect(answer.grant).toEqual(grant);
  });

  it("no-grant: no file, another revision, a reference that names no grant, a grant not yet started", () => {
    expect(result(hubDir({}))).toBe("no-grant/not-projected");
    expect(result(hubDir({ [file]: revised({ meta: { ...meta, revision: 4 } }) }))).toBe("no-grant/revised");
    for (const bad of ["no-revision", `${String(meta.id)}#x`, `${String(meta.id)}#-1`, "../escape#3", "a/b#3", "#3", `${String(meta.id)}#3#4`, ".hidden#3", "a b#3", "a\\b#3", `${"a".repeat(201)}#3`]) {
      expect(result(hubDir({ [file]: grant }), bad), bad).toBe("no-grant/malformed-reference");
    }
    expect(result(hubDir({ [file]: revised({ startsAt: "2026-10-13T00:00:00Z" }) }))).toBe("no-grant/not-started");
  });

  it("grant-revoked and grant-expired: the projected state, or an expiry that has passed", () => {
    expect(result(hubDir({ [file]: revised({ state: "revoked" }) }))).toBe("grant-revoked/revoked");
    expect(result(hubDir({ [file]: revised({ state: "expired" }) }))).toBe("grant-expired/expired");
    expect(result(hubDir({ [file]: revised({ expiresAt: "2026-10-12T08:59:59Z" }) }))).toBe("grant-expired/expired");
  });

  it("unknown-state: no directory, an unreadable or malformed file, a projection behind the token, a file for another grant, loose permissions", () => {
    expect(result(path.join(scratch, "absent"))).toBe("unknown-state/no-projection");
    expect(result(hubDir({ [file]: "{not json" }))).toBe("unknown-state/malformed-file");
    expect(result(hubDir({ [file]: { ...grant, kind: "one-shot-grant" } }))).toBe("unknown-state/malformed-file");
    expect(result(hubDir({ [file]: revised({ state: "paused" }) }))).toBe("unknown-state/unknown-grant-state");
    expect(result(hubDir({ [file]: revised({ meta: { ...meta, revision: 2 } }) }))).toBe("unknown-state/projection-behind");
    expect(result(hubDir({ [file]: revised({ meta: { ...meta, id: "urn:grant:project-a:another" } }) }))).toBe("unknown-state/another-grant");
    if (process.platform !== "win32") {
      const open = hubDir({ [file]: grant });
      chmodSync(path.join(open, file), 0o644);
      expect(result(open)).toBe("unknown-state/loose-permissions");
      expect(result(hubDir({ [file]: grant }, 0o755))).toBe("unknown-state/loose-permissions");
      if (process.getuid?.() !== 0) {
        const locked = hubDir({ [file]: grant });
        chmodSync(path.join(locked, file), 0o000);
        expect(result(locked)).toBe("unknown-state/unreadable");
      }
    }
  });

  it("unknown-state: a time that is not RFC 3339 with a zone, a file outside the standing-grant shape", () => {
    for (const expiresAt of ["2026-11-11T09:00:00", "12 Nov 2026", "2026-11-11", "2026-11-11 09:00:00Z", "2026-11-11T09:00:00+0200", "1794393600"]) {
      expect(result(hubDir({ [file]: revised({ expiresAt }) })), expiresAt).toBe("unknown-state/malformed-file");
    }
    expect(result(hubDir({ [file]: revised({ startsAt: "Oct 11 2026 09:00" }) }))).toBe("unknown-state/malformed-file");
    expect(result(hubDir({ [file]: revised({ expiresAt: "2026-11-11T11:00:00+02:00", startsAt: "2026-10-11T09:00:00.5Z" }) }))).toBe("ok");
    // RFC 3339 §5.6 allows a lowercase `t` and `z`; the schema's date-time accepts them, so the read does too.
    expect(result(hubDir({ [file]: revised({ expiresAt: "2026-11-11t09:00:00z" }) }))).toBe("ok");
    const spend = grant.spend as Json;
    for (const [label, changed] of [
      ["limits a string", revised({ spend: { ...spend, limits: "lots" } })],
      ["a limit without limitUsd", revised({ spend: { ...spend, limits: [{ window: "task" }] } })],
      ["a call limit window", revised({ spend: { ...spend, limits: [{ window: "call", limitUsd: 1 }] } })],
      ["no issuer", (({ issuer: _issuer, ...rest }) => rest)(grant)],
      ["meta without contentHash", revised({ meta: { id: meta.id, revision: meta.revision } })],
      ["an unknown field", revised({ extra: true })]
    ] as const) expect(result(hubDir({ [file]: changed as Json })), label).toBe("unknown-state/malformed-file");
    // A state the contract does not name is still its own row, not a malformed file.
    expect(result(hubDir({ [file]: revised({ state: "suspended" }) }))).toBe("unknown-state/unknown-grant-state");
  });

  it.skipIf(process.platform === "win32")("refuses a link or a FIFO at the file's path, without following or blocking on it", { timeout: 5000 }, () => {
    const linked = hubDir({ "elsewhere.json": grant });
    symlinkSync(path.join(linked, "elsewhere.json"), path.join(linked, file));
    expect(result(linked)).toBe("unknown-state/not-a-file");
    const piped = hubDir({});
    execFileSync("mkfifo", ["-m", "600", path.join(piped, file)]);
    // A blocking open would hang this worker past any test timeout, so the read runs in a child killed at 2 s.
    const script = `const p = await import(${JSON.stringify(path.join(root, "src/grant-projection.ts"))}); const a = p.readProjectedGrant(${JSON.stringify(piped)}, ${JSON.stringify(ref)}, { now: ${NOW} }); process.stdout.write(a.ok ? "ok" : a.code + "/" + a.detail);`;
    expect(execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { cwd: root, timeout: 2000, encoding: "utf8" })).toBe("unknown-state/not-a-file");
  });

  it("no-grant: a request's grantRef the verified token does not name is refused before anything is read", () => {
    const dir = hubDir({ [file]: grant });
    expect(projection.readProjectedGrant(dir, ref, { now: NOW, tokenGrants: [ref] })).toMatchObject({ ok: true });
    expect(projection.readProjectedGrant(dir, ref, { now: NOW, tokenGrants: [`${String(meta.id)}#${Number(meta.revision) + 1}`] })).toEqual({ ok: false, code: "no-grant", detail: "not-named" });
    expect(projection.readProjectedGrant(path.join(scratch, "absent"), ref, { now: NOW, tokenGrants: [] })).toMatchObject({ detail: "not-named" });
  });

  it("answers unknown-state on Windows before reading: the local profile is POSIX-only in 0.1", () => {
    const answer = projection.readProjectedGrant(hubDir({ [file]: grant }), ref, { now: NOW, platform: "win32" });
    expect(answer).toEqual({ ok: false, code: "unknown-state", detail: "unsupported-platform" });
    expect(projection.readProjectedGrant(path.join(scratch, "absent"), ref, { now: NOW, platform: "win32" })).toMatchObject({ detail: "unsupported-platform" });
    // The option only adds the refusal: naming another platform on Windows still refuses (exercised where the suite runs on Windows).
    if (process.platform === "win32") expect(projection.readProjectedGrant(hubDir({ [file]: grant }), ref, { now: NOW, platform: "linux" })).toMatchObject({ detail: "unsupported-platform" });
    expect(read("docs/specification/delegation.md")).toMatch(/POSIX-only in 0\.1[^\n]*\n?[^\n]*`unknown-state`/);
  });

  it("authorises nothing alone: every refusal is a meter denial with level null", () => {
    const answer = at(hubDir({}), ref);
    expect(answer.ok).toBe(false);
    if (!answer.ok) {
      const denial = projection.projectionDenial(answer, NOW);
      expect(valid("grant-check.schema.json", denial)).toBe(true);
      expect(denial).toMatchObject({ decision: "denied", level: null, code: "no-grant" });
    }
  });

  it("is stated as the local-placement profile of the delegation spec", () => {
    const profile = read("docs/specification/delegation.md");
    expect(profile).toMatch(/`grantsDir`/);
    expect(profile).toMatch(/0600 in a 0700 directory/);
    expect(profile).toMatch(/authorises nothing without the verified onward token/);
    expect(read("docs/specification/conformance.md")).toMatch(/`readProjectedGrant`/);
  });
});

describe("4 — fabric:// credential names are whole words (DEC-0041, CO-260 (1))", () => {
  const passes = (url: string) => parseFabricLink(url).ok;
  it("lets a name that merely contains a credential word through", () => {
    for (const name of ["themeCode", "sortKey", "countryCode", "primaryKey", "keyboard", "tokenizer", "monkey", "passage", "authorName", "sessionLength", "theme-code", "sort_key", "zipcode"]) {
      expect(passes(`fabric://chat?service=example-agent&${name}=x`), name).toBe(true);
    }
    for (const fragment of ["auth-settings", "section-2", "tokens", "key-concepts", "token-usage", "session"]) expect(passes(`fabric://chat?service=example-agent#${fragment}`), fragment).toBe(true);
    expect(codes("deep-link", load("semantic/deep-link-harmless-names.json"))).toEqual([]);
    expect(passes("fabric://chat?service=example-agent&commit=0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c")).toBe(true);
  });

  it("still refuses every name that carries a credential, in any case style", () => {
    for (const name of [
      "authToken", "refreshToken", "clientSecret", "privateKey", "sessionToken", "token", "key", "secret", "password",
      "passwd", "api_key", "apiKey", "access-key", "secretKey", "accessKeyId", "authCode", "auth_header", "auth", "sessionId",
      "session_id", "session", "cookie", "credentials", "credential", "code", "loginCode", "id_token", "x-api-key", "Authorization",
      "bearer", "jwt", "otp", "APIKey"
    ]) expect(passes(`fabric://chat?service=example-agent&${name}=x`), name).toBe(false);
    expect(passes("fabric://chat?service=example-agent#access_token=abc")).toBe(false);
    expect(passes("fabric://chat?service=example-agent#sessionToken=abc")).toBe(false);
  });

  it("refuses the names whole words first let through: glued, plural, signatures, and key beside its owner", () => {
    for (const name of [
      "accesstoken", "idtoken", "authtoken", "refreshtoken", "sessionid", "sessiontoken", "logincode", "authcode", "privatekey",
      "clientsecret", "secretkey", "accesskey", "sig", "signature", "X-Amz-Signature", "pass", "passphrase", "secrets", "tokens",
      "apikeys", "apiKeys", "sessionKey", "authKey", "signingKey", "encryptionKey", "masterKey", "clientKey", "loginKey",
      "refreshKey", "accessCode", "session_code"
    ]) {
      expect(links.credentialName(name), name).toBe(true);
      expect(passes(`fabric://chat?service=example-agent&${name}=x`), name).toBe(false);
    }
    for (const name of ["themeCode", "sortKey", "tokenizer", "authorName", "sessionLength", "passage", "signal", "keyboard", "compass", "bypass", "signup", "monkeys", "passes", "constructor"]) {
      expect(links.credentialName(name), name).toBe(false);
      expect(passes(`fabric://chat?service=example-agent&${name}=x`), name).toBe(true);
    }
    // A name an object inherits is an unknown parameter like any other, not a grammar.
    for (const name of ["constructor", "toString", "__proto__", "hasOwnProperty"]) expect(parseFabricLink(`fabric://chat?service=example-agent&${name}=x`), name).toMatchObject({ ok: true, ignored: [name] });
  });

  it("counts - and a raw + as part of a long secret", () => {
    // 47 base64url characters with a - in the middle: no half is 40 long, the whole is.
    const base64url = "Zm9vYmFyQmF6UXV4MTIzNDU2-Nzg5MGFiY2RlZkdISUpL0x";
    expect(base64url).toHaveLength(47);
    expect(passes(`fabric://chat?service=example-agent&ref=${base64url}`)).toBe(false);
    // URLSearchParams turns a raw + into a space; the raw value is checked too.
    expect(passes("fabric://chat?service=example-agent&x=Zm9vYmFyQmF6UXV4MTIzNDU2+Nzg5MGFiY2RlZkdISUpL")).toBe(false);
    expect(passes("fabric://chat?service=example-agent#x=Zm9vYmFyQmF6UXV4MTIzNDU2+Nzg5MGFiY2RlZkdISUpL")).toBe(false);
    // An escape and a raw + together: neither the form-decoded value nor the raw text holds a 40-character run.
    const mixed = "Zm9vYmFyQmF6UXV4%2FMTIzNDU2Nzg5MGFi+Y2RlZkdISUpLTU5P";
    expect(passes(`fabric://chat?service=example-agent&x=${mixed}`)).toBe(false);
    expect(passes(`fabric://chat?service=example-agent#x=${mixed}`)).toBe(false);
    // A lowercase hex digest and a ULID are ids, not secrets.
    expect(passes("fabric://chat?service=example-agent&digest=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08")).toBe(true);
    expect(passes("fabric://chat?service=example-agent&run=01JA7Y5Q3C2K9M8N4P6R0S1T2V")).toBe(true);
    expect(passes("fabric://chat?service=example-agent&project=example-project-2026")).toBe(true);
  });

  it("refuses a JWT anywhere and a long secret-shaped value", () => {
    const jwt = "eyJhbGciOiJFZERTQSJ9.eyJzdWIiOiJ4In0.c2ln";
    expect(codes("deep-link", load("semantic/deep-link-jwt-inside-value.json"))).toEqual(["FAC-SEM-052"]);
    expect(codes("deep-link", load("semantic/deep-link-long-secret.json"))).toEqual(["FAC-SEM-052"]);
    for (const url of [
      `fabric://chat?service=example-agent&note=see%20${jwt}%20here`,
      `fabric://chat?service=example-agent#t=${jwt}`,
      `fabric://chat?service=example-agent#go-${jwt}`,
      "fabric://chat?service=example-agent&ref=xoxb-123456789012-abcdefABCDEF",
      "fabric://chat?service=example-agent&ref=AKIAIOSFODNN7EXAMPLE"
    ]) expect(passes(url), url).toBe(false);
  });

  it("exports the word lists the specification names", () => {
    expect(links.credentialName("authToken")).toBe(true);
    expect(links.credentialName("themeCode")).toBe(false);
    expect([...links.nameWords("refreshToken_v2-Id")]).toEqual(["refresh", "token", "v2", "id"]);
    const spec = read("docs/specification/fabric-button.md");
    for (const word of links.CREDENTIAL_WORDS) expect(spec, word).toContain(`\`${word}\``);
    for (const [word, partners] of Object.entries(links.CREDENTIAL_PAIRS)) for (const partner of partners) expect(spec, `${word}+${partner}`).toMatch(new RegExp(`\`${word}\`[^\\n]*\`${partner}\``));
  });
});
