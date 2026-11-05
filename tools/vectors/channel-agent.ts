/**
 * The generator of the channel-agent vectors (DEC-0150): `fixtures/vectors/channel-agent.json`, shared by every checker
 * of a manifest's `extensions/channel-agent/0.1` (the contract's `channelAgentRules`, the adapter's check_service.py).
 *
 *   tsx tools/vectors/channel-agent.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/channel-agent.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand. Each expected finding is written below by
 * hand from DEC-0150 (CA-1 to CA-5, and CA-8 for `untrusted_input`) and channel-agent-standard/1 sections 11 and 13.6; nothing here imports
 * `src/channel-agent.ts`, so the gate checks that the reference agrees.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";

type Json = Record<string, any>;
export const VECTOR_FILE = "fixtures/vectors/channel-agent.json";
const KEY = "https://fabric.passioncode.ai/agent-contract/extensions/channel-agent/0.1";
const TOKEN = "https:~1~1fabric.passioncode.ai~1agent-contract~1extensions~1channel-agent~10.1";
const KEY_PATH = `/provider/extensions/${TOKEN}`;
const P0 = `${KEY_PATH}/projects/0`;

const dm = {
  id: "tg-dm",
  kind: "telegram_dm",
  replies_enabled: true,
  decision: null,
  final_limit: "P7D",
  first_reply_limit: "PT1H",
  holding_reply: true,
  clarifying_question: true,
  quiet_window: null,
  late_answer_window: null,
  items_seen_unit: "updates",
  texts: { holding: { en: "I am checking this and will write back." }, final: { en: "We could not confirm this; please write to our support." } }
};
const reviews = {
  id: "reviews",
  kind: "store_review",
  replies_enabled: false,
  decision: "replies-off-reviews",
  final_limit: "P7D",
  first_reply_limit: "PT24H",
  holding_reply: false,
  clarifying_question: false,
  items_seen_unit: "reviews",
  texts: {}
};
const project = (extra: Json = {}): Json => ({
  project: "project:example-support",
  side: "example-side",
  lead_agent: "support-bot",
  adopted_at: "2026-11-10",
  taxonomy: { version: "2026-11-04", codes: [{ code: "payments.refund", label: "A refund" }, { code: "account.access", label: "Access to an account" }] },
  tiers: [{ code: "premium", label: "Premium", rule: "open_orders > 10", escalate: "at_once" }],
  question_route: { capability: "operator.ask", target: "operator-desk", daily_cap: 10, days: "mon-fri", tz: "Europe/Warsaw", send_at: "09:00", expires: "P7D" },
  gap_registry: { owner: "support-bot", capability: "gaps.record" },
  channels: [dm, reviews],
  sources: [{ id: "docs", owner: "docs-team", read: "url", cadence: "PT1H", max_age: "PT2H" }],
  declined_sources: [{ id: "billing-export", decision: "no-billing-export" }],
  handoff_queues: [{ id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "none", recommendation: "thread-0001" }],
  evals: { suite: "evals/support", judge_budget_usd: 2.5, replay_budget_usd: 20, spend_record: "support-evals" },
  tickets: { outbox: "ticket_outbox", token_slot: "example-support/prod/SIGNAL_TICKETS_TOKEN", pd_check: "pd-rules@1.2.0" },
  recorded_decisions: [{ id: "replies-off-reviews", date: "2026-11-01", effect: "replies_off" }],
  ...extra
});
const declaration = (...projects: Json[]) => ({ standard: "channel-agent-standard/1", projects: projects.length ? projects : [project()] });
const manifest = (value: unknown) => ({ provider: { extensions: { [KEY]: value } } });
const wellKnown = (value: unknown) => ({ protocol: "fabric-service/0.1", extensions: { [KEY]: value } });
const WK_PATH = `/extensions/${TOKEN}`;
const withChannel = (channel: Json, at = 0) => {
  const channels: Json[] = [dm, reviews];
  channels[at] = channel;
  return manifest(declaration(project({ channels })));
};
const f = (code: string, instancePath: string) => ({ code, instancePath });
const sem = (n: number) => `FAC-SEM-${n}`;

/** Two declarations whose reading lands exactly on the budget, and one code point past it. */
function budgetEdge(): Array<[string, unknown, Json[]]> {
  const budget = 1_000_000;
  const visit = 16;
  const m = 814;
  const heavy = "eyJ".repeat(m);
  const heavyCost = visit + 3 * m + (3 * m * (m + 1)) / 2;
  const bearer = `Bearer ${"z".repeat(24)}`;
  // The last string's cost: its code points, and from a boundary `sk-` near its end, its three characters included,
  // to the end of the string (a reading that counted only after the `sk-` would read one past the edge).
  const tail = `${bearer} sk-ab`;
  // A URL whose query name holds an upper-case letter: 39 UTF-16 units, then per piece 128, the name's and the value's
  // units, and for aBC (3) with a value the triangular number 6: 39 + (128 + 3 + 1 + 6) + (128 + 7 + 6) = 318.
  const query = "https://a.example/?aBC=x&api_key=abc123";
  // The long-run term, by hand: min(length, 39) per code point of each base64 run shorter than 40, in each of three
  // partitions (the class; without `=`; without `=` and `/`). `Bearer` and the 24 z's hold neither, so 3 x (36 + 576) =
  // 1836; the tail adds `sk-ab`, 3 x 25 (1911 in all); the URL: `https` 3 x 25, `//a` 9 + 9 + 1, `example/` 64 + 64 +
  // 49, `aBC=x` 25 + 10 + 10, `api_key=abc123` 196 + 85 + 85 (682), its values `x` 3 and `abc123` 108: 318 + 793 = 1111;
  // the name `last`, 3 x 16; the heavy name and an a-pad are one run of 40 or more (nothing); an astral pad holds no run.
  // Every string also pays 4 for each separator the argument reading splits at: the bearer's space (4), the tail's
  // second space (4 more), the URL's three `/` and two `=` (20, so 1131), and its query's one `&` (4 more, 1135).
  const lastCost = (last: string) => visit + (last === query ? 1135 : last.length + 1836 + 4 + (last === tail ? "sk-ab".length + 75 + 4 : 0));
  // The pad's UTF-16 units, so the document's reading lands on the budget plus `extra`: an a-pad is `p` and a's; an
  // astral pad is one or two `é` (one unit each, no run) and astral characters (two units each).
  const pad = (extra: number, unit: string, last: string) => {
    const total = budget - (heavyCost + (visit + "last".length + 48) + lastCost(last) + visit) + extra;
    if (unit === "a") return `p${"a".repeat(total - 1)}`;
    const pairs = Math.floor((total - 1) / 2);
    return `${"\u00e9".repeat(total - 2 * pairs)}${unit.repeat(pairs)}`;
  };
  const doc = (extra: number, unit = "a", last = bearer) => ({ protocol: "fabric-service/0.1", extensions: { [KEY]: { [heavy]: [], [pad(extra, unit, last)]: [], last: [last] } } });
  // An astral character is one code point and two UTF-16 units: the edge falls where UTF-16 units say.
  const astral = String.fromCodePoint(0x1f600);
  return [
    ["the budget's edge: every name and string read once, the last value read and found", doc(0), [f(sem(165), `${WK_PATH}/*/*`), f(sem(162), WK_PATH)]],
    ["one UTF-16 unit past the budget's edge: the last value is not read", doc(1), [f(sem(165), WK_PATH), f(sem(162), WK_PATH)]],
    ["the budget's edge counted in UTF-16 units, a name of astral characters: the last value read and found", doc(0, astral), [f(sem(165), `${WK_PATH}/*/*`), f(sem(162), WK_PATH)]],
    ["one UTF-16 unit past the edge in astral characters: the last value is not read", doc(1, astral), [f(sem(165), WK_PATH), f(sem(162), WK_PATH)]],
    ["the budget's edge with a boundary sk- near the last string's end, counted from its s: read and found", doc(0, "a", tail), [f(sem(165), `${WK_PATH}/*/*`), f(sem(162), WK_PATH)]],
    ["one UTF-16 unit past that edge: the last value is not read", doc(1, "a", tail), [f(sem(165), WK_PATH), f(sem(162), WK_PATH)]],
    ["the budget's edge with a URL whose query name holds an upper-case letter, its triangular number counted: read and found", doc(0, "a", query), [f(sem(165), `${WK_PATH}/*/*`), f(sem(162), WK_PATH)]],
    ["one UTF-16 unit past that edge: the URL is not read", doc(1, "a", query), [f(sem(165), WK_PATH), f(sem(162), WK_PATH)]]
  ];
}

