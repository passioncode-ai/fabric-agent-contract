import { type Finding, type JsonObject, indexed, isObject, show } from "./findings.js";
import { BEARER_INSIDE, credentialName, hasJwt, jwtSpans, rawValues, secretValue } from "./secret-shape.js";

// #region source-rules (docs: docs/specification/source.md#semantic-rules)
/**
 * `fabric-source/1` (DEC-0149): an agent's source, as `fabric.source.json` at the root of its source repository, kept
 * apart from its instance (the records, logs, keys, names and paths of one installation). The manifest names the paths
 * that are source (default deny), the binary files and e-mail addresses the source may carry, and the slots an
 * installation fills, never a value. The tree check reads the files the caller restricted to the source and reports
 * each place the instance shows through, by path, line, column and kind, never by the text it found.
 */
const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);
const strings = (value: unknown): Array<[string, number]> =>
  Array.isArray(value) ? value.flatMap((item, index): Array<[string, number]> => (typeof item === "string" ? [[item, index]] : [])) : [];

/** The file that carries the manifest; it travels with the source whatever `include` says. */
export const SOURCE_FILE = "fabric.source.json";
/** The manifest's format. */
export const SOURCE_FORMAT = "fabric-source/1";
/** The kinds of slot an installation fills (DEC-0149 item 6). */
export const SLOT_KINDS: readonly string[] = ["secret", "config", "store", "endpoint"];
/** A file path: the package's path grammar (`fabric-package.schema.json#/$defs/path`), as `#/$defs/file` repeats it. */
export const SOURCE_FILE_PATH = /^(?![/~])(?![\s\S]*\\)(?![\s\S]*\/\/)(?!(?:[\s\S]*\/)?\.{1,2}(?:\/|$))[^\u0000-\u001f:]{1,256}(?<!\/)$/u;
/** A path of `include` or `exclude`: a file, or with a trailing `/` a folder and everything under it (`#/$defs/path`). */
export const SOURCE_PATH = /^(?![/~])(?![\s\S]*\\)(?![\s\S]*\/\/)(?!(?:[\s\S]*\/)?\.{1,2}(?:\/|$))[^\u0000-\u001f:]{1,256}$/u;

/**
 * Code points HFS+ ignores in a name (Git's `is_hfs_dotgit`): the zero-width joiners and marks, the bidirectional
 * embeddings and overrides, the deprecated format characters and the byte-order mark.
 */
const HFS_IGNORABLE = /[\u200c-\u200f\u202a-\u202e\u206a-\u206f\ufeff]/gu;
/** ASCII case folding only, as Git's `strncasecmp` and a case-insensitive file system's ASCII names read it. */
export const asciiFold = (text: string): string => text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
/**
 * Whether one path segment names the repository's `.git` on some file system, as Git's `is_hfs_dotgit` and
 * `is_ntfs_dotgit` read it: `.git` under ASCII case folding, with the code points HFS+ ignores removed and any run of
 * trailing dots or spaces dropped (NTFS drops them), or the NTFS short name `git~1` read the same way.
 */
export const isDotGitSegment = (segment: string): boolean => {
  const name = asciiFold(segment.replace(HFS_IGNORABLE, "")).replace(/[ .]+$/u, "");
  return name === ".git" || name === "git~1";
};
/**
 * A path with a `.git` segment is never source, whatever the lists say: the repository's history is not its source.
 * A segment that a case-insensitive or a Windows file system resolves to `.git` counts (`isDotGitSegment`).
 */
const inGit = (path: string): boolean => path.split("/").some(isDotGitSegment);
/**
 * A path compared in Unicode NFC: Git on macOS lists names in NFC and a walk reads them as stored (often NFD), so the
 * manifest's entries and every path asked about are normalised before they are compared; reads and messages keep the
 * name as stored.
 */
const nfc = (path: string): string => path.normalize("NFC");
/**
 * One path segment as a case-insensitive file system may resolve it, for `exclude` and a patch's paths: canonical
 * caseless matching. The code points HFS+ ignores removed, NFD (so the case mappings meet a letter apart from its
 * marks: `ᾼ͂` and `ᾷ` meet, which APFS joins), then lower case, upper case and lower case again (so `ß`, `ẞ` and `ss`,
 * `ſ` and `s`, the Kelvin sign and `k`, the Angstrom sign and `å`, the final sigma and `σ` meet: lower case first brings
 * the capital sharp s to `ß`, which upper case then spells `SS`), NFC, then Georgian Nuskhuri U+2D00 to U+2D25 mapped
 * onto Mkhedruli U+10D0 to U+10F5 (HFS+ joins Asomtavruli U+10A0 to U+10C5, which lower case makes Nuskhuri, with
 * Mkhedruli), then any trailing run of dots and spaces dropped (NTFS). The case mappings are the runtime's (Node's ICU; Unicode 17.0 when this was written, `FOLD_UNICODE`); the
 * fold is idempotent and keeps every pair of the case mappings together, and it folds more than APFS does in places
 * (`ı` and `i`), which refuses more: the safe side.
 */
export const foldSegment = (segment: string): string =>
  segment.replace(HFS_IGNORABLE, "").normalize("NFD").toLowerCase().toUpperCase().toLowerCase().normalize("NFC")
    .replace(NUSKHURI, (letter) => String.fromCharCode(letter.charCodeAt(0) - 0x2d00 + 0x10d0)).replace(/[ .]+$/u, "");
/** Georgian Nuskhuri U+2D00 to U+2D25, which the fold maps onto Mkhedruli U+10D0 to U+10F5 as HFS+ joins them. */
const NUSKHURI = /[\u2d00-\u2d25]/gu;
/** The Unicode version whose case mappings the fold and the vectors were written with (Node's ICU). */
export const FOLD_UNICODE = "17.0";
/** A path folded segment by segment (`foldSegment`); a folder's trailing `/` is kept. */
export const foldPath = (path: string): string => path.split("/").map(foldSegment).join("/");
/**
 * A list of `exclude` paths indexed in their folded form: an entry in the path grammar as written, folded only then, so
 * an entry the fold shortens (`a/.../`) still removes what it names. Looked up with `foldedCovers`.
 */
const foldedList = (value: unknown): PathList => {
  const entries = strings(value).map(([entry]) => nfc(entry)).filter((entry) => SOURCE_PATH.test(entry)).map(foldPath);
  return { files: new Set(entries.filter((entry) => !entry.endsWith("/"))), folders: new Set(entries.filter((entry) => entry.endsWith("/"))), reaches: new Set() };
};

/** Every prefix of a path that ends in `/`: the folders it lies in, the path itself when it is a folder. */
const folderPrefixes = (path: string): string[] => {
  const prefixes: string[] = [];
  for (let at = path.indexOf("/"); at >= 0; at = path.indexOf("/", at + 1)) prefixes.push(path.slice(0, at + 1));
  return prefixes;
};
/**
 * A list of paths, indexed so a path is looked up rather than compared with every entry: its files exactly, its folders
 * (entries ending in `/`) by each folder the path lies in, and every folder an entry lies in or is (`reaches`).
 */
interface PathList { files: Set<string>; folders: Set<string>; reaches: Set<string> }
/**
 * Only entries in the path grammar (at most 256 code points) are indexed: an entry outside it (longer, or with a `\`,
 * a `//`, a `:`) can neither equal nor be a folder of a path in the grammar, so it names, reaches and removes nothing,
 * and indexing a long one's prefixes would cost the square of its length. `reaches` is built only when asked (for
 * `include`).
 */
const pathList = (value: unknown, withReaches = false): PathList => {
  const entries = strings(value).map(([entry]) => nfc(entry)).filter((entry) => SOURCE_PATH.test(entry));
  return {
    files: new Set(entries.filter((entry) => !entry.endsWith("/"))),
    folders: new Set(entries.filter((entry) => entry.endsWith("/"))),
    reaches: new Set(withReaches ? entries.flatMap(folderPrefixes) : [])
  };
};
/** Whether a list names a path: the file itself, or a folder it lies in (`covers` for each entry, by lookup). */
// 256 code points are at most 512 UTF-16 units: a longer string is outside the grammar, which counts code points.
const coversNfc = (list: PathList, path: string): boolean =>
  list.files.has(path) || folderPrefixes(path).some((folder) => list.folders.has(folder));
const listCovers = (list: PathList, written: string): boolean => written.length <= 512 && coversNfc(list, nfc(written));
/**
 * Whether an exclude list names a path: the file itself, a folder it lies in, or a file entry it lies beneath (an
 * exclude entry without `/` also leaves out everything under that name: a nested repository's files, or anything
 * placed there later).
 */
const excludeCoversNfc = (list: PathList, path: string): boolean =>
  list.files.has(path) || folderPrefixes(path).some((folder) => list.folders.has(folder) || list.files.has(folder.slice(0, -1)));
/** Whether a folded exclude list (`foldedList`) names a path: the path folded the same way, then looked up. */
const foldedCovers = (list: PathList, written: string): boolean => written.length <= 512 && excludeCoversNfc(list, foldPath(nfc(written)));

/**
 * The include paths as a walk asks about them, indexed once: whether one names a path, and whether one reaches into a
 * folder (names it, with or without its trailing `/`, or something in it) or covers it. `folderPath` ends in `/`.
 */
export interface IncludeIndex { covers(path: string): boolean; reaches(folderPath: string): boolean }
const reachesNfc = (list: PathList, folderPath: string): boolean =>
  SOURCE_PATH.test(folderPath.slice(0, -1)) && (list.reaches.has(folderPath) || list.files.has(folderPath.slice(0, -1)) || folderPrefixes(folderPath).some((folder) => list.folders.has(folder)));
export function includeIndex(includes: readonly string[]): IncludeIndex {
  const list = pathList(includes, true);
  // A queried path outside the grammar is no source and no folder of one, whatever its length.
  return {
    covers: (path) => path.length <= 512 && SOURCE_FILE_PATH.test(path) && listCovers(list, path),
    reaches: (written) => written.length <= 513 && reachesNfc(list, nfc(written))
  };
}

