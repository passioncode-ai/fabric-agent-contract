/**
 * The generator of the machine-report vectors (DEC-0132): `fixtures/vectors/machine-report.json`, shared by every
 * machine that reports to its estate's hub over the relay and every hub that reads the reports.
 *
 *   tsx tools/vectors/machine-report.ts --check   compare the committed file with what this writes (exit 1 on a difference)
 *   tsx tools/vectors/machine-report.ts --write   write it
 *
 * Every vector change is made here and written by `--write`, never by hand; `test/machine-report.test.ts` runs the
 * check. Each expected answer is written below by hand from DEC-0132's items. The sealed reports are computed: HPKE base
 * mode (`hpkeSealBase`, itself checked against RFC 9180 §A.3.1 by `secret-envelope.json`) with an ephemeral scalar
 * derived from a published label, and the additional data written out here from the decision, so a port reproduces
 * each byte. Nothing here imports `src/machine-report.ts`, so the gate checks that the reference returns what this file
 * expects.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { rfc8785 } from "../../src/canonical.js";
import { projectRoot } from "../../src/contract.js";
import { hpkeSealBase } from "../../src/secret-envelope.js";
import { testKey, type TestKey } from "./relay-crypto.js";

type Json = Record<string, unknown>;
export const VECTOR_FILE = "fixtures/vectors/machine-report.json";

const TYPE = "fabric-machine-report/1";
const LABEL = "fabric-agent-contract/vectors/machine-report/";
const sha256 = (data: string | Buffer) => createHash("sha256").update(data).digest();
const scalar = (key: TestKey) => Buffer.from(key.d.toString(16).padStart(64, "0"), "hex").toString("base64");
const ephemeral = (label: string) => sha256(`${LABEL}ephemeral/${label}`);

const HUB = testKey("machine-report hub kem");
const OTHER = testKey("machine-report other kem");
const FROM = "m-a#sig";
const TO = "m-hub#sig";
const MSG = "report-0001";
const KEM = "m-hub#kem";

const REPORT: Json = {
  type: "machine-report/1",
  machine: "m-a",
  at: "2026-10-27T08:00:00Z",
  records: {
    estateRecord: { revision: 7, digest: `sha256:${"a".repeat(64)}` },
    heartbeat: { sequence: 12, at: "2026-10-27T07:00:00Z" },
    revocationDelta: { sequence: 3, sha256: "b".repeat(64) },
    leases: [{ leaseId: "lease-1", expiresAt: "2026-10-27T20:00:00Z", spent: "1.25" }]
  }
};

/** The additional data DEC-0132 names: the RFC 8785 bytes of `{type, from, to, msgId, kem}`. */
const aad = (from: string, to: string, msgId: string, kem: string) => Buffer.from(rfc8785({ type: TYPE, from, to, msgId, kem }), "utf8");

function seal(label: string, report: unknown, fields: { from?: string; to?: string; msgId?: string; key?: TestKey; kem?: string } = {}): Json {
  const kem = fields.kem ?? KEM;
  const { enc, ct } = hpkeSealBase(Buffer.from((fields.key ?? HUB).octets, "base64"), Buffer.from(TYPE, "ascii"), aad(fields.from ?? FROM, fields.to ?? TO, fields.msgId ?? MSG, kem), Buffer.from(rfc8785(report), "utf8"), ephemeral(label));
  return { type: TYPE, kem, enc: enc.toString("base64url"), ct: ct.toString("base64url") };
}

const TWICE: Json = { ...REPORT, records: { ...(REPORT.records as Json), leases: [{ leaseId: "lease-1", expiresAt: "2026-10-27T20:00:00Z" }, { leaseId: "lease-1", expiresAt: "2026-10-27T21:00:00Z" }] } };

