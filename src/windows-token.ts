import { type Finding, type JsonObject, isObject } from "./findings.js";

// #region windows-token — docs: docs/specification/service.md#windows-token-files
/**
 * The reader rule of service.md *Windows token files* (DEC-0032, DEC-0033, DEC-0057) on what a reader has already
 * read from the file system, so a port can run the same vectors (`fixtures/vectors/windows-token.json`) without
 * Windows. A refusal names the offending SID or the reason — never the file's contents.
 */
export const SYSTEM_SID = "S-1-5-18";
export const ADMINISTRATORS_SID = "S-1-5-32-544";

/**
 * One access control entry as read: `allow` or `deny`, the trustee's string SID and the access mask — the ACE's
 * unsigned 32-bit mask. A reader that reads it signed (.NET `FileSystemRights` is an `int`, so `GENERIC_READ`,
 * 0x80000000, arrives negative) converts it first (`>>> 0`, `(uint)`).
 */
export interface WindowsAce { type: string; sid: string; mask: number }
/** What a reader read about a token file before deciding. */
export interface WindowsTokenFile {
  isRegularFile: boolean;
  isReparsePoint: boolean;
  realPathInProfile: boolean;
  ownerSid: string;
  aces: WindowsAce[];
}
export type WindowsTokenProblemCode = "unreadable" | "not-regular-file" | "reparse-point" | "outside-profile" | "owner" | "ace-type" | "ace-sid";
export interface WindowsTokenProblem { problem: WindowsTokenProblemCode; at: string; sid?: string; message: string }

/** A string SID: revision 1, an identifier authority and up to 15 sub-authorities of 32 bits each. Compared case-insensitively on its `S`. */
const SID = /^S-1-\d{1,15}(-\d{1,10}){0,15}$/i;
const MAX_SUB_AUTHORITY = 0xffffffff;
const sid = (value: unknown): string | undefined =>
  typeof value === "string" && SID.test(value) && value.split("-").slice(3).every((part) => Number(part) <= MAX_SUB_AUTHORITY) ? value.toUpperCase() : undefined;
const MAX_MASK = 0xffffffff;

/**
 * The first reason a reader MUST refuse the token file, or `null` when it may read it:
 *
 * 1. a regular file — not a reparse point — whose real path lies inside the user's profile;
 * 2. owned by the current user, SYSTEM (`S-1-5-18`) or Administrators (`S-1-5-32-544`);
 * 3. every ACE that grants any right (an `allow` ACE with a non-zero mask) names one of those three; `deny` ACEs do
 *    not change the decision, an ACE of another type is refused, and anything unreadable is refused.
 */
export function windowsTokenAclProblem(file: unknown, currentUserSid: unknown): WindowsTokenProblem | null {
  const user = sid(currentUserSid);
  if (user === undefined) return { problem: "unreadable", at: "/currentUserSid", message: "the current user's SID is unreadable" };
  if (!isObject(file)) return { problem: "unreadable", at: "/file", message: "the token file's metadata is unreadable" };
  for (const flag of ["isRegularFile", "isReparsePoint", "realPathInProfile"] as const) {
    if (typeof file[flag] !== "boolean") return { problem: "unreadable", at: `/file/${flag}`, message: `${flag} is unreadable` };
  }
  if (file.isReparsePoint === true) return { problem: "reparse-point", at: "/file/isReparsePoint", message: "the token file is a reparse point (a symlink or a junction)" };
  if (file.isRegularFile !== true) return { problem: "not-regular-file", at: "/file/isRegularFile", message: "the token file is not a regular file" };
  if (file.realPathInProfile !== true) return { problem: "outside-profile", at: "/file/realPathInProfile", message: "the token file's real path lies outside the user's profile" };
  const trusted = new Set([user, SYSTEM_SID, ADMINISTRATORS_SID]);
  const owner = sid(file.ownerSid);
  if (owner === undefined) return { problem: "unreadable", at: "/file/ownerSid", message: "the owner SID is unreadable" };
  if (!trusted.has(owner)) return { problem: "owner", at: "/file/ownerSid", sid: owner, message: `the token file is owned by ${owner}, not by the current user, SYSTEM or Administrators` };
  if (!Array.isArray(file.aces)) return { problem: "unreadable", at: "/file/aces", message: "the ACL is unreadable" };
  for (const [index, ace] of file.aces.entries()) {
    const at = `/file/aces/${index}`;
    if (!isObject(ace)) return { problem: "unreadable", at, message: `ACE ${index} is unreadable` };
    if (typeof ace.type !== "string") return { problem: "unreadable", at: `${at}/type`, message: `ACE ${index} has an unreadable type` };
    const trustee = sid(ace.sid);
    if (trustee === undefined) return { problem: "unreadable", at: `${at}/sid`, message: `ACE ${index} names an unreadable SID` };
    if (typeof ace.mask !== "number" || !Number.isInteger(ace.mask) || ace.mask < 0 || ace.mask > MAX_MASK) return { problem: "unreadable", at: `${at}/mask`, message: `ACE ${index} has an unreadable access mask` };
    if (ace.type === "deny") continue;
    if (ace.type !== "allow") return { problem: "ace-type", at: `${at}/type`, sid: trustee, message: `ACE ${index} for ${trustee} is of a type the rule does not read` };
    if (ace.mask === 0) continue;
    if (!trusted.has(trustee)) return { problem: "ace-sid", at: `${at}/sid`, sid: trustee, message: `the token file grants access to ${trustee}; only the current user, SYSTEM and Administrators may hold any` };
  }
  return null;
}

/** FAC-SEM-079: a Windows token-file reader accepts exactly the files the rule admits. Input: `{ file, currentUserSid }`. */
export function windowsTokenRules(value: JsonObject): Finding[] {
  const problem = windowsTokenAclProblem(value.file, value.currentUserSid);
  return problem ? [{ code: "FAC-SEM-079", instancePath: problem.at, message: problem.message }] : [];
}
// #endregion windows-token