/**
 * Whether a path is source under a manifest, as a predicate built once for many paths: a path in the package's
 * grammar, with no `.git` segment, that is the manifest itself or lies inside an `include` path and inside no
 * `exclude` path.
 */
export function sourcePathTest(manifest: unknown): (path: unknown) => boolean {
  const source = isObject(manifest) ? manifest : {};
  const include = pathList(source.include);
  // `exclude` is read folded (`foldSegment`): on a case-insensitive file system `src/Secrets/` is `src/secrets/`, so
  // what an exclude entry names under any spelling stays out (it fails closed); `include` is read as written.
  const exclude = foldedList(source.exclude);
  return (path) => {
    // A path is in the grammar as written and in NFC: one NFC lengthens past 256 code points is no source.
    if (typeof path !== "string" || !SOURCE_FILE_PATH.test(path) || !SOURCE_FILE_PATH.test(nfc(path)) || inGit(path)) return false;
    if (nfc(path) === SOURCE_FILE) return true;
    return listCovers(include, path) && !foldedCovers(exclude, path);
  };
}

/**
 * Whether a path is left out only because `exclude` is read folded: in the grammar, not in `.git`, inside an `include`
 * path, named by no `exclude` entry as written, yet named by one once both are folded. The answer is the index of the
 * first such entry, or -1. Such a file is not source (it fails closed) and the tree check says so (`excluded-by-fold`),
 * so the author sees both spellings.
 */
export function foldOnlyExcludeTest(manifest: unknown): (path: unknown) => number {
  const source = isObject(manifest) ? manifest : {};
  const include = pathList(source.include);
  const literal = pathList(source.exclude);
  // Each folded entry to the first index that writes it, so the entry naming a path is looked up, never searched for.
  const first = new Map<string, number>();
  for (const [entry, at] of strings(source.exclude)) {
    const written = nfc(entry);
    if (SOURCE_PATH.test(written) && !first.has(foldPath(written))) first.set(foldPath(written), at);
  }
  return (path) => {
    if (typeof path !== "string" || !SOURCE_FILE_PATH.test(path) || inGit(path) || nfc(path) === SOURCE_FILE) return -1;
    if (!listCovers(include, path) || (path.length <= 512 && excludeCoversNfc(literal, nfc(path)))) return -1;
    const folded = foldPath(nfc(path));
    // A folder entry is keyed with its `/`, a file entry without: a path beneath a file entry is left out too.
    const keys = [folded, ...folderPrefixes(folded).flatMap((folder) => [folder, folder.slice(0, -1)])].filter((key) => first.has(key));
    return keys.length === 0 ? -1 : Math.min(...keys.map((key) => first.get(key) as number));
  };
}

/**
 * Whether a walk skips a folder (`src/cache`, no trailing `/`): an `exclude` folder is it or holds it, and no `include`
 * path lies under it. Nothing in it is source, so it is never entered (an unreadable excluded folder is no usage error).
 */
export function excludedFolderTest(manifest: unknown): (folder: string) => boolean {
  const source = isObject(manifest) ? manifest : {};
  const exclude = foldedList(source.exclude);
  // Every folder an include path lies in, indexed once: a folder is looked up, never compared with every include. Only
  // entries in the path grammar are indexed, as pathList does: a longer one would cost the square of its length.
  const under = new Set(strings(source.include).map(([path]) => nfc(path)).filter((path) => SOURCE_PATH.test(path)).flatMap((path) => folderPrefixes(path)));
  return (written) => {
    const folder = nfc(written);
    return folderPrefixes(`${foldPath(folder)}/`).some((prefix) => exclude.folders.has(prefix) || exclude.files.has(prefix.slice(0, -1))) && !under.has(`${folder}/`);
  };
}

/**
 * Whether a folder (`src/vendor`, no trailing `/`) lies in the source as a whole: an `include` folder is it or holds it,
 * and no `exclude` folder is it or holds it. What a name that cannot be read may be is judged by its folder alone.
 */
export function sourceFolderTest(manifest: unknown): (folder: string) => boolean {
  const source = isObject(manifest) ? manifest : {};
  const include = pathList(source.include);
  const exclude = foldedList(source.exclude);
  const held = (list: PathList, folder: string) => folderPrefixes(`${folder}/`).some((prefix) => list.folders.has(prefix));
  const heldBeneath = (folder: string) => folderPrefixes(`${folder}/`).some((prefix) => exclude.folders.has(prefix) || exclude.files.has(prefix.slice(0, -1)));
  return (written) => {
    if (written === "" || written.length > 512) return false;
    const folder = nfc(written);
    return !inGit(`${folder}/x`) && held(include, folder) && !heldBeneath(foldPath(folder));
  };
}

/**
 * Whether a file is source under a manifest: a path in the package's grammar, with no `.git` segment, that is the
 * manifest itself or lies inside an `include` path and inside no `exclude` path.
 */
export function isSourcePath(manifest: unknown, path: unknown): boolean {
  return sourcePathTest(manifest)(path);
}

/**
 * Whether a folder (a path ending in `/`) lies in the source: inside an `include` folder or one itself, with no
 * `.git` segment, inside no `exclude` folder.
 */
function folderInSource(includes: PathList, excludes: PathList, written: string): boolean {
  // `excludes` is a folded list (`foldedList`): the folder is looked up in it folded, as the source test reads exclude.
  const folder = nfc(written);
  return SOURCE_PATH.test(folder) && !inGit(folder.slice(0, -1)) &&
    folderPrefixes(folder).some((prefix) => includes.folders.has(prefix)) &&
    !folderPrefixes(foldPath(folder)).some((prefix) => excludes.folders.has(prefix) || excludes.files.has(prefix.slice(0, -1)));
}

/**
 * The paths of `unchecked`: source that travels with the source and that the tree check does not read (synthetic
 * test vectors, a licence whose copyright line names a holder on the operator's list). Each is `{path, reason}`.
 */
const uncheckedPaths = (manifest: unknown): Array<[string, number]> =>
  isObject(manifest) ? indexed(manifest.unchecked).flatMap(([entry, index]): Array<[string, number]> => (typeof entry.path === "string" ? [[entry.path, index]] : [])) : [];

/**
 * Whether a source file lies under an `unchecked` path: it travels, and the tree check reads its path only (a
 * credential file by its name is never source, unchecked or not).
 */
export function isUncheckedPath(manifest: unknown, path: unknown): boolean {
  return uncheckedTest(manifest)(path);
}

/** `isUncheckedPath` as a predicate built once for many paths. */
export function uncheckedTest(manifest: unknown): (path: unknown) => boolean {
  const isSource = sourcePathTest(manifest);
  const unchecked = pathList(uncheckedPaths(manifest).map(([entry]) => entry));
  return (path) => isSource(path) && listCovers(unchecked, path as string);
}

/**
 * Whether a nested repository at `path` (a folder, named without a trailing `/`: a submodule's gitlink, a folder holding
 * its own `.git`) lies in the source: an `include` path reaches it or into it, and no `exclude` path names it or a
 * folder around it. Leaving it out takes `exclude`; its own tree is checked as its own source.
 */
export function nestedInSource(manifest: unknown, written: unknown): boolean {
  return nestedTest(manifest)(written);
}

/** `nestedInSource` as a predicate built once for many paths. */
export function nestedTest(manifest: unknown): (written: unknown) => boolean {
  const source = isObject(manifest) ? manifest : {};
  const include = pathList(source.include, true);
  const exclude = foldedList(source.exclude);
  return (written) => {
    // `git ls-files --others` names an untracked repository with a trailing `/`.
    const stored = typeof written === "string" && written.endsWith("/") ? written.slice(0, -1) : written;
    if (typeof stored !== "string" || !SOURCE_FILE_PATH.test(stored) || inGit(stored)) return false;
    const path = nfc(stored);
    const folder = `${path}/`;
    // An include path names it, lies under it (its folder is one of that entry's prefixes) or covers it.
    const reached = include.files.has(path) || include.reaches.has(folder) || folderPrefixes(folder).some((prefix) => include.folders.has(prefix));
    const folded = foldPath(path);
    return reached && !exclude.files.has(folded) && !folderPrefixes(`${folded}/`).some((prefix) => exclude.folders.has(prefix) || exclude.files.has(prefix.slice(0, -1)));
  };
}

/**
 * DEC-0149 item 13: the paths of a patch that are not source, in the order given. A patch applies only when this is
 * empty; otherwise it is refused whole, and it applies at the source, never at an exported copy. `manifest` is the
 * RECEIVER's current source manifest, never one the patch brings: a patch that rewrote `fabric.source.json` to drop an
 * exclude would otherwise open the way for a later one. So an import never applies a change to the manifest, whoever
 * sends it: a patch path that is the manifest itself, in any spelling, is refused, and the patch is held (kept
 * unapplied) until the owner decides; the owner changes the manifest by a commit at the source. `exclude` is read folded
 * (`foldSegment`), and when the manifest has any exclude entry a segment in which `~` is followed by a digit
 * (`PRIVAT~1.MD`) is refused, since Windows may resolve such a short name to an excluded folder. A path beneath a
 * symbolic link in the receiver's tree is refused too, as `git apply` refuses one; the path list cannot tell, so the
 * receiver checks it at apply time.
 */
export function patchPathsAllowed(manifest: unknown, paths: readonly unknown[]): string[] {
  const isSource = sourcePathTest(manifest);
  const source = isObject(manifest) ? manifest : {};
  const anyExclude = strings(source.exclude).length > 0;
  const refused = (path: unknown): boolean => {
    if (!isSource(path)) return true;
    const folded = foldPath(nfc(path as string));
    return folded === SOURCE_FILE || (anyExclude && folded.split("/").some((segment) => SHORT_NAME.test(segment)));
  };
  return (Array.isArray(paths) ? paths : []).filter(refused).map((path) => show(path));
}
/** A folded segment that may be a Windows 8.3 short name: a `~` followed by a digit anywhere (`PRIVAT~1.MD`). */
const SHORT_NAME = /~[0-9]/u;

