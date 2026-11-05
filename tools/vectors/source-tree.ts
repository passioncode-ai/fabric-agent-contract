/**
 * The generator of the source-tree vectors (DEC-0149): `fixtures/vectors/source-tree.json`, shared by every tool that
 * checks an agent's source before an export (the adapter's check and `export`) and every port of
 * `src/source-rules.ts`.
 *
 *   tsx tools/vectors/source-tree.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/source-tree.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0149; nothing here imports `src/source-rules.ts` for an answer, so the gate checks that the reference
 * agrees. The `constants` block alone is written from its exports: it is what a port holds equal, not an answer. Every
 * value is neutral and synthetic; the credential-shaped ones are assembled here from parts, so no line of this file
 * is shaped like one.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";
// The one import from the reference: the constants a port holds equal (the `constants` block), never an expected answer.
import { CREDENTIAL_FILE, CREDENTIAL_FILE_OK, FOLD_UNICODE, KEY_SHAPE_SOURCES, NEUTRAL_HOMES, SOURCE_HOME_PATHS, SYNTHETIC, TOKEN_FILE, URL_SECRET_VALUE, foldSegment } from "../../src/source-rules.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/source-tree.json";

const PROVIDER_KEY = ["sk", "-", "A1".repeat(12)].join("");
const JWT = ["eyJ", "hbGciOiJFZERTQSJ9", ".", "eyJzdWIiOiJleGFtcGxlIn0", ".", "c2lnbmF0dXJl"].join("");
const LONG_RUN = "Ab1".repeat(14);
const SIGNATURE = `${"Ab1Cd2".repeat(14)}Ab`;
const PRIVATE_KEY = ["-----BEGIN ", "PRIVATE KEY-----"].join("");
const BEARER = ["Authorization: Bearer ", "abc123def456ghi789"].join("");
const PGP_KEY = ["-----BEGIN PGP ", "PRIVATE KEY BLOCK-----"].join("");
const AWS_EXAMPLE = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
const JWK_D = `${"Ab1Cd2".repeat(7)}E`;
const PASSWORD = ["Ab3dE5", "gH7k"].join("");
/** Random-looking runs with no synthetic word, for the parts of a line that must read as real. */
const RUN_24 = "A1b2C3d4".repeat(3);
const RUN_36 = "A1b2C3d4E5f6".repeat(3);

const manifest = {
  format: "fabric-source/1",
  include: ["src/", "docs/", "README.md", "LICENSE"],
  exclude: ["src/generated/"],
  binaries: ["docs/icon.png"],
  publicAddresses: ["support@inbox-digest.example"]
};
/** Files 0 to 3 of every case: a tree with nothing of its instance in it. */
const base = [
  { path: "LICENSE", text: "Licensed under the terms in this file." },
  { path: "README.md", text: "# Inbox digest\n\nSee [the guide](docs/guide.md)." },
  { path: "docs/guide.md", text: "# Guide\n\nBack to the [readme](../README.md)." },
  { path: "src/main.ts", text: "export const name = \"inbox-digest\";" }
];
const tree = (files: Json[], extra: Json = {}): Json => ({ manifest, files: [...base, ...files], ...extra });
/**
 * One line per form of a named home folder (DEC-0149 item 8, the adapter's `HOME_PATHS`), with the column (from 1) of
 * the name's first character, written by hand. The name `jdoe` is neutral in no list and is nobody's here.
 */
const HOMES = [
  "a = \"/Users/jdoe\"",
  "/home/jdoe",
  "/var/home/jdoe",
  "/c/Users/jdoe",
  "/mnt/c/Users/jdoe",
  "C:\\Users\\jdoe",
  "d:/users/jdoe",
  "{\"home\": \"C:\\\\Users\\\\jdoe\"}",
  " -Users-jdoe-inbox",
  "/x/-home-jdoe-inbox",
  "_-var-home-jdoe",
  "\"-mnt-c-Users-jdoe-x\"",
  "\"-c-Users-jdoe\"",
  "C--Users-jdoe-inbox",
  "?p=%2FUsers%2Fjdoe",
  "?p=%2Fhome%2Fjdoe",
  "?p=%5Cusers%5Cjdoe"
];
const HOME_COLUMNS = [13, 7, 11, 10, 14, 10, 10, 22, 9, 10, 12, 15, 11, 10, 15, 14, 15];
/** Lines that hold no named home folder: neutral and one-letter names, `~`, a web route, a flag, a folder with no name. */
const NEUTRAL = [
  "/Users/example/inbox",
  "/home/runner/work",
  "/Users/a",
  "cp agent.json ~/x",
  "cd ~",
  "GET /users/123",
  "--home-dir /tmp",
  "/Users/Example-Agent",
  "C:\\Users\\Public",
  "-Users-example-session",
  "ls /home/"
];

