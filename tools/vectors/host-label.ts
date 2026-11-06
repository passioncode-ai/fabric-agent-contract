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
  const secret = (owner: string, hex: string) => ({ owner, hex });
  const list: Array<[string, unknown, Json]> = [
    ["a root-owned secret of 32 bytes", { secret: secret("root", COUNTING), orgId: "org-7f3a" }, label(COUNTING, "org-7f3a")],
    ["the same host in another organization: another label, so two organizations cannot link it", { secret: secret("root", COUNTING), orgId: "org-b2c4" }, label(COUNTING, "org-b2c4")],
    ["another host in the same organization", { secret: secret("root", ALL_FF), orgId: "org-7f3a" }, label(ALL_FF, "org-7f3a")],
    ["on Windows, owned by the Administrators group", { secret: secret("administrators", COUNTING), orgId: "org-7f3a" }, label(COUNTING, "org-7f3a")],
    ["an organization id with every separator the pattern admits", { secret: secret("root", COUNTING), orgId: "Acme.eu:prod~2-x_y" }, label(COUNTING, "Acme.eu:prod~2-x_y")],
    ["an organization id of 128 characters", { secret: secret("root", COUNTING), orgId: `o${"a".repeat(127)}` }, label(COUNTING, `o${"a".repeat(127)}`)],
    ["a secret owned by an account: no label, never another key's", { secret: secret("other", COUNTING), orgId: "org-7f3a" }, { none: "secret-owner" }],
    ["31 bytes: no label", { secret: secret("root", COUNTING.slice(0, 62)), orgId: "org-7f3a" }, { none: "secret-size" }],
    ["33 bytes: no label", { secret: secret("root", `${COUNTING}20`), orgId: "org-7f3a" }, { none: "secret-size" }],
    ["an empty file: no label", { secret: secret("root", ""), orgId: "org-7f3a" }, { none: "secret-size" }],
    ["owned by an account and of the wrong size: the owner is named first", { secret: secret("other", "00"), orgId: "org-7f3a" }, { none: "secret-owner" }],
    ["an organization id of 129 characters", { secret: secret("root", COUNTING), orgId: `o${"a".repeat(128)}` }, FAULT],
    ["an organization id that is an address", { secret: secret("root", COUNTING), orgId: "ops@example.org" }, FAULT],
    ["an organization id that starts with a separator", { secret: secret("root", COUNTING), orgId: "-org" }, FAULT],
    ["an empty organization id", { secret: secret("root", COUNTING), orgId: "" }, FAULT],
    ["bytes not in lower-case hex", { secret: secret("root", COUNTING.toUpperCase()), orgId: "org-7f3a" }, FAULT],
    ["an odd number of hex digits", { secret: secret("root", `${COUNTING}0`), orgId: "org-7f3a" }, FAULT],
    ["a file far larger than a secret", { secret: secret("root", "00".repeat(1025)), orgId: "org-7f3a" }, FAULT],
    ["an owner this reference does not name", { secret: secret("wheel", COUNTING), orgId: "org-7f3a" }, FAULT],
    ["no secret", { orgId: "org-7f3a" }, FAULT],
    ["not an object", null, FAULT]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

/** The vectors as an object. */
export function hostLabelVectors(): Json {
  return {
    about: "Vectors for the host label (DEC-0154 item 4), written by tools/vectors/host-label.ts, never by hand. hostLabel(input): input is {secret: {owner, hex}, orgId}, owner root (uid 0), administrators (the Windows Administrators group) or other, hex the host secret file's bytes in lower-case hex, orgId the enrollment's org.id. The answer is {hostLabel}: HMAC-SHA-256 keyed with the 32-byte secret over the UTF-8 bytes of fabric-host-label/1 followed directly by orgId, its first 16 bytes in base64url without padding; or {none: secret-owner | secret-size}, the node sending no label; or {fault: input-invalid}.",
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