// #region source-tree-check (docs: docs/specification/source.md#the-tree-check)
/** What the tree check reports: the blocking kinds (FAC-SEM-158) and the warnings (FAC-SEM-159). */
export type SourceFindingKind =
  | "home-path" | "credential" | "binary" | "nested-repository" | "instance-string" | "missing" | "short-instance-string" | "no-include"
  | "email" | "link-outside" | "no-license" | "unused-exclude" | "excluded-by-fold";
export const BLOCKING_KINDS: readonly SourceFindingKind[] = ["home-path", "credential", "binary", "nested-repository", "instance-string", "missing", "short-instance-string", "no-include"];
export const WARNING_KINDS: readonly SourceFindingKind[] = ["email", "link-outside", "no-license", "unused-exclude", "excluded-by-fold"];

/**
 * One place the instance shows through. `file` is the index in `files`; a finding in a file's path has no `line`;
 * `line` and `column` count from 1, the column in UTF-16 code units where the match begins. `entry` is the index of an
 * instance string in the operator's list, `include` the index of an `include` path. Never the text found.
 */
export interface SourceProblem { kind: SourceFindingKind; file?: number; line?: number; column?: number; entry?: number; include?: number; exclude?: number }

/**
 * Files that are credentials by their name: the names the adapter's `pack` refuses to carry (`fabric_package.py`
 * `SECRET_FILE`, with its `SECRET_FILE_OK` exceptions), and the kits' token and credential files (`service.token`,
 * `board.credential`).
 */
export const CREDENTIAL_FILE = /^(?:\.env(?:\.[^\n\r\u2028\u2029]+)?|[^\n\r\u2028\u2029]*\.(?:pem|key|p12|pfx|jks|keystore)|id_(?:rsa|dsa|ecdsa|ed25519)|\.(?:npmrc|netrc|pypirc))$/;
export const CREDENTIAL_FILE_OK = /^\.env\.(?:example|sample|template)$/;
/** The kits' token and credential files, Python's `.` (anything but LF) before the extension: the adapter's `TOKEN_FILE`. */
export const TOKEN_FILE = /^[^\n]+\.(?:token|credential)$/;
const credentialFile = (path: string): boolean => {
  const name = path.slice(path.lastIndexOf("/") + 1);
  return (CREDENTIAL_FILE.test(name) && !CREDENTIAL_FILE_OK.test(name)) || TOKEN_FILE.test(name);
};

/**
 * The credential shapes a source tree holds, as the Fabric Agent Adapter's check reads them (`fabric_source_check.py`
 * `_secret_in`, `v0.58.0`; DEC-0149 item 8), each a value that does not say it is synthetic (`SYNTHETIC`):
 *
 * - a private key block (PEM, OpenSSH, PGP), whatever follows it;
 * - a JWK's private `d` (JSON, escaped JSON, a Python dict);
 * - a JWT (`JWT_SHAPE`);
 * - a provider key in the tree check's own shapes (`KEY_SHAPE_SOURCES`, unbounded, with no whole-value `^bearer`
 *   branch, which would take a line of prose that starts with the word), starting a word: no letter or digit before it,
 *   so `task-…` holds no `sk-` key;
 * - a bearer token inside a line (`BEARER_INSIDE`);
 * - an absolute URL with a password of 8 or more characters mixing letters and digits, or a query or fragment value
 *   that, percent-decoded, is a provider key, a JWT, a value `URL_SECRET_VALUE` reads (the tree check's own shapes,
 *   unbounded, after a whole-value bearer branch), or a long run under a credential's name, an inner
 *   URL in a parameter read the same way two levels deep;
 * - a long run mixing upper case, lower case and digits (`longSecret`), percent-decoded, assigned to a name that can
 *   only carry a credential (`credentialName`): `NAME = value`, `NAME: value`, `"name": "value"`, so an integrity hash
 *   is not one.
 *
 * A whole Ed25519 signature under a JSON `sig`, `signature` or `signatures` member is public and read by no rule. A line
 * holding a JSON escape of `&`, `=` or `/` (`&`, `=`, `\/`) is read again unescaped when it shows nothing as
 * written.
 */
const PRIVATE_KEY = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;
const JWK_PRIVATE = /\\?["']d\\?["'][ \t]*:[ \t]*\\?["']([A-Za-z0-9_-]{43,})/g;
/**
 * The tree check's own provider-key shapes, kept apart from the shared detector (`SECRET_VALUE`) for parity with the
 * adapter's source check, each as the adapter's `_alternatives` splits it: its prefix, and either the run of its own
 * characters that must follow (at least `least` of them) or its whole fixed shape. ASCII case-insensitive, no `u` flag:
 * Unicode case folding would read `ſk-` (U+017F) or a Kelvin sign as `sk-` or `K`. `KEY_SHAPE_SOURCES` is the same
 * list written out, held equal by test to the `constants` block of `fixtures/vectors/source-tree.json`, which a port
 * holds equal too.
 */
interface KeyShape { prefix: RegExp; run?: RegExp; least?: number; whole?: RegExp }
export const KEY_SHAPE_SOURCES: readonly string[] = ["sk-[A-Za-z0-9_-]{16,}", "gh[pousr]_[A-Za-z0-9]{20,}", "xox[abposr]-[A-Za-z0-9-]{10,}", "AKIA[0-9A-Z]{16}", "glpat-[A-Za-z0-9_-]{20,}"];
/**
 * Each shape derived from its source: `<prefix><class>{<least>,}` is a prefix and a run of at least `least` of the
 * class; any other source (`AKIA[0-9A-Z]{16}`) is matched whole after its prefix of letters.
 */
export const KEY_SHAPES: readonly KeyShape[] = KEY_SHAPE_SOURCES.map((source) => {
  const open = /^(.*?)(\[[^\]]+\])\{(\d+),\}$/.exec(source);
  if (open !== null) return { prefix: new RegExp(open[1] as string, "gi"), run: new RegExp(`${open[2] as string}+`, "g"), least: Number(open[3]) };
  return { prefix: new RegExp((/^[A-Za-z]+/.exec(source) as RegExpExecArray)[0], "gi"), whole: new RegExp(source, "iy") };
});
/** A letter or a digit in any script: a key that follows one starts no word (Python's `str.isalnum`). */
const LETTER_OR_DIGIT = /^[\p{L}\p{N}]$/u;
const BEARER_ALL = new RegExp(BEARER_INSIDE.source, "gi");
/**
 * An absolute URL in a line. Its end is Python's `\s` spelled out (U+001C to U+001F and U+0085 are white space there,
 * U+FEFF is not), so the two ports cut a URL at the same character.
 */
