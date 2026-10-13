import { isObject } from "./findings.js";
import { holdRefuses } from "./comms-hold.js";

// #region comms-finding — docs: docs/specification/project-comms.md#dedupe
/**
 * The order in which a board answers a `com.submit` (DEC-0080, with DEC-0073's idempotency and DEC-0079's hold): a
 * reference model for ports, not a board. The board runs it as one atomic step with the store, so of concurrent submits
 * with one (Project, `dedupeKey`) exactly one stores a message and the rest answer its receipt with `repeated: true`.
 *
 * 1. A stored idempotency key answers first: the same digest its receipt (`repeated: true`), another digest
 *    `idempotency_conflict`. A repeat commits nothing, so a hold does not refuse it (DEC-0079).
 * 2. A hold on the thread the call writes into refuses it `held` and stores nothing, before dedupe: a dedupe hit into a
 *    held thread is refused too.
 * 3. A finding whose `dedupeKey` names a retained finding of the SAME sender Project answers that finding's receipt with
 *    `repeated: true`, stores no message and stores this receipt under the fresh key. Never across Projects: a hit would
 *    hand back another Project's message and thread ids.
 * 4. Otherwise the call stores a message.
 */

/** A receipt's message, thread and time: what a dedupe hit hands back. */
export interface FindingReceipt { message: string; thread: string; at: string }
/** The board's records the answer depends on, as the board holds them (never from the payload). */
export interface SubmitState {
  /** Stored idempotency receipts by Project and key. */
  keys?: Array<{ project: string; key: string; digest: string; receipt: FindingReceipt }>;
  /** Retained findings by sender Project and `dedupeKey`. */
  findings?: Array<{ project: string; dedupeKey: string; receipt: FindingReceipt }>;
  /** The holds in force (`comms-hold.ts`). */
  holds?: unknown;
}
/** The call as the board resolved it: the sender Project from the endpoint, the thread it writes into (absent: new). */
export interface SubmitCall { project: string; thread?: string | undefined; key: string; digest: string; dedupeKey?: string | undefined }
export type SubmitAnswer =
  | { refused: "invalid_arguments" | "idempotency_conflict" | "held"; stores: "nothing" }
  | { receipt: FindingReceipt; repeated: true; stores: "nothing" | "receipt" }
  | { repeated: false; stores: "message" };

const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
const list = (value: unknown, key: string): unknown[] => (isObject(value) && Array.isArray(value[key]) ? value[key] as unknown[] : []);

/**
 * The answer to `call` under `state`. Ids and keys compare as written; malformed input never throws: a call that is not
 * an object, or lacks a string Project, key or digest, is refused `invalid_arguments`, and a state that is not an object
 * holds nothing.
 */
export function findingSubmitAnswer(call: SubmitCall, state: SubmitState): SubmitAnswer {
  const given: unknown = call;
  if (!isObject(given) || text(given.project) === undefined || text(given.key) === undefined || text(given.digest) === undefined) {
    return { refused: "invalid_arguments", stores: "nothing" };
  }
  const stored = list(state, "keys").find((entry) => isObject(entry) && entry.project === call.project && entry.key === call.key);
  if (isObject(stored)) {
    return stored.digest === call.digest && isObject(stored.receipt)
      ? { receipt: stored.receipt as unknown as FindingReceipt, repeated: true, stores: "nothing" }
      : { refused: "idempotency_conflict", stores: "nothing" };
  }
  if (holdRefuses("com.submit", { thread: text(call.thread) }, isObject(state) ? state.holds : undefined)) return { refused: "held", stores: "nothing" };
  const dedupeKey = text(call.dedupeKey);
  const standing = dedupeKey === undefined ? undefined : list(state, "findings").find((entry) => isObject(entry) && entry.project === call.project && entry.dedupeKey === dedupeKey);
  if (isObject(standing) && isObject(standing.receipt)) return { receipt: standing.receipt as unknown as FindingReceipt, repeated: true, stores: "receipt" };
  return { repeated: false, stores: "message" };
}
// #endregion comms-finding
