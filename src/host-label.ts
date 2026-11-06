import { createHmac } from "node:crypto";
import { isObject } from "./findings.js";

// #region host-label, docs: docs/specification/devices.md#the-host-label
/**
 * The host label (DEC-0154 item 4, proposed): what tells an organization that two of its devices (two counted OS
 * accounts of one computer, or a virtual machine and its host) run on one host, without naming the host. `hostLabel` is
 * the reference a node ports; it reads no file and never throws. The node reads the host secret file's metadata first
 * (whether the path is a symbolic link, the file's owner and who else can write it, its folder's owner and mode) and
 * its bytes only when the metadata passes, and hands them over; malformed input is an answer.
 *
 * The label is HMAC-SHA-256 keyed with the host secret over the UTF-8 bytes of `fabric-host-label/1` followed directly
 * by the organization's `org.id`, its first 16 bytes in base64url without padding (22 characters). A secret that is
 * reached through a symbolic link, is not owned by the system's administrator (root on macOS and Linux; the
 * Administrators group or SYSTEM on Windows), can be written by any other account, sits in a folder that is not the
 * administrator's or that another account can write, or is not exactly 32 bytes gives no label, never one computed
 * from another key.
 */

/** The domain string the HMAC message starts with. */
export const HOST_LABEL_DOMAIN = "fabric-host-label/1";
/** The host secret's exact size in bytes. */
export const HOST_SECRET_BYTES = 32;
/** A label: 16 bytes in unpadded base64url, whose last character carries two bits. */
export const HOST_LABEL = /^[A-Za-z0-9_-]{21}[AQgw]$/;
/** `activity-common.schema.json#/$defs/opaqueId`, the pattern of an enrollment's `org.id` (the test holds them equal). */
export const ORG_ID = /^[A-Za-z0-9][A-Za-z0-9._:~-]{0,127}$/;
const HEX = /^(?:[0-9a-f]{2})*$/;
const MAX_HEX = 2 * 1024;
/** The owners a node reports, and those that may own the secret on each platform. */
const OWNERS = new Set(["root", "administrators", "system", "other"]);
const ADMINISTRATOR: Record<"posix" | "windows", ReadonlySet<string>> = { posix: new Set(["root"]), windows: new Set(["administrators", "system"]) };

export type HostLabelAnswer =
  | { hostLabel: string }
  | { none: "secret-link" | "secret-owner" | "secret-mode" | "secret-size" }
  | { fault: "input-invalid" };

const FAULT: HostLabelAnswer = { fault: "input-invalid" };

/**
 * `{platform, secret: {link, owner, writableByOthers, folderOk, hex}, orgId}`: `platform` is `posix` (macOS, Linux) or
 * `windows`; `link` whether the path is a symbolic link (on Windows a reparse point); `owner` is `root` (uid 0),
 * `administrators` (the Windows Administrators group), `system` (Windows SYSTEM) or `other`; `writableByOthers` whether
 * any account but the owner can write the file (a POSIX group or other write bit; a Windows ACE granting write to
 * another SID); `folderOk` whether its folder is owned by the administrator and writable by no one else (on POSIX root
 * and `0755`; on Windows the ACL devices.md gives); `hex` the file's bytes in lower-case hex; `orgId` the enrollment's
 * `org.id`. Answers `{hostLabel}`, or `{none}` naming the first reason the node sends no label (the link, then the
 * owner, then the mode, then the size), or `{fault}`.
 */
export function hostLabel(input: unknown): HostLabelAnswer {
  if (!isObject(input) || !isObject(input.secret)) return FAULT;
  const { platform, orgId } = input;
  const { link, owner, writableByOthers, folderOk, hex } = input.secret;
  if (platform !== "posix" && platform !== "windows") return FAULT;
  if (typeof link !== "boolean" || typeof writableByOthers !== "boolean" || typeof folderOk !== "boolean") return FAULT;
  if (typeof owner !== "string" || !OWNERS.has(owner)) return FAULT;
  if (typeof hex !== "string" || hex.length > MAX_HEX || !HEX.test(hex)) return FAULT;
  if (typeof orgId !== "string" || !ORG_ID.test(orgId)) return FAULT;
  if (link) return { none: "secret-link" };
  if (!ADMINISTRATOR[platform].has(owner)) return { none: "secret-owner" };
  if (writableByOthers || !folderOk) return { none: "secret-mode" };
  const secret = Buffer.from(hex, "hex");
  if (secret.length !== HOST_SECRET_BYTES) return { none: "secret-size" };
  const mac = createHmac("sha256", secret).update(Buffer.from(HOST_LABEL_DOMAIN + orgId, "utf8")).digest();
  return { hostLabel: mac.subarray(0, 16).toString("base64url") };
}
// #endregion