const URL_IN_LINE = /[A-Za-z][A-Za-z0-9+.-]{0,63}:\/\/[^\t\n\v\f\r \x1c-\x1f\x85\xa0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000"'<>`]+/g;
/** Spaces or tabs and a colon, read where a quoted member name ends (sticky: no copy of the rest of the line). */
const COLON_AFTER = /[ \t]*:/y;
/**
 * A name assigned a value (`NAME = value`, `NAME: value`, `"name": "value"`): the head only. The value, at least 40
 * units of `[A-Za-z0-9+/_-]` or `%HH` and up to two `=`, is read by hand (`assignedValueEnd`): a backtracking group
 * over a run of millions of characters overflows V8's regex stack.
 */
const ASSIGNED_HEAD = /(?<![A-Za-z0-9_.-])([A-Za-z_][A-Za-z0-9_.-]{0,63})["']?[ \t]{0,8}[:=][ \t]{0,8}["']?/g;
const isValueUnit = (code: number): boolean =>
  (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a) || (code >= 0x30 && code <= 0x39) || code === 0x2b || code === 0x2f || code === 0x5f || code === 0x2d;
const isHex = (code: number): boolean => (code >= 0x30 && code <= 0x39) || (code >= 0x41 && code <= 0x46) || (code >= 0x61 && code <= 0x66);
/** The end of an assigned value starting at `from` (at least 40 units, then up to two `=`), or -1 when it is shorter. */
function assignedValueEnd(line: string, from: number): number {
  let at = from;
  let units = 0;
  for (;;) {
    const code = line.charCodeAt(at);
    if (isValueUnit(code)) at += 1;
    else if (code === 0x25 && isHex(line.charCodeAt(at + 1)) && isHex(line.charCodeAt(at + 2))) at += 3;
    else break;
    units += 1;
  }
  if (units < 40) return -1;
  for (let equals = 0; equals < 2 && line[at] === "="; equals += 1) at += 1;
  return at;
}
/**
 * Whether a text holds a run of 40 or more of `[A-Za-z0-9+/=_-]` mixing upper case, lower case and digits: the shared
 * `longSecret`, read by hand in one pass, so a run of millions of characters is read without a regex.
 */
export function longRunSecret(text: string): boolean {
  let length = 0;
  let lower = false;
  let upper = false;
  let digit = false;
  for (let at = 0; at <= text.length; at += 1) {
    const code = at < text.length ? text.charCodeAt(at) : -1;
    if (isValueUnit(code) || code === 0x3d) {
      length += 1;
      lower ||= code >= 0x61 && code <= 0x7a;
      upper ||= code >= 0x41 && code <= 0x5a;
      digit ||= code >= 0x30 && code <= 0x39;
      continue;
    }
    if (length >= 40 && lower && upper && digit) return true;
    length = 0;
    lower = upper = digit = false;
  }
  return false;
}
/** A whole Ed25519 signature as a JSON member: public, blanked before any rule reads the line. */
const PUBLIC_SIGNATURE = /("(?:sig|signature|signatures)"[ \t]*:[ \t]*")([A-Za-z0-9_-]{86})(")/gi;
const JSON_ESCAPES = /\\(?:u0026|u003[dD]|\/)/g;
const UNESCAPED: Readonly<Record<string, string>> = { "\\u0026": "&", "\\u003d": "=", "\\u003D": "=", "\\/": "/" };

/**
 * Words a documented or synthetic credential carries (`...EXAMPLE`, `sk-test-not-a-key`); a random key does not. Its
 * twin is the Fabric Agent Adapter's `SYNTHETIC` in `fabric_source_check.py` (`v0.58.0`); the two are kept equal. A
 * value is synthetic when the token found holds one of them, without regard to case (the adapter's `_real`).
 */
export const SYNTHETIC: readonly string[] = ["example", "not-a-key", "notakey", "fake", "dummy", "placeholder", "redacted"];
const real = (token: string): boolean => !SYNTHETIC.some((word) => token.toLowerCase().includes(word));
/**
 * Percent-decoding as Python's `unquote` reads it: each run of valid escapes decoded as UTF-8, a byte sequence that is
 * not UTF-8 replaced by U+FFFD (`errors='replace'`), anything else left as written.
 */
// A byte-order mark is a character like any other here, as Python's `unquote` keeps it.
const UTF8 = new TextDecoder("utf-8", { ignoreBOM: true });
function unquote(raw: string): string {
  // Read by hand: a regex group repeated over a run of millions of escapes overflows V8's regex stack.
  if (!raw.includes("%")) return raw;
  let out = "";
  let last = 0;
  for (let at = raw.indexOf("%"); at >= 0; at = raw.indexOf("%", at)) {
    const bytes: number[] = [];
    let end = at;
    while (raw.charCodeAt(end) === 0x25 && isHex(raw.charCodeAt(end + 1)) && isHex(raw.charCodeAt(end + 2))) {
      bytes.push(Number.parseInt(raw.slice(end + 1, end + 3), 16));
      end += 3;
    }
    if (bytes.length === 0) { at += 1; continue; }
    out += raw.slice(last, at) + UTF8.decode(Uint8Array.from(bytes));
    last = end;
    at = end;
  }
  return out + raw.slice(last);
}
/** The lowest of some indexes, or -1 for none; a long line may hold more than a spread argument list takes. */
const lowest = (values: readonly number[]): number => values.reduce((low, value) => (low < 0 || value < low ? value : low), -1);

/** The first index in a sorted list at or after `value` (Python's `bisect_left`). */
function bisectLeft(sorted: readonly number[], value: number): number {
  let low = 0;
  let high = sorted.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if ((sorted[middle] as number) < value) low = middle + 1;
    else high = middle;
  }
  return low;
}

/**
 * The provider keys of a text that start a word and are not synthetic, by their index (the adapter's `_provider_keys`):
 * every start of each shape is read with the run of the shape's characters it opens, found once per text and looked
 * up by bisection, so a synthetic key's run never hides a real key that starts inside it and a long line costs
 * O(n log n). A start after a letter or a digit of any script starts no word. A synthetic word counts when it lies
 * wholly inside the key's span, matched on the text's ASCII letters lowered.
 */
function providerKeys(text: string): number[] {
  const lowered = text.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
  const synthetic = SYNTHETIC.map((word) => {
    const at: number[] = [];
    for (let index = lowered.indexOf(word); index >= 0; index = lowered.indexOf(word, index + 1)) at.push(index);
    return [word.length, at] as const;
  });
  const found: number[] = [];
  for (const shape of KEY_SHAPES) {
    let runs: Array<[number, number]> | undefined;
    let runStarts: number[] = [];
    for (const start of text.matchAll(shape.prefix)) {
      const p = start.index as number;
      // The code point before the key, a surrogate pair read whole.
      const pair = p > 1 && /^[\uD800-\uDBFF][\uDC00-\uDFFF]$/.test(text.slice(p - 2, p));
      const before = p === 0 ? "" : String.fromCodePoint(text.codePointAt(p - (pair ? 2 : 1)) as number);
      if (LETTER_OR_DIGIT.test(before)) continue;
      let end: number;
      if (shape.whole !== undefined) {
        shape.whole.lastIndex = p;
        const key = shape.whole.exec(text);
        if (key === null) continue;
        end = p + key[0].length;
      } else {
        if (runs === undefined) {
          runs = [...text.matchAll(shape.run as RegExp)].map((run): [number, number] => [run.index as number, (run.index as number) + run[0].length]);
          runStarts = runs.map(([runStart]) => runStart);
        }
        const q = p + start[0].length;
        const index = bisectLeft(runStarts, q + 1) - 1;
        const run = runs[index];
        if (run === undefined || run[1] - q < (shape.least as number)) continue;
        end = run[1];
      }
      if (!synthetic.some(([length, at]) => { const k = bisectLeft(at, p); return k < at.length && (at[k] as number) + length <= end; })) found.push(p);
    }
  }
  return found.sort((a, b) => a - b);
}

const SPECIAL_SCHEMES = ["ftp", "http", "https", "ws", "wss"];
/**
 * A URL's password, query and fragment as WHATWG URL parsing splits them, read by hand (the adapter's `_url_parts`): a
 * special scheme's authority starts after every slash or backslash after `scheme:`, another scheme's only after `//`,
 * `file` has none; the user information ends at the authority's last `@`, the password follows its first `:`.
 */
function urlParts(value: string): [string, string, string] {
  const colon = value.indexOf(":");
  const scheme = value.slice(0, colon).toLowerCase();
  let rest = value.slice(colon + 1);
  const hash = rest.indexOf("#");
  const fragment = hash < 0 ? "" : rest.slice(hash + 1);
  if (hash >= 0) rest = rest.slice(0, hash);
  const mark = rest.indexOf("?");
  const query = mark < 0 ? "" : rest.slice(mark + 1);
  if (mark >= 0) rest = rest.slice(0, mark);
  const authority = SPECIAL_SCHEMES.includes(scheme) ? rest.replace(/\\/g, "/").replace(/^\/+/, "").split("/")[0] as string
    : scheme !== "file" && rest.startsWith("//") ? rest.slice(2).split("/")[0] as string : "";
  const at = authority.lastIndexOf("@");
  const userinfo = at < 0 ? "" : authority.slice(0, at);
  const password = userinfo.includes(":") ? userinfo.slice(userinfo.indexOf(":") + 1) : "";
  return [password, query, fragment];
}
/** A text without the run of the given characters at its end (Python's `rstrip`), read backward in one pass. */
function rstrip(text: string, characters: string): string {
  let end = text.length;
  while (end > 0 && characters.includes(text[end - 1] as string)) end -= 1;
  return text.slice(0, end);
}
/** A text without the run of the given characters at its start (Python's `lstrip`), read forward in one pass. */
function lstrip(text: string, characters: string): string {
  let start = 0;
  while (start < text.length && characters.includes(text[start] as string)) start += 1;
  return text.slice(start);
}
/**
 * What the tree check reads as a credential in a URL's parameter value: a whole-value bearer branch and its own key
 * shapes, unbounded, built from `KEY_SHAPE_SOURCES` and carried in the vectors' `constants` block, never the shared
 * detector's.
 */
export const URL_SECRET_VALUE = new RegExp(`(^bearer\\s.+|${KEY_SHAPE_SOURCES.join("|")})`, "i");
/** Whether a URL in a source tree carries a credential (the adapter's `_url_secret`), an inner URL read two levels deep. */
function urlSecret(url: string, depth = 0): boolean {
  const trimmed = rstrip(url, ".,;)]}");
  // Only an absolute URL is read as one: a parameter that holds `://` after other text is a value (the adapter's guard).
  if (!/^[A-Za-z][A-Za-z0-9+.-]*:/.test(trimmed)) return false;
  const [password, query, fragment] = urlParts(trimmed);
  if (password.length >= 8 && /[0-9]/.test(password) && /[A-Za-z]/.test(password) && real(unquote(password))) return true;
  for (const part of [query, fragment]) {
    for (const [name, raws] of rawValues(part)) {
      for (const raw of raws) {
        const value = unquote(raw);
        if (depth < 2 && value.includes("://") && urlSecret(value, depth + 1)) return true;
        if (providerKeys(value).length > 0) return true;
        if (!real(value)) continue;
        if ((credentialName(name) && longRunSecret(value)) || hasJwt(value) || URL_SECRET_VALUE.test(value)) return true;
      }
    }
  }
  return false;
}

/** The spans of the URLs in a line, as written, that carry a credential. */
const secretUrls = (line: string): Array<[number, number]> =>
  !line.includes("://") ? [] : [...line.matchAll(URL_IN_LINE)].filter((match) => urlSecret(match[0])).map((match) => [match.index as number, (match.index as number) + match[0].length]);

/**
 * A line with its JSON escapes of `&`, `=` and `/` undone, and for each character of it the index in the line where it
 * was written; undefined when the line holds none.
 */
function unescapedJson(line: string): { text: string; origin: number[] } | undefined {
  if (!line.includes("\\")) return undefined;
  const origin: number[] = [];
  let text = "";
  let last = 0;
  for (const match of line.matchAll(JSON_ESCAPES)) {
    for (let index = last; index < (match.index as number); index += 1) origin.push(index);
    text += line.slice(last, match.index) + (UNESCAPED[match[0]] as string);
    origin.push(match.index as number);
    last = (match.index as number) + match[0].length;
  }
  if (last === 0) return undefined;
  for (let index = last; index < line.length; index += 1) origin.push(index);
  return { text: text + line.slice(last), origin };
}

/**
 * The spans, in the line as written, of the URLs that carry a credential, as written or once its JSON escapes are undone:
 * an e-mail-shaped match inside one is no address.
 */
function credentialUrlSpans(line: string): Array<[number, number]> {
  const written = secretUrls(line);
  const unescaped = unescapedJson(line);
  if (written.length > 0 || unescaped === undefined) return written;
  return secretUrls(unescaped.text).map(([start, stop]) => [unescaped.origin[start] as number, stop < unescaped.origin.length ? (unescaped.origin[stop] as number) : line.length]);
}

/** The 0-based index where a line, as written, first shows a credential, or -1. */
function credentialIn(written: string): number {
  // A whole Ed25519 signature is blanked, keeping every other index.
  const line = written.includes('"') ? written.replace(PUBLIC_SIGNATURE, (_all, open: string, value: string, close: string) => `${open}${" ".repeat(value.length)}${close}`) : written;
  const found: number[] = [];
  const block = PRIVATE_KEY.exec(line);
  if (block) found.push(block.index);
  for (const match of line.matchAll(JWK_PRIVATE)) if (real(match[1] as string)) found.push(match.index as number);
  for (const [start, end] of jwtSpans(line)) if (real(line.slice(start, end))) found.push(start);
  const key = providerKeys(line)[0];
  if (key !== undefined) found.push(key);
  // A bearer token may start inside the last one's run: every start is read.
  for (let at = 0; at <= line.length;) {
    BEARER_ALL.lastIndex = at;
    const match = BEARER_ALL.exec(line);
    if (!match) break;
    if (real(match[0])) found.push(match.index);
    at = match.index + 1;
  }
  const url = secretUrls(line)[0];
  if (url !== undefined) found.push(url[0]);
  // Each search starts again inside the last value: `id=<run>/TOKEN=<value>` reads both. Only a line with `:` or `=` has one.
  const assigns = line.includes(":") || line.includes("=");
  for (let at = 0; assigns; ) {
    ASSIGNED_HEAD.lastIndex = at;
    const match = ASSIGNED_HEAD.exec(line);
    if (!match) break;
    const name = match[1] as string;
    const valueAt = match.index + match[0].length;
    const valueEnd = assignedValueEnd(line, valueAt);
    // A value under 40 units is no match here: the search goes on from the next character, as a regex's would.
    if (valueEnd < 0) { at = match.index + 1; continue; }
    const value = line.slice(valueAt, valueEnd);
    // A whole Ed25519 signature under a quoted `sig`, `signature` or `signatures` member is public (the adapter's `_credential`).
    COLON_AFTER.lastIndex = match.index + name.length + 1;
    const quoted = line[match.index - 1] === '"' && line[match.index + name.length] === '"' && COLON_AFTER.test(line);
    const signature = quoted && ["sig", "signature", "signatures"].includes(name.toLowerCase()) && /^[A-Za-z0-9_-]{86}$/.test(value);
    if (!signature && credentialName(name) && longRunSecret(unquote(value)) && real(unquote(value))) found.push(valueAt);
    // The value starts after the name, so the next search starts later.
    at = valueAt;
  }
  return lowest(found);
}

/** The 0-based index where a line first shows a credential, as written or, failing that, with its JSON escapes undone. */
function credentialAt(line: string): number {
  const written = credentialIn(line);
  const unescaped = written >= 0 ? undefined : unescapedJson(line);
  if (unescaped === undefined) return written;
  const found = credentialIn(unescaped.text);
  return found < 0 ? -1 : (unescaped.origin[found] as number);
}

/**
 * A value shaped like a credential as the tree check reads one apart from a line: a JWT or a long run (the shared
 * detector's reads) or the tree check's own key shapes anywhere in it (`URL_SECRET_VALUE`, unbounded), so a key glued
 * after a letter (`xsk-…`) stays held whatever bound the shared detector takes.
 */
export const ownSecretValue = (text: string): boolean => hasJwt(text) || URL_SECRET_VALUE.test(text) || longRunSecret(text);
/**
 * A manifest's description shaped like a credential (FAC-SEM-156): a provider key read as the tree check reads one in a
 * line (`providerKeys`: its own shapes, starting a word, no synthetic word), a JWT, a long run, or a bearer token inside
 * it (`BEARER_INSIDE`: 12 or more token characters with a digit), never the whole-value `^bearer` branch, so "Bearer
 * token for the board API" and "desk-booking-service-api" are prose.
 */
export const proseSecretValue = (text: string): boolean => hasJwt(text) || providerKeys(text).length > 0 || BEARER_INSIDE.test(text) || longRunSecret(text);
/** Whether a text shows a credential in any form the tree check reads, as a line or as a value. */
export const credentialShaped = (text: string): boolean => credentialAt(text) >= 0 || ownSecretValue(text);

/**
 * Whether a text shows what the tree check reads as the instance's: a credential, a home folder with a name or an
 * e-mail address the tree check reports (not at an RFC 2606 name, not an image's name, not before a `:`).
 */
export const holdsFinding = (text: string): boolean => credentialShaped(text) || homeAt(text) >= 0 || reportedAddresses(text).length > 0;
/** A word of a message, or a member name, holds a finding once the quotes and punctuation around it are stripped. */
export const wordHoldsFinding = (word: string): boolean => holdsFinding(word) || holdsFinding(rstrip(lstrip(word, "\"'`("), "\"'`),.;:"));
/**
 * A path holds a finding as the tree check reads one in a path: a credential, a home folder with a name, a credential
 * file by its name; never an e-mail address, which the check (and the adapter's) does not read in a path. A long run
 * mixing cases and digits (`longSecret`) is read in each segment between `/` on its own, so a path of ordinary names
 * (`packages/CoreLib2/src/Components/Button3/Index.tsx`) is no run; the other credential forms read the whole path.
 */
export const pathHoldsFinding = (path: string): boolean =>
  credentialAt(path) >= 0 || hasJwt(path) || URL_SECRET_VALUE.test(path) || path.split("/").some((segment) => longRunSecret(segment)) || homeAt(path) >= 0 || credentialFile(path);
/**
 * The clean path that leads a tree check's message (`<path> ` or `<path>: `), or "": a path that holds nothing is
 * printed whole and not masked again, at a folder run and at the document form alike.
 */
export const messageLead = (message: string, path: unknown): string =>
  typeof path === "string" && path !== "" && !pathHoldsFinding(path) && !labelledByIndex(path) && (message.startsWith(`${path} `) || message.startsWith(`${path}: `)) ? path : "";
/** The most of a path, in UTF-16 units, that `longRunAt` and a checker's `shownPath` read. */
export const PATH_READ_LIMIT = 512;
/**
 * The 0-based index where a long run mixing cases and digits (`longSecret`) starts in a whole text, `/` included, or
 * -1: where a value that runs across segments starts, so a name never shows its first part. Leading folders named in
 * lower-case letters only (`src/`, `cfg/`) are no part of the run while what follows them is still one.
 */
export function longRunAt(whole: string): number {
  // At most 512 UTF-16 units are read (a source path's grammar holds 256 code points), so the work stays linear.
  const text = whole.slice(0, PATH_READ_LIMIT);
  for (const match of text.matchAll(/[A-Za-z0-9+/=_-]{40,}/g)) {
    if (!longRunSecret(match[0])) continue;
    let start = 0;
    for (let slash = match[0].indexOf("/"); slash >= 0; slash = match[0].indexOf("/", start)) {
      if (!/^[a-z_-]+$/.test(match[0].slice(start, slash)) || !longRunSecret(match[0].slice(slash + 1))) break;
      start = slash + 1;
    }
    return (match.index as number) + start;
  }
  return -1;
}
/**
 * The 0-based index where a text first shows a credential, a named home folder or an e-mail address the tree check
 * reports, or -1; `inPath` reads a path, where a `:` after an address lets nothing through (the grammar has none).
 */
export const findingAt = (text: string, inPath = false): number =>
  lowest([credentialAt(text), homeAt(text), reportedAddresses(text, inPath)[0]?.index ?? -1].filter((index) => index >= 0));
/** The indexes of a quote sign in `[from, to)` that no backslash escapes (an odd run of backslashes before it). */
function quotesIn(text: string, sign: string, from: number, to: number): number[] {
  const found: number[] = [];
  for (let at = text.indexOf(sign, from); at >= 0 && at < to; at = text.indexOf(sign, at + 1)) {
    let slashes = 0;
    while (at - slashes - 1 >= 0 && text[at - slashes - 1] === "\\") slashes += 1;
    if (slashes % 2 === 0) found.push(at);
  }
  return found;
}

/**
 * A message with each value that holds a finding replaced by a mark naming its place, so a message that would quote a
 * value (a manifest member named like a key, a home path, an address) never repeats it. Each word is read first; a
 * finding that runs across a space (a bearer token, a private key block) is then cut from its word's start to the end
 * of the double-quoted or backticked value holding it, or of the message, until nothing is left; a finding no span locates masks the whole
 * message.
 */
export const masked = (message: string, place: string): string => {
  // The mark carries no quote of its own, so it never opens or closes a quoted value a later pass reads.
  const mark = `<a value the tree check reads as the instance's, at ${place.replace(/["`\\]/g, "?")}>`;
  let text = message.split(/(\s+)/).map((word) => (/\S/.test(word) && wordHoldsFinding(word) ? mark : word)).join("");
  for (let pass = 0; pass < 16 && holdsFinding(text); pass += 1) {
    const at = findingAt(text);
    if (at < 0) return mark;
    let start = at;
    while (start > 0 && !/[\s"`]/.test(text[start - 1] as string)) start -= 1;
    // The quoted value holding it: a double quote or a backtick opened before it and not closed (an apostrophe is prose);
    // a quote escaped with a backslash neither opens nor closes one.
    const quote = ['"', "`"].find((sign) => quotesIn(text, sign, 0, at).length % 2 === 1);
    const close = quote === undefined ? -1 : quotesIn(text, quote, at + 1, text.length)[0] ?? -1;
    text = `${text.slice(0, start)}${mark}${close < 0 ? "" : text.slice(close)}`;
  }
  return holdsFinding(text) ? mark : text;
};

