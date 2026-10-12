import { type Finding, type JsonObject, isObject } from "./findings.js";
import { credentialName, secretValue } from "./secret-shape.js";

// #region feed-data — docs: docs/specification/service.md#event-data
/**
 * FAC-SEM-101 (DEC-0070, kind `service-events-page`): an event's optional `data` never carries a secret. No string in
 * `data.value`, at either level, sits under a credential's name or has a credential's shape (the shared detector,
 * `src/secret-shape.ts`); a number under a name such as `inputTokens` is a count, not a credential. A finding names the place, never the value. Personal data is the service's duty:
 * no check can tell a name from any other string, so the rule is stated, not detected.
 */
export function feedDataFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const events = Array.isArray(value.events) ? value.events : [];
  const check = (key: string, member: unknown, at: string) => {
    if (typeof member !== "string") return;
    if (credentialName(key)) findings.push({ code: "FAC-SEM-101", instancePath: at, message: "an event's data puts no string under a credential's name" });
    else if (secretValue(member)) findings.push({ code: "FAC-SEM-101", instancePath: at, message: "an event's data carries no value shaped like a credential" });
  };
  events.forEach((event: unknown, i: number) => {
    if (!isObject(event) || !isObject(event.data) || !isObject(event.data.value)) return;
    for (const [key, member] of Object.entries(event.data.value)) {
      const at = `/events/${i}/data/value/${key}`;
      check(key, member, at);
      if (Array.isArray(member)) member.forEach((item: unknown, j: number) => check("", item, `${at}/${j}`));
      else if (isObject(member)) for (const [inner, leaf] of Object.entries(member)) check(inner, leaf, `${at}/${inner}`);
    }
  });
  return findings;
}

export function feedDataRules(kind: string, value: JsonObject): Finding[] | undefined {
  return kind === "service-events-page" ? feedDataFindings(value) : undefined;
}
// #endregion feed-data
