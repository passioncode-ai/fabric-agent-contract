import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { admitPeer, CLIENT_METHODS, channelStep, consentOutcome, ERROR_CODES, LOCAL_CHANNEL_PROTOCOL, mayPrompt, NODE_METHODS } from "../src/local-channel.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0075 (CON-OE-10, v4 edition, agreed with Project Observatory's session): the local channel to the node.
const dir = path.join(projectRoot(), "fixtures/semantic");
const cases = readdirSync(dir).filter((name) => name.startsWith("local-channel-session-")).map((name) => [name, JSON.parse(readFileSync(path.join(dir, name), "utf8"))] as const);
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
    expect(channelStep(fresh, { method: "health" })).toMatchObject({ ok: false, code: "hello-first" });
    const after = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client: { name: "fabric", version: "0.4.0" } }));
    expect(after).toMatchObject({ ok: true, state: { hello: true, capabilities: [] } });
    expect(channelStep(after.state, { method: "health" })).toMatchObject({ ok: true });
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
    expect(channelStep(fresh, { method: "channel.hello" })).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, null)).toMatchObject({ ok: false, code: "hello-first" });
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

describe("FAC-SEM-106: hello first", () => {
  it.each(cases)("%s", (_name, c) => expect([...new Set(evaluateSemanticRules(c.kind, c.input).map((f) => f.code))]).toEqual(c.expect));
  it("reads a session without requests, or without a method, as nothing", () => {
    expect(evaluateSemanticRules("local-channel-session", { requests: "x" })).toEqual([]);
    expect(evaluateSemanticRules("local-channel-session", { requests: [null, { id: 1 }] })).toEqual([]);
  });
});

describe("methods, codes and consent outcomes", () => {
  it("keeps the node's methods and the client's apart", () => {
    expect([...NODE_METHODS]).toEqual(["channel.hello", "health", "enroll.status"]);
    expect([...CLIENT_METHODS]).toEqual([["consent.prompt", "consent.ui"]]);
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
  });
});
