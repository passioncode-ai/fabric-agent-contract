#!/usr/bin/env node
// Assigns every inventory item of the 2026-10-11 board run to its canvas node, wave and release.
// Reads findings/*.json and waves.json; writes inventory.json; prints the counts per wave and per node.
// Exit 1 when an item lands on no node or on two, or the table names an item no findings file holds.
// A re-cut is an edit to waves.json and a re-run: `node docs/evidence/specs/2026-10-11-board-waves/assign.mjs`.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const table = JSON.parse(readFileSync(path.join(here, "waves.json"), "utf8"));
const problems = [];

const items = new Map();
for (const file of readdirSync(path.join(here, "findings")).filter((name) => name.endsWith(".json")).sort()) {
  for (const raw of JSON.parse(readFileSync(path.join(here, "findings", file), "utf8"))) {
    if (items.has(raw.id)) problems.push(`${raw.id}: in ${items.get(raw.id).file} and ${file}`);
    const source = Array.isArray(raw.source) ? raw.source.join("; ") : String(raw.source ?? "");
    items.set(raw.id, {
      id: raw.id,
      title: raw.title,
      source,
      status: raw.status_measured ?? raw.status ?? "",
      area: raw.area ?? raw.kind ?? raw.visibility ?? "",
      severity: raw.severity ?? null,
      owner: raw.owner ?? (raw.consumer ? raw.consumer : "contract"),
      decision: raw.decision ?? null,
      closable_in_one_pass: raw.closable_in_one_pass ?? null,
      needs: raw.needs ?? (raw.blocked_by ? [].concat(raw.blocked_by).join("; ") : ""),
      evidence: raw.evidence ?? raw.receipts ?? null,
      proposed_fix: raw.proposed_fix ?? raw.must_define ?? null,
      file
    });
  }
}

const placed = new Map();
for (const node of table.nodes) {
  for (const id of node.items) {
    if (!items.has(id)) problems.push(`${node.id}: names ${id}, which no findings file holds`);
    else if (placed.has(id)) problems.push(`${id}: on ${placed.get(id)} and ${node.id}`);
    else placed.set(id, node.id);
  }
}
for (const id of items.keys()) if (!placed.has(id)) problems.push(`${id}: lands on no node`);

const nodeOf = new Map(table.nodes.map((node) => [node.id, node]));
const inventory = [...items.values()]
  .map((item) => {
    const node = nodeOf.get(placed.get(item.id));
    return { ...item, node: node?.id ?? null, wave: node?.wave ?? null, release: node?.release ?? null };
  })
  .sort((a, b) => (a.wave ?? 99) - (b.wave ?? 99) || String(a.node).localeCompare(String(b.node)) || a.id.localeCompare(b.id));

writeFileSync(path.join(here, "inventory.json"), `${JSON.stringify({ schema: 1, generatedBy: "assign.mjs", items: inventory }, null, 2)}\n`);

const count = (key) => inventory.reduce((acc, item) => acc.set(item[key], (acc.get(item[key]) ?? 0) + 1), new Map());
console.log(`items: ${inventory.length}`);
for (const [wave, n] of [...count("wave")].sort((a, b) => (a[0] ?? 99) - (b[0] ?? 99))) console.log(`wave ${wave ?? "program"}: ${n}`);
for (const [node, n] of count("node")) console.log(`  ${node}: ${n}`);
if (problems.length) {
  for (const problem of problems) console.error(`problem: ${problem}`);
  process.exit(1);
}
