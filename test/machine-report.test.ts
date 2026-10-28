import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SCHEMA_PREFIX, projectRoot } from "../src/contract.js";
import {
  MACHINE_REPORT_INTERVAL_SECONDS,
  MACHINE_REPORT_REFUSALS,
  MACHINE_REPORT_SEAL_REFUSALS,
  MACHINE_REPORT_ACCEPT_REFUSALS,
  MAX_MACHINE_REPORT_BYTES,
  acceptMachineReport,
  machineReportAad,
  machineReportRules,
  openMachineReport,
  readMachineReport,
  sealMachineReport
} from "../src/machine-report.js";
import { rfc8785 } from "../src/canonical.js";
import { instantKey } from "../src/rfc3339.js";
import { instant } from "../src/relay.js";
import { hpkeSealBase } from "../src/secret-envelope.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidator, validateDocument } from "../src/validator.js";
import { VECTOR_FILE, buildMachineReportVectors } from "../tools/vectors/machine-report.js";

// DEC-0132 (CT-152): a machine's report to its estate's hub, sealed to the hub's #kem inside a relay message body.
type Json = Record<string, any>;
const root = projectRoot();
const vectors = JSON.parse(readFileSync(path.join(root, VECTOR_FILE), "utf8")) as Json;
const validator = await createValidator();
const valid = (schema: string) => (doc: unknown) => validateDocument(validator, `${SCHEMA_PREFIX}schemas/${schema}`, doc).valid;
const reportValid = valid("machine-report.schema.json");
const sealedValid = valid("machine-report-sealed.schema.json");
const json = (value: unknown) => JSON.parse(JSON.stringify(value ?? null));
const ctx = (over: Json = {}) => ({ ...(vectors.open[0].context as Json), schemaValid: reportValid, ...over }) as Parameters<typeof openMachineReport>[1];
const SEALED = vectors.seal.expect.sealed as Json;
const REPORT = vectors.report as Json;

describe("the machine-report vectors (DEC-0132)", () => {
  it("are the generator's output", () => {
    expect(readFileSync(path.join(root, VECTOR_FILE), "utf8")).toBe(buildMachineReportVectors());
  });

  it("seal: the reference seals the report to the same bytes, and the sealed report and the report are their schemas'", () => {
    const c = vectors.seal.context as Json;
    expect(json(sealMachineReport(REPORT, { ...c, ephemeral: Buffer.from(c.ephemeral, "hex") } as Parameters<typeof sealMachineReport>[1]))).toEqual(vectors.seal.expect);
    expect(machineReportAad({ from: c.from, to: c.to, msgId: c.msgId, kem: c.recipient.kid }).toString("utf8")).toBe(vectors.seal.aad);
    expect(sealedValid(SEALED)).toBe(true);
    expect(reportValid(REPORT)).toBe(true);
  });

  it.each(vectors.open as Json[])("open: $name", (c) => {
    const answer = openMachineReport(c.sealed, { ...c.context, schemaValid: reportValid });
    if (c.expect.ok && !("report" in c.expect)) {
      expect(answer.ok).toBe(true);
      const report = (answer as { report: Json }).report;
      expect(report.machine).toBe(c.context.sender);
      expect(evaluateSemanticRules("machine-report", report).map((finding) => finding.code)).toEqual(c.findings ?? []);
    } else {
      expect(json(answer)).toEqual(c.expect);
    }
  });
});

describe("acceptMachineReport (MR-2, MR-4)", () => {
  it.each(vectors.accept as Json[])("accept: $name", (c) => {
    const answer = acceptMachineReport(c.report, { ...c.context, schemaValid: reportValid });
    expect(json(answer)).toEqual(c.expect.ok ? { ok: true, report: c.report } : c.expect);
  });

  it("refuses what is no report and a schema check that throws, and never throws itself", () => {
    expect(MACHINE_REPORT_ACCEPT_REFUSALS).toEqual(["malformed", "wrong-machine", "stale"]);
    for (const report of [null, 1, [], { ...REPORT, type: "x" }]) expect(acceptMachineReport(report, { machine: "m-a", schemaValid: reportValid })).toEqual({ ok: false, refusal: "malformed" });
    expect(acceptMachineReport(REPORT, { machine: "m-a", schemaValid: () => { throw new Error("x"); } })).toEqual({ ok: false, refusal: "malformed" });
    expect(acceptMachineReport(REPORT, { machine: "m-a", held: { at: "unreadable" }, schemaValid: reportValid })).toEqual({ ok: true, report: REPORT });
    expect(acceptMachineReport(REPORT, { machine: "m-a", held: { at: 7 }, schemaValid: reportValid })).toEqual({ ok: true, report: REPORT });
  });
});

