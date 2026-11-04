// #region secret-shape — docs: docs/specification/profiles.md#no-secret-in-a-command-line
/**
 * The one credential detector of this kit (DEC-0044): a name that can only carry a credential (DEC-0041, FL-4), a
 * value shaped like one, a launch argument that carries one (session-handoff/1 SH-10) and a URL that does (LC-21).
 * `fabric://` links (`src/fabric-links.ts`, FAC-SEM-052) and declared command lines (`src/semantic-rules.ts`,
 * FAC-SEM-057) use it. `src/session-handoff.ts` keeps a copy, because its vendors take that file alone and run it
 * without this kit; `test/session-handoff-review.test.ts` checks that the copy agrees with this module. Vendors that
 * re-sync on a change (DEC-0151): Fabric vendors this file twice, one copy under a sha256 `pin.json` together with
 * `fixtures/vectors/folder-attribution.json`; Fabric Dashboards vendors `src/session-handoff.ts` and
 * `src/fabric-links.ts`, and its service host's connections hold a port; Fabric Dashboards' sample-service kit copies
 * hold the earlier pattern.
 */

/**
 * A name's words: split at `.`, `_`, `-` and camelCase humps, lowercased — `refreshToken_v2-Id` is
 * `refresh token v2 id` and `APIKey` is `api key`. A credential word must be a whole word of the name, so
 * `themeCode`, `sortKey` and `tokenizer` are harmless (DEC-0041, CO-260).
 */
export function nameWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
}
/**
 * A name holding one of these words can only carry a credential (FL-4): the words, and the glued forms a name
 * written in one case (`accesstoken`, `sessionid`) leaves unsplit.
 */
export const CREDENTIAL_WORDS = [
  "token", "secret", "password", "passwd", "pass", "passphrase", "credential", "credentials", "cookie", "authorization",
  "bearer", "jwt", "otp", "apikey", "signature", "sig",
  "accesstoken", "idtoken", "authtoken", "refreshtoken", "sessionid", "sessiontoken", "logincode", "authcode", "privatekey",
  "clientsecret", "secretkey", "accesskey"
] as const;
/**
 * Words that carry a credential only beside a partner word in the same name (`api_key`, `authCode`, `sessionId`),
 * or as the whole name (`key`, `auth`, `session`, `code`): `sortKey`, `authorName` and `sessionLength` pass.
 */
export const CREDENTIAL_PAIRS: Readonly<Record<string, readonly string[]>> = {
  key: ["private", "api", "access", "secret", "session", "auth", "signing", "encryption", "master", "client", "login", "refresh"],
  auth: ["token", "code", "header"],
  session: ["token", "id"],
  code: ["login", "auth", "access", "session"]
};
/** A name's words, each also in the singular when it ends in `s`: `apiKeys` is `api key`, `secrets` is `secret`. */
const withSingulars = (words: string[]): string[] => [...words, ...words.filter((word) => word.length > 2 && word.endsWith("s")).map((word) => word.slice(0, -1))];
/** Whether a name — a parameter, a header, an environment variable, a config key — can only carry a credential. */
export function credentialName(name: string): boolean {
  const split = nameWords(name);
  const words = withSingulars(split);
  if (words.some((word) => (CREDENTIAL_WORDS as readonly string[]).includes(word))) return true;
  if (split.length === 1 && words.some((word) => Object.hasOwn(CREDENTIAL_PAIRS, word))) return true;
  return Object.entries(CREDENTIAL_PAIRS).some(([word, partners]) => words.includes(word) && partners.some((partner) => words.includes(partner)));
}

/** A JWT or JWS anywhere in a value: three base64url segments, the first a JSON object's `eyJ`. */
export const JWT_SHAPE = /eyJ[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]*/;
/**
 * A value that says it is a credential (`Bearer ` at its start, in any case), or a provider key's shape (OpenAI,
 * GitHub, Slack, AWS, GitLab) with its prefix in its canonical case only: `SK-` or `GHP_` is no key (DEC-0151 item 7).
 * A prefix counts only at the start of a value, after a character that is no ASCII letter or digit, or after an
 * escape: a percent-escape (`%22`) or a double one (`%2522`), a backslash escape (`\n`, `\t`, `\r`, `\"`, `\'`, `\b`,
 * `\f`, `\v`, `\0`, `\a`, `\e`), an octal (`\042`), `\x` with two hex digits, `\u` with four, or an ESC colour
 * sequence, raw or escaped (`\u001b[`, `\x1b[`, `\e[`, `\033[`, digits and `;`, `m`). It is matched as a consuming
 * group so a port without look-behind reads it the same; a key glued right after a letter or digit is knowingly not
 * found. An `sk-` key holds what `src/connections.ts` asks of one, within 256 characters: a digit and an upper-case
 * letter with 16 or more characters, or a digit with 32 or more. Its two look-aheads are bounded to 255 characters,
 * read lazily, so a long run of `sk-` prefixes is read in linear time. So `project:helpdesk-customer-support`,
 * `project:sk-learn-experiments` and `sk-learn-experiments-2026` are no keys, and `sk-or-v1-` with 64 lower-case hex
 * digits is one. A port whose regex has no look-ahead (Rust's `regex` crate) checks that strength outside the regex.
 */
