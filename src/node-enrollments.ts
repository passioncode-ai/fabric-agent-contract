import { type Finding, type JsonObject, indexed, isObject, show } from "./findings.js";

// #region node-enrollments, docs: docs/specification/devices.md#unlinkable-enrollments
/**
 * DEC-0128 (CT-122, CX-CON-06): two organizations one machine is enrolled in cannot link it. Each enrollment has its
 * own device id, keys, kids, telemetry key and collector ids, none of them the machine's estate id (FAC-SEM-148), and
 * nothing of the person's estate leaves for an organization in a check-in or its answer (FAC-SEM-149). The node keeps
 * the registry that maps its machine to its enrollments locally and never sends it.
 */

/** The estate's own records a check-in to an organization never carries (DEC-0128): they link one machine across organizations. */
export const ESTATE_RECORDS: readonly string[] = ["estateRecord", "heartbeat", "revocationDelta", "leases"];

type Flag = (instancePath: string, message: string) => void;
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/**
 * FAC-SEM-148 on a node's local registry, `{estateMachineId?, estatePublicKeys?, enrollments: [{org, deviceId, kids, publicKeys,
 * telemetryKeyId, collectorIds}]}`: one enrollment per organization, no identifier (device id, kid, public key,
 * telemetry key, collector id) shared by two enrollments in any field, and none the machine's estate id, its device kids
 * or its estate public keys.
 */
function enrollmentFindings(value: JsonObject, flag: Flag): void {
  const estate = typeof value.estateMachineId === "string" ? value.estateMachineId : undefined;
  // The estate's own identifiers: its machine id, its device kids (FAC-SEM-073's <id>#sig, <id>#kem) and its public keys.
  const estateKeys = Array.isArray(value.estatePublicKeys) ? value.estatePublicKeys.filter((key): key is string => typeof key === "string") : [];
  const estateIds = new Set([...(estate === undefined ? [] : [estate, `${estate}#sig`, `${estate}#kem`]), ...estateKeys]);
  // One set across every identifier field: a value one enrollment uses as a telemetry key and another as a collector
  // id links them as surely as a shared device id. The organization is its own field.
  const identifiers = new Map<string, number>();
  const orgs = new Map<string, number>();
  const once = (seen: Map<string, number>, item: unknown, at: string, index: number, what: string) => {
    if (typeof item !== "string") return;
    if (seen === identifiers && estateIds.has(item)) flag(at, `${what} ${show(item)} is the machine's estate identity: an enrollment's is its own (DEC-0128)`);
    const first = seen.get(item);
    if (first !== undefined && first !== index) flag(at, `${what} ${show(item)} is shared with enrollment ${first}: each enrollment's is its own (DEC-0128)`);
    else seen.set(item, index);
  };
  for (const [enrollment, index] of indexed(value.enrollments)) {
    const at = `/enrollments/${index}`;
    once(orgs, enrollment.org, `${at}/org`, index, "organization");
    once(identifiers, enrollment.deviceId, `${at}/deviceId`, index, "device id");
    strings(enrollment.kids).forEach((kid, k) => once(identifiers, kid, `${at}/kids/${k}`, index, "kid"));
    strings(enrollment.publicKeys).forEach((key, k) => once(identifiers, key, `${at}/publicKeys/${k}`, index, "public key"));
    once(identifiers, enrollment.telemetryKeyId, `${at}/telemetryKeyId`, index, "telemetry key");
    strings(enrollment.collectorIds).forEach((id, k) => once(identifiers, id, `${at}/collectorIds/${k}`, index, "collector id"));
  }
}

/** FAC-SEM-149 on a check-in a node is about to send an organization server: no estate record in `records`. */
function outboundCheckIn(value: JsonObject, flag: Flag): void {
  const records = isObject(value.checkIn) && isObject(value.checkIn.records) ? value.checkIn.records : {};
  for (const name of ESTATE_RECORDS) {
    if (Object.hasOwn(records, name)) flag(`/checkIn/records/${name}`, `a check-in to an organization carries none of the estate's records: ${name} links one machine across organizations (DEC-0128)`);
  }
}

/** Whether a record member holds a document that names an estate (an estate's heartbeat, delta page or lease). */
const namesEstate = (item: unknown): boolean =>
  Array.isArray(item) ? item.some(namesEstate) : isObject(item) && (Object.hasOwn(item, "estate") || Object.values(item).some((inner) => Array.isArray(inner) && inner.some(namesEstate)));

/**
 * FAC-SEM-149 on an answer an organization server is about to send: no estate document. Only a document that names an
 * estate is refused, so an organization's own records (its leases once organization windows exist) stay allowed.
 */
function outboundResponse(value: JsonObject, flag: Flag): void {
  const records = isObject(value.response) && isObject(value.response.records) ? value.response.records : {};
  for (const name of ESTATE_RECORDS) {
    if (Object.hasOwn(records, name) && namesEstate(records[name])) flag(`/response/records/${name}`, `an organization's answer carries none of the estate's documents: this ${name} names the person's estate (DEC-0128)`);
  }
}

export function nodeEnrollmentRules(kind: string, value: JsonObject): Finding[] | undefined {
  const findings: Finding[] = [];
  const flag = (code: string): Flag => (instancePath, message) => findings.push({ code, instancePath, message });
  if (kind === "node-enrollments") {
    enrollmentFindings(value, flag("FAC-SEM-148"));
    return findings;
  }
  if (kind === "check-in-outbound") {
    outboundCheckIn(value, flag("FAC-SEM-149"));
    return findings;
  }
  if (kind === "check-in-response-outbound") {
    outboundResponse(value, flag("FAC-SEM-149"));
    return findings;
  }
  return undefined;
}

/** A node's own registry mapping its machine to its enrollments, as FAC-SEM-148 reads it. */
export function enrollmentsLinkable(registry: unknown): boolean {
  return isObject(registry) && (nodeEnrollmentRules("node-enrollments", registry) as Finding[]).length > 0;
}
// #endregion node-enrollments
