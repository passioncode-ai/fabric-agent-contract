import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { admitPeer, channelStep, LOCAL_CHANNEL_PROTOCOL, mayPrompt } from "../src/local-channel.js";
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
    for (const [peer, own] of [[502, 501], ["S-1-5-18", "S-1-5-21-1"], ["", ""], [1.5, 1.5], [undefined, undefined], ["501", 501]]) expect(admitPeer(peer, own)).toEqual({ ok: false, code: "unauthenticated" });
  });
});

describe("channelStep", () => {
  it("answers nothing before hello, and anything the node serves after it", () => {
    expect(channelStep(fresh, { method: "health" })).toMatchObject({ ok: false, code: "hello-first" });
    const after = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], client: { name: "fabric", version: "0.4.0" } }));
    expect(after).toMatchObject({ ok: true, state: { hello: true, capabilities: [] } });
    expect(channelStep(after.state, { method: "health" })).toMatchObject({ ok: true });
  });
  it("refuses a hello whose protocols the node does not accept, and one with no protocols", () => {
    expect(channelStep(fresh, hello({ protocols: ["fabric-local-channel/0.2"] }))).toMatchObject({ ok: false, code: "schema-unsupported" });
    expect(channelStep(fresh, hello({}))).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, { method: "channel.hello" })).toMatchObject({ ok: false, code: "invalid-params" });
    expect(channelStep(fresh, null)).toMatchObject({ ok: false, code: "hello-first" });
  });
  it("prompts for consent only on a session whose client declared consent.ui", () => {
    const withUi = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL], capabilities: ["consent.ui", 7] })).state;
    const without = channelStep(fresh, hello({ protocols: [LOCAL_CHANNEL_PROTOCOL] })).state;
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
