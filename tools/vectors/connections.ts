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
    ["a service target that is no key or product id", doc({ connections: [{ ...notify, target: "Personal-Communicator.default" }] }), REPORTED],
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
    ["a key-shaped id", doc({ connections: [{ ...model, id: ["sk", "-", "a1".repeat(12)].join("") }] }), REPORTED],
    ["a key-shaped capability", doc({ connections: [{ ...notify, capability: ["sk", "-", "a1".repeat(12)].join("") }] }), REPORTED],
    ["an sk- name without a digit is no credential", doc({ connections: [{ ...model, id: "sk-learn-classifier", label: "sk-learn-classifier-model" }] }), view([{ ...model, id: "sk-learn-classifier", label: "sk-learn-classifier-model", failing: false }])],
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
