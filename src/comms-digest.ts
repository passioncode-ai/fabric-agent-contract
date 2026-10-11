import { createHash } from "node:crypto";
import { rfc8785 } from "./canonical.js";

// #region comms-digest — docs: docs/specification/project-comms.md#idempotency
/** The protocol string the board's digest starts with (DEC-0022). */
export const COMMS_PROTOCOL = "fabric-project-comms/0.1" as const;

/** Throws on the first number that is not an integer within ±(2^53 − 1): the board's form has integers only. */
function integersOnly(value: unknown): void {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError(`${value} has no canonical form here: the board's digest admits integers within ±(2^53 − 1) only`);
  } else if (Array.isArray(value)) value.forEach(integersOnly);
  else if (typeof value === "object" && value !== null) Object.values(value).forEach(integersOnly);
}

/**
 * The board's idempotency digest (DEC-0022, pinned by DEC-0043): `sha256:` and the lowercase hex SHA-256 of the
 * UTF-8 bytes of `fabric-project-comms/0.1`, NUL, the operation, NUL and the RFC 8785 form of the operation's
 * arguments. The arguments hold integers only, so the bytes are those of RFC 8785 and of Fabric's board
 * (`commsDigest` in `apps/desktop/src/main/boardService.ts`). Refuses a fraction, an unsafe integer, whatever
 * RFC 8785 refuses and an operation that is empty or holds a NUL; a board answers such a call `invalid_arguments`
 * before anything is stored.
 */
export function commsDigest(operation: string, args: unknown): string {
  // A NUL inside the operation would move the separator, and two calls would share a digest.
  if (operation === "" || operation.includes("\u0000")) throw new TypeError("an operation is a non-empty name without NUL");
  integersOnly(args);
  return `sha256:${createHash("sha256").update(`${COMMS_PROTOCOL}\u0000${operation}\u0000${rfc8785(args)}`, "utf8").digest("hex")}`;
}
// #endregion comms-digest
