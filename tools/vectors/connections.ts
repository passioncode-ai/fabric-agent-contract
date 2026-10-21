/**
 * The generator of the connections vectors (DEC-0096): `fixtures/vectors/connections.json`, shared by every host that
 * reads a service's `extensions/connections/0.1` and every kit that writes it.
 *
 *   tsx tools/vectors/connections.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/connections.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected answer is written below by
 * hand from DEC-0096; nothing here imports `src/connections.ts`, so the gate checks that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/connections.json";
const KEY = "https://fabric.passioncode.ai/agent-contract/extensions/connections/0.1";

const notify = { id: "notify", kind: "service", target: "example-notifier.default", capability: "notifier.send", state: "ok", lastAt: "2026-10-20T09:00:00Z" };
const telegram = { id: "telegram", kind: "connector", target: "telegram", purpose: "reads the operator chat", state: "degraded", reason: "flood wait 30 s" };
const model = { id: "writer", kind: "model", target: "openrouter/xiaomi/mimo-v2.6-pro", state: "unknown" };
const doc = (value: unknown, degraded: unknown[] = []) => ({ extensions: { [KEY]: value }, degraded });
const view = (connections: Json[]) => ({ declared: true, reported: false, connections });
const REPORTED = { declared: false, reported: true };
const NONE = { declared: false, reported: false, connections: [] };

function cases(): Json[] {
  const fake = ["sk", "-", "A1".repeat(12)].join("");
  const bearer = ["abc123", "def456", "ghi789"].join("");
  // Lower-case like an OpenRouter key, but not its `sk-or-v1-` form, which the host's push protection blocks.
  const awsSecret = ["wJalrXUtnFEMI", "K7MDENG", "bPxRfiCYEXAMPLEKEY"].join("/");
  const routerKey = ["sk", "-", "abc0123def4567".repeat(3)].join("");
  const ghToken = ["ghp", "_", "a1b2c3d4e5f6g7h8i9j0k1"].join("");
  const botSecret = "AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX";
  const botToken = ["bot", "123456789", ":", "AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsawX"].join("");
  const jwt = ["eyJhbGciOiJIUzI1NiJ9", "eyJzdWIiOiJ4In0", "c2lnbmF0dXJl"].join(".");
  const list: Array<[string, unknown, Json]> = [
    ["no key: nothing declared", { extensions: {} }, NONE],
    ["not a document: nothing declared", null, NONE],
    ["an empty list is declared", doc({ connections: [] }), view([])],
    ["a service, a connector and a model; a degraded source marks its connection failing", doc({ connections: [notify, telegram, model] }, [{ source: "telegram", reason: "flood wait" }]), view([{ ...notify, failing: false }, { ...telegram, failing: true }, { ...model, failing: false }])],
    ["an id named twice", doc({ connections: [notify, { ...telegram, id: "notify" }] }), REPORTED],
    ["capability on a connector", doc({ connections: [{ ...telegram, capability: "telegram.read" }] }), REPORTED],
    ["an unknown kind", doc({ connections: [{ ...telegram, kind: "queue" }] }), REPORTED],
    ["an unknown state", doc({ connections: [{ ...telegram, state: "broken" }] }), REPORTED],
    ["an extra member (a call count is the usage report's)", doc({ connections: [{ ...notify, calls: 12 }] }), REPORTED],
    ["a reason on two lines", doc({ connections: [{ ...telegram, reason: "flood\nwait" }] }), REPORTED],
    ["a credential in a target", doc({ connections: [{ ...telegram, target: `https://api.example.com/?token=${fake}` }] }), REPORTED],
    ["a credential in a reason", doc({ connections: [{ ...telegram, reason: `key ${fake} refused` }] }), REPORTED],
    ["an id of 64 characters is declared", doc({ connections: [{ ...model, id: "a".repeat(64) }] }), view([{ ...model, id: "a".repeat(64), failing: false }])],
    ["an id of 65 characters", doc({ connections: [{ ...model, id: "a".repeat(65) }] }), REPORTED],
    ["an upper-case id", doc({ connections: [{ ...model, id: "Writer" }] }), REPORTED],
    ["a name that holds sk- inside a word is no credential", doc({ connections: [{ ...notify, id: "flask", target: "flask-server-production.default", purpose: "risk-assessment-builder" }] }), view([{ ...notify, id: "flask", target: "flask-server-production.default", purpose: "risk-assessment-builder", failing: false }])],
    ["a URL with a password", doc({ connections: [{ ...telegram, target: "postgres://user:pw@db.example.com/app" }] }), REPORTED],
    ["a capability with a hyphen (DEC-0020)", doc({ connections: [{ ...notify, capability: "fabric.job-get" }] }), view([{ ...notify, capability: "fabric.job-get", failing: false }])],
    ["a one-character capability", doc({ connections: [{ ...notify, capability: "x" }] }), REPORTED],
    ["a service target that is no key or product id", doc({ connections: [{ ...notify, target: "Example-Notifier.default" }] }), REPORTED],
    ["a service target that is a URL", doc({ connections: [{ ...notify, target: "https://example.com/a" }] }), REPORTED],
    ["a product id as a service target", doc({ connections: [{ ...notify, target: "example-notifier" }] }), view([{ ...notify, target: "example-notifier", failing: false }])],
    ["a connector target with a space", doc({ connections: [{ ...telegram, target: "Google Ads" }] }), REPORTED],
    ["a lastAt that is a date only", doc({ connections: [{ ...notify, lastAt: "2026-10-20" }] }), REPORTED],
    ["65 connections", doc({ connections: Array.from({ length: 65 }, (_, n) => ({ ...model, id: `m${n}` })) }), REPORTED],
    ["a URL with a password inside a reason", doc({ connections: [{ ...telegram, reason: "see postgres://user:pw@db.example.com/app" }] }), REPORTED],
    ["a URL with an api_key inside a purpose", doc({ connections: [{ ...telegram, purpose: "refused at https://api.example.com/v1?api_key=abcdefabcdef" }] }), REPORTED],
    ["a URL without a credential inside a purpose is declared", doc({ connections: [{ ...telegram, purpose: "reads https://api.telegram.org/bot/getUpdates" }] }), view([{ ...telegram, purpose: "reads https://api.telegram.org/bot/getUpdates", failing: false }])],
    ["bearer as a word is no credential", doc({ connections: [{ ...telegram, purpose: "calls the API with bearer authentication" }] }), view([{ ...telegram, purpose: "calls the API with bearer authentication", failing: false }])],
    ["Bearer and a token in a reason", doc({ connections: [{ ...telegram, reason: `sent Bearer ${bearer} and was refused` }] }), REPORTED],
    ["a key as a whole target", doc({ connections: [{ ...telegram, target: fake }] }), REPORTED],
    ["a key in a label", doc({ connections: [{ ...telegram, label: `uses ${fake}` }] }), REPORTED],
    ["a JWT in a purpose", doc({ connections: [{ ...telegram, purpose: `signs ${jwt}` }] }), REPORTED],
    ["a label of 300 characters is declared", doc({ connections: [{ ...model, label: "a".repeat(300) }] }), view([{ ...model, label: "a".repeat(300), failing: false }])],
    ["a label of 301 characters", doc({ connections: [{ ...model, label: "a".repeat(301) }] }), REPORTED],
    ["degraded entries that are not objects are ignored", doc({ connections: [telegram] }, [null, 5, "telegram", { source: 5 }]), view([{ ...telegram, failing: false }])],
    ["failing follows the id, not the target", doc({ connections: [{ ...telegram, id: "tg-reader" }, { ...model, id: "chat", target: "telegram" }] }, [{ source: "tg-reader" }, { source: "openrouter/xiaomi/mimo-v2.6-pro" }]), view([{ ...telegram, id: "tg-reader", failing: true }, { ...model, id: "chat", target: "telegram", failing: false }])],
    ["a key-shaped id", doc({ connections: [{ ...model, id: ghToken }] }), REPORTED],
    ["a key-shaped capability", doc({ connections: [{ ...notify, capability: `x.${ghToken}` }] }), REPORTED],
    ["an sk- name without a digit is no credential", doc({ connections: [{ ...model, id: "sk-learn-classifier", label: "sk-learn-classifier-model" }] }), view([{ ...model, id: "sk-learn-classifier", label: "sk-learn-classifier-model", failing: false }])],
    ["a password with a bracket", doc({ connections: [{ ...telegram, target: "postgres://app:pa(ss@db.example.com/app" }] }), REPORTED],
    ["a password ending in a bracket inside a purpose", doc({ connections: [{ ...model, purpose: "uses mysql://root:x)y2z@10.0.0.4:3306." }] }), REPORTED],
    ["a password with a quote at the end of a sentence", doc({ connections: [{ ...model, reason: 'see redis://:a"b@cache:6379.' }] }), REPORTED],
    ["a password on an IPv6 host", doc({ connections: [{ ...telegram, target: "redis://:secret@[::1]" }] }), REPORTED],
    ["a password on an IPv6 host at the end of a sentence", doc({ connections: [{ ...telegram, reason: "refused by http://user:pw@[2001:db8::1]." }] }), REPORTED],
    ["an IPv6 URL without a credential is declared", doc({ connections: [{ ...telegram, purpose: "(see https://[::1]/docs)." }] }), view([{ ...telegram, purpose: "(see https://[::1]/docs).", failing: false }])],
    ["two URLs glued together, the second with a password", doc({ connections: [{ ...telegram, purpose: "docs https://a.example/(x)https://u:p@b.example and https://a.example,https://v:q@c.example" }] }), REPORTED],
    ["an api_key whose value is punctuation", doc({ connections: [{ ...telegram, purpose: "uses https://ex.com/?api_key=!?" }] }), REPORTED],
    ["a key shape inside a word is no credential", doc({ connections: [{ ...telegram, label: `x${ghToken}` }] }), view([{ ...telegram, label: `x${ghToken}`, failing: false }])],
    ["names that look like keys but are not", doc({ connections: [{ ...model, label: "SK-Telecom-api-v2-gateway", purpose: "py-sk-learn-classifier-v2", reason: "release 20261021:connections-extension-reader-v2" }] }), view([{ ...model, label: "SK-Telecom-api-v2-gateway", purpose: "py-sk-learn-classifier-v2", reason: "release 20261021:connections-extension-reader-v2", failing: false }])],
    ["an api_key value in brackets inside a reason", doc({ connections: [{ ...telegram, reason: "refused (https://ex.com/?api_key=(abcd))" }] }), REPORTED],
    ["a URL in brackets or quotes without a credential is declared", doc({ connections: [{ ...telegram, purpose: "reads (https://example.com/docs), see 'https://example.com/a'." }] }), view([{ ...telegram, purpose: "reads (https://example.com/docs), see 'https://example.com/a'.", failing: false }])],
    ["a Telegram bot token in a URL path", doc({ connections: [{ ...telegram, purpose: `calls https://api.telegram.org/${botToken}/getUpdates` }] }), REPORTED],
    ["a lower-case key of 32 or more characters (as an OpenRouter key is)", doc({ connections: [{ ...model, label: `key ${routerKey}` }] }), REPORTED],
    ["a short lower-case sk- name with a digit is no credential", doc({ connections: [{ ...model, target: "sk-prod-eu-west-1-db" }] }), view([{ ...model, target: "sk-prod-eu-west-1-db", failing: false }])],
    ["an sk- name with an upper-case letter and no digit is no credential", doc({ connections: [{ ...model, label: "sk-Learn-Classifier-Model-X" }] }), view([{ ...model, label: "sk-Learn-Classifier-Model-X", failing: false }])],
    ["a bot id and 35 upper-case characters is no credential", doc({ connections: [{ ...model, label: `123456789:${"A".repeat(35)}` }] }), view([{ ...model, label: `123456789:${"A".repeat(35)}`, failing: false }])],
    ["a ticket id and a title is no credential", doc({ connections: [{ ...model, label: "Task 123456789:Implement-the-Connections-tab-reader-for-version-two" }] }), view([{ ...model, label: "Task 123456789:Implement-the-Connections-tab-reader-for-version-two", failing: false }])],
    ["an upper-case scheme with a password", doc({ connections: [{ ...telegram, reason: "see HTTPS://user:pw@db.example.com/app" }] }), REPORTED],
    ["two URLs glued together, the first with a password", doc({ connections: [{ ...telegram, purpose: "https://u:p@a.example,https://b.example/docs" }] }), REPORTED],
    ["an AWS access key id", doc({ connections: [{ ...telegram, label: `uses ${["AKIA", "IOSFODNN7EXAMPLE"].join("")}` }] }), REPORTED],
    ["a GitLab token", doc({ connections: [{ ...telegram, label: `uses ${["glpat", "-", "notarealtokennotreal"].join("")}` }] }), REPORTED],
    ["a Slack token", doc({ connections: [{ ...telegram, label: `uses ${["xoxb", "-", "notarealtoken"].join("")}` }] }), REPORTED],
    ...[")", "]", "}", ">", '"', "'", ".", ",", ";", ":", "!", "?"].map((closing): [string, unknown, Json] => [`a password on an IPv6 host followed by ${closing}${closing}`, doc({ connections: [{ ...telegram, reason: `refused by http://u:p@[::1]${closing}${closing}` }] }), REPORTED]),
    ["a 40-character run mixing cases and digits (an AWS secret access key shape)", doc({ connections: [{ ...telegram, reason: `signed with ${awsSecret}` }] }), REPORTED],
    ["a commit URL with a hex digest is declared", doc({ connections: [{ ...telegram, purpose: `pinned at https://github.com/o/r/commit/${"c55f2d5a11".repeat(4)}` }] }), view([{ ...telegram, purpose: `pinned at https://github.com/o/r/commit/${"c55f2d5a11".repeat(4)}`, failing: false }])],
    ["a bot secret of 34 characters", doc({ connections: [{ ...model, label: `token ${["110201543", ":", "AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw"].join("")}` }] }), REPORTED],
    ["Bearer and a short token is no credential", doc({ connections: [{ ...telegram, reason: "Bearer abc12 refused" }] }), view([{ ...telegram, reason: "Bearer abc12 refused", failing: false }])],
    ["a provider/model id with a long mixed name is declared", doc({ connections: [{ ...model, target: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", purpose: "embeds with sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2" }] }), view([{ ...model, target: "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", purpose: "embeds with sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", failing: false }])],
    ["a commit URL with an upper-case owner is declared", doc({ connections: [{ ...telegram, purpose: `pinned at https://github.com/Microsoft/TypeScript/commit/${"c55f2d5a11".repeat(4)}` }] }), view([{ ...telegram, purpose: `pinned at https://github.com/Microsoft/TypeScript/commit/${"c55f2d5a11".repeat(4)}`, failing: false }])],
    ["a 40-character slug mixing cases and digits across hyphens", doc({ connections: [{ ...model, target: "store", label: "Prod-Analytics-Warehouse-EU-West-1-Replica" }] }), REPORTED],
    ...([
      ["sk- and 15 characters with an upper-case letter and a digit", `sk-${"Ab1".repeat(5)}`, false],
      ["sk- and 16 characters with an upper-case letter and a digit", `sk-${"Ab1".repeat(5)}C`, true],
      ["sk- and 31 lower-case characters with a digit", `sk-${"a1".repeat(15)}b`, false],
      ["sk- and 32 lower-case characters with a digit", `sk-${"a1".repeat(16)}`, true],
      ["a bot id of 5 digits", `12345:${botSecret}`, false],
      ["a bot id of 6 digits", `123456:${botSecret}`, true],
      ["a bot id of 12 digits", `123456789012:${botSecret}`, true],
      ["a bot id of 13 digits", `1234567890123:${botSecret}`, false],
      ["a bot secret of 33 characters", `123456789:${botSecret.slice(0, 33)}`, false],
      ["a bot secret of 36 characters", `123456789:${botSecret}X`, false],
      ["Bearer and 11 characters with a digit", `sent Bearer ${"abcdefghij1"}`, false],
      ["Bearer and 12 characters with a digit", `sent Bearer ${"abcdefghijk1"}`, true]
    ] as Array<[string, string, boolean]>).map(([name, label, reported]): [string, unknown, Json] => [name, doc({ connections: [{ ...model, label }] }), reported ? REPORTED : view([{ ...model, label, failing: false }])]),
    ["a ticket title of 40 or more characters mixing cases and a digit is a long run", doc({ connections: [{ ...model, label: "Task 123456789:Implement-the-Connections-tab-reader-for-v2" }] }), REPORTED],
    ["a mixed-case URL path is read between its slashes", doc({ connections: [{ ...telegram, purpose: "reads https://docs.example.com/API/v2/Reference/Connections/GetUpdates" }] }), view([{ ...telegram, purpose: "reads https://docs.example.com/API/v2/Reference/Connections/GetUpdates", failing: false }])],
    ["a provider and a long model id are a path", doc({ connections: [{ ...model, target: "together/meta-llama/Meta-Llama-3-70B-Instruct-Turbo" }] }), view([{ ...model, target: "together/meta-llama/Meta-Llama-3-70B-Instruct-Turbo", failing: false }])],
    ["an upper-case AKIA only", doc({ connections: [{ ...telegram, label: `uses ${["akia", "iosfodnn7example"].join("")}` }] }), view([{ ...telegram, label: `uses ${["akia", "iosfodnn7example"].join("")}`, failing: false }])],
    ["not an object", doc([notify]), REPORTED]
  ];
  return list.map(([name, input, expected]) => ({ name, input, expected }));
}

export function connectionsVectors(): Json {
  return {
    about: "Vectors for extensions/connections/0.1 (DEC-0096), written by tools/vectors/connections.ts, never by hand. connectionsView(wellKnown) answers {declared, reported, connections}: declared with each connection and `failing` (a degraded[].source equal to its id), or reported (an invalid value, a repeated id, a credential) with no connections, or neither when the key is absent. The `errors` lines are the reference's own wording and not part of a vector.",
    cases: cases()
  };
}

export function buildConnectionsVectors(): string {
  return `${JSON.stringify(connectionsVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildConnectionsVectors();
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