describe("readMachineReport (MR-4's whole reading, DEC-0146)", () => {
  it.each(vectors.read as Json[])("read: $name", (c) => {
    const answer = readMachineReport(c.sealed, { ...c.context, schemaValid: reportValid });
    expect(json(answer)).toEqual(c.expect);
  });

  it("answers what openMachineReport refuses, and what acceptMachineReport then refuses, never throwing", () => {
    const read = (over: Json = {}) => ({ ...ctx(over), notAfter: "2026-10-27T08:00:01Z" });
    expect(readMachineReport(null, read())).toEqual({ ok: false, refusal: "malformed" });
    expect(readMachineReport(SEALED, read({ msgId: "other" }))).toEqual({ ok: false, refusal: "cannot-open" });
    expect(readMachineReport(SEALED, read())).toEqual({ ok: true, report: REPORT });
  });
});

describe("FAC-SEM-154: a report's at is a relay time (DEC-0146)", () => {
  it("reads exactly the times the relay's own instant reads (relay.json's instant group)", () => {
    const relayVectors = JSON.parse(readFileSync(path.join(root, "fixtures/vectors/relay.json"), "utf8")) as Json;
    const cases = (relayVectors.instant as Json).cases as Json[];
    expect(cases.length).toBeGreaterThan(0);
    for (const c of cases) expect(instantKey(c.value) !== undefined, String(c.value)).toBe(instant(c.value) !== undefined);
  });

  it("flags an at the hub refuses and passes one it reads", () => {
    const codes = (at: unknown) => evaluateSemanticRules("machine-report", { ...REPORT, at }).map((finding) => finding.code);
    for (const at of ["2026-10-27T08:00:00+00:00", "2026-10-27t08:00:00Z", "2026-10-27T08:00:00.0000000001Z", "2026-12-31T23:59:60Z", "2026-02-30T08:00:00Z"]) expect(codes(at), at).toEqual(["FAC-SEM-154"]);
    for (const at of ["2026-10-27T08:00:00Z", "2026-10-27T08:00:00.123456789Z"]) expect(codes(at), at).toEqual([]);
    expect(codes(7)).toEqual([]);
  });
});

describe("sealMachineReport (MR-3)", () => {
  const c = vectors.seal.context as Json;
  const base = { from: c.from, to: c.to, msgId: c.msgId, recipient: c.recipient };
  it("names its refusals, the 64 KiB limit and the daily report", () => {
    expect(MACHINE_REPORT_SEAL_REFUSALS).toEqual(["malformed", "bad-key", "too-large"]);
    expect(MACHINE_REPORT_REFUSALS).toEqual(["malformed", "wrong-recipient", "cannot-open", "wrong-machine", "stale"]);
    expect(MAX_MACHINE_REPORT_BYTES).toBe(65_536);
    expect(MACHINE_REPORT_INTERVAL_SECONDS).toBe(86_400);
  });

  it("refuses what is no report, a body without its members, a key that is no #kem point, and a report over the limit", () => {
    for (const report of [null, 1, { ...REPORT, type: "x" }]) expect(sealMachineReport(report, base)).toEqual({ ok: false, refusal: "malformed" });
    for (const over of [{ from: 1 }, { to: null }, { msgId: undefined }]) expect(sealMachineReport(REPORT, { ...base, ...over })).toEqual({ ok: false, refusal: "malformed" });
    expect(sealMachineReport({ ...REPORT, machine: "\ud800" }, base)).toEqual({ ok: false, refusal: "malformed" });
    for (const recipient of [{ kid: "m-hub#sig", publicKey: c.recipient.publicKey }, { kid: 1, publicKey: c.recipient.publicKey }, { kid: c.recipient.kid, publicKey: "AAAA" }, { kid: c.recipient.kid, publicKey: 7 }, { kid: c.recipient.kid, publicKey: Buffer.alloc(65, 4).toString("base64") }]) {
      expect(sealMachineReport(REPORT, { ...base, recipient }), JSON.stringify(recipient).slice(0, 40)).toEqual({ ok: false, refusal: "bad-key" });
    }
    // The limit is the plaintext's RFC 8785 length: exactly 65 536 bytes seal and open, one more is too large.
    const padded = (bytes: number) => {
      const shell = Buffer.byteLength(rfc8785({ ...REPORT, machine: "" }), "utf8");
      return { ...REPORT, machine: "m".repeat(bytes - shell) };
    };
    const exact = sealMachineReport(padded(MAX_MACHINE_REPORT_BYTES), base);
    expect(exact.ok).toBe(true);
    expect(openMachineReport((exact as { sealed: unknown }).sealed, ctx({ sender: padded(MAX_MACHINE_REPORT_BYTES).machine, schemaValid: () => true })).ok).toBe(true);
    expect(sealMachineReport(padded(MAX_MACHINE_REPORT_BYTES + 1), base)).toEqual({ ok: false, refusal: "too-large" });
    expect(sealMachineReport(REPORT, { ...base, ephemeral: Buffer.alloc(32) })).toEqual({ ok: false, refusal: "malformed" });
  });

  it("round-trips without a fixed ephemeral key", () => {
    const sealed = sealMachineReport(REPORT, base);
    expect(sealed.ok).toBe(true);
    expect(openMachineReport((sealed as { sealed: unknown }).sealed, ctx())).toEqual({ ok: true, report: REPORT });
  });
});