function machineReportVectors(): Json {
  const own = { kid: KEM, privateKey: scalar(HUB) };
  const ctx = (over: Json = {}): Json => ({ from: FROM, to: TO, msgId: MSG, own, sender: "m-a", ...over });
  const sealed = seal("seal", REPORT);
  return {
    description:
      "Vectors for a machine's report to its estate's hub over the relay (DEC-0132), written by tools/vectors/machine-report.ts, never by hand. seal: sealMachineReport(report, context), context.ephemeral the hex ephemeral scalar; recipient.publicKey is the base64 uncompressed P-256 point. open: openMachineReport(sealed, context) with schemaValid the machine-report schema; context.own.privateKey is the base64 P-256 scalar; context.sender is the machine relayCallerTier named; context.held, when present, the report the hub holds for that machine; a case with findings expects the opened report to carry those FAC-SEM codes, and an ok case without report opens the case's own report. accept: acceptMachineReport(report, context) with schemaValid the machine-report schema, the hub's reading of a report it opened or its own node answered over the local channel (MR-2, MR-4); context.machine is the sender relayCallerTier named or the hub's own machine id; an ok case expects the case's own report. A sealed report is HPKE base mode, suite [16, 1, 1], info the ASCII fabric-machine-report/1, the additional data the RFC 8785 UTF-8 bytes of {type, from, to, msgId, kem}, the plaintext the RFC 8785 form of the report; enc and ct are unpadded base64url.",
    report: REPORT,
    seal: {
      context: { from: FROM, to: TO, msgId: MSG, recipient: { kid: KEM, publicKey: HUB.octets }, ephemeral: ephemeral("seal").toString("hex") },
      aad: aad(FROM, TO, MSG, KEM).toString("utf8"),
      expect: { ok: true, sealed }
    },
    open: [
      { name: "the hub opens the report of the machine that sent it", sealed, context: ctx(), expect: { ok: true, report: REPORT } },
      { name: "a report newer than the one held replaces it", sealed, context: ctx({ held: { at: "2026-10-27T07:59:59Z" } }), expect: { ok: true, report: REPORT } },
      { name: "a report not after the one held is stale", sealed, context: ctx({ held: { at: "2026-10-27T08:00:00Z" } }), expect: { ok: false, refusal: "stale" } },
      { name: "a report naming another machine than the sender", sealed, context: ctx({ sender: "m-b" }), expect: { ok: false, refusal: "wrong-machine" } },
      { name: "sealed to another kem", sealed: seal("other-kem", REPORT, { key: OTHER, kem: "m-other#kem" }), context: ctx(), expect: { ok: false, refusal: "wrong-recipient" } },
      { name: "copied into another body (another msgId)", sealed, context: ctx({ msgId: "report-0002" }), expect: { ok: false, refusal: "cannot-open" } },
      { name: "a plaintext that is no report", sealed: seal("not-a-report", { type: "machine-report/1", machine: "m-a" }), context: ctx(), expect: { ok: false, refusal: "malformed" } },
      { name: "a lease named twice is a semantic finding, not a refusal of the seal", sealed: seal("twice", TWICE), context: ctx(), expect: { ok: true }, findings: ["FAC-SEM-152"] },
      { name: "an enc that is not a point on P-256", sealed: { ...sealed, enc: Buffer.concat([Buffer.from([4]), Buffer.alloc(64, 1)]).toString("base64url") }, context: ctx(), expect: { ok: false, refusal: "malformed" } },
      { name: "an at with a leap second, which the schema's date-time takes and RFC 3339 as strictTime reads does not", sealed: seal("leap", { ...REPORT, at: "2026-12-31T23:59:60Z" }), context: ctx(), expect: { ok: false, refusal: "malformed" } },
      { name: "an at with a space for T, held or not", sealed: seal("space", { ...REPORT, at: "2026-10-27 08:00:00Z" }), context: ctx({ held: { at: "2026-10-27T07:00:00Z" } }), expect: { ok: false, refusal: "malformed" } }
    ],
    accept: [
      { name: "the hub's own node answers its report", report: { ...REPORT, machine: "m-hub" }, context: { machine: "m-hub" }, expect: { ok: true } },
      { name: "an opened report whose lease is named twice is dropped", report: TWICE, context: { machine: "m-a" }, expect: { ok: false, refusal: "malformed" } },
      { name: "a report the schema refuses", report: { type: "machine-report/1", machine: "m-hub" }, context: { machine: "m-hub" }, expect: { ok: false, refusal: "malformed" } },
      { name: "an at strictTime cannot read", report: { ...REPORT, machine: "m-hub", at: "2026-12-31T23:59:60Z" }, context: { machine: "m-hub" }, expect: { ok: false, refusal: "malformed" } },
      { name: "a node that answers another machine's report", report: REPORT, context: { machine: "m-hub" }, expect: { ok: false, refusal: "wrong-machine" } },
      { name: "a report not after the one held", report: { ...REPORT, machine: "m-hub" }, context: { machine: "m-hub", held: { at: "2026-10-27T08:00:00Z" } }, expect: { ok: false, refusal: "stale" } },
      { name: "a report after the one held replaces it", report: { ...REPORT, machine: "m-hub" }, context: { machine: "m-hub", held: { at: "2026-10-27T07:59:59Z" } }, expect: { ok: true } }
    ]
  };
}

/** What `--write` writes: the vector file's exact text. */
export function buildMachineReportVectors(): string {
  return `${JSON.stringify(machineReportVectors(), null, 2)}\n`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const target = path.join(projectRoot(), VECTOR_FILE);
  const built = buildMachineReportVectors();
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
