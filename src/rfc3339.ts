// #region rfc3339 — docs: docs/specification/estate-record.md#the-verifier
/**
 * The one strict reading of an RFC 3339 date-time a rule compares (the board run's wave-3 lesson): `T` (or RFC 3339
 * §5.6's lower-case `t`), an offset (`Z`, `z` or `±hh:mm`) and a day that exists in its month are required. This is
 * stricter than the schemas' `date-time`, which also admits a space separator and a leap second `:60`; both are refused.
 * `Date.parse` alone reads 2026-02-30 as 2 March and a missing offset as local time. The estate record (DEC-0055, ER-10),
 * the window lease (DEC-0062) and the share-grant challenge (DEC-0063) read their times with this function.
 */
const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(\.\d+)?([Zz]|[+-]\d{2}:\d{2})$/;

/** Milliseconds since the epoch, or NaN for anything that is not a strict RFC 3339 date-time. */
export function rfc3339Time(value: unknown): number {
  const match = typeof value === "string" ? RFC3339.exec(value) : null;
  if (!match) return Number.NaN;
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number) as [number, number, number, number, number, number];
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) return Number.NaN;
  return Date.parse(value as string);
}
// #endregion rfc3339