/**
 * The read declaration with 70 credential-shaped labels and a misplaced copy with 80 (CA-5): the read declaration names
 * 64 places and closes its own 6 at its key; the copy, read after it, names none and closes its 80 at the copy, so the
 * read declaration's answer does not depend on it.
 */
function overflowCopies(): [string, unknown, Json[], Json] {
  const bearer = ["Bearer", "k".repeat(24)].join(" ");
  const labelled = (count: number) => project({ taxonomy: { version: "1", codes: Array.from({ length: count }, (_, i) => ({ code: `c${i}`, label: bearer })) } });
  const input = { provider: { extensions: { [KEY]: declaration(labelled(70)) } }, extensions: { [KEY]: declaration(labelled(80)) } };
  const named = Array.from({ length: 64 }, (_, i) => `${P0}/taxonomy/codes/${i}/label`);
  const findings = [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `/extensions/${TOKEN}`), ...named.map((at) => f(sem(165), at)), f(sem(165), KEY_PATH)];
  const reason = "a value is shaped like a credential: a token is named by its vault slot, never written";
  const errors = [...named.map((at) => `FAC-SEM-165 at ${at.slice(KEY_PATH.length)}: ${reason}`), "FAC-SEM-165 at /: and 6 more names or values shaped like a credential"];
  return ["more than 64 credential places in the read declaration and more in a misplaced copy: each closes its own count", input, findings, { declared: false, reported: true, errors }];
}

