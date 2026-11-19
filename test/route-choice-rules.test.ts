import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { cheaperRoute, routeChoiceRules } from "../src/route-choice-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

type Choice = Record<string, unknown> & { measured: Record<string, unknown> };
const report = () =>
  JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/positive/service-usage-route-choices.json"), "utf8")) as Record<string, unknown> & {
    routeChoices: Choice[];
  };
const paths = (value: Record<string, unknown>) => routeChoiceRules(value).map((f) => `${f.code} ${f.instancePath}`);

describe("FAC-SEM-184: route choices (DEC-0186)", () => {
  it("accepts the fixture through the service-usage kind, with no other finding", () => {
    expect(evaluateSemanticRules("service-usage", report())).toEqual([]);
  });

  it("answers nothing for a report without route choices or with malformed entries", () => {
    expect(routeChoiceRules({})).toEqual([]);
    expect(routeChoiceRules({ routeChoices: "x" })).toEqual([]);
    expect(routeChoiceRules({ routeChoices: [1, null, { measured: 3 }] })).toEqual([]);
  });

  it("keeps ids unique and one choice per work and model (RC-3)", () => {
    const u = report();
    u.routeChoices[1]!.id = u.routeChoices[0]!.id;
    expect(paths(u)).toContain("FAC-SEM-184 /routeChoices/1/id");
    const v = report();
    v.routeChoices[1] = { ...v.routeChoices[0]!, id: "rc-other" };
    expect(paths(v)).toEqual(["FAC-SEM-184 /routeChoices/1/work"]);
  });

  it("names the runner of a subscription choice (DEC-0046 item 3)", () => {
    const u = report();
    delete u.routeChoices[0]!.runner;
    expect(paths(u)).toEqual(["FAC-SEM-184 /routeChoices/0/runner"]);
  });

  it("records previous only when the route changed (RC-4)", () => {
    const u = report();
    u.routeChoices[0]!.previous = "subscription";
    expect(paths(u)).toEqual(["FAC-SEM-184 /routeChoices/0/previous"]);
  });

  it("reads the window and the decision against the report (RC-2, RC-5)", () => {
    const u = report();
    u.routeChoices[0]!.decidedAt = "2026-10-05T00:00:00Z";
    expect(paths(u)).toEqual(["FAC-SEM-184 /routeChoices/0/decidedAt"]);
    const v = report();
    v.routeChoices[0]!.measured.from = "2026-10-04";
    expect(paths(v)).toEqual(["FAC-SEM-184 /routeChoices/0/measured/from"]);
    const w = report();
    w.routeChoices[0]!.measured.to = "2026-10-05";
    expect(paths(w)).toEqual(["FAC-SEM-184 /routeChoices/0/measured/to"]);
    const x = report();
    x.generatedAt = "not a time";
    x.routeChoices[0]!.measured.from = "2026-02-30";
    expect(paths(x)).toEqual([]);
  });

  it("reviews within 92 days, after the day of the decision; an overdue review is valid (RC-5)", () => {
    const u = report();
    u.routeChoices[0]!.reviewBy = "2026-10-04";
    expect(paths(u)).toEqual(["FAC-SEM-184 /routeChoices/0/reviewBy"]);
    const v = report();
    v.routeChoices[0]!.reviewBy = "2027-01-05";
    expect(paths(v)).toEqual(["FAC-SEM-184 /routeChoices/0/reviewBy"]);
    const w = report();
    w.routeChoices[0]!.reviewBy = "2027-01-04";
    expect(paths(w)).toEqual([]);
    const overdue = report();
    overdue.generatedAt = "2027-03-01T00:00:00Z";
    expect(paths(overdue)).toEqual([]);
    const unreadable = report();
    unreadable.routeChoices[0]!.decidedAt = "yesterday";
    expect(paths(unreadable)).toEqual([]);
  });
});

describe("cheaperRoute: the comparison a host shows (DEC-0186 RC-4)", () => {
  const choice = (chosen: string, tokens: unknown, subscription: unknown, quotaFits?: unknown) => ({
    chosen,
    measured: { tokensUsdMonth: tokens, subscriptionUsdMonth: subscription, ...(quotaFits === undefined ? {} : { quotaFits }) }
  });

  it("says which side is cheaper and whether the choice is", () => {
    expect(cheaperRoute(choice("subscription", 38.5, 20, true))).toEqual({ cheaper: "subscription", chosenIsCheaper: true, savingOnTokensUsd: -18.5, quotaBlocksSubscription: false });
    expect(cheaperRoute(choice("key", 2.2, 20))).toEqual({ cheaper: "tokens", chosenIsCheaper: true, savingOnTokensUsd: 17.8, quotaBlocksSubscription: false });
    expect(cheaperRoute(choice("platform-metered", 30, 20))).toEqual({ cheaper: "subscription", chosenIsCheaper: false, savingOnTokensUsd: -10, quotaBlocksSubscription: false });
    expect(cheaperRoute(choice("subscription", 20, 20))).toEqual({ cheaper: "even", chosenIsCheaper: null, savingOnTokensUsd: 0, quotaBlocksSubscription: false });
  });

  it("flags a cheaper subscription whose quota the volume does not fit", () => {
    expect(cheaperRoute(choice("key", 60, 20, false))).toMatchObject({ cheaper: "subscription", chosenIsCheaper: false, quotaBlocksSubscription: true });
    expect(cheaperRoute(choice("key", 10, 20, false))).toMatchObject({ cheaper: "tokens", quotaBlocksSubscription: false });
  });

  it("answers unknown for an unknown price, never a guess", () => {
    expect(cheaperRoute(choice("key", 2.2, null))).toEqual({ cheaper: "unknown", chosenIsCheaper: null, savingOnTokensUsd: null, quotaBlocksSubscription: false });
    expect(cheaperRoute(choice("key", -1, 20))?.cheaper).toBe("unknown");
    expect(cheaperRoute(choice("key", Number.POSITIVE_INFINITY, 20))?.cheaper).toBe("unknown");
  });

  it("answers undefined for what is not a route choice", () => {
    expect(cheaperRoute(null)).toBeUndefined();
    expect(cheaperRoute({ chosen: "key" })).toBeUndefined();
    expect(cheaperRoute(choice("tokens", 1, 2))).toBeUndefined();
  });

  it("agrees with the fixture's entries", () => {
    const [drafting, classify] = report().routeChoices;
    expect(cheaperRoute(drafting)?.chosenIsCheaper).toBe(true);
    expect(cheaperRoute(classify)?.cheaper).toBe("unknown");
  });
});