describe("openMachineReport (MR-4)", () => {
  it("refuses a sealed shape that is not the schema's before it opens anything", () => {
    for (const sealed of [null, { ...SEALED, extra: 1 }, { ...SEALED, type: "fabric-agent-call/1" }, { ...SEALED, kem: "m-hub#sig" }, { ...SEALED, kem: 1 }, { ...SEALED, enc: 1 }, { ...SEALED, ct: "a b" },
      { ...SEALED, enc: `${SEALED.enc.slice(0, -1)}B` }, { ...SEALED, enc: "AAAA" }, { ...SEALED, ct: "AAAA" }, { ...SEALED, ct: "A".repeat(87_408) }]) {
      expect(openMachineReport(sealed, ctx()), JSON.stringify(sealed)?.slice(0, 60)).toEqual({ ok: false, refusal: "malformed" });
    }
  });

  it("refuses another recipient, a body it was not sealed in and a key that cannot open it", () => {
    expect(openMachineReport(SEALED, ctx({ own: { kid: "m-other#kem", privateKey: "x" } }))).toEqual({ ok: false, refusal: "wrong-recipient" });
    expect(openMachineReport(SEALED, ctx({ from: "m-b#sig" }))).toEqual({ ok: false, refusal: "cannot-open" });
    expect(openMachineReport(SEALED, ctx({ own: { kid: "m-hub#kem", privateKey: 7 } }))).toEqual({ ok: false, refusal: "cannot-open" });
  });

  it("refuses a plaintext that is not a report's JSON in its own RFC 8785 form, whatever the schema says", () => {
    const c = vectors.seal.context as Json;
    const raw = (bytes: Buffer) => {
      const { enc, ct } = hpkeSealBase(Buffer.from(c.recipient.publicKey, "base64"), Buffer.from("fabric-machine-report/1", "ascii"), machineReportAad({ from: c.from, to: c.to, msgId: c.msgId, kem: c.recipient.kid }), bytes);
      return { type: "fabric-machine-report/1", kem: c.recipient.kid, enc: enc.toString("base64url"), ct: ct.toString("base64url") };
    };
    for (const bytes of [Buffer.from("[1]"), Buffer.from(rfc8785({ ...REPORT, type: "fabric-agent-call/1" })), Buffer.from(" {}"), Buffer.from([0xff]), Buffer.from(JSON.stringify(REPORT, null, 1))]) {
      expect(openMachineReport(raw(bytes), ctx({ schemaValid: () => true })), bytes.toString().slice(0, 20)).toEqual({ ok: false, refusal: "malformed" });
    }
  });

  it("refuses a plaintext the schema refuses, and a schema check that throws", () => {
    expect(openMachineReport(SEALED, ctx({ schemaValid: () => false }))).toEqual({ ok: false, refusal: "malformed" });
    expect(openMachineReport(SEALED, ctx({ schemaValid: () => { throw new Error("x"); } }))).toEqual({ ok: false, refusal: "malformed" });
  });

  it("keeps a held report it cannot read from refusing a newer one, and a report whose time it cannot read is malformed, held or not", () => {
    expect(openMachineReport(SEALED, ctx({ held: { at: "not a time" } }))).toEqual({ ok: true, report: REPORT });
    expect(openMachineReport(SEALED, ctx({ held: { at: 7 } }))).toEqual({ ok: true, report: REPORT });
    expect(openMachineReport(SEALED, ctx({ held: null }))).toEqual({ ok: true, report: REPORT });
    const timeless = sealMachineReport({ ...REPORT, at: 5 }, { from: vectors.seal.context.from, to: vectors.seal.context.to, msgId: vectors.seal.context.msgId, recipient: vectors.seal.context.recipient });
    const sealed = (timeless as { sealed: unknown }).sealed;
    expect(openMachineReport(sealed, ctx({ schemaValid: () => true, held: { at: "2026-10-27T07:00:00Z" } }))).toEqual({ ok: false, refusal: "malformed" });
    expect(openMachineReport(sealed, ctx({ schemaValid: () => true }))).toEqual({ ok: false, refusal: "malformed" });
  });
});

describe("FAC-SEM-152", () => {
  it("names each lease once, and reads only its own kind", () => {
    const twice = { ...REPORT, records: { ...REPORT.records, leases: [REPORT.records.leases[0], REPORT.records.leases[0], { expiresAt: "x" }, 1] } };
    expect(machineReportRules("machine-report", twice)).toEqual([{ code: "FAC-SEM-152", instancePath: "/records/leases/1/leaseId", message: "a report names each lease once" }]);
    expect(machineReportRules("machine-report", { records: 1 })).toEqual([]);
    expect(machineReportRules("machine-report", { records: { leases: 1 } })).toEqual([]);
    expect(machineReportRules("heartbeat", REPORT)).toBeUndefined();
    expect(evaluateSemanticRules("machine-report", REPORT)).toEqual([]);
  });
});
