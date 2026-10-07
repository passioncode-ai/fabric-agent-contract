import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region feed-client — docs: docs/specification/service.md#feed-client
/** The header a client sends the service token in, as the descriptor's `auth` declares it. */
export interface TokenHeader {
  name: string;
  value: string;
}

/**
 * The one request header that carries the service token (DEC-0025). `auth.header` defaults to
 * `Authorization` and `auth.scheme` to `Bearer`, as `service-descriptor.schema.json` says; with
 * `none` the header carries the raw token, with `Bearer` it carries `Bearer <token>`.
 */
export function tokenHeader(auth: unknown, token: string): TokenHeader {
  const declared = isObject(auth) ? auth : {};
  const name = typeof declared.header === "string" ? declared.header : "Authorization";
  const scheme = typeof declared.scheme === "string" ? declared.scheme : "Bearer";
  return { name, value: scheme === "none" ? token : `Bearer ${token}` };
}

/**
 * FAC-SEM-036: a client of `GET /fabric/v1/events` sends the token in the header the descriptor
 * declares, in the declared form, and nowhere else. Input: `{ descriptor, token, request: { path,
 * headers } }`. Messages name headers and forms, never the token.
 */
export function feedRequestRules(value: JsonObject): Finding[] {
  const descriptor = isObject(value.descriptor) ? value.descriptor : {};
  const token = typeof value.token === "string" ? value.token : "";
  const request = isObject(value.request) ? value.request : {};
  const headers = isObject(request.headers) ? request.headers : {};
  const expected = tokenHeader(descriptor.auth, token);
  const findings: Finding[] = [];
  const sent = Object.entries(headers).find(([name]) => name.toLowerCase() === expected.name.toLowerCase());
  const form = expected.value === token ? "the raw token (scheme none)" : "`Bearer <token>`";
  if (!sent) {
    findings.push({ code: "FAC-SEM-036", instancePath: "/request/headers", message: `the feed request does not carry the declared header ${expected.name}` });
  } else if (sent[1] !== expected.value) {
    findings.push({ code: "FAC-SEM-036", instancePath: `/request/headers/${sent[0]}`, message: `${expected.name} must carry ${form}` });
  }
  for (const [name, carried] of Object.entries(headers)) {
    if (name.toLowerCase() === expected.name.toLowerCase() || !token || typeof carried !== "string" || !carried.includes(token)) continue;
    findings.push({ code: "FAC-SEM-036", instancePath: `/request/headers/${name}`, message: `the token travels only in ${expected.name}; it was also sent in ${name}` });
  }
  if (token && typeof request.path === "string" && request.path.includes(encodeURIComponent(token))) {
    findings.push({ code: "FAC-SEM-036", instancePath: "/request/path", message: "the token never travels in the URL" });
  }
  return findings;
}
// #endregion feed-client
