import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region access-grants — docs: docs/specification/service.md#access-grants-dec-0187
/**
 * FAC-SEM-185 (DEC-0187): an `access-grants/1` answer can be joined with every other product's by a host, so each grant
 * reads the same way everywhere:
 * - grant ids are unique in the answer (AG-5);
 * - `limitPeriod` is present exactly when `limitUsd` is a number (AG-4);
 * - an act names the calling `agent` exactly when it came through an agent's call (`via: "agent"`), and one decided
 *   `by: "agent"` came through that call, on issue and on revocation (AG-5);
 * - `issued.at` is not after `generatedAt`; `revoked.at` is not before `issued.at` nor after `generatedAt`; `expiresAt`
 *   is after `issued.at` (AG-5).
 * A spend above the ceiling is not a finding: a breach is shown, not refused (AG-4, as DEC-0027's limits). Malformed
 * input answers findings or none, never an exception.
 */
export function accessGrantsRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-185", instancePath, message });
  const grants = Array.isArray(value.grants) ? value.grants : [];
  const generated = strictTime(value.generatedAt);
  const ids = new Set<string>();
  grants.forEach((grant, i) => {
    if (!isObject(grant)) return;
    const at = `/grants/${i}`;
    const id = show(grant.id ?? "");
    if (ids.has(id)) flag(`${at}/id`, `grant id ${id} appears twice`);
    ids.add(id);

    const metered = typeof grant.limitUsd === "number";
    if (metered && grant.limitPeriod === undefined) flag(`${at}/limitPeriod`, "a ceiling names its window: limitPeriod is present when limitUsd is a number");
    if (!metered && grant.limitPeriod !== undefined) flag(`${at}/limitPeriod`, "limitPeriod is the window of a ceiling, so it is present only when limitUsd is a number");

    const issued = isObject(grant.issued) ? grant.issued : {};
    const revoked = isObject(grant.revoked) ? grant.revoked : undefined;
    for (const [name, act] of [["issued", issued], ["revoked", revoked]] as const) {
      if (act === undefined) continue;
      if (act.via === "agent" && act.agent === undefined) flag(`${at}/${name}/agent`, "an act that came through an agent's call names that agent");
      if (act.via !== "agent" && act.agent !== undefined) flag(`${at}/${name}/agent`, "agent names the caller of an act that came through an agent's call, so it is present only with via agent");
      if (act.by === "agent" && act.via !== "agent") flag(`${at}/${name}/via`, "an act an agent decided on its own account came through its call: via is agent");
    }

    const issuedAt = strictTime(issued.at);
    if (!Number.isNaN(issuedAt) && !Number.isNaN(generated) && issuedAt > generated) flag(`${at}/issued/at`, "a grant is not issued after the answer's generatedAt");
    if (revoked !== undefined) {
      const revokedAt = strictTime(revoked.at);
      if (!Number.isNaN(revokedAt) && !Number.isNaN(issuedAt) && revokedAt < issuedAt) flag(`${at}/revoked/at`, "a grant is not revoked before it was issued");
      if (!Number.isNaN(revokedAt) && !Number.isNaN(generated) && revokedAt > generated) flag(`${at}/revoked/at`, "a grant is not revoked after the answer's generatedAt");
    }
    const expires = strictTime(grant.expiresAt);
    if (!Number.isNaN(expires) && !Number.isNaN(issuedAt) && expires <= issuedAt) flag(`${at}/expiresAt`, "a grant expires after it was issued");
  });
  return findings;
}

/** Whether a grant admits now (DEC-0187 AG-5): `revoked` wins over `expired`; `undefined` for a value that is not a grant. */
export type GrantState = "active" | "revoked" | "expired";

/**
 * The state a host shows for one grant at `now` (milliseconds since the epoch): `revoked` when it carries a
 * revocation, `expired` when `expiresAt` is at or before `now`, otherwise `active`. Answers `undefined` for a value
 * that is not an object or for an unreadable `now`, and never throws on a JSON value.
 */
export function grantState(grant: unknown, now: number): GrantState | undefined {
  if (!isObject(grant) || !Number.isFinite(now)) return undefined;
  if (isObject(grant.revoked)) return "revoked";
  const expires = strictTime(grant.expiresAt);
  return !Number.isNaN(expires) && expires <= now ? "expired" : "active";
}
// #endregion access-grants
