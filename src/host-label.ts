import { createHmac } from "node:crypto";
import { isObject } from "./findings.js";

// #region host-label, docs: docs/specification/devices.md#the-host-label
/**
 * The host label (DEC-0154 item 4, proposed): what tells an organization that two of its devices (two OS accounts of
 * one computer, or a virtual machine and its host) run on one host, without naming the host and without letting two
 * organizations link it. `hostLabel` is the reference a node ports; it reads no file and never throws: the node reads
 * the host secret's owner and bytes itself and hands them over, and malformed input is an answer.
 *
 * The label is HMAC-SHA-256 keyed with the host secret over the UTF-8 bytes of `fabric-host-label/1` followed directly
 * by the organization's `org.id`, its first 16 bytes in base64url without padding (22 characters). A host secret not
 * owned by root (on Windows, the Administrators group) or not exactly 32 bytes gives no label, never one computed from
 * another key.
 */

/** The domain string the HMAC message starts with. */
export const HOST_LABEL_DOMAIN = "fabric-host-label/1";
/** The host secret's exact size in bytes. */
export const HOST_SECRET_BYTES = 32;
/** A label: 16 bytes in unpadded base64url, whose last character carries two bits. */
export const HOST_LABEL = /^[A-Za-z0-9_-]{21}[AQgw]$/;
/** `activity-common.schema.json#/$defs/opaqueId`, the pattern of an enrollment's `org.id`. */
const ORG_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const HEX = /^(?:[0-9a-f]{2})*$/;
const MAX_HEX = 2 * 1024;
const OWNERS = new Set(["root", "administrators", "other"]);

export type HostLabelAnswer = { hostLabel: string } | { none: "secret-owner" | "secret-size" } | { fault: "input-invalid" };

const FAULT: HostLabelAnswer = { fault: "input-invalid" };

/**
 * `{secret: {owner, hex}, orgId}`: `owner` is `root` (uid 0 on macOS and Linux), `administrators` (the Windows
 * Administrators group) or `other`; `hex` the file's bytes in lower-case hex; `orgId` the enrollment's `org.id`. Answers
 * `{hostLabel}`, or `{none}` naming why the node sends no label (the owner checked before the size), or `{fault}` for
 * input that is not this shape.
 */
export function hostLabel(input: unknown): HostLabelAnswer {
  if (!isObject(input) || !isObject(input.secret)) return FAULT;
  const { owner, hex } = input.secret;
  const { orgId } = input;
  if (typeof owner !== "string" || !OWNERS.has(owner)) return FAULT;
  if (typeof hex !== "string" || hex.length > MAX_HEX || !HEX.test(hex)) return FAULT;
  if (typeof orgId !== "string" || !ORG_ID.test(orgId)) return FAULT;
  if (owner === "other") return { none: "secret-owner" };
  const secret = Buffer.from(hex, "hex");
  if (secret.length !== HOST_SECRET_BYTES) return { none: "secret-size" };
  const mac = createHmac("sha256", secret).update(Buffer.from(HOST_LABEL_DOMAIN + orgId, "utf8")).digest();
  return { hostLabel: mac.subarray(0, 16).toString("base64url") };
}
// #endregion
