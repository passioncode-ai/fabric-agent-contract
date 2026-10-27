/**
 * The generator of the local channel vectors (DEC-0075, DEC-0143): `fixtures/vectors/local-channel.json`, shared by
 * every node that serves the channel and every client that speaks it.
 *
 *   tsx tools/vectors/local-channel.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/local-channel.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/local-channel.test.ts` runs the
 * check. Every answer and outcome is written by hand from local-channel.md; nothing here imports
 * `src/local-channel.ts`, so the gate checks that the reference answers what this file expects.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

export const VECTOR_FILE = "fixtures/vectors/local-channel.json";

type Json = Record<string, unknown>;
const PROTOCOL = "fabric-local-channel/0.1";
const CLIENT = { name: "example-app", version: "1.0.0" };
const hello = (capabilities?: string[]) => ({ jsonrpc: "2.0", id: 1, method: "channel.hello", params: { protocols: [PROTOCOL], client: CLIENT, ...(capabilities ? { capabilities } : {}) } });
/** One answer as a vector reads it: `code` null when nothing is answered, `hello` and `capabilities` the state after. */
const answer = (ok: boolean, code: string | null, hello: boolean, capabilities?: string[]) => ({ ok, code, hello, ...(capabilities ? { capabilities } : {}) });

/** A session from its start: the peer check's result, the messages in order, the answer to each, and what the node may send after. */
function sessions(): Json[] {
  const list: Array<[string, boolean | string | undefined, unknown[], Json[], { mayPrompt: boolean; maySecretPrompt: boolean }]> = [
    ["a signed app declares both: admitted for consent and secrets", true, [hello(["consent.ui", "secret.ui"])], [answer(true, null, true, ["consent.ui", "secret.ui"])], { mayPrompt: true, maySecretPrompt: true }],
    ["an unverified peer declares secret.ui: forbidden, then a hello without it is accepted", undefined, [hello(["consent.ui", "secret.ui"]), hello(["consent.ui"])], [answer(false, "forbidden", false), answer(true, null, true, ["consent.ui"])], { mayPrompt: true, maySecretPrompt: false }],
    ["a peer the check refused: forbidden", false, [hello(["secret.ui"])], [answer(false, "forbidden", false)], { mayPrompt: false, maySecretPrompt: false }],
    ["a check result that is not true: forbidden", "yes", [hello(["secret.ui"])], [answer(false, "forbidden", false)], { mayPrompt: false, maySecretPrompt: false }],
    ["a signed app that declares only consent.ui is never sent a secret prompt", true, [hello(["consent.ui"])], [answer(true, null, true, ["consent.ui"])], { mayPrompt: true, maySecretPrompt: false }],
    ["a capability the contract does not name: invalid-params, then a retry is accepted", true, [hello(["camera.ui"]), hello(["secret.ui"])], [answer(false, "invalid-params", false), answer(true, null, true, ["secret.ui"])], { mayPrompt: false, maySecretPrompt: true }],
    ["a second hello after an accepted one: invalid-request, the first stands", true, [hello(["secret.ui"]), hello(["consent.ui"])], [answer(true, null, true, ["secret.ui"]), answer(false, "invalid-request", true, ["secret.ui"])], { mayPrompt: false, maySecretPrompt: true }],
    ["a client that sends the node's own secret.prompt: hello-first before hello, unknown-method after", true,
      [{ jsonrpc: "2.0", id: 2, method: "secret.prompt", params: {} }, hello(["secret.ui"]), { jsonrpc: "2.0", id: 3, method: "secret.prompt", params: {} }],
      [answer(false, "hello-first", false), answer(true, null, true, ["secret.ui"]), answer(false, "unknown-method", true, ["secret.ui"])], { mayPrompt: false, maySecretPrompt: true }],
    ["secret.cancel is a notification: never answered", true, [hello(["secret.ui"]), { jsonrpc: "2.0", method: "secret.cancel", params: { requestId: "r-1" } }], [answer(true, null, true, ["secret.ui"]), answer(false, null, true, ["secret.ui"])], { mayPrompt: false, maySecretPrompt: true }]
  ];
  return list.map(([name, signedApp, messages, answers, after]) => ({ name, ...(signedApp === undefined ? {} : { signedApp }), messages, answers, after }));
}

