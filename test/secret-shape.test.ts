import { describe, expect, it } from "vitest";
import { SECRET_VALUE, secretArgument, secretValue } from "../src/secret-shape.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";

// DEC-0151: a provider key's prefix counts only where no letter or digit stands right before it, so a slug such as
// `project:helpdesk-customer-support` (`sk-` inside "helpdesk-") is no key. Keys are built at run time, never
// written whole in the repository.
const tail = (length: number, alphabet: string) => Array.from({ length }, (_, index) => alphabet[(index * 5) % alphabet.length]).join("");
const keys = {
  openai: `sk-${tail(24, "aB3cD4eF5gH6jK7mN8")}`,
  github: `ghp_${tail(36, "aB3cD4eF5gH6jK7mN8")}`,
  slack: `xoxb-${tail(24, "0123456789abcdef")}`,
  aws: `AKIA${tail(16, "0123456789ABCDEFGHJ")}`,
  gitlab: `glpat-${tail(20, "aB3cD4eF5gH6jK7mN8")}`
};

describe("SECRET_VALUE: a provider prefix needs a boundary before it (DEC-0151)", () => {
  it.each(Object.entries(keys))("still finds a %s key at the start, after a space, a quote, '=', ':' and 'Bearer '", (_, key) => {
    for (const value of [key, `token ${key}`, `"${key}"`, `'${key}'`, `api_key=${key}`, `key:${key}`, `Authorization: Bearer ${key}`, `_${key}`, `-${key}`, `/${key}`]) {
      expect(SECRET_VALUE.test(value), value).toBe(true);
      expect(secretValue(value), value).toBe(true);
      expect(secretArgument(value), value).toBe(true);
    }
  });
  it("finds no key inside a word: the prefixes behind a letter or digit", () => {
    for (const value of ["project:helpdesk-customer-support", "project:kiosk-ordering-platform", "project:helpdesk-ticket-automation", "flask-server-configuration-v2", `x${keys.openai}`, `9${keys.github}`, `a${keys.slack}`, `b${keys.aws}`, `c${keys.gitlab}`]) {
      expect(SECRET_VALUE.test(value), value).toBe(false);
    }
  });
  it("only accepts more: a value it finds is one the earlier pattern found too", () => {
    const earlier = /(^bearer\s.+|sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abposr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|glpat-[A-Za-z0-9_-]{20,})/i;
    const samples = [...Object.values(keys), ...Object.values(keys).map((key) => `in${key}`), "Bearer abc.def", "plain words", "project:helpdesk-customer-support", `x${keys.openai} ${keys.openai}`];
    for (const value of samples) if (SECRET_VALUE.test(value)) expect(earlier.test(value), value).toBe(true);
    expect(SECRET_VALUE.test(`x${keys.openai} ${keys.openai}`)).toBe(true);
  });
  it("lets a support-quality day name a project whose slug holds -sk- (FAC-SEM-101 on the events page)", () => {
    const page = { events: [{ id: "1", at: "2026-10-19T00:20:00Z", kind: "support.quality_daily", level: "info", text: "Support quality for chat on 2026-10-18.", data: { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: { kind: "support-quality-daily/1", project: "project:helpdesk-customer-support" } } }], cursor: "1" };
    expect(evaluateSemanticRules("service-events-page", page).filter((finding) => finding.code === "FAC-SEM-101")).toEqual([]);
  });
});
