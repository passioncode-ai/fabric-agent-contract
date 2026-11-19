/**
 * The context a key-issuing door proves (DEC-0185, CT-339): the caller's reading `doorContext` (DC-1), the issuer's
 * rule (DC-2) as `doorAdmits`, the closed list of refusals (DC-3), and the door's own check of the calling issue key
 * (DC-7) as `issueKeyAdmitted`. A door's context is read only from a statement the organization signed
 * (`org-instance/1`, DEC-0170) or from the person's verified estate record (a secret placement, DEC-0082), never from
 * a name, a configuration row or a member the door writes about itself.
 */
import { PERSONAL_CONTEXT, parseContext } from "./context-route.js";
import { type JsonObject, isObject } from "./findings.js";
import { type HeldInstance, type OrgInstanceProblem, verifyOrgInstance } from "./org-instance.js";

/** The refusals of DC-3, checked in this order; `context-invalid` is the caller's own input, never the door's. */
export const DOOR_REFUSALS = ["context-invalid", "door-claim-absent", "door-claim-invalid", "door-organization-mismatch"] as const;
export type DoorRefusal = (typeof DOOR_REFUSALS)[number];

/** Why a claim is invalid: the verifier's problem, a retired instance, another origin, or no key set for its organization. */
export type DoorClaimDetail = OrgInstanceProblem | "retired" | "wrong-origin" | "no-key-set" | `record-${string}`;

/** A door served at its own `https://` origin, with the `org-instance/1` statement it handed over (DC-4), if any. */
export interface RemoteDoor { kind: "remote"; origin: string; statement?: unknown; held?: HeldInstance }
/** A vault slot on a machine of the estate that an issuing agent issues through. */
export interface LocalDoor { kind: "local"; machineId: string; agentRef: string; slot: string }
export type Door = RemoteDoor | LocalDoor;

export interface DoorTrust {
  /** The reader's clock. */
  now: Date;
  /** The key set the caller applied per organization (`org:<orgId>`), each accepted by `verifyOrgKeySet` under its pinned root. */
  keySets?: Record<string, JsonObject>;
  /** The estate record and the verdict `verifyEstateRecord` gave it; the record is read only when that verdict accepted it. */
  estate?: { record: JsonObject; verdict: { ok: boolean; digest?: string; problem?: string } };
}

export type DoorContextVerdict =
  | { ok: true; context: string; source: "org-instance" | "estate-record" }
  | { ok: false; refusal: DoorRefusal; detail?: DoorClaimDetail; context?: string };

const contextOf = (entry: JsonObject): unknown => (entry.context === undefined ? PERSONAL_CONTEXT : entry.context);
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);

function remoteContext(door: RemoteDoor, trust: DoorTrust): DoorContextVerdict {
  const statement = door.statement;
  if (statement === undefined) return { ok: false, refusal: "door-claim-absent" };
  const org = isObject(statement) && typeof statement.org === "string" ? statement.org : undefined;
  const keySet = org !== undefined ? trust.keySets?.[org] : undefined;
  if (!keySet) return { ok: false, refusal: "door-claim-invalid", detail: org === undefined ? "malformed" : "no-key-set" };
  const instanceId = (statement as JsonObject).instanceId;
  if (typeof instanceId !== "string") return { ok: false, refusal: "door-claim-invalid", detail: "malformed" };
  const verdict = verifyOrgInstance(statement, { now: trust.now, org: org as string, instanceId, keySet, ...(door.held ? { held: door.held } : {}) });
  if (!verdict.ok) return { ok: false, refusal: "door-claim-invalid", detail: verdict.problem };
  if (verdict.status !== "active") return { ok: false, refusal: "door-claim-invalid", detail: "retired" };
  // The origin is compared as written: the statement names the origin the caller calls, or it proves nothing about it.
  if (verdict.origin !== door.origin) return { ok: false, refusal: "door-claim-invalid", detail: "wrong-origin" };
  return { ok: true, context: org as string, source: "org-instance" };
}

