import { type Finding, type JsonObject, isObject } from "./findings.js";
import { type DeviceCertificateRecord, type DeviceRequest, checkDeviceSignature, strictTime } from "./http-signature.js";

// #region device-transport-rules — docs: docs/specification/devices.md#semantic-rules
/**
 * The device transport binding's rule (DEC-0056), kept apart from `src/device-rules.ts` so a consumer that vendors the
 * device rules does not need the HTTP layer.
 *
 * FAC-SEM-077: `{request: {method, target, headers, body}, publicBaseUrl, certificates, at, clientCertificateSerial?, seen?,
 * answer}` — the answer of a receiver that requires the signature, or that sees a client certificate, is the one the
 * binding gives: `accepted`, or the 401 code `checkDeviceSignature` names, or `signature-replayed` when `seen` — the
 * (serial, nonce) pairs the receiver holds, each with its `keepUntil` — already holds the pair at `at`. `certificates` are
 * the receiver's records by serial; `body` is the body as a UTF-8 string; `at` is the receiver's clock, RFC 3339 read
 * strictly; `clientCertificateSerial` is the mutual-TLS session's client certificate, when there is one.
 */
function requestSignature(value: JsonObject): Finding[] {
  const flag = (instancePath: string, message: string): Finding[] => [{ code: "FAC-SEM-077", instancePath, message }];
  const at = strictTime(value.at);
  if (Number.isNaN(at)) return flag("/at", "the input names the receiver's clock as an RFC 3339 date-time with an offset; an unreadable clock decides nothing");
  const request = isObject(value.request) ? value.request : {};
  const certificates = new Map<string, DeviceCertificateRecord>();
  for (const record of Array.isArray(value.certificates) ? value.certificates.filter(isObject) : []) {
    if (typeof record.serial === "string") certificates.set(record.serial, record as unknown as DeviceCertificateRecord);
  }
  const seen = new Map<string, number>();
  for (const pair of Array.isArray(value.seen) ? value.seen.filter(isObject) : []) seen.set(`${String(pair.serial)} ${String(pair.nonce)}`, typeof pair.keepUntil === "number" ? pair.keepUntil : 0);
  const verdict = checkDeviceSignature(
    { method: request.method as string, target: request.target as string, headers: (isObject(request.headers) ? request.headers : {}) as DeviceRequest["headers"], body: typeof request.body === "string" ? request.body : "" },
    {
      publicBaseUrl: String(value.publicBaseUrl ?? ""),
      certificate: (serial) => certificates.get(serial),
      at: new Date(at),
      ...(typeof value.clientCertificateSerial === "string" ? { clientCertificateSerial: value.clientCertificateSerial } : {})
    }
  );
  let want: string = verdict.ok ? "accepted" : verdict.code;
  let reason = verdict.ok ? "" : verdict.reason;
  if (verdict.ok && verdict.binding === "signature") {
    const until = seen.get(`${verdict.serial} ${verdict.nonce}`);
    if (until !== undefined && at / 1000 <= until) { want = "signature-replayed"; reason = "this (serial, nonce) is already held"; }
  }
  if (value.answer === want) return [];
  return flag("/answer", want === "accepted" ? `the binding accepts this request; the receiver accepts it, not ${String(value.answer)}` : `the receiver answers ${want}: ${reason}`);
}

export function deviceTransportRules(kind: string, value: unknown): Finding[] | undefined {
  if (kind !== "device-request-signature" || !isObject(value)) return undefined;
  return requestSignature(value);
}
// #endregion device-transport-rules
