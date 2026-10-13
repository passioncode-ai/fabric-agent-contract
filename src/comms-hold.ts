import { isObject } from "./findings.js";

// #region comms-hold — docs: docs/specification/project-comms.md#holds
/**
 * An operator's hold on the Project board (DEC-0079, `fabric-project-comms/0.1`): the operator, through the host's own
 * controls, holds a thread, a Project or a (Project, capability) responder slot. While it lasts, the board refuses NEW
 * work in its scope with the retryable refusal `held`, and never refuses a call that settles, reports on or keeps alive
 * work already started, a cancel or a read. `holdRefuses` is that matrix, run by ports from `fixtures/vectors/comms-hold.json`.
 *
 * The board evaluates it at commit time, inside the same atomic recheck as the fence, the authority revision and the
 * lease (C4): a hold refuses calls that commit after it and undoes none that committed before. A hold is not a fence, a
 * grant change or an authority revision, so it bumps no slot generation, attempt or request revision.
 */

/** The seventeen board tools (DEC-0022, DEC-0073). */
export const COMMS_TOOLS: readonly string[] = [
  "com.submit", "com.list", "com.get", "com.read_ack", "com.reply", "com.cancel", "com.status", "com.directory",
  "com.enroll", "com.claim", "com.renew", "com.accept", "com.progress", "com.effect_begin", "com.complete",
  "com.reconcile", "com.responder_replace"
];

/**
 * What a hold may refuse, by the scopes that refuse it. `thread`: the call writes into a held thread. `slot`: the call
 * acts on a held (Project, capability) slot. `project`: the call acts on a slot of a held Project. A call on a request
 * (`com.claim` naming one, `com.accept`, `com.effect_begin`) is refused when the request is held work: its thread, its
 * target Project or its target slot is held. A tool absent from this map is never refused `held`.
 */
export const HOLD_SCOPES: ReadonlyMap<string, readonly ("thread" | "project" | "slot")[]> = new Map([
  ["com.submit", ["thread"]],
  ["com.reply", ["thread"]],
  ["com.enroll", ["project", "slot"]],
  ["com.responder_replace", ["project", "slot"]],
  ["com.claim", ["thread", "project", "slot"]],
  ["com.accept", ["thread", "project", "slot"]],
  ["com.effect_begin", ["thread", "project", "slot"]]
]);

/** Never refused `held`, under any hold: they settle, report on or keep alive started work, cancel, or read. */
export const NEVER_HELD: readonly string[] = COMMS_TOOLS.filter((tool) => !HOLD_SCOPES.has(tool));

/**
 * What the call acts on, as the board resolved it from its own records (never from the payload).
 * - `thread`: the existing thread the call writes into, or the thread of the request it acts on; absent for a new
 *   thread and for a slot-only call.
 * - `project`, `capability`: the slot the call acts on (`com.enroll`, `com.responder_replace`, `com.claim`), or the
 *   request's target Project and capability.
 * - `fenced`: a `com.reply` that carries a responder's fence. A fenced reply is never refused.
 * - `repeat`: the call repeats a key and digest whose receipt was stored before the hold; that receipt answers it and
 *   nothing commits, so it is never refused.
 */
export interface HoldTarget { thread?: string; project?: string; capability?: string; fenced?: boolean; repeat?: boolean }
/** The holds in force when the call commits. Ids and capability names compare as written (DEC-0077), never folded. */
export interface Holds { threads?: string[]; projects?: string[]; slots?: Array<{ project: string; capability: string }> }

/** An object's own member, or `undefined`: an inherited one (`constructor`, a `__proto__` chain) is never read. */
const own = (value: unknown, key: string): unknown => (isObject(value) && Object.hasOwn(value, key) ? value[key] : undefined);
const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const strings = (value: unknown): Set<string> =>
  new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);

/**
 * True when the board refuses `tool` on `target` with `held` under `holds`. Malformed input never throws: a member of
 * the wrong type, or one only inherited, counts as absent, and an unknown tool is never refused `held` (the board
 * answers it `unsupported_capability`).
 */
export function holdRefuses(tool: unknown, target: unknown, holds: unknown): boolean {
  const scopes = typeof tool === "string" ? HOLD_SCOPES.get(tool) : undefined;
  if (!scopes || !isObject(target)) return false;
  if (own(target, "repeat") === true) return false;
  if (tool === "com.reply" && own(target, "fenced") === true) return false;
  const thread = text(own(target, "thread"));
  const project = text(own(target, "project"));
  const capability = text(own(target, "capability"));
  if (scopes.includes("thread") && thread !== undefined && strings(own(holds, "threads")).has(thread)) return true;
  if (scopes.includes("project") && project !== undefined && strings(own(holds, "projects")).has(project)) return true;
  const slots = own(holds, "slots");
  if (scopes.includes("slot") && project !== undefined && capability !== undefined && Array.isArray(slots)) {
    return slots.some((slot: unknown) => own(slot, "project") === project && own(slot, "capability") === capability);
  }
  return false;
}
// #endregion comms-hold
