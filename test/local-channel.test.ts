import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { admitPeer, CLIENT_CAPABILITIES, CLIENT_METHODS, channelStep, consentOutcome, ERROR_CODES, lineWithinLimit, LOCAL_CHANNEL_PROTOCOL, MAX_LINE_BYTES, MAX_SECRET_DEADLINE_MS, mayPrompt, maySecretPrompt, NODE_METHODS, secretOutcome } from "../src/local-channel.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { VECTOR_FILE, buildLocalChannelVectors } from "../tools/vectors/local-channel.js";

// DEC-0075 (CON-OE-10, v4 edition, agreed with Project Observatory's session): the local channel to the node.
const dir = path.join(projectRoot(), "fixtures/semantic");
const cases = readdirSync(dir).filter((name) => name.startsWith("local-channel-session-")).map((name) => [name, JSON.parse(readFileSync(path.join(dir, name), "utf8"))] as const);
const validator = await createValidator();
const def = (name: string, value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/local-channel.schema.json#/$defs/${name}`, value).valid;
const whole = (value: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/local-channel.schema.json`, value).valid;
const fresh = { hello: false, accepted: [LOCAL_CHANNEL_PROTOCOL] };
const hello = (params: unknown) => ({ jsonrpc: "2.0", id: 1, method: "channel.hello", params });

describe("admitPeer", () => {
  it("admits the same OS user only, by uid or SID", () => {
    expect(admitPeer(501, 501)).toEqual({ ok: true });
    expect(admitPeer("S-1-5-21-1-2-3-1001", "S-1-5-21-1-2-3-1001")).toEqual({ ok: true });
    // SYSTEM or another administrator may open the pipe through the DEC-0033 DACL, but is not the node's user: refused.
    for (const [peer, own] of [[502, 501], ["S-1-5-18", "S-1-5-21-1"], ["", ""], [1.5, 1.5], [undefined, undefined], ["501", 501]]) expect(admitPeer(peer, own)).toEqual({ ok: false, code: "unauthenticated" });
  });
});

describe("channelStep", () => {
  it("answers nothing before hello, and anything the node serves after it", () => {
    expect(channelStep(fresh, { jsonrpc: "2.0", id: 1, method: "health" })).toMatchObject({ ok: false, code: "hello-first" });
    const after = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client: { name: "fabric", version: "0.4.0" } }));
    expect(after).toMatchObject({ ok: true, state: { hello: true, capabilities: [] } });
    expect(channelStep(after.state, { jsonrpc: "2.0", id: 2, method: "health" })).toMatchObject({ ok: true });
    // A second hello is refused and changes nothing.
    const again = channelStep(after.state, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client: { name: "fabric", version: "0.4.0" }, capabilities: ["consent.ui"] }));
    expect(again).toMatchObject({ ok: false, code: "invalid-request", state: after.state });
  });
  it("refuses a hello whose protocols the node does not accept, and one with no protocols", () => {
    const client = { name: "fabric", version: "0.4.0" };
    expect(channelStep(fresh, hello({ protocols: ["fabric-local-channel/0.2"], client }))).toMatchObject({ ok: false, code: "schema-unsupported" });
    expect(channelStep(fresh, hello({ client }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL] }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client: { name: "fabric" } }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui", 7] }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: "consent.ui" }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, { jsonrpc: "2.0", id: 1, method: "channel.hello" })).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, null)).toMatchObject({ ok: false, code: "invalid-request" });
  });
  it("prompts for consent only on a session whose client declared consent.ui", () => {
    const client = { name: "fabric", version: "0.4.0" };
    const withUi = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui"] })).state;
    const without = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client })).state;
    expect(mayPrompt(withUi)).toBe(true);
    expect(mayPrompt(without)).toBe(false);
    expect(mayPrompt(fresh)).toBe(false);
    expect(mayPrompt({ hello: true, accepted: [] })).toBe(false);
  });
});

// DEC-0143: a secret request goes only to the product's signed app, checked by the node before hello; no value on the channel.
describe("secret.ui and secret.prompt", () => {
  const client = { name: "project-observatory", version: "0.32.0" };
  const ask = (state: Record<string, unknown>) => channelStep({ ...fresh, ...state }, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["secret.ui"] }));
  it("accepts secret.ui only from a peer the node verified as its signed app, and agrees nothing otherwise", () => {
    expect(ask({ signedApp: true })).toMatchObject({ ok: true, state: { hello: true, capabilities: ["secret.ui"] } });
    for (const state of [{}, { signedApp: false }, { signedApp: "yes" }]) expect(ask(state)).toMatchObject({ ok: false, code: "forbidden", state: { hello: false } });
    // A refused hello agrees nothing: the client says hello again without secret.ui and keeps consent.
    const refused = ask({});
    expect(channelStep(refused.state, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui"] }))).toMatchObject({ ok: true, state: { hello: true, capabilities: ["consent.ui"] } });
    // The refusal comes after the hello's own checks: a bad hello is still invalid-params, an unknown revision schema-unsupported.
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["secret.ui", "secret.ui"] }))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, hello({ protocols: ["fabric-local-channel/0.2"], client, capabilities: ["secret.ui"] }))).toMatchObject({ ok: false, code: "schema-unsupported" });
    // consent.ui alone needs no signed-app check (DEC-0075 unchanged).
    expect(channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui"] }))).toMatchObject({ ok: true });
  });
  it("prompts only a signed app that declared secret.ui", () => {
    const signed = ask({ signedApp: true }).state;
    expect(maySecretPrompt(signed)).toBe(true);
    expect(mayPrompt(signed)).toBe(false);
    const consentOnly = channelStep({ ...fresh, signedApp: true }, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui"] })).state;
    expect(maySecretPrompt(consentOnly)).toBe(false);
    expect(maySecretPrompt({ hello: true, accepted: [], capabilities: ["secret.ui"] })).toBe(false);
    expect(maySecretPrompt({ hello: true, accepted: [], signedApp: true })).toBe(false);
    expect(maySecretPrompt({ hello: false, accepted: [], capabilities: ["secret.ui"], signedApp: true })).toBe(false);
    // A client that sends secret.prompt to the node gets unknown-method, before hello hello-first.
    expect(channelStep(signed, { jsonrpc: "2.0", id: 4, method: "secret.prompt", params: {} })).toMatchObject({ ok: false, code: "unknown-method" });
    expect(channelStep(fresh, { jsonrpc: "2.0", id: 4, method: "secret.prompt" })).toMatchObject({ ok: false, code: "hello-first" });
  });
  it("answers the agent stored only after the node confirmed the write; never a value", () => {
    const t = 1_000_000;
    expect(MAX_SECRET_DEADLINE_MS).toBe(600_000);
    expect(secretOutcome(t, t + 60_000, [{ at: t + 5, outcome: "stored" }], true)).toBe("stored");
    expect(secretOutcome(t, t + 60_000, [{ at: t + 5, outcome: "stored" }], false)).toBe("unconfirmed");
    expect(secretOutcome(t, t + 60_000, [{ at: t + 6, outcome: "stored" }, { at: t + 5, outcome: "declined" }], true)).toBe("declined");
    expect(secretOutcome(t, t + 60_000, [{ at: t + 60_001, outcome: "stored" }], true)).toBe("no-answer");
    expect(secretOutcome(t, t + 60_000, [{ at: t - 1, outcome: "stored" }], true)).toBe("no-answer");
    expect(secretOutcome(t, t + 60_000, [{ at: t + 1, outcome: "maybe" }], true)).toBe("no-answer");
    expect(secretOutcome(t, t + 600_001, [{ at: t + 1, outcome: "stored" }], true)).toBe("no-answer");
    expect(secretOutcome(t, t, [{ at: t, outcome: "stored" }], true)).toBe("no-answer");
    expect(secretOutcome(Number.NaN, t, [], true)).toBe("no-answer");
    expect(secretOutcome(t, t + 1000, [], true)).toBe("no-answer");
  });
  it("binds the prompt, its result and its cancel", () => {
    const prompt = { requestId: "r-1", agent: "claude-code", project: "example-site", slot: { env: "prod", name: "OPENROUTER_API_KEY" }, provider: "openrouter", reason: "Deploy the site's search", replaces: false, deadline: "2026-10-27T10:10:00Z" };
    expect(def("secretPrompt", prompt)).toBe(true);
    expect(def("secretPrompt", { ...prompt, value: "sk-1" })).toBe(false);
    expect(def("secretPrompt", { ...prompt, slot: { env: "prod", name: "has space" } })).toBe(false);
    expect(def("secretPrompt", { ...prompt, reason: "" })).toBe(false);
    expect(def("secretPrompt", { ...prompt, slot: { env: "prod", name: "openrouter_key" } })).toBe(false);
    expect(def("secretPrompt", { ...prompt, project: "a project with spaces" })).toBe(false);
    // The whole message binds secret.prompt's params to its definition: no value travels, no field is missing.
    const request = (params?: unknown) => ({ jsonrpc: "2.0", id: 1, method: "secret.prompt", ...(params === undefined ? {} : { params }) });
    expect(whole(request(prompt))).toBe(true);
    expect(whole(request({ ...prompt, value: "sk-1" }))).toBe(false);
    expect(whole(request({}))).toBe(false);
    expect(whole(request())).toBe(false);
    const { provider: _provider, ...noProvider } = prompt;
    expect(def("secretPrompt", noProvider)).toBe(true);
    expect(def("secretResult", { outcome: "stored", at: "2026-10-27T10:01:00Z" })).toBe(true);
    expect(def("secretResult", { outcome: "stored", at: "2026-10-27T10:01:00Z", value: "sk-1" })).toBe(false);
    expect(def("secretResult", { outcome: "no-answer", at: "2026-10-27T10:01:00Z" })).toBe(false);
    expect(def("secretResult", { outcome: "declined" })).toBe(false);
    expect(whole({ jsonrpc: "2.0", method: "secret.cancel", params: { requestId: "r-1" } })).toBe(true);
    expect(whole({ jsonrpc: "2.0", method: "secret.cancel" })).toBe(false);
    expect(whole({ jsonrpc: "2.0", method: "consent.cancel", params: { promptId: "p" } })).toBe(true);
    expect(def("hello", { protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["consent.ui", "secret.ui"] })).toBe(true);
    expect(def("hello", { protocols: [LOCAL_CHANNEL_PROTOCOL], client, capabilities: ["secret.prompt"] })).toBe(false);
  });
});

describe("FAC-SEM-106: hello first", () => {
  it.each(cases)("%s", (_name, c) => expect([...new Set(evaluateSemanticRules(c.kind, c.input).map((f) => f.code))]).toEqual(c.expect));
  it("reads a session without requests, or without a method, as nothing", () => {
    expect(evaluateSemanticRules("local-channel-session", { requests: "x" })).toEqual([]);
    expect(evaluateSemanticRules("local-channel-session", { requests: [null, { id: 1 }] })).toEqual([]);
  });
});

describe("methods, codes and consent outcomes", () => {
  it("keeps the node's methods and the client's apart", () => {
    expect([...NODE_METHODS]).toEqual(["channel.hello", "health", "enroll.status", "machine.report"]);
    expect([...CLIENT_METHODS]).toEqual([["consent.prompt", "consent.ui"], ["secret.prompt", "secret.ui"]]);
    expect([...CLIENT_CAPABILITIES]).toEqual(["consent.ui", "secret.ui"]);
  });
  it("maps every code to one JSON-RPC integer", () => {
    expect(Object.fromEntries(ERROR_CODES)).toEqual({ "invalid-request": -32600, "unknown-method": -32601, "invalid-params": -32602, unauthenticated: -32001, forbidden: -32003, "schema-unsupported": -32004, "hello-first": -32005 });
  });
  it("lets the first answer before the deadline win, and denies otherwise", () => {
    const t = 1_000_000;
    expect(consentOutcome(t, t + 60_000, [{ at: t + 5, state: "given" }, { at: t + 6, state: "denied" }])).toBe("given");
    expect(consentOutcome(t, t + 60_000, [{ at: t + 6, state: "given" }, { at: t + 5, state: "denied" }])).toBe("denied");
    expect(consentOutcome(t, t + 60_000, [{ at: t + 60_001, state: "given" }])).toBe("denied");
    expect(consentOutcome(t, t + 60_000, [{ at: t + 60_000, state: "given" }])).toBe("given");
    expect(consentOutcome(t, t + 600_000, [{ at: t + 1, state: "given" }])).toBe("given");
    expect(consentOutcome(t, t + 600_001, [{ at: t + 1, state: "given" }])).toBe("denied");
    expect(consentOutcome(t, t + 1000, [])).toBe("denied");
    expect(consentOutcome(Number.NaN, t, [{ at: t, state: "given" }])).toBe("denied");
    expect(consentOutcome(t, t + 1000, [{ at: Number.NaN, state: "given" }, { at: t + 1, state: "maybe" }])).toBe("denied");
    expect(consentOutcome(t, t + 1000, [{ at: t - 3_600_000, state: "given" }])).toBe("denied");
    expect(consentOutcome(t, t - 1000, [{ at: t - 2000, state: "given" }])).toBe("denied");
    expect(consentOutcome(t, t, [{ at: t, state: "given" }])).toBe("denied");
  });
});

describe("hello as the schema reads it, notifications, client methods, limits", () => {
  const client = { name: "fabric", version: "0.4.0" };
  const ok = { protocols: [LOCAL_CHANNEL_PROTOCOL], client };
  it("refuses every hello the schema refuses, and agrees on a good one", () => {
    const bad = [
      { ...ok, client: { name: "Fabric App", version: "1" } },
      { ...ok, tokn: "x" },
      { ...ok, capabilities: ["consent.ui", "consent.ui"] },
      { ...ok, client: { ...client, version: "v".repeat(65) } },
      { ...ok, token: "short" },
      { ...ok, protocols: [7, LOCAL_CHANNEL_PROTOCOL] },
      { ...ok, protocols: [] },
      { ...ok, client: { ...client, extra: 1 } },
      { ...ok, protocols: [LOCAL_CHANNEL_PROTOCOL, LOCAL_CHANNEL_PROTOCOL] },
      { ...ok, protocols: ["not a protocol!!", LOCAL_CHANNEL_PROTOCOL] },
      { ...ok, token: "🙂".repeat(10) }
    ];
    for (const params of bad) {
      expect(def("hello", params), JSON.stringify(params)).toBe(false);
      expect(channelStep(fresh, hello(params)), JSON.stringify(params)).toMatchObject({ ok: false, code: "invalid-params" });
    }
    expect(def("hello", { ...ok, token: "t".repeat(16), capabilities: ["consent.ui"] })).toBe(true);
    const astral = { ...ok, client: { name: "fabric", version: "🙂".repeat(33) } };
    expect(def("hello", astral)).toBe(true);
    expect(channelStep(fresh, hello(astral))).toMatchObject({ ok: true });
    expect(channelStep(fresh, { jsonrpc: "2.0", id: null, method: "health" })).toMatchObject({ ok: false, code: "invalid-request" });
    expect(channelStep(fresh, hello({ ...ok, token: "t".repeat(16), capabilities: ["consent.ui"] }))).toMatchObject({ ok: true });
  });
  it("never answers a notification, and answers a client method sent to the node as unknown", () => {
    expect(channelStep(fresh, { jsonrpc: "2.0", method: "consent.cancel", params: { promptId: "p" } })).toMatchObject({ ok: false, code: null });
    const after = channelStep(fresh, hello(ok)).state;
    expect(channelStep(after, { jsonrpc: "2.0", id: 3, method: "consent.prompt", params: {} })).toMatchObject({ ok: false, code: "unknown-method" });
    expect(channelStep(fresh, { jsonrpc: "2.0", id: 3, method: "consent.prompt" })).toMatchObject({ ok: false, code: "hello-first" });
    expect(NODE_METHODS.has("consent.prompt")).toBe(false);
  });
  it("holds a line to 1 MiB", () => {
    expect(lineWithinLimit("x".repeat(MAX_LINE_BYTES))).toBe(true);
    expect(lineWithinLimit("x".repeat(MAX_LINE_BYTES + 1))).toBe(false);
    expect(lineWithinLimit("é".repeat(MAX_LINE_BYTES / 2 + 1))).toBe(false);
  });
});

describe("the request envelope: the code refuses what $defs/request refuses", () => {
  const client = { name: "fabric", version: "0.4.0" };
  const after = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client })).state;
  const base = { jsonrpc: "2.0", id: 7, method: "health" };
  const accepted: unknown[] = [base, { ...base, id: "a" }, { ...base, id: "x".repeat(128) }, { ...base, id: -5 }, { ...base, id: 2 ** 60 }, { ...base, method: "node.lifecycle.ensure_running" }, { ...base, params: {} }];
  const refused: unknown[] = [
    null, [], [base], "health", 7, true,
    { id: 7, method: "health" }, { ...base, jsonrpc: "1.0" }, { ...base, jsonrpc: 2 },
    { ...base, id: 1.5 }, { ...base, id: {} }, { ...base, id: [] }, { ...base, id: true }, { ...base, id: "" }, { ...base, id: "x".repeat(129) }, { ...base, id: null },
    { ...base, method: 7 }, { ...base, method: "Health" }, { ...base, method: "" }, { jsonrpc: "2.0", id: 7 }, { ...base, method: "a..b" },
    { ...base, params: [] }, { ...base, params: "x" }, { ...base, params: null }, { ...base, extra: 1 },
  ];
  it("accepts every request the schema accepts, after hello", () => {
    for (const request of accepted) {
      expect(def("request", request), JSON.stringify(request)).toBe(true);
      expect(channelStep(after, request), JSON.stringify(request)).toMatchObject({ ok: true });
    }
  });
  it("answers invalid-request to every message the schema refuses, before hello and after it", () => {
    for (const request of refused) {
      expect(def("request", request), JSON.stringify(request)).toBe(false);
      for (const state of [fresh, after]) expect(channelStep(state, request), JSON.stringify(request)).toMatchObject({ ok: false, code: "invalid-request", state });
    }
  });
  it("refuses a hello's envelope as invalid-request and its params as invalid-params, as the schema refuses both", () => {
    expect(def("request", hello([]))).toBe(false);
    expect(channelStep(fresh, hello([]))).toMatchObject({ ok: false, code: "invalid-request" });
    const bare = { jsonrpc: "2.0", id: 1, method: "channel.hello" };
    expect(def("request", bare)).toBe(false);
    expect(channelStep(fresh, bare)).toMatchObject({ ok: false, code: "invalid-params" });
  });
  it("never answers a well-formed notification, and refuses a malformed one", () => {
    const cancel = { jsonrpc: "2.0", method: "consent.cancel", params: { promptId: "p" } };
    expect(def("notification", cancel)).toBe(true);
    for (const state of [fresh, after]) expect(channelStep(state, cancel)).toMatchObject({ ok: false, code: null });
    expect(channelStep(after, { jsonrpc: "2.0", method: "health" })).toMatchObject({ ok: false, code: null });
    // JSON-RPC 2.0 §4.1: a notification is never answered, even one whose params its definition refuses.
    for (const params of [{ promptId: 7 }, { promptId: "" }, {}]) {
      expect(def("notification", { ...cancel, params })).toBe(false);
      expect(channelStep(after, { ...cancel, params })).toMatchObject({ ok: false, code: null });
    }
    for (const message of [{ method: "consent.cancel" }, { jsonrpc: "2.0", method: 7 }, { jsonrpc: "2.0" }, { ...cancel, params: [] }]) {
      expect(def("notification", message), JSON.stringify(message)).toBe(false);
      expect(channelStep(after, message), JSON.stringify(message)).toMatchObject({ ok: false, code: "invalid-request" });
    }
  });
});

describe("the message definitions validate what they name", () => {
  it("binds health, enroll.status, the consent prompt and result, and the hello result", () => {
    expect(def("health", { status: "ready", version: "1", protocols: [LOCAL_CHANNEL_PROTOCOL], degraded: [] })).toBe(true);
    expect(def("health", { status: "ready", version: "1", protocols: [LOCAL_CHANNEL_PROTOCOL] })).toBe(false);
    expect(def("enrollStatus", { enrolled: true, org: "org-1" })).toBe(true);
    expect(def("enrollStatus", {})).toBe(false);
    // DEC-0132: the hub on the same machine reads the node's report here, never over the relay.
    const report = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/machine-report.json"), "utf8"));
    expect(def("machineReport", { report })).toBe(true);
    expect(def("machineReport", { report: null })).toBe(true);
    expect(def("machineReport", { report: { ...report, records: {} } })).toBe(false);
    expect(def("machineReport", {})).toBe(false);
    expect(def("consentResult", { state: "given", at: "2026-10-12T10:00:00Z" })).toBe(true);
    expect(def("consentResult", { state: "given" })).toBe(false);
    expect(def("consentResult", { state: "denied" })).toBe(true);
    expect(def("consentPrompt", { promptId: "p", purposeId: "Time Tracking!", noticeVersion: "2026-10", deadline: "2026-10-12T10:00:00Z" })).toBe(false);
    expect(def("helloResult", { protocols: [LOCAL_CHANNEL_PROTOCOL] })).toBe(true);
    expect(def("notification", { jsonrpc: "2.0", method: "consent.cancel", params: { promptId: "p" }, extra: 1 })).toBe(false);
  });
  it("ties each error code to its integer, both ways", () => {
    for (const [code, integer] of ERROR_CODES) {
      expect(whole({ jsonrpc: "2.0", id: 1, error: { code: integer, message: "m", data: { code } } }), code).toBe(true);
      expect(whole({ jsonrpc: "2.0", id: 1, error: { code: integer + 1000, message: "m", data: { code } } }), code).toBe(false);
    }
    expect(whole({ jsonrpc: "2.0", id: 1, error: { code: -32004, message: "m" } })).toBe(false);
    expect(whole({ jsonrpc: "2.0", id: 1, error: { code: -32004, message: "m", data: { code: "hello-first" } } })).toBe(false);
  });
});

describe("the shared vectors (local-channel.json)", () => {
  const vectors = JSON.parse(readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8")) as { sessions: any[]; outcomes: any[]; prompts: any[] };
  it("is what its generator writes", () => {
    expect(readFileSync(path.join(projectRoot(), VECTOR_FILE), "utf8")).toBe(buildLocalChannelVectors());
  });
  it.each(vectors.sessions)("session: $name", (c) => {
    let state: any = { ...fresh, ...(c.signedApp === undefined ? {} : { signedApp: c.signedApp }) };
    c.messages.forEach((message: unknown, i: number) => {
      const got = channelStep(state, message);
      state = got.state;
      const expected = c.answers[i];
      expect({ ok: got.ok, code: got.ok ? null : got.code, hello: state.hello, ...(state.capabilities ? { capabilities: [...state.capabilities] } : {}) }, `message ${i}`).toEqual(expected);
    });
    expect({ mayPrompt: mayPrompt(state), maySecretPrompt: maySecretPrompt(state) }).toEqual(c.after);
  });
  it.each(vectors.outcomes)("outcome: $name", (c) => {
    expect(secretOutcome(c.promptedAt, c.deadline, c.answers, c.written)).toBe(c.expect);
  });
  it.each(vectors.prompts)("prompt shape: $name", (c) => {
    expect(def(c.definition, c.value)).toBe(c.valid);
  });
});
