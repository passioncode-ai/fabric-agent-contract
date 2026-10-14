/** A semantic-rule finding. `severity: "accepted"` marks a rule that classifies rather than rejects. */
export interface Finding {
  code: string;
  instancePath: string;
  message: string;
  severity?: "rejected" | "accepted";
}

export type JsonObject = Record<string, unknown>;
export const isObject = (value: unknown): value is JsonObject => typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * A value as text for a finding's message or a key, without `String()`, which throws on an object whose `toString` is
 * not a function (`{"toString": 1}`, valid JSON): a string as it is, a number or boolean as `String` writes it, anything
 * else as its JSON.
 */
export function show(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean" || value === undefined || value === null) return String(value);
  return JSON.stringify(value) ?? typeof value;
}

/** Structural equality of JSON values; object key order does not matter. */
export function jsonEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, index) => jsonEqual(item, b[index]));
  }
  if (isObject(a) || isObject(b)) {
    if (!isObject(a) || !isObject(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => Object.hasOwn(b, key) && jsonEqual(a[key], b[key]));
  }
  return a === b;
}