export const SECRET_VALUE = /(^[Bb][Ee][Aa][Rr][Ee][Rr]\s.+|(?:^|[^A-Za-z0-9]|%[0-9A-Fa-f]{2}|\\[nrt"']|\\u[0-9A-Fa-f]{4}|\\x[0-9A-Fa-f]{2}|\\[bfv0ae]|\\[0-7]{1,3}|%25[0-9A-Fa-f]{2}|\x1b\[[0-9;]*m|(?:\\u001[bB]|\\x1[bB]|\\e|\\033)\[[0-9;]*m)(?:sk-(?=[A-Za-z0-9_-]{0,255}?\d)(?:(?=[A-Za-z0-9_-]{0,255}?[A-Z])[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{32,})|gh[pousr]_[A-Za-z0-9]{20,}|xox[abposr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|glpat-[A-Za-z0-9_-]{20,}))/;
/**
 * A long secret: 40 or more characters of base64 or base64url (`+`, `/`, `=`, `-`, `_` included), mixing upper case,
 * lower case and digits. A hex digest is lower case and passes.
 */
const LONG_RUN = /[A-Za-z0-9+/=_-]{40,}/g;
export const longSecret = (value: string) => (value.match(LONG_RUN) ?? []).some((run) => /[a-z]/.test(run) && /[A-Z]/.test(run) && /[0-9]/.test(run));
/** Whether a value could be a credential: a JWT anywhere, a provider key or `Bearer …`, or a long secret-shaped run. */
export const secretValue = (value: string): boolean => JWT_SHAPE.test(value) || SECRET_VALUE.test(value) || longSecret(value);

/**
 * `Bearer <token>` inside a longer value (`--header=Authorization: Bearer …`): a token of 12 or more token characters
 * holding a digit, so prose ("the Bearer token refresh bug", "the Bearer authentication scheme") passes.
 */
export const BEARER_INSIDE = /\bbearer\s+(?=[A-Za-z0-9._~+/-]*\d)[A-Za-z0-9._~+/-]{12,}=*/i;
/** A path or a URL by its start: `/…`, `~/…`, `./…`, `C:\…`, `scheme://…`. */
const PATH_LIKE = /^(?:[/~.]|[A-Za-z]:[\\/]|[a-z][a-z0-9+.-]*:\/\/)/i;
/**
 * Whether a piece is a path or a URL, whose separators split it: it starts like one, or it holds a separator and
 * either ends with a file extension or has a lower-case word for a segment (`sessions/…`, `apps/Desktop/src`). A
 * base64 secret's segments are mixed-case runs, so `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` stays one value.
 */
const pathLike = (piece: string): boolean =>
  PATH_LIKE.test(piece) ||
  (/[\\/]/.test(piece) && (/\.[A-Za-z0-9]{1,8}$/.test(piece) || piece.split(/[\\/]/).some((segment) => /^[a-z][a-z0-9_-]{2,}$/.test(segment))));
/**
 * The same, for a launch argument or a server's command and URL, which carry paths: a long run is looked for
 * between path separators, so a folder path holding a session id is not taken for a key.
 */
export const secretArgument = (value: string): boolean =>
  JWT_SHAPE.test(value) || SECRET_VALUE.test(value) || BEARER_INSIDE.test(value) ||
  value.split(/[\s=]/).some((piece) => (pathLike(piece) ? piece.split(/[\\/]/).some((part) => longSecret(part)) : longSecret(piece)));

/** Percent-decode and keep `+` as `+`: `URLSearchParams` turns a raw `+` into a space, which would split a base64 run. */
const decodeKeepingPlus = (raw: string): string => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
/** Each query or fragment piece's raw value, by its decoded name: what `URLSearchParams` hands over, with `+` kept. */
export function rawValues(query: string): Map<string, string[]> {
  const values = new Map<string, string[]>();
  for (const piece of query.split("&")) {
    if (piece === "") continue;
    const at = piece.indexOf("=");
    const name = [...new URLSearchParams(at < 0 ? piece : piece.slice(0, at)).keys()][0] ?? "";
    values.set(name, [...(values.get(name) ?? []), at < 0 ? "" : decodeKeepingPlus(piece.slice(at + 1))]);
  }
  return values;
}
/**
 * Whether a URL an MCP entry or a launch names carries a credential (LC-21): anything `secretArgument` finds in it,
 * a password in its user information, or a query or fragment parameter whose name can only carry a credential and
 * has a value, or whose value is shaped like one. `?api_key=…` is refused whatever the value, `?key=` left empty
 * and `?sort=key` are not. A string that is not an absolute URL is checked as an argument only.
 */
export function secretUrl(value: string): boolean {
  if (secretArgument(value)) return true;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.password !== "") return true;
  for (const part of [url.search, url.hash]) {
    for (const [name, values] of rawValues(part.slice(1))) {
      if (values.some((raw) => (raw !== "" && credentialName(name)) || secretValue(raw))) return true;
    }
  }
  return false;
}
// #endregion secret-shape