/**
 * Names that stand for nobody in a home path: placeholders, CI runners, the system's shared folders, the users of
 * container images, cloud machines and hosted workspaces. Its twin is the Fabric Agent Adapter's `NEUTRAL_HOMES` in
 * `fabric_source_check.py` (`v0.58.0`); the two are kept equal, so the adapter's check and this one agree on the
 * vectors. A name an operator wants caught anyway goes in their list of installation strings.
 */
export const NEUTRAL_HOMES: readonly string[] = [
  "example", "examples", "user", "username", "you", "me", "name", "someone", "runner", "shared", "public",
  "default", "guest", "linuxbrew", "alice", "bob", "operator", "owner", "person", "your-name", "yourname",
  // the users of container images, cloud machines and hosted CI
  "node", "ubuntu", "ec2-user", "runneradmin", "admin", "vagrant", "debian", "centos", "app", "builder",
  // dev containers and hosted workspaces, and the reference's own fixture id
  "vscode", "codespace", "circleci", "gitpod", "jovyan", "coder", "example-agent"
];
/**
 * A home folder with a name, in the forms the adapter's `HOME_PATHS` reads (DEC-0149 item 8): `/home/<name>` and
 * `/var/home/<name>`; `/Users/<name>` with a capital U (`/users/…` is a web route); Git Bash's `/c/Users/<name>` and WSL's
 * `/mnt/c/Users/<name>`; `C:\Users\<name>` with either separator, a JSON-escaped one included, any drive letter in
 * either case; DEC-0105's dashed forms, never after a dash (`--home-dir` is a flag); the URL-encoded ones. The name is
 * each pattern's last group, at the end of its match. This is narrower than `hasHomePath` in `src/activity-rules.ts`,
 * the scanner for values that hold no path at all: a source holds `~/` and neutral homes, and they are portable.
 */
