import { type JsonObject, isObject } from "./findings.js";

// #region partner-usage, docs: docs/specification/partner-channel.md
/**
 * A partner's view of its agents' usage (DEC-0090 item 2, CT-58): the organization server shows a partner organization
 * the joined `grant.usage` sums (DEC-0086's join) of the agents whose `agentRef` publisher is one the partner publishes
 * under, per `agentRef` and UTC day or billing period, with no person, device or grant dimension. `partnerUsage` is the
 * reference; it reads no store and never throws: malformed input is an answer.
 */

/** `fabric-package.schema.json#/$defs/agentRef`: at most 146 characters, `urn:fabric:agent:<publisher>:<id>`. */
const AGENT_REF = /^urn:fabric:agent:([a-z][a-z0-9]*(?:-[a-z0-9]+)*):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/;
const MAX_AGENT_REF = 146;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ROWS = 100_000;

/** The publisher of an `agentRef` (`urn:fabric:agent:<publisher>:<id>`, DEC-0050), or undefined. */
export function publisherOf(agentRef: unknown): string | undefined {
  return typeof agentRef === "string" && agentRef.length <= MAX_AGENT_REF ? AGENT_REF.exec(agentRef)?.[1] : undefined;
}

/** One cell a partner reads: an agent's sums for one UTC day, or for the whole period. */
export interface PartnerUsageCell {
  agentRef: string;
  day: string | null;
  calls: number;
  unpricedCalls: number;
  costUsd: number | null;
}
export type PartnerUsageAnswer = { cells: PartnerUsageCell[] } | { fault: "input-invalid" };

const count = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const isDay = (value: unknown): value is string => typeof value === "string" && DAY.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value);

/**
 * `{usage, publishers, step}`: `usage` the organization server's joined rows `{agentRef, day, calls, unpricedCalls,
 * costUsd}` (one per joined `grant.usage`; a row not joined to an agent is never shown to a partner), `publishers` the
 * publisher names the partner publishes under, `step` `day` or `period`. Answers the partner's cells, ordered by
 * `agentRef` then `day`: a cell's `costUsd` is `null` exactly when every call in it is unpriced (FAC-SEM-038's rule), else
 * the sum of the priced costs. A row whose publisher is not the partner's adds nothing.
 */
export function partnerUsage(input: unknown): PartnerUsageAnswer {
  const fault = { fault: "input-invalid" } as const;
  if (!isObject(input)) return fault;
  const { usage, publishers, step } = input as JsonObject;
  if (!Array.isArray(usage) || usage.length > MAX_ROWS || !Array.isArray(publishers) || (step !== "day" && step !== "period")) return fault;
  if (!publishers.every((name) => typeof name === "string" && publisherOf(`urn:fabric:agent:${name}:x`) === name)) return fault;
  const theirs = new Set(publishers as string[]);
  const cells = new Map<string, PartnerUsageCell>();
  for (const row of usage) {
    if (!isObject(row)) return fault;
    const { agentRef, day, calls, unpricedCalls, costUsd } = row;
    const publisher = publisherOf(agentRef);
    if (publisher === undefined || !isDay(day) || !count(calls) || calls < 1 || !count(unpricedCalls) || unpricedCalls > calls) return fault;
    if (costUsd !== null && !(typeof costUsd === "number" && Number.isFinite(costUsd) && costUsd >= 0)) return fault;
    if ((costUsd === null) !== (unpricedCalls === calls)) return fault;
    if (!theirs.has(publisher)) continue;
    const cellDay = step === "day" ? day : null;
    const key = JSON.stringify([agentRef, cellDay]);
    const cell = cells.get(key) ?? { agentRef: agentRef as string, day: cellDay, calls: 0, unpricedCalls: 0, costUsd: null };
    cell.calls += calls;
    cell.unpricedCalls += unpricedCalls;
    if (costUsd !== null) cell.costUsd = (cell.costUsd ?? 0) + costUsd;
    cells.set(key, cell);
  }
  const ordered = [...cells.values()].sort((a, b) => (a.agentRef === b.agentRef ? String(a.day).localeCompare(String(b.day)) : a.agentRef < b.agentRef ? -1 : 1));
  return { cells: ordered };
}
// #endregion
