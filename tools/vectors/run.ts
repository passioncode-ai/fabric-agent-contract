/**
 * Every vector generator in one run: `pnpm vectors:check` compares each committed vector file with what its generator
 * writes (exit 1 on any difference, naming every stale file); `pnpm vectors:write` writes them all.
 *
 *   tsx tools/vectors/run.ts --check   (the default)
 *   tsx tools/vectors/run.ts --write
 *
 * Each generator keeps its own `--check` and `--write` (`tsx tools/vectors/<name>.ts --write`), and each one's test
 * runs its own check in the gate; this runner is the one command for a change that moves several. A new generator is
 * added to `GENERATORS` below: `test/vectors-runner.test.ts` fails while a file in `tools/vectors/` is missing here.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { projectRoot } from "../../src/contract.js";
import * as agentNetwork from "./agent-network.js";
import * as commsHold from "./comms-hold.js";
import * as connections from "./connections.js";
import * as contextRoute from "./context-route.js";
import * as enrollToken from "./enroll-token.js";
import * as entitlement from "./entitlement.js";
import * as folderAttribution from "./folder-attribution.js";
import * as jobLimits from "./job-limits.js";
import * as machineCall from "./machine-call.js";
import * as pairing from "./pairing.js";
import * as partnerUsage from "./partner-usage.js";
import * as relayCrypto from "./relay-crypto.js";
import * as shareRegistration from "./share-registration.js";

/** One generator: its source in `tools/vectors/`, and the exact text of each file it writes, by repository path. */
export interface Generator { source: string; build: () => Record<string, string> }

const one = (file: string, build: () => string) => () => ({ [file]: build() });

export const GENERATORS: readonly Generator[] = [
  { source: "agent-network.ts", build: one(agentNetwork.VECTOR_FILE, agentNetwork.buildAgentNetworkVectors) },
  { source: "comms-hold.ts", build: one(commsHold.VECTOR_FILE, commsHold.buildCommsHoldVectors) },
  { source: "connections.ts", build: one(connections.VECTOR_FILE, connections.buildConnectionsVectors) },
  { source: "context-route.ts", build: one(contextRoute.VECTOR_FILE, contextRoute.buildContextRouteVectors) },
  { source: "enroll-token.ts", build: one(enrollToken.VECTOR_FILE, enrollToken.buildEnrollTokenVectors) },
  { source: "entitlement.ts", build: one(entitlement.VECTOR_FILE, entitlement.buildEntitlementVectors) },
  { source: "folder-attribution.ts", build: one(folderAttribution.VECTOR_FILE, folderAttribution.buildFolderAttributionVectors) },
  { source: "job-limits.ts", build: one(jobLimits.VECTOR_FILE, jobLimits.buildJobLimitVectors) },
  { source: "machine-call.ts", build: one(machineCall.VECTOR_FILE, machineCall.buildMachineCallVectors) },
  { source: "pairing.ts", build: one(pairing.VECTOR_FILE, pairing.buildPairingVectors) },
  { source: "partner-usage.ts", build: one(partnerUsage.VECTOR_FILE, partnerUsage.buildPartnerUsageVectors) },
  { source: "relay-crypto.ts", build: () => relayCrypto.buildVectorFiles() },
  { source: "share-registration.ts", build: one(shareRegistration.VECTOR_FILE, shareRegistration.buildShareRegistrationVectors) }
];

/**
 * Builds every generator's files first, then writes them (`write`) or compares them with the committed text. Building
 * before writing matters: `relay-crypto.ts` reads two of its own committed files as input. Returns the stale files.
 */
export function runVectors(write: boolean, root: string = projectRoot()): { files: string[]; stale: string[] } {
  const built = GENERATORS.map((generator) => generator.build());
  const files: string[] = [];
  const stale: string[] = [];
  for (const texts of built) {
    for (const [file, text] of Object.entries(texts)) {
      files.push(file);
      const target = path.join(root, file);
      if (write) writeFileSync(target, text);
      else if (!existsSync(target) || readFileSync(target, "utf8") !== text) stale.push(file);
    }
  }
  return { files, stale };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const write = process.argv.includes("--write");
  const { files, stale } = runVectors(write);
  if (stale.length) {
    console.error(`stale vector files (run pnpm vectors:write): ${stale.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log(write ? `wrote ${files.length} vector files` : `${files.length} vector files match their generators`);
  }
}