function localContexts(door: LocalDoor, trust: DoorTrust): { contexts: string[] } | DoorContextVerdict {
  const estate = trust.estate;
  if (!estate) return { ok: false, refusal: "door-claim-absent" };
  const { record, verdict } = estate;
  if (!isObject(verdict) || verdict.ok !== true || !isObject(record) || verdict.digest !== record.digest) {
    const problem = isObject(verdict) && typeof verdict.problem === "string" ? verdict.problem : "unverified";
    return { ok: false, refusal: "door-claim-invalid", detail: `record-${problem}` };
  }
  const machine = list(record.machines).find((entry) => entry.id === door.machineId);
  const contexts = list(machine?.secrets)
    .filter((entry) => entry.agentRef === door.agentRef && entry.slot === door.slot)
    .map((entry) => contextOf(entry))
    .filter((value): value is string => typeof value === "string");
  return { contexts };
}

/**
 * DC-1 and DC-3: the context `door` proves for an issue in `asked` (`personal` or `org:<orgId>`). A remote door proves
 * the organization of an `org-instance/1` statement that verifies under the key set the caller applied for that
 * organization, reads `active`, and names the origin called; a local door proves a context the verified estate record
 * places its slot in on that machine. Absent, invalid or another context: a refusal. It never throws.
 */
export function doorContext(door: unknown, asked: unknown, trust: DoorTrust): DoorContextVerdict {
  if (parseContext(asked) === undefined || !isObject(trust)) return { ok: false, refusal: "context-invalid" };
  if (!(trust.now instanceof Date) || !Number.isFinite(trust.now.getTime())) return { ok: false, refusal: "context-invalid" };
  if (!isObject(door)) return { ok: false, refusal: "context-invalid" };
  if (door.kind === "remote" && typeof door.origin === "string") {
    const verdict = remoteContext(door as unknown as RemoteDoor, trust);
    if (!verdict.ok || verdict.context === asked) return verdict;
    return { ok: false, refusal: "door-organization-mismatch", context: verdict.context };
  }
  if (door.kind === "local" && typeof door.machineId === "string" && typeof door.agentRef === "string" && typeof door.slot === "string") {
    const read = localContexts(door as unknown as LocalDoor, trust);
    if (!("contexts" in read)) return read;
    if (read.contexts.length === 0) return { ok: false, refusal: "door-claim-absent" };
    // A slot placed in several contexts proves each of them; the issue in hand picks the one asked about.
    if (read.contexts.includes(asked as string)) return { ok: true, context: asked as string, source: "estate-record" };
    return { ok: false, refusal: "door-organization-mismatch", context: read.contexts[0] as string };
  }
  return { ok: false, refusal: "context-invalid" };
}

/** DC-2: an issuer issuing in `asked` uses `door` only when `doorContext` answers `asked`; read per issue, never once at start. */
export function doorAdmits(door: unknown, asked: unknown, trust: DoorTrust): boolean {
  return doorContext(door, asked, trust).ok;
}

export type IssueKeyVerdict = { ok: true } | { ok: false; refusal: "issuer-organization-mismatch" | "context-invalid" };

/**
 * DC-7, the door's own side: an organization's door that offers `*.keys.issue` admits an issue call only from a key
 * bound at issue to its own verified context (`doorOwn`, the organization its `org-instance/1` statement names). A key
 * bound to another context, the personal one included, or bound to none (issued before DEC-0185) is refused before any
 * provider call.
 */
export function issueKeyAdmitted(doorOwn: unknown, keyContext: unknown): IssueKeyVerdict {
  const own = parseContext(doorOwn);
  if (own === undefined || own.kind !== "org") return { ok: false, refusal: "context-invalid" };
  return keyContext === doorOwn ? { ok: true } : { ok: false, refusal: "issuer-organization-mismatch" };
}
