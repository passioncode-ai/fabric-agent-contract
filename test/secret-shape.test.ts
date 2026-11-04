import { describe, expect, it } from "vitest";
import { SECRET_VALUE, secretArgument, secretUrl, secretValue } from "../src/secret-shape.js";
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
  it("finds a key right after a percent-escape or a backslash escape, after a letter as well (DEC-0151)", () => {
    const hex = tail(64, "0123456789abcdef");
    const escaped = [`AKIA${tail(16, "0123456789ABCDEFGHJ")}`, `glpat-${tail(20, "aB3cD4eF5gH6jK7mN8")}`, `sk-or-v1-${hex}`, keys.openai, `sk-proj-${tail(48, "aB3cD4eF5gH6jK7mN8_-")}`];
    // A literal backslash and n, as an escaped JSON or log line holds it, and a real newline too.
    for (const key of escaped) {
      for (const value of ["a\\n" + key, `a\n${key}`, `a%20${key}`, `%22${key}`, `"${key}`, "x\\u0022" + key, "x\\\"" + key, "x\\t" + key]) {
        expect(SECRET_VALUE.test(value), JSON.stringify(value)).toBe(true);
      }
    }
  });
  it("finds nothing the earlier pattern did not, over a sweep of prefixes, joins and tails", () => {
    const earlier = /(^bearer\s.+|sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abposr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|glpat-[A-Za-z0-9_-]{20,})/i;
    const heads = ["", "a", "Z", "9", "_", "-", ".", ":", " ", "%2", "%20", "%2g", "\\", "\\n", "\\x", "\\u002", "\\u0022", "\\uZZZZ", "\\x41", "\\b", "\\e", "\\0", "\u001b[0m", "\\u001b[1;31m", "\u001b[0", "\\042", "\\1234", "%2522", "%252", "\\x1B[0m", "\\033[1m", "\\e[0m", "\\33[0m", "\u001b[38:5:1m", "\\x{1b}[0m", "\u009b0m", "\"", "'", "=", "/", "é", "bearer "];
    const prefixes = ["sk-", "SK-", "ghp_", "gho_", "xoxb-", "xoxq-", "AKIA", "akia", "glpat-", "s k-"];
    const tails = [tail(8, "aB3cD4"), tail(24, "aB3cD4eF5gH6jK7mN8"), tail(16, "0123456789ABCDEF"), tail(40, "abc-def_")];
    let newOnly = 0;
    let found = 0;
    for (const head of heads) for (const prefix of prefixes) for (const end of tails) {
      const value = `${head}${prefix}${end}`;
      if (SECRET_VALUE.test(value)) {
        found += 1;
        if (!earlier.test(value)) newOnly += 1;
      }
    }
    expect(newOnly).toBe(0);
    expect(found).toBeGreaterThan(0);
  });
  it("takes an sk- key only with a digit and an upper-case letter or 32 characters, so a lower-case slug word is none (DEC-0151)", () => {
    const hex = tail(64, "0123456789abcdef");
    for (const key of [keys.openai, `sk-proj-${tail(48, "aB3cD4eF5gH6jK7mN8_-")}`, `sk-or-v1-${hex}`]) {
      for (const value of [key, ` ${key}`, `"${key}`, `=${key}`, `:${key}`, `Bearer ${key}`, "a\\n" + key, `a%20${key}`, `%22${key}`, "x\\u0022" + key]) {
        expect(SECRET_VALUE.test(value), JSON.stringify(value)).toBe(true);
      }
    }
    for (const value of ["sk-learn-experiments", "sk-learn-experiments-2026", "sk-harbor-customer-care", "acme-sk-customer-support-eu", "sk-tundra-customer-care", `sk-${tail(20, "abcdefgh")}`, `sk-${tail(24, "abc123")}`]) {
      expect(SECRET_VALUE.test(value), value).toBe(false);
    }
  });
  it("reads provider prefixes in their canonical case only, and Bearer in any case (DEC-0151)", () => {
    const hex = tail(64, "0123456789abcdef");
    expect(SECRET_VALUE.test(`sk-or-v1-${hex}`)).toBe(true);
    for (const value of [keys.openai.replace("sk-", "SK-"), keys.github.replace("ghp_", "GHP_"), keys.slack.replace("xoxb-", "XOXB-"), keys.aws.replace("AKIA", "akia"), keys.gitlab.replace("glpat-", "GLPAT-")]) {
      expect(SECRET_VALUE.test(value), value).toBe(false);
    }
    for (const value of ["Bearer abc.def", "bearer abc.def", "BEARER abc.def", "bEaReR x"]) expect(SECRET_VALUE.test(value), value).toBe(true);
    expect(SECRET_VALUE.flags).toBe("");
  });
  it("accepts an alias with a weak sk- slug word, and reads one whose slug word starts with a provider prefix and holds enough key characters as a credential (DEC-0151)", () => {
    const page = (project: string) => ({ events: [{ id: "1", at: "2026-10-19T00:20:00Z", kind: "support.quality_daily", level: "info", text: "Support quality for chat on 2026-10-18.", data: { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: { kind: "support-quality-daily/1", project } } }], cursor: "1" });
    const codes = (project: string) => evaluateSemanticRules("service-events-page", page(project)).map((finding) => finding.code);
    for (const project of ["project:sk-learn-experiments", "project:acme-sk-customer-support-eu", "project:sk-harbor-customer-care"]) {
      expect(codes(project), project).not.toContain("FAC-SEM-101");
    }
    // The residual: a slug word that starts with a provider prefix and holds enough key characters. For sk-, a run of
    // 32 or more letters, digits, - and _ holding a digit (as a lower-case sk-or-v1- key does); for ghp_, 20 or more.
    expect(codes(["project:sk", "-customer-support-team-europe-2026"].join(""))).toContain("FAC-SEM-101");
    expect(codes(["project:gh", "p_customerservicedeskabcdef"].join(""))).toContain("FAC-SEM-101");
    // Slack's prefix with 10 or more characters; the alias is built from parts so no key-shaped literal sits here.
    expect(codes(["project:xox", "b-support-team"].join(""))).toContain("FAC-SEM-101");
    // 31 characters after sk-, holding a digit and no upper-case letter: no key; 32: a key.
    const run = (n: number) => `${"customer-support-team-europe-".repeat(3).slice(0, n - 1)}7`;
    expect(run(31)).toHaveLength(31);
    expect(codes(`project:sk-${run(31)}`)).not.toContain("FAC-SEM-101");
    expect(codes(`project:sk-${run(32)}`)).toContain("FAC-SEM-101");
    // GitLab's prefix: 19 key characters pass, 20 are read. Built from parts.
    const gl = (n: number) => ["project:", "glpat", "-", "supportdeskeuropeteamx".slice(0, n)].join("");
    expect(codes(gl(19))).not.toContain("FAC-SEM-101");
    expect(codes(gl(20))).toContain("FAC-SEM-101");
  });
  it("knowingly does not find a key after a triple percent-escape, an eight-digit \\U escape or a %u escape (DEC-0151)", () => {
    for (const head of ["a%252522", "a\\U00000022", "a%u0022"]) expect(SECRET_VALUE.test(head + keys.github), head).toBe(false);
  });
  it("lets a support-quality day name a project whose slug holds -sk- (FAC-SEM-101 on the events page)", () => {
    const page = { events: [{ id: "1", at: "2026-10-19T00:20:00Z", kind: "support.quality_daily", level: "info", text: "Support quality for chat on 2026-10-18.", data: { schema: "https://support.example.com/schemas/support-quality-daily.schema.json", value: { kind: "support-quality-daily/1", project: "project:helpdesk-customer-support" } } }], cursor: "1" };
    expect(evaluateSemanticRules("service-events-page", page).filter((finding) => finding.code === "FAC-SEM-101")).toEqual([]);
  });
  it("finds a key after the further escapes: \\x, \\b \\f \\v \\0 \\a \\e, a raw ESC colour sequence and an escaped one (DEC-0151)", () => {
    const hex = tail(64, "0123456789abcdef");
    const esc = String.fromCharCode(27);
    for (const key of [`sk-or-v1-${hex}`, keys.openai, keys.github, `AKIA${tail(16, "0123456789ABCDEFGHJ")}`]) {
      for (const head of ["a\\x41", "a\\b", "a\\f", "a\\v", "a\\0", "a\\a", "a\\e", `a${esc}[0m`, `a${esc}[1;31m`, "a\\u001b[0m", "a\\u001b[1;32m"]) {
        expect(SECRET_VALUE.test(head + key), JSON.stringify(head + key)).toBe(true);
      }
    }
    // Not escapes: a letter or digit before the prefix still hides it.
    for (const head of ["a\\x4", "a\\q", `a${esc}[0`, "ab"]) expect(SECRET_VALUE.test(head + keys.github), JSON.stringify(head)).toBe(false);
  });
  it("reads a long run of sk- prefixes in linear time: the look-aheads are bounded to 255 characters (DEC-0151)", () => {
    // CPU time of this thread where the runtime offers it, else of the process. Two checks: the time grows less than
    // 8 times when the input grows 4 times (a quadratic read grows 16 times), and stays under a generous 500 ms.
    const usage = (): NodeJS.CpuUsage => ((process as unknown as { threadCpuUsage?: () => NodeJS.CpuUsage }).threadCpuUsage ?? process.cpuUsage)();
    const cpuMs = (run: () => unknown): number => {
      const start = usage();
      run();
      const end = usage();
      return (end.user - start.user + end.system - start.system) / 1000;
    };
    const checks = [["SECRET_VALUE.test", (v: string) => SECRET_VALUE.test(v)], ["secretValue", secretValue], ["secretArgument", secretArgument], ["secretUrl", secretUrl]] as const;
    for (const suffix of ["", "-a"]) {
      for (const [name, check] of checks) {
        const timed = (n: number): number => {
          const value = `${"-sk".repeat(n)}${suffix}`;
          let found = true;
          // The best of three, so one scheduling hiccup does not decide the ratio.
          const best = Math.min(...[0, 1, 2].map(() => cpuMs(() => { found = check(value); })));
          expect(found, name).toBe(false);
          return best;
        };
        const small = timed(25000);
        const large = timed(100000);
        expect(large, `${name} on 300000 characters`).toBeLessThan(500);
        expect(large, `${name}: 4 times the input, ${small} ms then ${large} ms`).toBeLessThan(Math.max(8 * small, 40));
      }
    }
    // Twenty-four timed reads of up to 300000 characters: an explicit timeout, since a loaded machine can pass vitest's
    // 5000 ms default while every assertion above holds.
  }, 30000);

  it("finds every key kind after an octal escape, a double percent-escape and the escaped ESC colour forms (DEC-0151)", () => {
    const hex = tail(64, "0123456789abcdef");
    const kinds = [keys.openai, `sk-or-v1-${hex}`, keys.github, keys.slack, keys.aws, keys.gitlab];
    const heads = ["a\\042", "a\\7", "a\\177", "a%2522", "a%253D", "a\\u001B[0m", "a\\x1b[1;31m", "a\\x1B[0m", "a\\e[32m", "a\\033[0m"];
    for (const key of kinds) for (const head of heads) expect(SECRET_VALUE.test(head + key), JSON.stringify(head) + " " + key.slice(0, 5)).toBe(true);
    // Not escapes: an octal run longer than three digits, or a double percent-escape cut short.
    for (const head of ["a\\1234", "a%252", "a\\x1b[0"]) expect(SECRET_VALUE.test(head + keys.github), JSON.stringify(head)).toBe(false);
  });
  it("reads the sk- strength within 256 characters, and finds no key after a CSI sequence that is not a colour one (DEC-0151)", () => {
    const lower = "abcdefghijklmnopqrstuvwxyz".repeat(10).slice(0, 255);
    // A digit at the 256th character still counts (the 32-or-more branch); upper-case letters past it do not matter.
    expect(SECRET_VALUE.test(`sk-${lower}7ABCDE`)).toBe(true);
    // An upper-case letter first, then the digit past the 256th character: neither look-ahead reaches it.
    expect(SECRET_VALUE.test(`sk-A${lower}7`)).toBe(false);
    const esc = String.fromCharCode(27);
    const hex = tail(64, "0123456789abcdef");
    for (const key of [keys.openai, `sk-or-v1-${hex}`, keys.github, keys.slack, keys.aws, keys.gitlab]) {
      for (const head of [`a${esc}[K`, `a${esc}[2J`]) expect(SECRET_VALUE.test(head + key), JSON.stringify(head) + " " + key.slice(0, 5)).toBe(false);
    }
  });
  it("reads the AKIA body in upper case only, as an AWS key id is written (DEC-0151)", () => {
    const body = tail(16, "0123456789ABCDEFGHJ");
    expect(SECRET_VALUE.test(["AK", "IA", body].join(""))).toBe(true);
    expect(SECRET_VALUE.test(["AK", "IA", body.toLowerCase()].join(""))).toBe(false);
  });
  it("is not composable after a separator look-behind: such a composition misses a key after '-', '.' or '_' (DEC-0151)", () => {
    // A port that composes `(?:^|(?<=[._-]))(?:SECRET_VALUE.source)` (a repository-name check) needs a second separator,
    // since the boundary group consumes one: it keeps its own boundary-free key shapes instead, case-sensitive, no i flag.
    const composed = new RegExp(`(?:^|(?<=[._-]))(?:${SECRET_VALUE.source})`, "i");
    for (const key of [keys.github, keys.openai, keys.gitlab]) {
      for (const separator of ["-", ".", "_"]) {
        const value = `x${separator}${key}`;
        expect(SECRET_VALUE.test(value), value.slice(0, 8)).toBe(true);
        expect(composed.test(value), value.slice(0, 8)).toBe(false);
      }
    }
    // And the i flag undoes the canonical case and the sk- strength: it finds what SECRET_VALUE does not.
    const upper = keys.github.replace("ghp_", "GHP_");
    expect(SECRET_VALUE.test(upper)).toBe(false);
    expect(composed.test(upper)).toBe(true);
    for (const length of [16, 31]) {
      const weak = `sk-${"abcdefghijklmnopqrstuvwxyz".repeat(2).slice(0, length - 1)}7`;
      expect(SECRET_VALUE.test(weak), weak).toBe(false);
      expect(composed.test(weak), weak).toBe(true);
    }
  });
  it("takes the colon form of a colour sequence and an escaped \\33, and not the 8-bit CSI, brace escapes, \\E or ^[ (DEC-0151)", () => {
    const esc = String.fromCharCode(27);
    const csi8 = String.fromCharCode(0x9b);
    const hex = tail(64, "0123456789abcdef");
    const kinds = [keys.openai, `sk-or-v1-${hex}`, keys.github, keys.slack, keys.aws, keys.gitlab];
    const found = [`a${esc}[38:5:1m`, `a${esc}[38:2:1:2:3m`, "a\\x1b[38:5:1m", "a\\33[0m", "a\\33[1;31m", "a\\u001b[1:4m"];
    const unfound = [`a${csi8}0m`, `a${csi8}[0m`, "a\\x{1b}[0m", "a\\u{1b}[0m", "a\\E[0m", "a^[[0m"];
    for (const key of kinds) {
      for (const head of found) expect(SECRET_VALUE.test(head + key), JSON.stringify(head) + " " + key.slice(0, 5)).toBe(true);
      for (const head of unfound) expect(SECRET_VALUE.test(head + key), JSON.stringify(head) + " " + key.slice(0, 5)).toBe(false);
    }
  });
  it("finds a strong key at an inner boundary of a rejected sk- run, and no digit or capital past 256 characters (DEC-0151)", () => {
    const low = "abcdefghijklmnopqrstuvwxyz".repeat(12).slice(0, 300);
    expect(SECRET_VALUE.test(`sk-${low}-${keys.openai}`)).toBe(true);
    expect(SECRET_VALUE.test(`sk-${low}_${keys.openai}`)).toBe(true);
    expect(SECRET_VALUE.test(`sk-${low}1A`)).toBe(false);
  });
});