export const SOURCE_HOME_PATHS: readonly RegExp[] = [
  /(?<![A-Za-z0-9_.-])(?:\/var)?\/home\/([A-Za-z0-9][A-Za-z0-9._-]*)/g,
  /(?<![A-Za-z0-9_.-])\/Users\/([A-Za-z0-9][A-Za-z0-9._-]*)/g,
  /(?<![A-Za-z0-9_.-])(?:\/mnt)?\/[A-Za-z]\/Users\/([A-Za-z0-9][A-Za-z0-9._-]*)/g,
  /(?<![A-Za-z0-9_.-])[A-Za-z]:(?:\\|\/)+Users(?:\\|\/)+([A-Za-z0-9][A-Za-z0-9._-]*)/gi,
  /(?:^|[^A-Za-z0-9-])(?:-Users|-home|-var-home|(?:-mnt)?-[A-Za-z]-Users)-([A-Za-z0-9][A-Za-z0-9._]*)/g,
  /(?<![A-Za-z0-9])[A-Za-z]--Users-([A-Za-z0-9][A-Za-z0-9._]*)/gi,
  /%2[Ff](?:Users|home)%2[Ff]([A-Za-z0-9][A-Za-z0-9._-]*)/g,
  /%5CUsers%5C([A-Za-z0-9][A-Za-z0-9._-]*)/gi
];
/** A home folder's name that stands for someone: two characters or more, and not a neutral name. */
const personal = (name: string): boolean => name.length > 1 && !NEUTRAL_HOMES.includes(name.toLowerCase());
/** The 0-based index where a line first shows a named home folder, at the name's first character, or -1. */
function homeAt(line: string): number {
  const found = SOURCE_HOME_PATHS.flatMap((pattern) =>
    [...line.matchAll(pattern)].filter((match) => personal(match[1] as string)).map((match) => match.index + match[0].length - (match[1] as string).length));
  return lowest(found);
}

const escaped = (text: string) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
/**
 * An instance string's forms: as written and in Unicode NFC, each also percent-encoded (`encodeURIComponent`), form-encoded
 * (`+` for a space), JSON-escaped, JSON-escaped with `\/` for `/`, and JSON-escaped with every non-ASCII character as
 * `\uXXXX`; each matched without regard to case.
 */
