import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { strictTime } from "./rfc3339.js";
import { utcDate } from "./usage-rules.js";

// #region route-choice — docs: docs/specification/service.md#choosing-a-payment-route-dec-0186
/**
 * FAC-SEM-184 (DEC-0186): every `routeChoices[]` entry of a usage report is readable on its own, so a host can show
 * which route each piece of work pays on, what it was chosen on and when it is due again:
 * - ids are unique, and one piece of work on one model has one choice (`work`, `provider`, `model`) (RC-3);
 * - a `subscription` choice names its `runner`, since a subscription runs only in its vendor's runner (DEC-0046 item 3);
 * - `previous`, when present, differs from `chosen`: it records a change (RC-4);
 * - the measured window is `from` not after `to`, and `to` not after the UTC date of `decidedAt` (RC-2);
 * - `decidedAt` is not after `generatedAt`, and `reviewBy` is after the UTC date of `decidedAt` and at most 92 days
 *   after it (RC-5).
 * An overdue review (`reviewBy` before the report's date) is not a finding: a report may truthfully show one, and a host
 * shows it first (RC-5). A route that costs more by the entry's own numbers is not a finding either: `reason` carries
 * why, and `cheaperRoute` is what a host shows beside it (RC-4). Malformed input answers findings or none, never an
 * exception.
 */
const DAY_MS = 86_400_000;
export const REVIEW_MAX_DAYS = 92;

export function routeChoiceRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-184", instancePath, message });
  const choices = Array.isArray(value.routeChoices) ? value.routeChoices.filter(isObject) : [];
  const generated = strictTime(value.generatedAt);
  const ids = new Set<string>();
  const subjects = new Set<string>();
  choices.forEach((choice, i) => {
    const at = `/routeChoices/${i}`;
    const id = show(choice.id ?? "");
    if (ids.has(id)) flag(`${at}/id`, `route choice id ${id} appears twice`);
    ids.add(id);
    const subject = JSON.stringify([choice.work, choice.provider, choice.model]);
    if (subjects.has(subject)) flag(`${at}/work`, "one piece of work on one model has one route choice");
    subjects.add(subject);

    if (choice.chosen === "subscription" && choice.runner === undefined) {
      flag(`${at}/runner`, "a subscription runs only in its vendor's runner, so a subscription choice names it (DEC-0046)");
    }
    if (choice.previous !== undefined && choice.previous === choice.chosen) flag(`${at}/previous`, "previous records a change, so it differs from chosen");

    const decided = strictTime(choice.decidedAt);
    const decidedDay = Number.isNaN(decided) ? Number.NaN : Math.floor(decided / DAY_MS) * DAY_MS;
    if (!Number.isNaN(decided) && !Number.isNaN(generated) && decided > generated) flag(`${at}/decidedAt`, "a choice is not decided after the report's generatedAt");

    const measured = isObject(choice.measured) ? choice.measured : {};
    const from = utcDate(measured.from), to = utcDate(measured.to);
    if (!Number.isNaN(from) && !Number.isNaN(to) && from > to) flag(`${at}/measured/from`, "the measured window's from is not after its to");
    if (!Number.isNaN(to) && !Number.isNaN(decidedDay) && to > decidedDay) flag(`${at}/measured/to`, "a choice rests on volume measured or estimated by the day it was decided");

    const review = utcDate(choice.reviewBy);
    if (!Number.isNaN(review) && !Number.isNaN(decidedDay)) {
      if (review <= decidedDay) flag(`${at}/reviewBy`, "reviewBy is after the day the choice was decided");
      else if (review - decidedDay > REVIEW_MAX_DAYS * DAY_MS) flag(`${at}/reviewBy`, `a choice is reviewed within ${REVIEW_MAX_DAYS} days of its decision`);
    }
  });
  return findings;
}

/** What one month of a choice's volume costs on each side, by the entry's own numbers (DEC-0186 RC-4). */
export interface RouteComparison {
  /** `tokens` or `subscription` when both prices are known and one is lower; `even` when equal; `unknown` otherwise. */
  cheaper: "tokens" | "subscription" | "even" | "unknown";
  /** Whether the chosen route is the cheaper one by these numbers; `null` when `cheaper` is `unknown` or `even`. */
  chosenIsCheaper: boolean | null;
  /** `subscriptionUsdMonth - tokensUsdMonth` when both are known: above 0, tokens save that much a month. */
  savingOnTokensUsd: number | null;
  /** The subscription is cheaper but the volume does not fit its quota (`quotaFits: false`): the comparison alone does not decide. */
  quotaBlocksSubscription: boolean;
}

const price = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null);

/**
 * The comparison a host shows beside a route choice (DEC-0186 RC-4): tokens are `key` or `platform-metered`, the other
 * route is `subscription`. Only the entry's own `tokensUsdMonth` and `subscriptionUsdMonth` are compared; an unknown
 * price makes the answer `unknown`, never a guess. Answers `undefined` for a value that is not an entry with a known
 * `chosen`, and never throws on a JSON value.
 */
export function cheaperRoute(choice: unknown): RouteComparison | undefined {
  if (!isObject(choice) || !isObject(choice.measured)) return undefined;
  const chosen = choice.chosen;
  if (chosen !== "subscription" && chosen !== "key" && chosen !== "platform-metered") return undefined;
  const tokens = price(choice.measured.tokensUsdMonth), subscription = price(choice.measured.subscriptionUsdMonth);
  if (tokens === null || subscription === null) {
    return { cheaper: "unknown", chosenIsCheaper: null, savingOnTokensUsd: null, quotaBlocksSubscription: false };
  }
  const cheaper = tokens < subscription ? "tokens" : subscription < tokens ? "subscription" : "even";
  const chosenSide = chosen === "subscription" ? "subscription" : "tokens";
  return {
    cheaper,
    chosenIsCheaper: cheaper === "even" ? null : cheaper === chosenSide,
    savingOnTokensUsd: Math.round((subscription - tokens) * 1e6) / 1e6,
    quotaBlocksSubscription: cheaper === "subscription" && choice.measured.quotaFits === false
  };
}
// #endregion route-choice
