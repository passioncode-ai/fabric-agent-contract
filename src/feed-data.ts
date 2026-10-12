import { type Finding, type JsonObject, isObject } from "./findings.js";
import { credentialName, secretUrl, secretValue } from "./secret-shape.js";

/** A JSON Pointer token (RFC 6901 §4): `~` and `/` escaped. */
const pointer = (name: string) => name.replace(/~/g, "~0").replace(/\//g, "~1");

// #region feed-data — docs: docs/specification/service.md#event-data
/**
 * FAC-SEM-101 (DEC-0070, kind `service-events-page`): an event's optional `data` never carries a secret. No string in
 * `data.value`, at either level, sits under a credential's name or has a credential's shape (the shared detector,
 * `src/secret-shape.ts`, values and URLs); a list's items and an object's members sit under the outer name too; a number
 * under a name such as `inputTokens` is a count, not a credential. A finding names the place, never the value. Personal data is the service's duty:
 * no check can tell a name from any other string, so the rule is stated, not detected.
 */
export function feedDataFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const events = Array.isArray(value.events) ? value.events : [];
  const check = (named: boolean, member: unknown, at: string) => {
    if (typeof member !== "string") return;
    if (named) findings.push({ code: "FAC-SEM-101", instancePath: at, message: "an event's data puts no string under a credential's name" });
    else if (secretValue(member) || secretUrl(member)) findings.push({ code: "FAC-SEM-101", instancePath: at, message: "an event's data carries no value shaped like a credential" });
  };
  events.forEach((event: unknown, i: number) => {
    if (!isObject(event) || !isObject(event.data) || !isObject(event.data.value)) return;
    for (const [key, member] of Object.entries(event.data.value)) {
      const at = `/events/${i}/data/value/${pointer(key)}`;
      const named = credentialName(key);
      check(named, member, at);
      // A list's items and an object's members sit under the outer name too: `apiKeys: ["k1"]` is a credential.
      if (Array.isArray(member)) member.forEach((item: unknown, j: number) => check(named, item, `${at}/${j}`));
      else if (isObject(member)) for (const [inner, leaf] of Object.entries(member)) check(named || credentialName(inner), leaf, `${at}/${pointer(inner)}`);
    }
  });
  return findings;
}

export function feedDataRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "service-events-page" ? feedDataFindings(value) : undefined;
}
// #endregion feed-data