/** SP-5: what the agent learns, from the prompt's time, its deadline (a withdrawal's time when the request was withdrawn), the answers by the node's receipt time and whether the node confirmed the write. */
function outcomes(): Json[] {
  const T = 1_761_552_000_000; // 2025-10-27T08:00:00Z, in milliseconds
  const MIN = 60_000;
  const list: Array<[string, number, Array<{ at: number; outcome: string }>, boolean, string]> = [
    ["stored, and the node saw the write", T + 10 * MIN, [{ at: T + MIN, outcome: "stored" }], true, "stored"],
    ["stored, but the node saw no write", T + 10 * MIN, [{ at: T + MIN, outcome: "stored" }], false, "unconfirmed"],
    ["declined", T + 10 * MIN, [{ at: T + MIN, outcome: "declined" }], false, "declined"],
    ["the first answer wins, by the node's receipt time", T + 10 * MIN, [{ at: T + 2 * MIN, outcome: "stored" }, { at: T + MIN, outcome: "declined" }], true, "declined"],
    ["an answer at the prompt's own time counts", T + 10 * MIN, [{ at: T, outcome: "stored" }], true, "stored"],
    ["an answer at the deadline counts", T + 10 * MIN, [{ at: T + 10 * MIN, outcome: "stored" }], true, "stored"],
    ["a late answer is ignored", T + 10 * MIN, [{ at: T + 10 * MIN + 1, outcome: "stored" }], true, "no-answer"],
    ["an answer before the prompt is ignored", T + 10 * MIN, [{ at: T - 1, outcome: "stored" }], true, "no-answer"],
    ["no answer", T + 10 * MIN, [], false, "no-answer"],
    ["an outcome the result does not name is no answer", T + 10 * MIN, [{ at: T + MIN, outcome: "cancelled" }], false, "no-answer"],
    ["a deadline more than 10 minutes after the prompt", T + 10 * MIN + 1, [{ at: T + MIN, outcome: "stored" }], true, "no-answer"],
    ["a deadline at or before the prompt", T, [{ at: T, outcome: "stored" }], true, "no-answer"],
    ["withdrawn before an answer: the cancel time is the deadline", T + 2 * MIN, [{ at: T + 3 * MIN, outcome: "stored" }], true, "no-answer"],
    ["withdrawn after an answer: the answer stands", T + 2 * MIN, [{ at: T + MIN, outcome: "declined" }], false, "declined"]
  ];
  return list.map(([name, deadline, answers, written, expect]) => ({ name, promptedAt: T, deadline, answers, written, expect }));
}

export function localChannelVectors(): Json {
  return {
    about: "Vectors for fabric-local-channel/0.1 (DEC-0075, DEC-0143), written by tools/vectors/local-channel.ts, never by hand. `sessions`: from a fresh session (hello false, accepted [fabric-local-channel/0.1], signedApp as given: the node's own operating-system check of the peer, absent when it made none), channelStep over `messages` in order answers each as `answers` says ({ok, code, hello, capabilities?}: code null when nothing is answered, hello and capabilities the session after), and then mayPrompt and maySecretPrompt answer as `after` says. `outcomes`: secretOutcome(promptedAt, deadline, answers, written), times in milliseconds by the node's receipt time; a withdrawn request passes the withdrawal's time as its deadline (SP-3).",
    sessions: sessions(),
    outcomes: outcomes()
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildLocalChannelVectors(): string {
  return `${JSON.stringify(localChannelVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildLocalChannelVectors();
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
