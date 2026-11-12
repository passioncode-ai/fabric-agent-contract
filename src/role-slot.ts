import { type Finding, type JsonObject, isObject } from "./findings.js";
import { normalIdentifier } from "./identifiers.js";

// #region role-slot (docs: docs/specification/governance-and-roles.md#the-estates-manager)
// DEC-0167: the estate's manager is whoever holds the estate's `ceo` slot (MG-1). A binding and an execution context
// carry `scope`, the estate or one project, as roles' assignments do (MG-2). A slot `(estate, role, scope)` names its
// holder and the epoch the estate's hub issued for it; only the holder at the current epoch writes for the slot, and a
// holder never chooses its own epoch (MG-3).

/** One role slot as `role-slot.schema.json` carries it. */
export interface RoleSlot {
  type: "role-slot/1";
  estate: string;
  role: "ceo" | "product-manager";
  scope: { estate: string } | { project: string };
  epoch: number;
  holder: { id: string; revision: number; contentHash: string };
  since: string;
}

/** A write for a slot: the epoch the writer holds it at and the binding revision it writes as. */
export interface SlotWrite { epoch: unknown; holder: unknown }

export type SlotWriteAnswer =
  | { ok: true }
  /** An older epoch: another holder has the slot now, even when the writer's transport is still live. */
  | { ok: false; refused: "slot-epoch-stale" }
  /** An epoch the hub never issued (a holder naming its own), or the right epoch from another binding. */
  | { ok: false; refused: "slot-epoch-unknown" | "slot-not-holder" };

const sameRef = (a: unknown, b: unknown): boolean =>
  isObject(a) && isObject(b) && typeof a.id === "string" && typeof b.id === "string"
  && normalIdentifier(a.id) === normalIdentifier(b.id) && a.revision === b.revision && a.contentHash === b.contentHash;

/**
 * Whether a registry takes a write for a slot (DEC-0167 MG-3): the write's epoch is the slot's current one and its
 * holder the slot's holder. An older epoch is `slot-epoch-stale`, a later one `slot-epoch-unknown` (the hub issues
 * epochs, a holder never chooses its own), and the current epoch from another binding `slot-not-holder`. A write
 * whose epoch is not an integer is `slot-epoch-unknown`. It answers and never throws.
 */
export function slotWrite(slot: Pick<RoleSlot, "epoch" | "holder">, write: SlotWrite): SlotWriteAnswer {
  if (typeof write.epoch !== "number" || !Number.isInteger(write.epoch) || write.epoch > slot.epoch) return { ok: false, refused: "slot-epoch-unknown" };
  if (write.epoch < slot.epoch) return { ok: false, refused: "slot-epoch-stale" };
  if (!sameRef(write.holder, slot.holder)) return { ok: false, refused: "slot-not-holder" };
  return { ok: true };
}

const flag = (instancePath: string, message: string): Finding => ({ code: "FAC-SEM-174", instancePath, message });

/** A binding's or an execution context's `project` against its `scope` (MG-2): a project scope names the same project. */
function scopeFindings(value: JsonObject): Finding[] {
  const scope = isObject(value.scope) ? value.scope : undefined;
  if (scope === undefined || typeof scope.project !== "string" || typeof value.project !== "string") return [];
  return normalIdentifier(scope.project) === normalIdentifier(value.project) ? [] : [flag("/scope/project", `the scope's project ${scope.project} is not the record's project ${value.project} (DEC-0167 MG-2)`)];
}

/** A slot's role against its scope (MG-1, MG-3): `ceo` holds the estate it names, `product-manager` one project. */
function slotFindings(slot: JsonObject): Finding[] {
  const scope = isObject(slot.scope) ? slot.scope : {};
  if (slot.role === "ceo") {
    if (typeof scope.estate !== "string") return [flag("/scope", "the ceo slot is scoped to the estate (DEC-0167 MG-1)")];
    return typeof slot.estate === "string" && normalIdentifier(scope.estate) === normalIdentifier(slot.estate) ? [] : [flag("/scope/estate", "the ceo slot's scope names its own estate (DEC-0167 MG-3)")];
  }
  return typeof scope.project === "string" ? [] : [flag("/scope", "a product-manager slot is scoped to one project (DEC-0167 MG-1)")];
}

/**
 * The next revision of a slot against the one before (MG-3, MG-4): the same estate, role and scope; a new holder at a
 * higher epoch; the same holder at the same epoch; never an epoch that goes back.
 */
function successionFindings(previous: JsonObject, next: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const key = (slot: JsonObject) => JSON.stringify([slot.estate, slot.role, slot.scope].map((part) => (typeof part === "string" ? normalIdentifier(part) : isObject(part) ? Object.fromEntries(Object.entries(part).map(([k, v]) => [k, typeof v === "string" ? normalIdentifier(v) : v])) : part)));
  if (key(previous) !== key(next)) findings.push(flag("/next/scope", "a slot's next revision keeps its estate, role and scope (DEC-0167 MG-3)"));
  const prevEpoch = previous.epoch as number;
  const nextEpoch = next.epoch as number;
  if (sameRef(previous.holder, next.holder)) {
    if (nextEpoch !== prevEpoch) findings.push(flag("/next/epoch", "the same holder keeps its epoch (DEC-0167 MG-3)"));
  } else if (!(nextEpoch > prevEpoch)) findings.push(flag("/next/epoch", "a new holder takes the slot at a higher epoch, never a repeated one (DEC-0167 MG-3, MG-4)"));
  return findings;
}

/**
 * FAC-SEM-174 (DEC-0167): kind `binding` and `execution-context`, a project scope names the record's project; kind
 * `role-slot`, the role matches the scope; kind `role-slot-succession` (`{previous, next}`), the next revision keeps the
 * slot and its epoch rises with a new holder; kind `role-slot-write` (`{slot, write, answer}`), the answer is
 * `slotWrite`'s.
 */
export function roleSlotRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "binding") return scopeFindings(value);
  if (kind === "execution-context") return value.kind === "execution-context" ? scopeFindings(value) : [];
  if (kind === "role-slot") return slotFindings(value);
  if (kind === "role-slot-succession") return isObject(value.previous) && isObject(value.next) ? successionFindings(value.previous, value.next) : [flag("", "a succession reads {previous, next}")];
  if (kind === "role-slot-write") {
    if (!isObject(value.slot) || !isObject(value.write)) return [flag("", "a write reads {slot, write, answer}")];
    const want = slotWrite(value.slot as unknown as RoleSlot, value.write as unknown as SlotWrite);
    return JSON.stringify(want) === JSON.stringify(value.answer) ? [] : [flag("/answer", `the registry answers ${JSON.stringify(want)} (DEC-0167 MG-3)`)];
  }
  return undefined;
}
// #endregion role-slot