function declarations(): Json[] {
  const invalid = [f(sem(162), KEY_PATH)];
  const list: Array<[string, unknown, Json[], Json?]> = [
    // Nothing declared: nothing to check.
    ["no provider extensions", { provider: {} }, []],
    ["no key", { provider: { extensions: {} } }, []],
    ["not an object", null, []],
    // A valid declaration.
    ["one project, every member", manifest(declaration()), []],
    ["two projects of two sides", manifest(declaration(project(), project({ project: "project:example-mail", side: "other-side" }))), []],
    ["no tiers, no declined sources, no recorded decisions, no queue, only a channel that replies", manifest(declaration(project({ channels: [dm], tiers: undefined, declined_sources: undefined, recorded_decisions: undefined, handoff_queues: [] }))), []],
    ["budgets of 0 need no spend record", manifest(declaration(project({ evals: { suite: "evals/support", judge_budget_usd: 0, replay_budget_usd: 0 } }))), []],
    ["a tier at or above, escalated by the ladder", manifest(declaration(project({ tiers: [{ code: "vip", label: "VIP", rule: "paid_total_usd >= 500", escalate: "ladder" }] }))), []],
    ["a token slot whose name mixes case and digits is a name, not a value", manifest(declaration(project({ tickets: { outbox: "ticket_outbox", token_slot: "example-support-project/prod/SUPPORT_TOKEN_V2", pd_check: "pd-rules@1.2.0" } }))), []],
    ["a holding reply in two languages", withChannel({ ...dm, texts: { holding: { en: "Checking.", "pt-BR": "Verificando." }, final: { en: "Please write to our support." } } }), []],
    // FAC-SEM-162: where a reader reads it, and its shape.
    ["the key in the manifest's own extensions is not read", { provider: {}, extensions: { [KEY]: declaration() } }, [f(sem(162), `/extensions/${TOKEN}`)]],
    ["the key in a capability's extensions is not read", { provider: {}, capabilities: [{ extensions: { [KEY]: declaration() } }] }, [f(sem(162), `/capabilities/0/extensions/${TOKEN}`)]],
    ["read under provider.extensions, and also misplaced", { provider: { extensions: { [KEY]: declaration() } }, extensions: { [KEY]: declaration() } }, [f(sem(162), `/extensions/${TOKEN}`)]],
    ["a value that is not an object", manifest([project()]), invalid],
    ["another standard", manifest({ ...declaration(), standard: "channel-agent-standard/2" }), invalid],
    ["no projects", manifest({ standard: "channel-agent-standard/1", projects: [] }), invalid],
    ["a member the schema does not name", manifest({ ...declaration(), note: "x" }), invalid],
    ["a side in upper case", manifest(declaration(project({ side: "Example" }))), invalid],
    ["a project id that is not project:<slug>", manifest(declaration(project({ project: "example-support" }))), invalid],
    ["a tier rule with no spaces", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: "open_orders>10", escalate: "at_once" }] }))), invalid],
    ["a tier rule with another operator", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: "open_orders < 10", escalate: "at_once" }] }))), invalid],
    ["a tier rule over a decimal", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: "paid_total_usd > 9.5", escalate: "at_once" }] }))), invalid],
    ["an escalation the standard does not name", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: "open_orders > 10", escalate: "later" }] }))), invalid],
    ["a question route to another capability", manifest(declaration(project({ question_route: { ...project().question_route, capability: "support.ask" } }))), invalid],
    ["a token slot whose name is in lower case", manifest(declaration(project({ tickets: { ...project().tickets, token_slot: "example-support/prod/token" } }))), invalid],
    ["a token slot with no environment", manifest(declaration(project({ tickets: { ...project().tickets, token_slot: "example-support/TOKEN" } }))), invalid],
    ["a source owner that is a person's address", manifest(declaration(project({ sources: [{ id: "docs", owner: "someone@example.com", read: "url", cadence: "PT1H", max_age: "PT2H" }] }))), invalid],
    ["a source read by its address", manifest(declaration(project({ sources: [{ id: "docs", owner: "docs-team", read: "https://docs.example/faq", cadence: "PT1H", max_age: "PT2H" }] }))), invalid],
    ["an outbox at an absolute path", manifest(declaration(project({ tickets: { ...project().tickets, outbox: "/srv/agent/outbox.db" } }))), invalid],
    ["an outbox in a home folder", manifest(declaration(project({ tickets: { ...project().tickets, outbox: "~/outbox.db" } }))), invalid],
    ["an eval suite outside the repository", manifest(declaration(project({ evals: { ...project().evals, suite: "evals/../../private/suite" } }))), invalid],
    ["an outbox behind a file scheme", manifest(declaration(project({ tickets: { ...project().tickets, outbox: "file:///srv/outbox.db" } }))), invalid],
    ["an eval suite behind a scheme with one slash", manifest(declaration(project({ evals: { ...project().evals, suite: "db:/srv/suite" } }))), invalid],
    ["a duration in words", withChannel({ ...dm, final_limit: "7 days" }), invalid],
    ["a duration in months", withChannel({ ...dm, final_limit: "P1M" }), invalid],
    ["a channel kind the standard does not name", withChannel({ ...dm, kind: "sms" }), invalid],
    ["a budget below 0", manifest(declaration(project({ evals: { ...project().evals, judge_budget_usd: -1 } }))), invalid],
    ["a budget as a string", manifest(declaration(project({ evals: { ...project().evals, replay_budget_usd: "20" } }))), invalid],
    ["a spend record that is not a limit id", manifest(declaration(project({ evals: { ...project().evals, spend_record: "Support Evals" } }))), invalid],
    ["a text keyed by something that is not a language tag", withChannel({ ...dm, texts: { holding: { "en_US!": "Checking." }, final: dm.texts.final } }), invalid],
    ["a duration of zero days", withChannel({ ...dm, final_limit: "P0D" }), invalid],
    ["a source read on every question: a cadence of zero", manifest(declaration(project({ sources: [{ id: "docs", owner: "docs-team", read: "api", cadence: "PT0S", max_age: "PT1H" }] }))), []],
    ["a source's maximum age of zero: it would read as always stale", manifest(declaration(project({ sources: [{ id: "docs", owner: "docs-team", read: "api", cadence: "PT0S", max_age: "P0D" }] }))), invalid],
    ["a channel id with a run of 7 digits", withChannel({ ...dm, id: "dm-4915112" }), invalid],
    ["a time zone of one segment", manifest(declaration(project({ question_route: { ...project().question_route, tz: "GMT" } }))), []],
    ["a time zone of three segments", manifest(declaration(project({ question_route: { ...project().question_route, tz: "America/Argentina/Buenos_Aires" } }))), []],
    ["a duration of zero seconds", withChannel({ ...dm, first_reply_limit: "PT0S" }), invalid],
    ["a duration of zero hours and minutes", withChannel({ ...dm, first_reply_limit: "PT0H0M" }), invalid],
    ["a tier rule over an integer of 16 digits", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: `open_orders > 1${"0".repeat(15)}`, escalate: "at_once" }] }))), invalid],
    ["a tier rule over an integer of 15 digits", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: `open_orders > 1${"0".repeat(14)}`, escalate: "at_once" }] }))), []],
    ["an id with a run of 7 digits, as a phone number", manifest(declaration(project({ lead_agent: "agent-4915112345" }))), invalid],
    ["an id with a run of 6 digits", manifest(declaration(project({ lead_agent: "agent-491511" }))), []],
    ["a token slot named by the project:<slug> id", manifest(declaration(project({ tickets: { ...project().tickets, token_slot: "project:example-support/prod/SIGNAL_TICKETS_TOKEN" } }))), invalid],
    ["a declared text that is empty", withChannel({ ...dm, texts: { holding: { en: "" }, final: dm.texts.final } }), invalid],
    // In a well-known answer (a service with no manifest), the key is read under its extensions.
    ["a well-known answer's declaration, valid", wellKnown(declaration()), []],
    ["a well-known answer's declaration, invalid", wellKnown({ ...declaration(), standard: "channel-agent-standard/2" }), [f(sem(162), WK_PATH)]],
    ["a well-known answer reads no provider member", { protocol: "fabric-service/0.1", provider: { extensions: { [KEY]: { standard: "x" } } } }, []],
    ["a well-known answer's declaration with a channel declared twice", wellKnown(declaration(project({ channels: [dm, reviews, dm] }))), [f(sem(163), `${WK_PATH}/projects/0/channels/2/id`)]],
    // FAC-SEM-163: ids once, and decisions named.
    ["a project declared twice", manifest(declaration(project(), project())), [f(sem(163), `${KEY_PATH}/projects/1/project`)]],
    ["a category code declared twice", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "A" }, { code: "a", label: "A again" }] } }))), [f(sem(163), `${P0}/taxonomy/codes/1/code`)]],
    ["a tier code declared twice", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium", rule: "open_orders > 10", escalate: "at_once" }, { code: "premium", label: "Premium+", rule: "open_orders > 50", escalate: "at_once" }] }))), [f(sem(163), `${P0}/tiers/1/code`)]],
    ["a channel declared twice", manifest(declaration(project({ channels: [dm, reviews, dm] }))), [f(sem(163), `${P0}/channels/2/id`)]],
    ["a source declared twice", manifest(declaration(project({ sources: [project().sources[0], project().sources[0]] }))), [f(sem(163), `${P0}/sources/1/id`)]],
    ["a source both read and declined", manifest(declaration(project({ declined_sources: [{ id: "docs", decision: "no-docs" }] }))), [f(sem(163), `${P0}/declined_sources/0/id`)]],
    ["a hand-off queue declared twice", manifest(declaration(project({ handoff_queues: [project().handoff_queues[0], project().handoff_queues[0]] }))), [f(sem(163), `${P0}/handoff_queues/1/id`)]],
    ["a decision recorded twice", manifest(declaration(project({ recorded_decisions: [project().recorded_decisions[0], project().recorded_decisions[0]] }))), [f(sem(163), `${P0}/recorded_decisions/1/id`)]],
    ["replies off with no decision", withChannel({ ...reviews, decision: null }, 1), [f(sem(163), `${P0}/channels/1/decision`)]],
    ["a decision recorded_decisions does not list", withChannel({ ...reviews, decision: "replies-off-forever" }, 1), [f(sem(163), `${P0}/channels/1/decision`)]],
    ["a channel that replies and is held by a decision that is not recorded", withChannel({ ...dm, decision: "approval-held" }), [f(sem(163), `${P0}/channels/0/decision`)]],
    ["replies off and no recorded decisions at all", manifest(declaration(project({ recorded_decisions: undefined }))), [f(sem(163), `${P0}/channels/1/decision`)]],
    // FAC-SEM-164: what a channel, a queue and the budgets owe.
    ["a holding reply with no holding text", withChannel({ ...dm, texts: { final: dm.texts.final } }), [f(sem(164), `${P0}/channels/0/texts/holding`)]],
    ["a channel that replies with no final text", withChannel({ ...dm, texts: { holding: dm.texts.holding } }), [f(sem(164), `${P0}/channels/0/texts/final`)]],
    ["a store review that asks a clarifying question", withChannel({ ...reviews, clarifying_question: true }, 1), [f(sem(164), `${P0}/channels/1/clarifying_question`)]],
    ["a final text with an em dash", withChannel({ ...dm, texts: { holding: dm.texts.holding, final: { en: "We could not confirm this \u2014 please write to us." } } }), [f(sem(164), `${P0}/channels/0/texts/final/*`)]],
    ["a blank holding text", withChannel({ ...dm, texts: { holding: { en: "   " }, final: dm.texts.final } }), [f(sem(164), `${P0}/channels/0/texts/holding/*`)]],
    ["a queue with no answered signal and no recommendation", manifest(declaration(project({ handoff_queues: [{ id: "owner-dm", owner: "owner", limit: "P2D", answered_signal: "none" }] }))), [f(sem(164), `${P0}/handoff_queues/0/recommendation`)]],
    ["a queue with an answered signal needs no recommendation", manifest(declaration(project({ handoff_queues: [{ id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "mail.replied" }] }))), []],
    ["a judge budget with no spend record", manifest(declaration(project({ evals: { suite: "evals/support", judge_budget_usd: 2.5, replay_budget_usd: 0 } }))), [f(sem(164), `${P0}/evals/spend_record`)]],
    ["both budgets with a null spend record: one finding", manifest(declaration(project({ evals: { suite: "evals/support", judge_budget_usd: 2.5, replay_budget_usd: 20, spend_record: null } }))), [f(sem(164), `${P0}/evals/spend_record`)]],
    // FAC-SEM-165: no value shaped like a credential, in a valid or an invalid declaration.
    ["a holding text that carries a bearer token", withChannel({ ...dm, texts: { holding: { en: `Bearer ${"x".repeat(24)}` }, final: dm.texts.final } }), [f(sem(165), `${P0}/channels/0/texts/holding/*`)]],
    ["a final text with a key in a link", withChannel({ ...dm, texts: { holding: dm.texts.holding, final: { en: "https://help.example/?api_key=abc123" } } }), [f(sem(165), `${P0}/channels/0/texts/final/*`)]],
    ["a credential in an invalid declaration: both found", manifest({ ...declaration(), note: `Bearer ${"x".repeat(24)}` }), [f(sem(165), `${KEY_PATH}/*`), f(sem(162), KEY_PATH)]],
    ["a token slot that is a provider key, outside the slot's grammar", manifest(declaration(project({ tickets: { ...project().tickets, token_slot: `sk-${"Q7r2".repeat(5)}/prod/SIGNAL_TICKETS_TOKEN` } }))), [f(sem(165), `${P0}/tickets/token_slot`), f(sem(162), KEY_PATH)]],
    ["a texts key shaped like a credential: placed at its map", withChannel({ ...dm, texts: { holding: { [`sk-${"B2c4".repeat(5)}`]: "Checking." }, final: dm.texts.final } }), [f(sem(165), `${P0}/channels/0/texts/holding`), f(sem(162), KEY_PATH)]],
    ["a language shaped like a credential, its text with an em dash: both placed at the map", withChannel({ ...dm, texts: { holding: { [["sk", "-Ab12Cd34", "-Ef56Gh78", "-Ij90Kl12"].join("")]: "a \u2014 b" }, final: dm.texts.final } }), [f(sem(165), `${P0}/channels/0/texts/holding`), f(sem(164), `${P0}/channels/0/texts/holding`)]],
    ["a recommendation thread id of the board's shape, digits and all", manifest(declaration(project({ handoff_queues: [{ id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "none", recommendation: "1234567f" }] }))), []],
    ["a misplaced declaration with a credential: not read, still walked", { provider: {}, extensions: { [KEY]: { ...declaration(), note: `Bearer ${"x".repeat(24)}` } } }, [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `/extensions/${TOKEN}/*`)]],
    ["an eval suite path whose whole is a long mixed run, each segment ordinary", manifest(declaration(project({ evals: { ...project().evals, suite: "evals/SupportSuite2026/regression_cases_v2" } }))), []],
    ["a recommendation of 42 mixed characters, the board's opaque id", manifest(declaration(project({ handoff_queues: [{ id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "none", recommendation: "Thread9aBc4XyZ2qWeRt7YuIo1PaSdF3gHjK5lZx8C" }] }))), []],
    ["a tier label that is blank", manifest(declaration(project({ tiers: [{ code: "premium", label: "   ", rule: "open_orders > 10", escalate: "at_once" }] }))), [f(sem(164), `${P0}/tiers/0/label`)]],
    ["a tier label with an em dash", manifest(declaration(project({ tiers: [{ code: "premium", label: "Premium \u2014 gold", rule: "open_orders > 10", escalate: "at_once" }] }))), [f(sem(164), `${P0}/tiers/0/label`)]],
    ["a declaration that is a credential-shaped string", manifest(`Bearer ${"x".repeat(24)}`), [f(sem(165), KEY_PATH), f(sem(162), KEY_PATH)]],
    ["an eval suite path with a long mixed base64 segment", manifest(declaration(project({ evals: { ...project().evals, suite: `evals/${["aB3d", "E5fG", "7hI9", "jK1l", "M3nO", "5pQ7", "rS9t", "U1vW", "3xY5", "zA7b"].join("")}` } }))), [f(sem(165), `${P0}/evals/suite`)]],
    ["a holding text of a Hangul filler only", withChannel({ ...dm, texts: { holding: { en: "\u3164" }, final: dm.texts.final } }), [f(sem(164), `${P0}/channels/0/texts/holding/*`)]],
    ["a holding text of a bell character only", withChannel({ ...dm, texts: { holding: { en: "\u0007" }, final: dm.texts.final } }), [f(sem(164), `${P0}/channels/0/texts/holding/*`)]],
    ["a project slug with a run of 7 digits: the registry's name, read as written", manifest(declaration(project({ project: "project:shop-4915112" }))), []],
    ["a member that is not plain holding members that share declared names: all placed at the declaration", manifest({ ...declaration(), [["sk", "-", "Zx9Q".repeat(5)].join("")]: { standard: `Bearer ${"s".repeat(24)}`, side: `Bearer ${"t".repeat(24)}`, lead_agent: { note: `Bearer ${"u".repeat(24)}` } } }), [f(sem(165), KEY_PATH), f(sem(165), KEY_PATH), f(sem(165), KEY_PATH), f(sem(165), KEY_PATH), f(sem(162), KEY_PATH)]],
    ["an unknown plain member holding a credential: written *", manifest({ ...declaration(), extra: { note: `Bearer ${"v".repeat(24)}` } }), [f(sem(165), `${KEY_PATH}/*/*`), f(sem(162), KEY_PATH)]],
    ["an unknown member named by a run of digits holding a credential: collapsed at its plain ancestor", manifest({ ...declaration(), extra: { "4915112345": `Bearer ${"v".repeat(24)}` } }), [f(sem(165), `${KEY_PATH}/*`), f(sem(162), KEY_PATH)]],
    ["a recommendation outside the opaque id grammar, a database URL with a password: read whole", manifest(declaration(project({ handoff_queues: [{ id: "support-mail", owner: "support-team", limit: "P2D", answered_signal: "none", recommendation: `postgres://app:${"Pw7q".repeat(4)}@db.example/support` }] }))), [f(sem(165), `${P0}/handoff_queues/0/recommendation`), f(sem(162), KEY_PATH)]],
    // The budget's edge (CA-5), counted as the page counts it, each name and string once: a name of m `eyJ`s costs
    // VISIT 16 + 3m + 3m(m+1)/2 (the JWT shape's rereading), a plain name or string 16 + its length.
    ...budgetEdge(),
    // A string is read as a URL only when its head, tab, line feed and carriage return removed, is ASCII with no
    // percent-escape of a byte at or above 0x80 and opens with a scheme (CA-5).
    ["a URL with an ASCII authority and a credential-named query parameter: read as a URL, found", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "https://help.example/?api_key=abc123" }] } }))), [f(sem(165), `${P0}/taxonomy/codes/0/label`)]],
    ["the same URL with an authority outside ASCII: not read as a URL, the other shapes find nothing", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "https://h\u00e9lp.example/?api_key=abc123" }] } }))), []],
    ["the same query with no scheme: not read as a URL", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "help.example/?api_key=abc123" }] } }))), []],
    ["a special scheme with a host outside ASCII and no //: not read as a URL", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "http:h\u00e9lp.example/?api_key=abc123" }] } }))), []],
    ["an ASCII URL with a percent-escape of a byte at or above 0x80: not read as a URL", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "https://help.example/%C3%A9?api_key=abc123" }] } }))), []],
    ["an ASCII URL with a percent-escape below 0x80: read as a URL, found", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "https://help.example/%41?api_key=abc123" }] } }))), [f(sem(165), `${P0}/taxonomy/codes/0/label`)]],
    ["a scheme split by a tab: the tab removed, read as a URL, found", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: "ht\ttps://help.example/?api_key=abc123" }] } }))), [f(sem(165), `${P0}/taxonomy/codes/0/label`)]],
    // The gap of reading a URL only at the head: a sentence that holds a URL is read for key shapes only, so a password
    // in the URL's user information is not found there (CA-5).
    ["the gap: a sentence that holds a URL with a password is read for key shapes only, and nothing is found", manifest(declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: ["Please write to https://", "u:p", "@help.example/"].join("") }] } }))), [], { declared: true, reported: false, errors: [], obligations: [] }],
    // The read declaration is judged only by the findings under its own path (CA-5): a misplaced copy's credential, or
    // the budget running out in a copy, is placed at that copy.
    ["a valid read declaration beside a heavy misplaced copy: the rest not read is placed at the copy, the read one declared", { provider: { extensions: { [KEY]: declaration() } }, extensions: { [KEY]: { ...declaration(), extra: "eyJ".repeat(1365) } } }, [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `/extensions/${TOKEN}`)], { declared: true, reported: false, errors: [], obligations: [] }],
    ["a valid read declaration beside a misplaced copy holding a credential: found at the copy, the read one declared", { provider: { extensions: { [KEY]: declaration() } }, extensions: { [KEY]: declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: `Bearer ${"k".repeat(24)}` }] } })) } }, [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `/extensions/${TOKEN}/projects/0/taxonomy/codes/0/label`)], { declared: true, reported: false, errors: [], obligations: [] }],
    ["a manifest with no provider.extensions and only a heavy misplaced copy: not declared, the copy reported and its removal asked", { provider: {}, extensions: { [KEY]: { ...declaration(), extra: "eyJ".repeat(1365) } } }, [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `/extensions/${TOKEN}`)], { declared: false, reported: true, errors: [`FAC-SEM-162 at /extensions/${TOKEN}: a reader reads a manifest's channel-agent declaration under provider.extensions only, so it is not read here`, `FAC-SEM-165 at /extensions/${TOKEN}: reading the declarations for credentials takes more than 1000000 UTF-16 units of reading; this copy is not read by a reader and should be removed`] }],
    // CA-8 (e): a member such as untrusted_input is not declared anywhere, so the declaration is not read.
    ["an untrusted_input member at the top: not declared (CA-8)", manifest({ ...declaration(), untrusted_input: false }), invalid, { declared: false, reported: true, errors: ["FAC-SEM-162 at /: maxProperties (more members than the schema declares)"] }],
    ["an untrusted_input member in a project: not declared (CA-8)", manifest(declaration(project({ untrusted_input: false }))), invalid, { declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0: maxProperties (more members than the schema declares)"] }],
    ["an untrusted_input member in a channel: not declared (CA-8)", withChannel({ ...dm, untrusted_input: false }), invalid, { declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/channels/0: maxProperties (more members than the schema declares)"] }],
    ["an untrusted_input member in the sparse reviews channel: not declared, by additionalProperties (CA-8)", withChannel({ ...reviews, untrusted_input: false }, 1), invalid, { declared: false, reported: true, errors: ["FAC-SEM-162 at /projects/0/channels/1: additionalProperties (only declared members are taken)"] }],
    // The walk order: an array-index key is read before a member written ahead of it, so the credential under "5" is
    // found before the heavy member spends the budget (ECMAScript own-property order).
    ["an integer-like key after a heavy member: read first, its credential found, then the rest not read", manifest({ ...declaration(), extra: { heavy: "eyJ".repeat(1365), "5": `Bearer ${"x".repeat(24)}` } }), [f(sem(165), `${KEY_PATH}/*/*`), f(sem(165), KEY_PATH), f(sem(162), KEY_PATH)]],
    overflowCopies(),
    ["a channel with replies off, a holding reply and a final text it does not use: declared, nothing owed", manifest(declaration(project({ channels: [dm, { ...dm, id: "quiet-desk", replies_enabled: false, holding_reply: true, decision: "replies-off-2026", texts: { final: { none: "not_used" } } }], recorded_decisions: [{ id: "replies-off-2026", date: "2026-11-01", effect: "replies_off" }] }))), [], { declared: true, reported: false, errors: [], obligations: [] }],
    ["a channel with replies off and a holding reply, with no texts: declared, nothing owed", manifest(declaration(project({ channels: [dm, { ...dm, id: "quiet-desk", replies_enabled: false, holding_reply: true, decision: "replies-off-2026", texts: {} }], recorded_decisions: [{ id: "replies-off-2026", date: "2026-11-01", effect: "replies_off" }] }))), [], { declared: true, reported: false, errors: [], obligations: [] }],
    ["a read declaration whose own read runs out: not declared", manifest(declaration(project({ channels: [{ ...dm, texts: { holding: { en: "eyJ".repeat(1365) }, final: dm.texts.final } }] }))), [f(sem(165), KEY_PATH)], { declared: false, reported: true, errors: ["FAC-SEM-165 at /: reading the declarations for credentials takes more than 1000000 UTF-16 units of reading; a reader treats the declaration as not declared; declare fewer or shorter texts or names"] }],
    // The read declaration is walked first: a heavy misplaced copy cannot spend the budget it needs.
    ["a heavy misplaced copy and a read declaration with a credential-shaped label: the label is found", { provider: { extensions: { [KEY]: declaration(project({ taxonomy: { version: "1", codes: [{ code: "a", label: `Bearer ${"k".repeat(24)}` }] } })) } }, extensions: { [KEY]: { ...declaration(), extra: "eyJ".repeat(1365) } } }, [f(sem(162), `/extensions/${TOKEN}`), f(sem(165), `${P0}/taxonomy/codes/0/label`), f(sem(165), `/extensions/${TOKEN}`)]],
    // Several findings in one project, in the reference's order: FAC-SEM-163 then FAC-SEM-164.
    // The standard's none form, at its four members only (CA-2), and what a final text in it owes (CA-4).
    ["the none form at the question route, the gap registry, the personal-data check and a replying channel's final text", manifest(declaration(project({ question_route: { none: "not_yet", until: "2027-01-15" }, gap_registry: { none: "not_used" }, tickets: { ...project().tickets, pd_check: { none: "not_yet", until: "2026-12-01" } }, channels: [{ ...dm, texts: { holding: dm.texts.holding, final: { none: "not_yet", until: "2027-01-15" } } }] }))), []],
    ["a channel that sends a holding reply with a final text it does not use: owed, the declaration kept declared", manifest(declaration(project({ channels: [{ ...dm, holding_reply: true, texts: { holding: dm.texts.holding, final: { none: "not_used" } } }] }))), [f(sem(164), `${P0}/channels/0/texts/final`)], { declared: true, reported: false, errors: [], obligations: ["FAC-SEM-164 at /projects/0/channels/0/texts/final: a channel that sends a holding reply owes a final reply, so its final text is not one it does not use"] }],
    ["a channel that does not hold, with a final text it does not use: nothing owed", manifest(declaration(project({ channels: [{ ...dm, holding_reply: false, texts: { holding: dm.texts.holding, final: { none: "not_used" } } }] }))), []],
    ["the none form not_yet with no date", manifest(declaration(project({ question_route: { none: "not_yet" } }))), invalid],
    ["the none form not_used with a date", manifest(declaration(project({ gap_registry: { none: "not_used", until: "2027-01-15" } }))), invalid],
    ["the none form with a date that is not a full date", manifest(declaration(project({ question_route: { none: "not_yet", until: "2027-01" } }))), invalid],
    ["the none form with another member", manifest(declaration(project({ gap_registry: { none: "not_used", note: "later" } }))), invalid],
    ["the none form with another word", manifest(declaration(project({ gap_registry: { none: "later" } }))), invalid],
    ["the none form at a member that takes null instead", manifest(declaration(project({ channels: [{ ...dm, decision: { none: "not_used" } }] }))), invalid],
    ["the none form at a holding text", manifest(declaration(project({ channels: [{ ...dm, texts: { holding: { none: "not_used" }, final: dm.texts.final } }] }))), invalid],
    ["a recommendation on a queue with an answered signal", manifest(declaration(project({ handoff_queues: [{ ...project().handoff_queues[0], answered_signal: "label" }] }))), [f(sem(164), `${P0}/handoff_queues/0/recommendation`)]],
    ["a duplicated channel that also owes its final text", manifest(declaration(project({ channels: [dm, { ...dm, texts: { holding: dm.texts.holding } }] }))), [f(sem(163), `${P0}/channels/1/id`), f(sem(164), `${P0}/channels/1/texts/final`)]]
  ];
  // The walk-order vector carries its document as JSON text too, the heavy member written before "5": `input`, once
  // parsed by JavaScript, lists "5" first, so a port parses `inputText` and walks it in ECMAScript order.
  const walkOrder = "an integer-like key after a heavy member: read first, its credential found, then the rest not read";
  const walkText = JSON.stringify(manifest({ ...declaration(), extra: "EXTRA" })).replace('"EXTRA"', `{"heavy":${JSON.stringify("eyJ".repeat(1365))},"5":${JSON.stringify(`Bearer ${"x".repeat(24)}`)}}`);
  return list.map(([name, input, findings, view]) => ({ name, site: (input as Json | null)?.protocol === "fabric-service/0.1" ? "well-known" : "manifest", input, ...(name === walkOrder ? { inputText: walkText } : {}), findings, ...(view === undefined ? {} : { view }) }));
}

export function channelAgentVectors(): Json {
  return {
    about: `Vectors for extensions/channel-agent/0.1 (DEC-0150), written by tools/vectors/channel-agent.ts, never by hand. \`key\`: the extension key. \`declarations\`: a document and the findings {code, instancePath} a checker reports on it, in the reference's order (a port may compare them as a set). \`site\` says where the key is read: \`manifest\` (kind manifest) under provider.extensions, at ${KEY_PATH}, or \`well-known\` (kind service-well-known, a service with no manifest) under extensions, at ${"/extensions/"}${TOKEN} (CA-1). FAC-SEM-162, in a manifest only, at the key under /extensions or /capabilities/<i>/extensions, where a reader does not read it, each followed by the FAC-SEM-165 findings of that value where it stands; then FAC-SEM-165 at each member name and each string of the value shaped like a credential (at most 1 000 000 UTF-16 units read in all for one document, every copy of the declaration in it sharing them, counted as detectorCost counts them, in UTF-16 units (an astral character is two): the walk's 16 per name or string, read once (a name is not charged again when its member is entered or placed), beside detectorCost: the string's UTF-16 units, the JWT shape's rereading from each eyJ (its base64url run, eyJ included, and, when that run ends at a dot, the dot and the run after it), for a string read as a URL (its head, once its leading C0 controls and spaces are stripped and ASCII tab, line feed and carriage return removed, opens with a scheme, ^[A-Za-z][A-Za-z0-9+.-]*:, is ASCII only and holds no percent-escape of a byte at or above 0x80, %[89A-Fa-f][0-9A-Fa-f]; every other string, a sentence that holds a URL included, is read by the detector's value and argument shapes only, with no URL parse, so a password or a credential-named query parameter in it is not found: the gap a vector pins), on the names and values a WHATWG URL parse yields (tab, line feed and carriage return removed, percent-decoded): 128 per query or fragment piece, 4 per & of the search or the hash, the piece's name and value, the value's JWT and sk- terms, and the triangular number n(n+1)/2 of the length of a name holding an upper-case letter when the value is not empty, and from each sk-, in any case, at a boundary, its three characters included, up to 255 (the start, a character other than a letter or a digit, %XX, %25XX, \\xHH, \\uHHHH, a two- or three-digit octal escape, a backslash escape, or a colour sequence ESC[...m with any number of parameter characters (digits, ; and :) whose ESC is raw or escaped (\\x1b, \\033, \\33, \\u001b, \\e) in either case of its hex digits), up to 16 after an sk- away from a boundary, up to its floor after every other provider prefix, anywhere and in any case (gh[pousr]_ 20, xox[abposr]- 10, AKIA 16, glpat- 20), and, for each maximal run shorter than 40 (the shared detector's long-run floor) in each of three partitions (the class [A-Za-z0-9+/=_-]; that class without =; without = and /), min(length, 39) per code point (a URL's values too); and, for every string, 4 for each white space, =, / and \\ the argument reading may split at; once spent, nothing more is read and every further member collapses; one finding then says, once per document, that the rest was not read, at the copy where the budget ran out (the read declaration is walked first, with the whole budget, and never carries it when read whole)), by shape (FAC-SEM-101's detector on the first 4097 code points), a name at the object that holds it, a value under a name that is not plain (letters, digits, _ and -, at most 64, no run of 7 digits once - and _ are left out) or is itself shaped like a credential at its nearest plain ancestor with every descendant, a member more than 64 levels down at its ancestor 64 levels down, at most 64 places per document, named in a copy only while the document's total is under 64, and then one finding at each copy (the read declaration's key, or a misplaced copy) counting that copy's own places past it, the narrow readings only at their place and only for a value of their own grammar (a project's token slot segment by segment, its suite and outbox of the relativeRef grammar (no leading /, ~ or scheme, no .. segment) by the path-aware reading, secretArgument and secretUrl, and a queue's recommendation of the opaqueId grammar by a provider key's and a JWT's shapes only), anything else read whole, a place writing a declared name, an index of a declared array or *, a member whose name is not plain collapsing its place for itself and every descendant, before the schema check, in a valid or an invalid value (CA-5); then FAC-SEM-162 at the key for a value invalid against service-channel-agent-extension.schema.json, or with an array longer than its schema's maxItems, a map wider than its maxProperties, a closed object with more members than the schema declares, or a string or member name over 4096 code points (each checked before the schema, the limits read from the schema), which a reader treats as not declared, its message naming each failed keyword's place with the schema's own limit: the member for required, the values for enum (at most 8, the rest counted) and const, the pattern (cut to 80 characters, each distinct pattern spelled once), a length in code points, a count, a bound, a format, the type alone for type (at question_route, gap_registry, tickets.pd_check and texts.final, the none form beside the type), and for a nullable member its failure in one line, its value branch's, ending in ', or null', with no oneOf line and no line for the null branch, never a declared value (CA-2); for a valid value, per project in order, FAC-SEM-163 at a repeated project, category code, tier code, channel id, source id (a declined source counted with the sources), queue id or recorded decision id (the second occurrence), and at a channel's decision when replies are off and it is null or when it names a decision recorded_decisions does not list, at most 64 places and then one finding at the key counting the rest (CA-3); then FAC-SEM-164 at texts/holding when holding_reply is true, its replies on (replies_enabled true), and it is absent, at texts/final when replies_enabled is true and it is absent, at clarifying_question when true on a store_review, at a tier's label that is blank or carries U+2014, at a text that is blank (nothing left after white space, \\p{Cf}, \\p{Cc}, \\p{Z}, \\p{Default_Ignorable_Code_Point}, U+115F, U+1160, U+3164, U+FFA0, U+2800 and U+FFFC) or carries U+2014, a text's language written * when plain and placed at its texts/holding or texts/final map when not, at a queue's recommendation when answered_signal is none and it is absent, and when it is present with another answered_signal (the declaration kept declared, a reader does not read the recommendation), at texts/final when it is {none: not_used} and holding_reply is true, its replies on (replies_enabled true) (a holding reply obliges a final reply), not at texts/final otherwise in the none form ({none: not_yet, until} or {none: not_used}, which the schema takes at question_route, gap_registry, tickets.pd_check and a channel's texts.final only, closed, until a full date with not_yet only), and once at evals/spend_record when a budget is above 0 and it is absent or null, at most 64 places per document and then one finding at the key counting the rest (CA-4). Inside an object the walk takes members in ECMAScript own-property order: array-index keys (canonical decimal integers 0 to 4294967294, no leading zero) ascending, then the rest in document order; a vector with \`inputText\` carries its document as JSON text in document order, and a port parses \`inputText\` and walks it in ECMAScript order. No message carries a declared value. \`view\`, on some cases: what channelAgentView answers, {declared, reported, errors, obligations when declared}, each line \`<code> at <place>: <reason>\`, the reason the finding's message without the decision it cites, identical lines once; the read declaration is judged only by the findings under its own path, so a misplaced copy's credential or the budget running out in a copy leaves it declared.`,
    key: KEY,
    declarations: declarations()
  };
}

export function buildChannelAgentVectors(): string {
  // U+2014 is written as its JSON escape, so the file carries no em dash character and reads the same.
  return `${JSON.stringify(channelAgentVectors(), null, 2).replace(/\u2014/g, "\\u2014")}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildChannelAgentVectors();
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