function forms(entry: string): RegExp[] {
  const all = [entry, entry.normalize("NFC")].flatMap((written) => {
    const json = JSON.stringify(written).slice(1, -1);
    const ascii = json.replace(/[^\u0000-\u007f]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
    const percent = encodeURIComponent(written);
    return [written, percent, percent.replace(/%20/g, "+"), json, json.replace(/\//g, "\\/"), ascii];
  });
  return [...new Set(all)].map((form) => new RegExp(escaped(form), "iu"));
}
/** The first index of any pattern in a text, or -1; the text is also read in NFC, its index used when only it matches. */
const firstOf = (patterns: readonly RegExp[], text: string): number => {
  for (const form of [text, text.normalize("NFC")]) {
    const found = patterns.map((pattern) => pattern.exec(form)?.index ?? -1).filter((index) => index >= 0);
    if (found.length > 0) return lowest(found);
  }
  return -1;
};

/** A UTF-16 code unit of a surrogate pair standing alone: a string that holds one is not well formed. */
const LONE_SURROGATE = /[\uD800-\uDFFF]/u;
/**
 * The e-mail addresses of a line, by the pattern of `src/node-summary.ts` with the local part bounded to 64 characters
 * (RFC 5321), read from each `@` outward so a long line costs one pass: the local part is the run of address characters
 * before the `@`, at most 64 and never inside the last address found, the domain the pattern's after it.
 */
const LOCAL_CHAR = /[A-Za-z0-9._%+-]/;
const DOMAIN = /[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/y;
function addresses(line: string): Array<{ index: number; text: string }> {
  const found: Array<{ index: number; text: string }> = [];
  let floor = 0;
  for (let at = line.indexOf("@"); at >= 0; at = line.indexOf("@", at + 1)) {
    let start = at;
    while (start > floor && at - start < 64 && LOCAL_CHAR.test(line[start - 1] as string)) start -= 1;
    if (start === at) continue;
    DOMAIN.lastIndex = at + 1;
    const domain = DOMAIN.exec(line);
    if (!domain) continue;
    floor = domain.index + domain[0].length;
    found.push({ index: start, text: line.slice(start, floor) });
  }
  return found;
}

/** RFC 2606's names: an address at them is an example, never a person's. */
const RESERVED_DOMAINS = ["example.com", "example.org", "example.net"];
const RESERVED_TLDS = [".invalid", ".test", ".example"];
const exampleAddress = (address: string): boolean => {
  const domain = address.slice(address.lastIndexOf("@") + 1).toLowerCase();
  return RESERVED_DOMAINS.some((name) => domain === name || domain.endsWith(`.${name}`)) || RESERVED_TLDS.some((tld) => domain.endsWith(tld));
};
/** An image's extension: `user@2x.png` is an asset's name, not an address. */
const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "ico"];
/** Not a person's address: a match followed by `:` (an SSH remote, `git@host:owner/repo`) or ending in an image's extension. */
const imageName = (match: { text: string }): boolean => IMAGE_EXTENSIONS.includes(match.text.slice(match.text.lastIndexOf(".") + 1).toLowerCase());
const notAnAddress = (line: string, match: { index: number; text: string }): boolean => line[match.index + match.text.length] === ":" || imageName(match);
/**
 * The addresses of a text as the tree check reports them: not at an RFC 2606 name, not an image's name, and, in a line,
 * not followed by `:` (an SSH remote). A path has no `:`, so there that exception is dropped.
 */
const reportedAddresses = (text: string, inPath = false): Array<{ index: number; text: string }> =>
  addresses(text).filter((match) => !exampleAddress(match.text) && !(inPath ? imageName(match) : notAnAddress(text, match)));

/** A Markdown file, whose relative links the check follows. */
const MARKDOWN = /\.(?:md|mdx|markdown)$/i;
/** `](target)` with an optional title; `<target>` read without its brackets. */
// A target and a title never run past a `]`, which every later link opening holds, so a line of many `](` is read in
// one pass rather than one scan to the line's end from each.
const LINK = /\]\(\s{0,64}<?([^)\]\s>]{1,2048})>?(?:\s{1,64}[^)\]]{0,2048})?\)/g;
const SCHEME = /^[A-Za-z][A-Za-z0-9+.-]*:/;
/** A link target resolved against its file's folder; undefined when it climbs above the source's root. */
function resolveLink(file: string, target: string): string | undefined {
  let raw = target.replace(/[#?].*$/, "");
  try { raw = decodeURIComponent(raw); } catch { /* read as written */ }
  const base = raw.startsWith("/") ? [] : file.split("/").slice(0, -1);
  const parts = [...base];
  for (const segment of raw.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else parts.push(segment);
  }
  return parts.join("/");
}

/**
 * A symbolic link's target resolved against its folder, literally: split on `/`, with no `#` or `?` stripped and no
 * percent-decoding (a link names a path, not a URL); undefined when it climbs above the source's root.
 */
function resolveLinkTarget(file: string, target: string): string | undefined {
  const parts = file.split("/").slice(0, -1);
  for (const segment of target.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (parts.length === 0) return undefined;
      parts.pop();
    } else parts.push(segment);
  }
  return parts.join("/");
}

/** A root file named as a licence is: `LICENSE`, `LICENCE` or `COPYING`, with an extension or none, in any letter case. */
const LICENSE_FILE = /^(?:LICENSE|LICENCE|COPYING)(?:\..+)?$/i;

/**
 * DEC-0149 item 8, the reference tree check (kind `source-tree`): `{manifest, files: [{path, text?, binary?,
 * nestedRepository?, link?}], instanceStrings?}`, `nestedRepository: true` marking a folder that holds another
 * repository (a submodule's gitlink, its own `.git`), read by its path only, and `link: true` a symbolic link whose
 * `text` is its target, read with link-outside's rule (literally) and never a licence. The caller restricts `files` to the source; a file this check does not read as source is ignored.
 * Every problem names a place and a kind, never the text it found.
 */
export function sourceTreeProblems(value: unknown): SourceProblem[] {
  const input = isObject(value) ? value : {};
  const manifest = isObject(input.manifest) ? input.manifest : {};
  const problems: SourceProblem[] = [];
  const instance: Array<[number, RegExp[]]> = [];
  if (Array.isArray(input.instanceStrings)) {
    input.instanceStrings.forEach((entry: unknown, index: number) => {
      // An entry that is not well formed (a lone surrogate) has no encoded form: refused as a short one is, never thrown.
      if (typeof entry !== "string" || [...entry].length < 3 || LONE_SURROGATE.test(entry)) problems.push({ kind: "short-instance-string", entry: index });
      else instance.push([index, forms(entry)]);
    });
  }
  if (strings(manifest.include).length === 0) problems.push({ kind: "no-include" });
  const allowed = new Set(strings(manifest.publicAddresses).map(([address]) => address.toLowerCase()));
  const binaries = new Set(strings(manifest.binaries).map(([path]) => nfc(path)));
  // The manifest's lists are indexed once, so each path is looked up rather than compared with every entry.
  const isSource = sourcePathTest(manifest);
  const isNested = nestedTest(manifest);
  const unchecked = pathList(uncheckedPaths(manifest).map(([path]) => path));
  const files = (Array.isArray(input.files) ? input.files : [])
    .map((file: unknown, index: number) => [file, index] as const)
    .filter((pair): pair is readonly [JsonObject, number] =>
      isObject(pair[0]) && (pair[0].nestedRepository === true ? isNested(pair[0].path) : isSource(pair[0].path)));
  const sourcePaths = files.filter(([file]) => file.nestedRepository !== true).map(([file]) => file.path as string);
  // A file left out only because exclude is read folded is never read; it is said after the source files, by its path
  // and the entry that names it.
  const foldOnly = foldOnlyExcludeTest(manifest);
  const foldedOut = (Array.isArray(input.files) ? input.files : []).flatMap((file: unknown, index: number): SourceProblem[] => {
    if (!isObject(file) || file.nestedRepository === true) return [];
    const at = foldOnly(file.path);
    return at < 0 ? [] : [{ kind: "excluded-by-fold", file: index, exclude: at }];
  });
  // A resolved target has no trailing slash: the root, a source file, or a folder some source file lies in.
  // Every folder some source file lies in, built once per tree, so a link is looked up, never compared with each path.
  const sourceFolders = new Set(sourcePaths.flatMap((path) => nfc(path).split("/").slice(0, -1).map((_part, index, parts) => parts.slice(0, index + 1).join("/"))));
  const linkInside = (target: string): boolean => target === "" || isSource(target) || sourceFolders.has(nfc(target));

  for (const [file, index] of files) {
    const path = file.path as string;
    const binary = file.binary === true;
    if (homeAt(path) >= 0) problems.push({ kind: "home-path", file: index });
    if (credentialFile(path) || credentialAt(path) >= 0) problems.push({ kind: "credential", file: index });
    for (const [entry, patterns] of instance) if (firstOf(patterns, path) >= 0) problems.push({ kind: "instance-string", file: index, entry });
    // A nested repository would export as a link to another repository, or not at all; it has no text.
    if (file.nestedRepository === true) {
      problems.push({ kind: "nested-repository", file: index });
      continue;
    }
    // An unchecked file travels and is read by its path only.
    if (listCovers(unchecked, path)) continue;
    if (binary) {
      if (!binaries.has(nfc(path))) problems.push({ kind: "binary", file: index });
      continue;
    }
    const text = typeof file.text === "string" ? file.text : "";
    // A symbolic link (`link: true`, its target as `text`) is read with link-outside's rule: a target above the root,
    // absolute, or not a source path is a warning, since a source export does not carry what it points at.
    // The verdict is taken before the lines are read and said on line 1, in the table's order, once per kind.
    let linkOutside = false;
    if (file.link === true) {
      const resolved = text.startsWith("/") ? undefined : resolveLinkTarget(path, text);
      linkOutside = resolved === undefined || !linkInside(resolved);
    }
    const markdown = MARKDOWN.test(path);
    // Lines as an editor numbers them and the adapter reads them: split at LF, a trailing CR dropped.
    text.split("\n").map((raw) => (raw.endsWith("\r") ? raw.slice(0, -1) : raw)).forEach((line, at) => {
      const place = (kind: SourceFindingKind, column: number, extra: Partial<SourceProblem> = {}) =>
        problems.push({ kind, file: index, line: at + 1, column: column + 1, ...extra });
      const home = homeAt(line);
      if (home >= 0) place("home-path", home);
      const credential = credentialAt(line);
      if (credential >= 0) place("credential", credential);
      for (const [entry, patterns] of instance) {
        const found = firstOf(patterns, line);
        if (found >= 0) place("instance-string", found, { entry });
      }
      const urls = credential >= 0 ? credentialUrlSpans(line) : [];
      const inSecretUrl = (match: { index: number }) => urls.some(([start, stop]) => match.index >= start && match.index < stop);
      const address = addresses(line).find((match) => !allowed.has(match.text.toLowerCase()) && !exampleAddress(match.text) && !notAnAddress(line, match) && !inSecretUrl(match));
      if (address) place("email", address.index);
      if (markdown) {
        const outside = [...line.matchAll(LINK)].find((match) => {
          const target = match[1] as string;
          if (target.startsWith("#") || target.startsWith("//") || SCHEME.test(target)) return false;
          const resolved = resolveLink(path, target);
          return resolved === undefined || !linkInside(resolved);
        });
        if (outside) {
          place("link-outside", outside.index);
          // Line 1's link-outside is said once: the link's own verdict below is then already said.
          if (at === 0) linkOutside = false;
        }
      }
      if (at === 0 && linkOutside) place("link-outside", 0);
    });
  }
  problems.push(...foldedOut);
  // An include path names a file of the tree, or a folder one lies in: looked up, never compared with every path.
  const present = new Set(sourcePaths.map(nfc));
  const presentFolders = new Set([...present].flatMap(folderPrefixes));
  strings(manifest.include).forEach(([written, at]) => {
    const entry = nfc(written);
    if (!(entry.endsWith("/") ? presentFolders.has(entry) : present.has(entry))) problems.push({ kind: "missing", include: at });
  });
  // With `listed` (every path the tree holds, source or not, a folder written with a trailing `/`), an exclude entry
  // that names none of them, read folded, is said once: a misspelt entry would leave out nothing.
  if (Array.isArray(input.listed)) {
    const listed = strings(input.listed).map(([path]) => path).filter((path) => path.length <= 513).map((path) => foldPath(nfc(path)));
    const listedFiles = new Set(listed);
    const listedFolders = new Set(listed.flatMap(folderPrefixes));
    // An entry an excluded-by-fold line names leaves a file out, so it is never called unused.
    const naming = new Set(foldedOut.map((problem) => problem.exclude));
    strings(manifest.exclude).forEach(([written, at]) => {
      const entry = foldPath(nfc(written));
      // An entry without `/` names a file, and a folder too, since it leaves out everything beneath its name.
      if (!naming.has(at) && !(entry.endsWith("/") ? listedFolders.has(entry) : listedFiles.has(entry) || listedFolders.has(`${entry}/`))) problems.push({ kind: "unused-exclude", exclude: at });
    });
  }
  // A licence that is a symbolic link is no licence: the export carries the link, not the terms.
  const linked = new Set(files.filter(([file]) => file.link === true).map(([file]) => file.path as string));
  if (!sourcePaths.some((path) => !path.includes("/") && LICENSE_FILE.test(path) && !linked.has(path))) problems.push({ kind: "no-license" });
  return problems;
}

const MESSAGES: Readonly<Record<SourceFindingKind, string>> = {
  "home-path": "a path in a person's home folder belongs to the instance, never to the source",
  credential: "shaped like a credential: a key reaches the agent through its slot, never through the source",
  binary: "a binary file the manifest does not list in binaries: its content cannot be read, so it is source only when listed",
  "nested-repository": "a nested repository (a submodule or a folder holding its own .git): a source export would carry it as a link to another repository, or not at all; name it in exclude and check it in its own tree",
  "instance-string": "a string of the operator's list: the installation's own strings never travel",
  missing: "an include path names no file of the tree",
  "short-instance-string": "an instance string is a well-formed string of at least 3 characters; this one is not looked for",
  "no-include": "the source manifest names no include path, so nothing is source",
  email: "an e-mail address not listed in publicAddresses: a person's address belongs to the instance",
  "link-outside": "a link to a path outside the source: a source export does not carry its target",
  "no-license": "no licence file at the source's root (LICENSE, LICENCE or COPYING): a source export carries the licence files the source has, and the contract chooses none",
  "unused-exclude": "an exclude path names nothing the tree holds, in any letter case (an entry ending in / names a folder, and one over a symbolic link leaves the link in: write it without / to leave the link out; an entry without / names a file, a link or a folder and everything beneath that name): check its spelling, since it leaves nothing out",
  "excluded-by-fold": "an exclude path names this file only in another spelling (letter case, a Unicode form, a trailing dot or space): it is left out and never read, as a case-insensitive file system would leave it out; write the exclude path as the file is spelt"
};

/**
 * Whether a file is labelled `files[<index>]` though its path holds no finding: a path holding an e-mail address,
 * which is no finding in a path (as the adapter reads one) but is never printed either.
 */
export const labelledByIndex = (path: unknown): boolean => typeof path === "string" && reportedAddresses(path, true).length > 0;

/**
 * The tree check as findings: the blocking kinds under FAC-SEM-158 (rejected), the warnings under FAC-SEM-159
 * (accepted). A message names the file's path, line, column and kind; a file whose own path holds a finding is named
 * `files[<index>]`, so no message repeats what was found.
 */
export function checkSourceTree(value: unknown): Finding[] {
  const problems = sourceTreeProblems(value);
  const files = isObject(value) && Array.isArray(value.files) ? value.files : [];
  const inPath = (problem: SourceProblem) => problem.file !== undefined && problem.line === undefined && problem.kind !== "binary" && problem.kind !== "nested-repository";
  const named = new Set(problems.filter(inPath).map((problem) => problem.file));
  return problems.map((problem): Finding => {
    const blocking = BLOCKING_KINDS.includes(problem.kind);
    const pathOf = problem.file === undefined ? "" : show((files[problem.file] as JsonObject).path);
    // One path policy, as the checker's file column: a path that holds a finding (a long run read per segment) or an
    // address is labelled by its index.
    const label = problem.file === undefined ? undefined : named.has(problem.file) || labelledByIndex(pathOf) || pathHoldsFinding(pathOf) ? `files[${problem.file}]` : pathOf;
    const where = label === undefined ? "" : problem.line !== undefined ? `${label} line ${problem.line}, column ${problem.column}: ` : inPath(problem) ? `${label}, its path: ` : `${label}: `;
    const said = problem.kind !== "credential" || !inPath(problem) ? MESSAGES[problem.kind]
      : credentialFile(pathOf) ? "a credential file by its name (.env, a private key, a token file) is never source"
        : "the file's path holds a value shaped like a credential, which never travels in a source";
    const entry = problem.entry === undefined ? "" : ` (entry ${problem.entry} of the operator's list)`;
    const include = problem.include === undefined ? "" : ` (include[${problem.include}])`;
    const exclude = problem.exclude === undefined ? "" : ` (exclude[${problem.exclude}])`;
    const instancePath =
      problem.kind === "short-instance-string" ? `/instanceStrings/${problem.entry}`
        : problem.kind === "missing" ? `/manifest/include/${problem.include}`
          : problem.kind === "unused-exclude" ? `/manifest/exclude/${problem.exclude}`
          : problem.kind === "no-include" ? "/manifest/include"
            : problem.file === undefined ? "/files"
              : inPath(problem) ? `/files/${problem.file}/path` : `/files/${problem.file}`;
    const message = `${where}${problem.kind}: ${said}${entry}${include}${exclude}`;
    return blocking ? { code: "FAC-SEM-158", instancePath, message } : { code: "FAC-SEM-159", instancePath, message, severity: "accepted" };
  });
}
// #endregion source-tree-check

/**
 * FAC-SEM-156: a slot is named once, and neither its name nor its purpose is shaped like a credential (read as a
 * package secret's are, FAC-SEM-065's `secretValue`, so a slot packs cleanly, and as the tree check reads a line,
 * `credentialShaped`, as written and in its serialized JSON form, so what FAC-SEM-158 blocks in fabric.source.json this
 * blocks too); the manifest's description is not shaped
 * like one (read as prose, `proseSecretValue`); a store path is declared once. That a store slot has a path and no other slot has
 * one is the schema's.
 */
/** A name or path as a message names it: by its place when it is shaped like a credential, so no message repeats one. */
/**
 * A value a message may print: a string of at most 256 characters that holds no finding as it is; a number, a boolean
 * or null as its JSON; any other string, object or array by its place, never by its content.
 */
const named = (value: unknown, place: string, isPath = false): string => {
  // A long string, or one that holds a finding as written or with its white space folded (as a rendered line reads
  // it), goes by its place; a path value is read with the path rule (an address before a `:` is still one).
  if (typeof value === "string") {
    const held = (text: string) => holdsFinding(text) || (isPath && findingAt(text, true) >= 0);
    return value.length > 256 || held(value) || held(value.replace(/\s+/g, " ")) ? place : value;
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return JSON.stringify(value);
  return value === undefined ? "(none)" : `${place} (a value that is not a string)`;
};

function slotFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-156", instancePath, message });
  const names = new Set<unknown>();
  const stores = new Set<unknown>();
  // The manifest's own description is read as a slot's words are: a credential there is flagged, never repeated.
  if (typeof value.description === "string" && proseSecretValue(value.description)) flag("/description", "a manifest never holds a value: this looks like a credential");
  for (const [slot, index] of indexed(value.slots)) {
    if (names.has(slot.name)) flag(`/slots/${index}/name`, `slot ${named(slot.name, `slots[${index}]`)} is declared twice`);
    names.add(slot.name);
    // The message never repeats the value.
    for (const field of ["name", "purpose"] as const) {
      const text = slot[field];
      if (typeof text === "string" && (secretValue(text) || credentialShaped(text) || credentialShaped(JSON.stringify(text)))) flag(`/slots/${index}/${field}`, "a slot is named, never filled: this looks like a credential");
    }
    if (slot.kind === "store" && typeof slot.path === "string") {
      if (stores.has(slot.path)) flag(`/slots/${index}/path`, `store path ${named(slot.path, `slots[${index}].path`, true)} is declared twice`);
      stores.add(slot.path);
    }
  }
  return findings;
}

/**
 * FAC-SEM-157: each path is listed once in its list; no listed path has a `.git` segment; an `exclude` path lies inside
 * an `include` folder and is not an `include` path; a `binaries` path is a file of the source; an `unchecked` path is
 * a file of the source or a folder in it.
 */
function pathFindings(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-157", instancePath, message });
  const include = strings(value.include);
  for (const member of ["include", "exclude", "binaries"] as const) {
    const seen = new Set<string>();
    for (const [path, index] of strings(value[member])) {
      if (seen.has(path)) flag(`/${member}/${index}`, `${member}[${index}] is listed twice`);
      seen.add(path);
      if (inGit(path)) flag(`/${member}/${index}`, `${member}[${index}] lies in .git, which is never source`);
      if (SOURCE_PATH.test(path) && !SOURCE_PATH.test(nfc(path))) flag(`/${member}/${index}`, `${member}[${index}] is an entry NFC lengthens past 256 code points, so it names, reaches and removes nothing`);
    }
  }
  // Each list is indexed once: a path is looked up by itself and by each folder it lies in. `include` and `exclude` are
  // compared folded, as the source test reads exclude (an exclude spelt `SRC/gen/` removes `src/gen/`).
  const includes = pathList(value.include);
  const foldedIncludes = foldedList(value.include);
  const excludes = foldedList(value.exclude);
  const isSource = sourcePathTest(value);
  // An entry outside the path grammar (over 256 code points) lies in no folder an index holds: its prefixes are not built.
  const prefixesOf = (written: string): string[] => { const path = nfc(written); return SOURCE_PATH.test(path) ? folderPrefixes(foldPath(path)) : []; };
  for (const [written, index] of include) {
    const path = foldPath(nfc(written));
    const dead = prefixesOf(written).some((folder) => folder !== path && (excludes.folders.has(folder) || excludes.files.has(folder.slice(0, -1))));
    if (dead) flag(`/include/${index}`, `include[${index}] lies inside an exclude folder, so it names nothing`);
  }
  for (const [path, index] of strings(value.exclude)) {
    // An entry NFC lengthens past the grammar is said once above, not again with another reason.
    if (SOURCE_PATH.test(path) && !SOURCE_PATH.test(nfc(path))) continue;
    const folded = foldPath(nfc(path));
    // A bare entry also names everything beneath it, so it equals an include folder of its name.
    if (foldedIncludes.files.has(folded) || foldedIncludes.folders.has(folded) || foldedIncludes.folders.has(`${folded}/`)) flag(`/exclude/${index}`, `exclude[${index}] is an include path: it would remove it whole, so leave both out`);
    else if (!prefixesOf(path).some((folder) => foldedIncludes.folders.has(folder))) flag(`/exclude/${index}`, `exclude[${index}] lies inside no include folder, so it removes nothing`);
  }
  for (const [path, index] of strings(value.binaries)) {
    if (!inGit(path) && !isSource(path)) flag(`/binaries/${index}`, `binaries[${index}] is not a file of the source`);
  }
  const unchecked = new Set<string>();
  for (const [path, index] of uncheckedPaths(value)) {
    if (unchecked.has(path)) flag(`/unchecked/${index}/path`, `unchecked[${index}] is listed twice`);
    unchecked.add(path);
    if (!(path.endsWith("/") ? folderInSource(includes, excludes, path) : isSource(path))) flag(`/unchecked/${index}/path`, `unchecked[${index}] is not in the source`);
  }
  return findings;
}

/**
 * FAC-SEM-160 (`{source, package}`): the package's `secrets[]` are the source's `secret` slots, by name and `optional`,
 * always; its `state[]` paths are the source's `store` slots' paths, each compared as a set, when `state[]` holds any
 * entry (an absent or empty one is a copy packed without state); `pack` writes them from the source manifest.
 */
export function sourcePackageFindings(value: JsonObject): Finding[] {
  if (!isObject(value.source) || !isObject(value.package)) return [];
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-160", instancePath, message });
  const slots = list(value.source.slots);
  const secrets = new Map(slots.filter((slot) => slot.kind === "secret" && typeof slot.name === "string").map((slot) => [slot.name as string, slot.optional === true] as const));
  const slotPlace = new Map(indexed(value.source.slots).map(([slot, index]) => [slot.name, `slots[${index}]`] as const));
  const storePlace = new Map(indexed(value.source.slots).filter(([slot]) => slot.kind === "store").map(([slot, index]) => [slot.path, `slots[${index}]`] as const));
  const stores = new Set(slots.filter((slot) => slot.kind === "store" && typeof slot.path === "string").map((slot) => slot.path as string));
  const packaged = indexed(value.package.secrets);
  // The package's secret names and state paths, looked up by name and path rather than compared with every entry.
  const packagedNames = new Set(packaged.map(([entry]) => entry.name));
  for (const [name] of secrets) {
    if (!packagedNames.has(name)) flag("/package/secrets", `the source's secret slot ${named(name, slotPlace.get(name) as string)} is not in the package's secrets[]`);
  }
  for (const [entry, index] of packaged) {
    const optional = secrets.get(entry.name as string);
    const place = `secrets[${index}]`;
    if (typeof entry.name !== "string" || optional === undefined) flag(`/package/secrets/${index}/name`, `secret ${named(entry.name, place)} is no secret slot of the source`);
    else if (optional !== (entry.optional === true)) flag(`/package/secrets/${index}/optional`, `secret ${named(entry.name, place)} is ${optional ? "" : "not "}optional in the source`);
  }
  const state = indexed(value.package.state);
  // An absent or empty state[] is a copy packed without state (a colleague's copy, package.md): it passes.
  if (!Array.isArray(value.package.state) || value.package.state.length === 0) return findings;
  const statePaths = new Set(state.map(([entry]) => entry.path));
  for (const path of stores) {
    if (!statePaths.has(path)) flag("/package/state", `the source's store path ${named(path, `${storePlace.get(path) as string}.path`, true)} is not in the package's state[]`);
  }
  for (const [entry, index] of state) {
    if (typeof entry.path !== "string" || !stores.has(entry.path)) flag(`/package/state/${index}/path`, `state ${named(entry.path, `state[${index}]`, true)} is no store slot of the source`);
  }
  return findings;
}

export function sourceRules(kind: string, value: JsonObject): Finding[] | undefined {
  if (kind === "source-manifest") return [...slotFindings(value), ...pathFindings(value)];
  if (kind === "source-tree") return checkSourceTree(value);
  if (kind === "source-package") return sourcePackageFindings(value);
  return undefined;
}
// #endregion source-rules