/** [name, input, expected problems]: each problem's kind, file index, line and column (from 1), entry or include index. */
const cases: Array<[string, Json, Json[]]> = [
  ["a clean tree", tree([]), []],
  ["the manifest is source whatever include says", tree([{ path: "fabric.source.json", text: "{\"format\": \"fabric-source/1\"}" }]), []],
  [
    "a named home folder in each form the adapter reads blocks, at the name's first character",
    tree([{ path: "src/homes.txt", text: HOMES.join("\n") }]),
    HOMES.map((line, at) => ({ kind: "home-path", file: 4, line: at + 1, column: HOME_COLUMNS[at] }))
  ],
  ["a named home folder in the dashed form a tool makes of it, in a file's path", tree([{ path: "src/-Users-jdoe-session.json", text: "{}" }]), [{ kind: "home-path", file: 4 }]],
  ["a neutral or one-letter home, ~, a web route and a flag are not home folders", tree([{ path: "src/neutral.txt", text: NEUTRAL.join("\n") }, { path: "src/-Users-example-session.json", text: "{}" }]), []],
  ["a provider key's shape", tree([{ path: "src/keys.ts", text: `const key = "${PROVIDER_KEY}";` }]), [{ kind: "credential", file: 4, line: 1, column: 14 }]],
  ["a JWT", tree([{ path: "src/token.ts", text: `export const sample = "${JWT}";` }]), [{ kind: "credential", file: 4, line: 1, column: 24 }]],
  ["a bearer token inside a header line", tree([{ path: "docs/call.md", text: `Send ${BEARER} with the call.` }]), [{ kind: "credential", file: 4, line: 1, column: 21 }]],
  ["a private key block", tree([{ path: "src/key.txt", text: `${PRIVATE_KEY}\nAAAA` }]), [{ kind: "credential", file: 4, line: 1, column: 1 }]],
  ["a long run under a credential's name", tree([{ path: "src/config.ts", text: `API_TOKEN = "${LONG_RUN}"` }]), [{ kind: "credential", file: 4, line: 1, column: 14 }]],
  ["a long run under another name (an integrity hash) is not a credential", tree([{ path: "src/lock.json", text: `{"integrity": "sha512-${LONG_RUN}"}` }]), []],
  ["a whole Ed25519 signature under sig is public", tree([{ path: "src/package.json", text: `{"sig": "${SIGNATURE}"}` }]), []],
  ["prose that starts with the word Bearer is not a credential", tree([{ path: "docs/auth.md", text: "Bearer tokens expire after an hour." }]), []],
  ["a word holding sk- is not a provider key", tree([{ path: "src/jobs.ts", text: "export const queue = \"task-processing-pipeline-v2\";" }]), []],
  ["a self-labelled synthetic value passes, and the same shape without the word blocks", tree([{ path: "src/keys.ts", text: `const a = "sk-test-not-a-key-0000000";\nconst b = "${PROVIDER_KEY}";` }]), [{ kind: "credential", file: 4, line: 2, column: 12 }]],
  [
    "a synthetic key's run never hides a real key that starts inside it",
    tree([{ path: "src/keys.ts", text: `a = "sk-${"A1b2".repeat(4)}_ghp_${RUN_36}_fake"\nb = "sk-fakefakefakefake1234_sk-${RUN_24}"` }]),
    [{ kind: "credential", file: 4, line: 1, column: 26 }, { kind: "credential", file: 4, line: 2, column: 30 }]
  ],
  [
    "a value shaped like a credential in a file's path",
    tree([{ path: `docs/sk-${RUN_24}.md`, text: "notes" }]),
    [{ kind: "credential", file: 4 }]
  ],
  [
    "a whole Ed25519 signature under a quoted sig member passes even with no closing quote; under another name (sigs) or unquoted it blocks",
    tree([{ path: "src/sig.txt", text: `"sig": "${SIGNATURE}\n"sigs": "${SIGNATURE}"\nsig = "${SIGNATURE}"` }]),
    [{ kind: "credential", file: 4, line: 2, column: 10 }, { kind: "credential", file: 4, line: 3, column: 8 }]
  ],
  [
    "a parameter holding :// after other text is a value, not a URL read again",
    tree([{ path: "docs/next.md", text: `https://a.example.org/?next=%20https%3A%2F%2Fb.example.org%2F%3Ftoken%3D${LONG_RUN}` }]),
    []
  ],
  [
    "lines split at LF with a trailing CR dropped: a lone CR does not end a line",
    tree([{ path: "src/cr.txt", text: "a\r\nb\r/home/jdoe\nc" }]),
    [{ kind: "home-path", file: 4, line: 2, column: 9 }]
  ],
  [
    "a key's prefix and the character before it are read without Unicode case folding: U+017F and the Kelvin sign are no s or k, a letter in any script before a key starts no word",
    tree([{ path: "src/folding.ts", text: `a = "\u017fk-${RUN_24}"\nb = "s\u212a-${RUN_24}"\nc = "\u00e9sk-${RUN_24}"\nd = "\u00b7sk-${RUN_24}"` }]),
    [{ kind: "credential", file: 4, line: 4, column: 7 }]
  ],
  [
    "a URL ends where Python's \\s ends it: U+FEFF continues it, U+001C cuts it",
    tree([{ path: "docs/urls.md", text: `https://app:${PASSWORD}\ufeff@db.example.internal/x\nhttps://app:Ab3d\u001cE5gH7k@db.example.internal/x` }]),
    [{ kind: "credential", file: 4, line: 1, column: 1 }, { kind: "email", file: 4, line: 2, column: 18 }]
  ],
  ["an escape that is not UTF-8 decodes to U+FFFD, as Python's unquote reads it", tree([{ path: "src/env.txt", text: `TOKEN=%FFaB3${"x".repeat(36)}` }]), []],
  [
    "a byte-order mark an escape decodes stays a character, as Python's unquote keeps it",
    tree([{ path: "src/bom.txt", text: "API_KEY=fa%EF%BB%BFkeAbcdefGhijk1234567890Abcdefghij1234567890\nAPI_KEY=Abcdefghij1234567890Klmnop%EF%BB%BFqrstuvwxyz0123456789ABCDEFG" }]),
    [{ kind: "credential", file: 4, line: 1, column: 9 }]
  ],
  ["a bearer word with a line separator in a URL's parameter is no bearer token", tree([{ path: "docs/q.md", text: "https://h.io/?q=bearer%20%E2%80%A8x" }]), []],
  ["a token or credential file's name may hold a line or paragraph separator, as Python's . reads it", tree([{ path: "src/a\u2028b.token", text: "x" }, { path: "src/a\u2029b.credential", text: "x" }]), [{ kind: "credential", file: 4 }, { kind: "credential", file: 5 }]],
  ["AWS's documented example key id is synthetic", tree([{ path: "docs/aws.md", text: `AWS_ACCESS_KEY_ID=${AWS_EXAMPLE}` }]), []],
  ["a bearer token that says it is an example passes", tree([{ path: "docs/call.md", text: "Authorization: Bearer example-token-123456" }]), []],
  ["a PGP private key block", tree([{ path: "src/key.asc", text: PGP_KEY }]), [{ kind: "credential", file: 4, line: 1, column: 1 }]],
  [
    "a JWK's private d in JSON, escaped JSON and a Python dict",
    tree([{ path: "src/jwk.json", text: `{"kty": "OKP", "crv": "Ed25519", "d": "${JWK_D}"}\n"{\\"d\\": \\"${JWK_D}\\"}"\nkey = {'d': '${JWK_D}'}` }]),
    [{ kind: "credential", file: 4, line: 1, column: 34 }, { kind: "credential", file: 4, line: 2, column: 3 }, { kind: "credential", file: 4, line: 3, column: 8 }]
  ],
  [
    "a URL with a password blocks and is no e-mail address",
    tree([{ path: "docs/db.md", text: `DATABASE_URL=postgres://app:${PASSWORD}@db.example.internal/app` }]),
    [{ kind: "credential", file: 4, line: 1, column: 14 }]
  ],
  [
    "a URL whose query holds a long value under a credential's name blocks; a placeholder and EXAMPLE pass",
    tree([{ path: "docs/api.md", text: `https://api.example.org/v1?token=<your-token>\nhttps://api.example.org/v1?token=EXAMPLE\nGET https://api.example.org/v1?token=${LONG_RUN}` }]),
    [{ kind: "credential", file: 4, line: 3, column: 5 }]
  ],
  [
    "a URL inside another URL's parameter is read too",
    tree([{ path: "docs/login.md", text: `https://app.example.org/login?next=https%3A%2F%2Fapi.example.org%2F%3Ftoken%3D${LONG_RUN}` }]),
    [{ kind: "credential", file: 4, line: 1, column: 1 }]
  ],
  [
    "a line read again with its JSON escapes undone",
    tree([{ path: "src/config.json", text: `{"url": "https:\\/\\/api.example.org\\/v1?token\\u003d${LONG_RUN}"}` }]),
    [{ kind: "credential", file: 4, line: 1, column: 10 }]
  ],
  [
    "a URL parameter holding a provider key right after a letter blocks: the URL rule reads the key shapes unbounded",
    tree([{ path: "docs/search.md", text: `https://api.example.org/find?q=x${PROVIDER_KEY}` }]),
    [{ kind: "credential", file: 4, line: 1, column: 1 }]
  ],
  [
    "each provider-key shape one short of its least length passes, and at it blocks",
    tree([
      ["sk-", 16],
      ["ghp_", 20],
      ["xoxb-", 10],
      ["AKIA", 16],
      ["glpat-", 20]
    ].map(([prefix, least], index) => ({ path: `src/k${index}.txt`, text: `value ${prefix}${"A1".repeat(10).slice(0, (least as number) - 1)}\nvalue ${prefix}${"A1".repeat(10).slice(0, least as number)}` }))),
    [0, 1, 2, 3, 4].map((index) => ({ kind: "credential", file: 4 + index, line: 2, column: 7 }))
  ],
  [
    "a symbolic link whose target climbs above the root or is absolute is link-outside; one to a source file passes",
    tree([{ path: "src/up.txt", text: "../../outside.txt", link: true }, { path: "src/abs.txt", text: "/srv/data.txt", link: true }, { path: "src/in.txt", text: "../README.md", link: true }]),
    [{ kind: "link-outside", file: 4, line: 1, column: 1 }, { kind: "link-outside", file: 5, line: 1, column: 1 }]
  ],
  [
    "a symbolic link's target is read on line 1 in the table's order: a home path, then link-outside",
    // No segment after the name, so the repository's own privacy check reads no home path with a file in it.
    tree([{ path: "src/data", text: ["/Us", "ers/jdoe"].join(""), link: true }]),
    [{ kind: "home-path", file: 4, line: 1, column: 8 }, { kind: "link-outside", file: 4, line: 1, column: 1 }]
  ],
  [
    "a Markdown-named link whose target holds a Markdown link outside is one link-outside",
    tree([{ path: "src/notes.md", text: "](../../../y)", link: true }]),
    [{ kind: "link-outside", file: 4, line: 1, column: 1 }]
  ],
  [
    "a link's target is resolved literally: # is a path character, so #/../../../x climbs above the root; . and // stay inside",
    tree([{ path: "src/#/f.txt", text: "x" }, { path: "src/l", text: "#/../../../x", link: true }, { path: "src/n", text: ".//../README.md", link: true }, { path: "src/q", text: "?/../../../x", link: true }, { path: "src/p", text: "%2e%2e/%2e%2e/x", link: true }]),
    [{ kind: "link-outside", file: 5, line: 1, column: 1 }, { kind: "link-outside", file: 7, line: 1, column: 1 }]
  ],
  [
    "a LICENSE that is a symbolic link is no licence",
    { manifest, files: [...base.filter((file) => file.path !== "LICENSE"), { path: "LICENSE", text: "README.md", link: true }] },
    [{ kind: "no-license" }]
  ],
  ["files that are credentials by their name", tree([{ path: "src/.env", text: "MAILBOX=inbox" }, { path: "src/.env.example", text: "MAILBOX=" }, { path: "src/certs/agent.pem", text: "certificate" }, { path: "src/service.token", text: "x" }]), [{ kind: "credential", file: 4 }, { kind: "credential", file: 6 }, { kind: "credential", file: 7 }]],
  [
    "a nested repository in the source blocks; one an exclude path names, or one outside include, is left out",
    {
      manifest: { ...manifest, exclude: ["src/generated/", "src/vendor/other/"] },
      files: [...base, { path: "src/vendor/lib", nestedRepository: true }, { path: "src/vendor/other", nestedRepository: true }, { path: "tests/sub", nestedRepository: true }]
    },
    [{ kind: "nested-repository", file: 4 }]
  ],
  [
    "a .gitmodules file is ordinary text",
    { manifest: { ...manifest, include: [...manifest.include, ".gitmodules"] }, files: [...base, { path: ".gitmodules", text: "[submodule \"lib\"]\n\tpath = src/vendor/lib\n\turl = https://git.example.org/lib.git" }] },
    []
  ],
  ["a binary file binaries lists, and one it does not", tree([{ path: "docs/icon.png", binary: true }, { path: "docs/diagram.png", binary: true }]), [{ kind: "binary", file: 5 }]],
  [
    "an instance string as written, in upper case, percent-encoded and JSON-escaped",
    tree([
      { path: "docs/team.md", text: "Run by example holding." },
      { path: "docs/board.md", text: "BOARD: EXAMPLE HOLDING" },
      { path: "src/links.ts", text: "export const board = \"https://board.example/p/Example%20Holding\";" },
      { path: "src/folders.json", text: "{\"root\": \"example-team\\\\board\"}" }
    ], { instanceStrings: ["example holding", "example-team\\board"] }),
    [
      { kind: "instance-string", file: 4, line: 1, column: 8, entry: 0 },
      { kind: "instance-string", file: 5, line: 1, column: 8, entry: 0 },
      { kind: "instance-string", file: 6, line: 1, column: 47, entry: 0 },
      { kind: "instance-string", file: 7, line: 1, column: 11, entry: 1 }
    ]
  ],
  [
    "an instance string in NFC, with \\/ for /, and form-encoded with + for a space",
    tree([
      { path: "docs/cafe.md", text: "Run by cafe\u0301 holding." },
      { path: "docs/team.json", text: "{\"team\": \"example\\/holding\"}" },
      { path: "docs/search.md", text: "?q=north+yard" }
    ], { instanceStrings: ["caf\u00e9 holding", "example/holding", "north yard"] }),
    [
      { kind: "instance-string", file: 4, line: 1, column: 8, entry: 0 },
      { kind: "instance-string", file: 5, line: 1, column: 11, entry: 1 },
      { kind: "instance-string", file: 6, line: 1, column: 4, entry: 2 }
    ]
  ],
  [
    "a licence naming a holder on the operator's list blocks, unless unchecked",
    { manifest, files: [{ path: "LICENSE", text: "Copyright Example Holding" }, ...base.slice(1)], instanceStrings: ["example holding"] },
    [{ kind: "instance-string", file: 0, line: 1, column: 11, entry: 0 }]
  ],
  [
    "an unchecked licence travels and is not read",
    { manifest: { ...manifest, unchecked: [{ path: "LICENSE", reason: "the copyright line names the holder" }] }, files: [{ path: "LICENSE", text: "Copyright Example Holding" }, ...base.slice(1)], instanceStrings: ["example holding"] },
    []
  ],
  [
    "an unchecked folder's file holding a provider key is not read, and a credential file by its name in it still blocks",
    {
      manifest: { ...manifest, unchecked: [{ path: "src/vectors/", reason: "synthetic test vectors" }] },
      files: [...base, { path: "src/vectors/keys.json", text: `{"key": "${PROVIDER_KEY}"}` }, { path: "src/vectors/.env", text: "MAILBOX=inbox" }]
    },
    [{ kind: "credential", file: 5 }]
  ],
  ["an instance string in a file's path", tree([{ path: "docs/example-holding/notes.md", text: "notes" }], { instanceStrings: ["example-holding"] }), [{ kind: "instance-string", file: 4, entry: 0 }]],
  ["an instance string shorter than 3 characters is refused as input", tree([], { instanceStrings: ["ex", "example holding"] }), [{ kind: "short-instance-string", entry: 0 }]],
  ["an instance string that is not well formed (a lone surrogate) is refused as input", tree([], { instanceStrings: ["holding\ud800", "example holding"] }), [{ kind: "short-instance-string", entry: 0 }]],
  ["an excluded file holding a credential is not read", tree([{ path: "src/generated/keys.ts", text: `const key = "${PROVIDER_KEY}";` }]), []],
  ["a file outside include is not read", tree([{ path: "tests/recorded/run.log", text: "/Users/jdoe" }]), []],
  ["a file in .git is never source", tree([{ path: "src/.git/config", text: "/Users/jdoe" }]), []],
  ["an include path with no file", { manifest, files: base.filter((file) => file.path !== "README.md") }, [{ kind: "missing", include: 2 }]],
  [
    "an include path outside the path grammar reaches nothing: a nested repository it would lie in is not in the source",
    { manifest: { format: "fabric-source/1", include: ["lib/a/a\\b", "LICENSE"] }, files: [{ path: "LICENSE", text: "terms" }, { path: "lib", nestedRepository: true }] },
    [{ kind: "missing", include: 0 }]
  ],
  [
    "a file whose own path is outside the path grammar under an include folder is not source and is never read",
    { manifest: { format: "fabric-source/1", include: ["src/", "LICENSE"] }, files: [{ path: "LICENSE", text: "terms" }, { path: "src/a.ts", text: "x" }, { path: "src/a:b", text: "/home/jdoe" }] },
    []
  ],
  [
    "an exclude path outside the path grammar removes nothing: the file it would name stays source",
    { manifest: { format: "fabric-source/1", include: ["src/", "LICENSE"], exclude: ["src/a\\"] }, files: [{ path: "LICENSE", text: "terms" }, { path: "src/a", text: "/home/jdoe" }] },
    [{ kind: "home-path", file: 1, line: 1, column: 7 }]
  ],
  ["a manifest with no include", { manifest: { format: "fabric-source/1" }, files: base }, [{ kind: "no-include" }, { kind: "no-license" }]],
  [
    "e-mail addresses: one not listed warns; a listed one, RFC 2606 names, an image's name and an SSH remote pass",
    tree([{ path: "docs/contact.md", text: "Write to support@inbox-digest.example or someone@mail.org.\nTry a@example.com, b@host.test or c@sub.example.net.\nAn asset user@2x.png and a remote git@github.com:o/r." }]),
    [{ kind: "email", file: 4, line: 1, column: 42 }]
  ],
  [
    "relative links: one leaving the source warns; a URL, an anchor and a link inside pass",
    tree([{ path: "docs/notes.md", text: "See [run](../tests/recorded/run.md), [site](https://inbox-digest.example), [top](#top) and [main](../src/main.ts).\n[up](../../outside.md)" }]),
    [{ kind: "link-outside", file: 4, line: 1, column: 9 }, { kind: "link-outside", file: 4, line: 2, column: 4 }]
  ],
  ["a link outside the source in a file that is not Markdown is not followed", tree([{ path: "src/doc.ts", text: "// see [run](../tests/recorded/run.md)" }]), []],
  ["no licence file at the root", { manifest: { ...manifest, include: ["src/", "docs/", "README.md"] }, files: base.filter((file) => file.path !== "LICENSE") }, [{ kind: "no-license" }]],
  ["a licence file in another letter case and with an extension", { manifest: { ...manifest, include: ["src/", "docs/", "README.md", "License.md"] }, files: [{ path: "License.md", text: "terms" }, ...base.slice(1)] }, []],
  ["an include path in NFC names a file read in NFD, so it is not missing", { manifest: { ...manifest, include: ["src/", "docs/", "README.md", "LICENSE", "caf\u00e9.md"] }, files: [...base, { path: "cafe\u0301.md", text: "menu" }] }, []],
  ["an exclude entry that names nothing the tree lists is said, read folded", { ...tree([]), listed: ["src/main.ts", "src/GENERATED/keys.ts"], manifest: { ...manifest, exclude: ["src/generated/", "src/cache/"] } }, [{ kind: "unused-exclude", exclude: 1 }]],
  ["an excluded folder in another letter case is not read, and is said with the entry that names it", tree([{ path: "src/Generated/x.ts", binary: true }]), [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["a file under the capital sharp s is never read under an exclude spelt with ss", { ...tree([{ path: "src/PA\u1e9eWORDS/notes.md", text: "kept out" }]), manifest: { ...manifest, exclude: ["src/passwords/"] } }, [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["a file spelt with ss is never read under an exclude spelt with the capital sharp s", { ...tree([{ path: "src/passwords/notes.md", text: "kept out" }]), manifest: { ...manifest, exclude: ["src/PA\u1e9eWORDS/"] } }, [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["an entry without / names a file, a link or a nested repository, never a plain folder the tree lists with /", { ...tree([]), listed: ["src/gen/", "src/sub", "src/cache/"], manifest: { ...manifest, exclude: ["src/gen", "src/sub", "src/cache/"] } }, [{ kind: "unused-exclude", exclude: 0 }]],
  ["an exclude entry an excluded-by-fold line names is never called unused", { ...tree([{ path: "src/Generated/x.ts", text: "x" }]), listed: [] }, [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["a file under a letter with ypogegrammeni and perispomeni is never read under an exclude spelt precomposed", { ...tree([{ path: "src/\u1fbc\u0342/notes.md", text: "kept out" }]), manifest: { ...manifest, exclude: ["src/\u1fb7/"] } }, [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["a file the exclude names only in another letter case is never read", tree([{ path: "src/GENERATED/x.ts", text: "export const generated = true;" }]), [{ kind: "excluded-by-fold", file: 4, exclude: 0 }]],
  ["a .git folder in another letter case or with a trailing space is not read", tree([{ path: "src/.GIT/config", binary: true }, { path: "src/.git /config", binary: true }]), []]
];

/**
 * Segments and what foldSegment makes of them, for a port to hold its fold equal: the case pairs a port is most likely
 * to read differently (the sharp s both ways, the long s, the Kelvin and Angstrom signs, the sigmas, the dotted and
 * dotless i, a ligature, a decomposed accent), with an ignorable code point and the NTFS trailing dots and spaces.
 */
const FOLD_INPUTS = ["PA\u1e9eWORDS", "pa\u00dfwords", "PASSWORDS", "\u017fecrets", "\u212aeys", "\u212b", "\u00c5", "\u03a3x", "\u03c2x", "x\u03a3", "\u0130d", "\u0131d", "\ufb00ile", "cafe\u0301", "CAF\u00c9", "pri\u200cvate", "private. .", "PRIVAT~1.MD", "\u1fbc\u0342", "\u1fb7", "\u0391\u0342\u0345", "\u1fcc\u0342", "\u1fc7", "\u1ffc\u0342", "\u1ff7", "cafe\u200c\u0301"];
const unicodeExclude = { format: "fabric-source/1", include: ["app/"], exclude: ["app/secrets/", "app/keys/", "app/strasse/", "app/\u03c3x/", "app/caf\u00e9/", "app/\u00e5/", "app/private/"] };
/** patchPathsAllowed(manifest, paths): the paths that are not source; a patch applies only when it is empty. */
const patches: Array<[string, string[], string[], Json?]> = [
  ["every path is source", ["src/main.ts", "docs/guide.md", "README.md"], []],
  ["a patch to the manifest itself, in any spelling, is held for the owner's word", ["fabric.source.json", "FABRIC.SOURCE.JSON", "src/main.ts"], ["fabric.source.json", "FABRIC.SOURCE.JSON"]],
  ["an excluded path, a path outside include and a path in .git", ["src/main.ts", "src/generated/keys.ts", "tests/run.ts", ".git/config"], ["src/generated/keys.ts", "tests/run.ts", ".git/config"]],
  ["a path that climbs out, an absolute path and a folder", ["src/../../etc/hosts", "/srv/agent/src/main.ts", "src/"], ["src/../../etc/hosts", "/srv/agent/src/main.ts", "src/"]],
  [".git in another letter case, with a trailing dot and as the NTFS short name", [".GIT/hooks/x", "src/.git./config", "src/GIT~1/config", "src/.github/workflow.yml"], [".GIT/hooks/x", "src/.git./config", "src/GIT~1/config"]],
  ["an excluded folder in another letter case", ["src/GENERATED/keys.ts", "src/Generated/x.ts", "src/main.ts"], ["src/GENERATED/keys.ts", "src/Generated/x.ts"]],
  ["an excluded folder under the fold's case mappings (long s, the Kelvin sign, sharp s, sigma, NFC, the Angstrom sign), with an ignorable code point, a trailing dot or space, or as a short name", ["app/\u017fecrets/x", "app/\u212aeys/k", "app/stra\u00dfe/x", "app/\u03a3x/f", "app/\u03c2x/f", "app/CAF\u00c9/x", "app/\u212b/x", "app/pri\u200cvate/x", "app/private./x", "app/private /x", "app/PRIVAT~1/x", "app/main.ts"], ["app/\u017fecrets/x", "app/\u212aeys/k", "app/stra\u00dfe/x", "app/\u03a3x/f", "app/\u03c2x/f", "app/CAF\u00c9/x", "app/\u212b/x", "app/pri\u200cvate/x", "app/private./x", "app/private /x", "app/PRIVAT~1/x"], unicodeExclude],
  ["the capital sharp s meets ss and the sharp s, both ways", ["app/PA\u1e9eWORDS/token.txt", "app/pa\u00dfwords/x", "app/main.ts"], ["app/PA\u1e9eWORDS/token.txt", "app/pa\u00dfwords/x"], { format: "fabric-source/1", include: ["app/"], exclude: ["app/passwords/"] }],
  ["an exclude entry with the capital sharp s names ss and the sharp s", ["app/passwords/x", "app/pa\u00dfwords/y", "app/main.ts"], ["app/passwords/x", "app/pa\u00dfwords/y"], { format: "fabric-source/1", include: ["app/"], exclude: ["app/PA\u1e9eWORDS/"] }],
  ["a letter carrying ypogegrammeni and another mark meets its precomposed form (canonical caseless matching)", ["app/\u1fbc\u0342/token.txt", "app/\u0391\u0342\u0345/x", "app/\u1fb7/y", "app/main.ts"], ["app/\u1fbc\u0342/token.txt", "app/\u0391\u0342\u0345/x", "app/\u1fb7/y"], { format: "fabric-source/1", include: ["app/"], exclude: ["app/\u1fb7/"] }],
  ["the eta and omega forms with ypogegrammeni and perispomeni meet", ["app/\u1fcc\u0342/x", "app/\u1ffc\u0342/y", "app/main.ts"], ["app/\u1fcc\u0342/x", "app/\u1ffc\u0342/y"], { format: "fabric-source/1", include: ["app/"], exclude: ["app/\u1fc3\u0342/", "app/\u1ff3\u0342/"] }],
  ["an ignorable code point between a letter and its mark is removed before NFD, so the mark joins the letter", ["app/cafe\u200c\u0301/x", "app/main.ts"], ["app/cafe\u200c\u0301/x"], unicodeExclude],
  ["a short name with an extension, as a file or a folder", ["app/PRIVAT~1.MD", "app/SECRET~1.D/x", "app/CREDEN~1.JSO", "app/main~x.ts"], ["app/PRIVAT~1.MD", "app/SECRET~1.D/x", "app/CREDEN~1.JSO"], unicodeExclude],
  ["an exclude entry with the Kelvin sign names its ASCII spelling", ["app/kit/x", "app/kite/x"], ["app/kit/x"], { format: "fabric-source/1", include: ["app/"], exclude: ["app/\u212ait/"] }],
  ["an excluded folder with an ignorable code point, a trailing dot or space, or as a short name", ["src/gen\u200cerated/x", "src/generated./x", "src/generated /x", "src/GENERA~1/x", "src/main.ts"], ["src/gen\u200cerated/x", "src/generated./x", "src/generated /x", "src/GENERA~1/x"]],
  ["a path in NFD under an include path in NFC", ["docs/cafe\u0301.md"], []]
];

export function sourceTreeVectors(): Json {
  return {
    about: "Vectors for an agent's source tree (DEC-0149), written by tools/vectors/source-tree.ts, never by hand. `tree`: sourceTreeProblems({manifest, files, instanceStrings?, listed?}) answers each place the instance shows through as {kind, file?, line?, column?, entry?, include?, exclude?} (a file marked nestedRepository: true is a folder holding another repository, a submodule's gitlink or its own .git, read by its path only; a file marked link: true is a symbolic link whose text is its target, link-outside when that target is absolute, climbs above the root or is no source path, and never a licence): file is the index in files; a finding in a file's path has no line; line and column count from 1, the column in UTF-16 code units where the match begins (for a home path, where its name begins). Blocking kinds (FAC-SEM-158): home-path (a home folder with a name, in the forms and with the neutral names of the Fabric Agent Adapter's check; ~ never), credential (a value shaped like one, or a file that is one by its name), binary (not listed in binaries), nested-repository (a nested repository no exclude path names), instance-string (an entry of the operator's list, without regard to case under Unicode simple case folding, the entry and the text each also in NFC: as written, percent-encoded, form-encoded with + for a space, JSON-escaped, JSON-escaped with \\/ for /, or JSON-escaped with every character outside ASCII as \\uXXXX), missing (an include path with no file), short-instance-string, no-include. Warnings (FAC-SEM-159): email (not in publicAddresses, not at an RFC 2606 name), link-outside (a relative Markdown link, or a symbolic link, whose target is not source; a link's target is read literally), no-license, excluded-by-fold (a file an exclude entry names only once folded: never read), unused-exclude (an exclude entry naming nothing listed). Problems come in the order: the list's refused entries, then no-include, then each file in order (its path, then each line: home-path, credential, instance-string, email, link-outside), then excluded-by-fold (a file an exclude entry names only once both are folded: never read, said by its index and the entry's), then missing, then unused-exclude (only when the input carries listed, the paths the tree holds that an exclude entry can name: a file, a symbolic link, a nested repository, and a folder with a trailing /; an exclude entry, read folded, that names none of them), then no-license. A file that is not source (outside include, inside exclude, in .git) is not read; a .git segment is read as Git's is_hfs_dotgit and is_ntfs_dotgit read it (ASCII case folded, the code points HFS+ ignores removed, trailing dots and spaces dropped, or GIT~1), and paths are compared in Unicode NFC. `patches`: patchPathsAllowed(manifest, paths) answers the paths that are not source, in the order given, and also a path an exclude entry names once both are folded per segment (HFS+ ignorable code points removed first, then NFD, lower, upper and lower case, NFC, trailing dots and spaces dropped), a segment shaped like an 8.3 short name when any exclude entry exists, and the manifest itself in any spelling; the manifest is the receiver's current one. Exclude entries are read folded the same way everywhere. The fold is the runtime's case mappings (Node's ICU at the Unicode version constants.FOLD_UNICODE names): canonical caseless matching (NFD before the case mappings): NFD, then lower, upper and lower case, then NFC, which also joins the dotless i with i and I (Unicode's case folding keeps them apart; the join refuses more); constants.FOLD_PAIRS holds segments and their folds. A segment with ~ followed by a digit is refused in a patch when any exclude entry exists. An exclude entry an excluded-by-fold line names is never unused-exclude.",
    constants: {
      about: "The constants a port of the tree check holds equal to the reference's, written from src/source-rules.ts's exports (test/source-rules.test.ts holds the block to them): the neutral home names, the synthetic words, the home-folder patterns, the credential-file name patterns, the tree check's own provider-key shapes (KEY_SHAPE_SOURCES, unbounded, kept apart from the shared detector) and the URL rule's pattern (URL_SECRET_VALUE), each pattern as its source and flags.",
      NEUTRAL_HOMES: [...NEUTRAL_HOMES],
      SYNTHETIC: [...SYNTHETIC],
      SOURCE_HOME_PATHS: SOURCE_HOME_PATHS.map((pattern) => ({ source: pattern.source, flags: pattern.flags })),
      CREDENTIAL_FILE: { source: CREDENTIAL_FILE.source, flags: CREDENTIAL_FILE.flags },
      CREDENTIAL_FILE_OK: { source: CREDENTIAL_FILE_OK.source, flags: CREDENTIAL_FILE_OK.flags },
      TOKEN_FILE: { source: TOKEN_FILE.source, flags: TOKEN_FILE.flags },
      KEY_SHAPE_SOURCES: [...KEY_SHAPE_SOURCES],
      URL_SECRET_VALUE: { source: URL_SECRET_VALUE.source, flags: URL_SECRET_VALUE.flags },
      FOLD_UNICODE,
      FOLD_PAIRS: FOLD_INPUTS.map((input) => [input, foldSegment(input)])
    },
    manifest,
    tree: cases.map(([name, input, expected]) => ({ name, input, expected })),
    patches: patches.map(([name, paths, expected, own]) => ({ name, input: { manifest: own ?? manifest, paths }, expected }))
  };
}

export function buildSourceTreeVectors(): string {
  return `${JSON.stringify(sourceTreeVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildSourceTreeVectors();
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
