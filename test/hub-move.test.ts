import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { HUB_MOVE_HEARTBEAT_JUMP, HUB_SILENT_SECONDS, hubMove, hubSilence, recoveryReady } from "../src/hub-move.js";
import { HEARTBEAT_MAX_INTERVAL_SECONDS } from "../src/revocation-delta.js";
import { VECTOR_FILE, buildHubMoveVectors } from "../tools/vectors/hub-move.js";

type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;

describe("the hub-move vectors (DEC-0107)", () => {
  it("are the generator's output", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildHubMoveVectors());
  });

  it.each(vectors.silence as Json[])("silence: $name", (c) => {
    expect(hubSilence(c.heartbeatAt, c.at)).toEqual(c.expect);
  });

  it.each(vectors.recovery as Json[])("recovery: $name", (c) => {
    expect(recoveryReady(c.record)).toEqual(c.expect);
  });

  it.each(vectors.move as Json[])("move: $name", (c) => {
    expect(hubMove(c.parent, c.next)).toEqual(c.expect);
  });
});

describe("hub-move beyond the vectors", () => {
  it("alerts at the hub's own daily interval", () => {
    expect(HUB_SILENT_SECONDS).toBe(HEARTBEAT_MAX_INTERVAL_SECONDS);
    // A hub signing a heartbeat every second for 24 hours stays below the jump.
    expect(HUB_MOVE_HEARTBEAT_JUMP).toBeGreaterThan(24 * 60 * 60);
  });

  it("never throws on hostile input", () => {
    const hostile = { toString: 1 } as never;
    expect(hubSilence(hostile, hostile)).toEqual({ answer: "unknown", reason: "no-clock" });
    expect(recoveryReady({ authorities: hostile, revocations: hostile })).toEqual({ ready: false, authorities: 0 });
    expect(hubMove({ machines: [{ id: "m-a", hubKey: { kid: hostile } }, hostile] }, { machines: hostile, revocations: hostile })).toEqual({ moved: false, added: [], removed: [] });
    // A next revision that is no object takes every hub away, and revokes none.
    expect(hubMove({ machines: [{ id: "m-a", hubKey: { kid: "hub-a" } }] }, null)).toEqual({ moved: false, added: [], removed: [{ machine: "m-a", kid: "hub-a", revoked: false }] });
  });
});
