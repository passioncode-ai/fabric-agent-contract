import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { ADMINISTRATORS_SID, SYSTEM_SID, windowsTokenAclProblem } from "../src/windows-token.js";

// DEC-0057 (F-B-210): the Windows token-file reader rule of service.md as a reference function with vectors, because a
// consumer's reader got it wrong once (DEC-0033: an Administrators-owned file refused in Fabric Dashboards' CI).
interface Case { name: string; file: Record<string, unknown>; problem: string | null; sid?: string; at?: string }
const vectors = JSON.parse(readFileSync(path.join(projectRoot(), "fixtures/vectors/windows-token.json"), "utf8")) as { currentUserSid: string; cases: Case[] };
const user = vectors.currentUserSid;
const base = () => structuredClone(vectors.cases[0]!.file) as Record<string, unknown> & { aces: Array<Record<string, unknown>> };

describe("Windows token files: the reader (FAC-SEM-079)", () => {
  it.each(vectors.cases)("$name", (vector) => {
    const problem = windowsTokenAclProblem(vector.file, user);
    expect(problem?.problem ?? null).toBe(vector.problem);
    if (vector.sid) expect(problem?.sid).toBe(vector.sid);
    if (vector.at) expect(problem?.at).toBe(vector.at);
  });

  it("holds the four cases the receipt names", () => {
    const named = new Map(vectors.cases.map((vector) => [vector.name, vector.problem]));
    expect(named.get("owned by Administrators: an elevated administrator wrote it (DEC-0033)")).toBeNull();
    expect(named.get("an Everyone ACE is refused")).toBe("ace-sid");
    expect(named.get("a deny ACE for Everyone is ignored")).toBeNull();
    expect(named.get("a left-behind CREATOR OWNER ACE is refused")).toBe("ace-sid");
  });

  it("trusts exactly the user, SYSTEM and Administrators", () => {
    expect([SYSTEM_SID, ADMINISTRATORS_SID]).toEqual(["S-1-5-18", "S-1-5-32-544"]);
    for (const trustee of [user, SYSTEM_SID, ADMINISTRATORS_SID]) {
      const file = base();
      file.aces = [{ type: "allow", sid: trustee, mask: 1 }];
      expect(windowsTokenAclProblem(file, user), trustee).toBeNull();
    }
    // The current user's SID is the reader's, not a constant: the same file read by another user is refused.
    const other = "S-1-5-21-1004336348-1177238915-682003330-1002";
    expect(windowsTokenAclProblem(base(), other)).toMatchObject({ problem: "owner", sid: user });
  });

  it("checks in order: the file, the owner, then each ACE", () => {
    const file = base();
    Object.assign(file, { isReparsePoint: true, isRegularFile: false, realPathInProfile: false, ownerSid: "S-1-1-0" });
    expect(windowsTokenAclProblem(file, user)?.problem).toBe("reparse-point");
    file.isReparsePoint = false;
    expect(windowsTokenAclProblem(file, user)?.problem).toBe("not-regular-file");
    file.isRegularFile = true;
    expect(windowsTokenAclProblem(file, user)?.problem).toBe("outside-profile");
    file.realPathInProfile = true;
    expect(windowsTokenAclProblem(file, user)?.problem).toBe("owner");
  });

  it("refuses rather than throws on anything unreadable, naming where", () => {
    expect(windowsTokenAclProblem(base(), "not a sid")).toMatchObject({ problem: "unreadable", at: "/currentUserSid" });
    expect(windowsTokenAclProblem(base(), undefined)?.at).toBe("/currentUserSid");
    for (const file of [undefined, null, 7, "x", []]) expect(windowsTokenAclProblem(file, user)).toMatchObject({ problem: "unreadable", at: "/file" });
    for (const flag of ["isRegularFile", "isReparsePoint", "realPathInProfile"]) {
      const file = base();
      file[flag] = "yes";
      expect(windowsTokenAclProblem(file, user)).toMatchObject({ problem: "unreadable", at: `/file/${flag}` });
    }
    const file = base();
    file.aces = [7 as unknown as Record<string, unknown>];
    expect(windowsTokenAclProblem(file, user)).toMatchObject({ problem: "unreadable", at: "/file/aces/0" });
    file.aces = [{ type: "allow", sid: user, mask: 1.5 }];
    expect(windowsTokenAclProblem(file, user)?.at).toBe("/file/aces/0/mask");
    file.aces = [{ type: "allow", sid: user, mask: 0xffffffff }];
    expect(windowsTokenAclProblem(file, user)).toBeNull();
    file.aces = [{ type: "allow", sid: user, mask: "2032127" }];
    expect(windowsTokenAclProblem(file, user)?.at).toBe("/file/aces/0/mask");
    // An ACE for a stranger behind a malformed one: the first refusal wins, and either way the file is refused.
    file.aces = [{ type: "deny", sid: "constructor", mask: 1 }, { type: "allow", sid: "S-1-1-0", mask: 1 }];
    expect(windowsTokenAclProblem(file, user)?.problem).toBe("unreadable");
  });

  it("answers as a rule kind with one finding naming the SID, never the file's contents", () => {
    const refused = vectors.cases.find((vector) => vector.name === "an Everyone ACE is refused")!;
    const found = evaluateSemanticRules("windows-token-file", { file: refused.file, currentUserSid: user });
    expect(found).toEqual([{ code: "FAC-SEM-079", instancePath: "/file/aces/1/sid", message: expect.stringContaining("S-1-1-0") as string }]);
    expect(evaluateSemanticRules("windows-token-file", { file: base(), currentUserSid: user })).toEqual([]);
    expect(evaluateSemanticRules("windows-token-file", {}).map((finding) => finding.instancePath)).toEqual(["/currentUserSid"]);
  });
});
