/**
 * The generator of the host-label vectors (DEC-0154 item 4, proposed): `fixtures/vectors/host-label.json`, shared by
 * every node that sends `device.hostLabel` in an organization enrollment and every organization server that shows it.
 *
 *   tsx tools/vectors/host-label.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/host-label.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/host-label.test.ts` runs the check.
 * Each expected label is computed below with Node's own HMAC, from DEC-0154's text; nothing here imports
 * `src/host-label.ts`, so the gate checks that the reference returns what this file expects.
 */
import { createHmac } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/host-label.json";

/** The bytes 0x00 to 0x1f: a fixed, readable host secret. */
const COUNTING = Array.from({ length: 32 }, (_, n) => n.toString(16).padStart(2, "0")).join("");
const ALL_FF = "ff".repeat(32);

/** DEC-0154 item 4, written out: HMAC-SHA-256(secret, "fabric-host-label/1" || orgId), the first 16 bytes, base64url. */
function label(hex: string, orgId: string): Json {
  const mac = createHmac("sha256", Buffer.from(hex, "hex")).update(`fabric-host-label/1${orgId}`, "utf8").digest();
  return { hostLabel: mac.subarray(0, 16).toString("base64url") };
}

const FAULT = { fault: "input-invalid" };

function cases(): Json[] {
  /** A secret file's metadata and bytes as a node reads them; the defaults are a well-kept POSIX file. */
  const secret = (owner: string, hex: string, more: Json = {}) => ({ link: false, owner, writableByOthers: false, folderOk: true, hex, ...more });
  const posix = (s: Json, orgId: unknown = "org-7f3a") => ({ platform: "posix", secret: s, orgId });
  const windows = (s: Json, orgId: unknown = "org-7f3a") => ({ platform: "windows", secret: s, orgId });
  const list: Array<[string, unknown, Json]> = [
    ["a root-owned secret of 32 bytes", posix(secret("root", COUNTING)), label(COUNTING, "org-7f3a")],
    ["the same host in another organization: another label", posix(secret("root", COUNTING), "org-b2c4"), label(COUNTING, "org-b2c4")],
    ["another host in the same organization", posix(secret("root", ALL_FF)), label(ALL_FF, "org-7f3a")],
    ["on Windows, owned by the Administrators group", windows(secret("administrators", COUNTING)), label(COUNTING, "org-7f3a")],
    ["on Windows, owned by SYSTEM", windows(secret("system", COUNTING)), label(COUNTING, "org-7f3a")],
    ["an organization id with every separator the pattern admits", posix(secret("root", COUNTING), "Acme.eu:prod~2-x_y"), label(COUNTING, "Acme.eu:prod~2-x_y")],
    ["an organization id of 128 characters", posix(secret("root", COUNTING), `o${"a".repeat(127)}`), label(COUNTING, `o${"a".repeat(127)}`)],
    ["a secret owned by an account: no label, never another key's", posix(secret("other", COUNTING)), { none: "secret-owner" }],
    ["administrators named on a POSIX platform: not its administrator", posix(secret("administrators", COUNTING)), { none: "secret-owner" }],
    ["root named on Windows: not its administrator", windows(secret("root", COUNTING)), { none: "secret-owner" }],
    ["reached through a symbolic link: no label", posix(secret("root", COUNTING, { link: true })), { none: "secret-link" }],
    ["a link is named before an owner", posix(secret("other", COUNTING, { link: true })), { none: "secret-link" }],
    ["writable by another account: no label", posix(secret("root", COUNTING, { writableByOthers: true })), { none: "secret-mode" }],
    ["in a folder another account can write, or not the administrator's: no label", posix(secret("root", COUNTING, { folderOk: false })), { none: "secret-mode" }],
    ["on Windows, an ACE granting another SID write: no label", windows(secret("administrators", COUNTING, { writableByOthers: true })), { none: "secret-mode" }],
    ["the owner is named before the mode", posix(secret("other", COUNTING, { writableByOthers: true })), { none: "secret-owner" }],
    ["31 bytes: no label", posix(secret("root", COUNTING.slice(0, 62))), { none: "secret-size" }],
    ["33 bytes: no label", posix(secret("root", `${COUNTING}20`)), { none: "secret-size" }],
    ["an empty file: no label", posix(secret("root", "")), { none: "secret-size" }],
    ["the mode is named before the size", posix(secret("root", "00", { folderOk: false })), { none: "secret-mode" }],
    ["an organization id of 129 characters", posix(secret("root", COUNTING), `o${"a".repeat(128)}`), FAULT],
    ["an organization id that is an address", posix(secret("root", COUNTING), "ops@example.org"), FAULT],
    ["an organization id that starts with a separator", posix(secret("root", COUNTING), "-org"), FAULT],
    ["an empty organization id", posix(secret("root", COUNTING), ""), FAULT],
    ["bytes not in lower-case hex", posix(secret("root", COUNTING.toUpperCase())), FAULT],
    ["an odd number of hex digits", posix(secret("root", `${COUNTING}0`)), FAULT],
    ["exactly 1024 bytes, the cap: no label", posix(secret("root", "00".repeat(1024))), { none: "secret-size" }],
    ["1025 bytes, above the cap", posix(secret("root", "00".repeat(1025))), FAULT],
    ["a link, no bytes read", posix({ link: true, owner: "root", writableByOthers: false, folderOk: true }), { none: "secret-link" }],
    ["an oversized file behind a link: the link decides, the bytes are never read", posix(secret("root", "00".repeat(4096), { link: true })), { none: "secret-link" }],
    ["owned by an account, no bytes read", posix({ link: false, owner: "other", writableByOthers: false, folderOk: true, hex: "" }), { none: "secret-owner" }],
    ["passing metadata and no bytes", posix({ link: false, owner: "root", writableByOthers: false, folderOk: true }), FAULT],
    ["an organization id of at least 128 random bits, as a server that turns the label on issues it", posix(secret("root", COUNTING), "org_7dk3q2zr2m4x5b6c3n5v7w2y4t"), label(COUNTING, "org_7dk3q2zr2m4x5b6c3n5v7w2y4t")],
    ["an owner this reference does not name", posix(secret("wheel", COUNTING)), FAULT],
    ["a platform this reference does not name", { platform: "darwin", secret: secret("root", COUNTING), orgId: "org-7f3a" }, FAULT],
    ["a flag that is not a boolean", posix(secret("root", COUNTING, { link: "no" })), FAULT],
    ["no folder flag", posix({ link: false, owner: "root", writableByOthers: false, hex: COUNTING }), FAULT],
    ["no secret", { platform: "posix", orgId: "org-7f3a" }, FAULT],
    ["not an object", null, FAULT]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** The vectors as an object. */
export function hostLabelVectors(): Json {
  return {
    about: "Vectors for the host label (DEC-0154 item 4), written by tools/vectors/host-label.ts, never by hand. hostLabel(input): input is {platform, secret: {link, owner, writableByOthers, folderOk, hex}, orgId}: platform posix or windows; link whether the path is a symbolic link (a reparse point); owner root (uid 0), administrators (the Windows Administrators group), system (Windows SYSTEM) or other, the administrator being root on posix and administrators or system on windows; writableByOthers whether any account but the owner can write the file; folderOk whether its folder is the administrator's and writable by no one else; hex the file's bytes in lower-case hex, read only when the metadata passes (so absent or empty otherwise), up to 1024 bytes checked for size and a fault above; orgId the enrollment's org.id. The answer is {hostLabel}: HMAC-SHA-256 keyed with the 32-byte secret over the UTF-8 bytes of fabric-host-label/1 followed directly by orgId, its first 16 bytes in base64url without padding; or {none: secret-link | secret-owner | secret-mode | secret-size}, the first reason in that order, the node sending no label; or {fault: input-invalid}.",
    cases: cases()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildHostLabelVectors(): string {
  return `${JSON.stringify(hostLabelVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildHostLabelVectors();
  if (process.argv.includes("--write")) {
    writeFileSync(target, built);
    console.log(`wrote ${VECTOR_FILE}`);
  } else if (readFileSync(target, "utf8") !== built) {
    console.error(`stale vector file (run with --write): ${VECTOR_FILE}`);
    process.exitCode = 1;
  } else {
    console.log("vector file matches the generator");
  }
}
