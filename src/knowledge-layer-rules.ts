import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { strictTime } from "./rfc3339.js";

// #region knowledge-layer — docs: docs/specification/memory-and-learning.md#knowledge-layer-dec-0188
const CODE = "FAC-SEM-186";
type Flag = (instancePath: string, message: string) => void;
const flagger = (findings: Finding[]): Flag => (instancePath, message) => findings.push({ code: CODE, instancePath, message });
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const strings = (value: unknown): string[] => list(value).filter((item): item is string => typeof item === "string");

/**
 * FAC-SEM-186 (DEC-0188) on a `knowledge-map/1` answer (KL-5, KL-6, KL-7):
 * - node ids and cluster ids are unique;
 * - every edge joins two nodes of the answer, and never a node to itself;
 * - a node's `cluster` names a cluster of the answer;
 * - with no local embedder (`embedder: null`) there is no semantic edge and `degraded` names `semantic`.
 * Malformed input answers findings or none, never an exception.
 */
export function knowledgeMapRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = flagger(findings);
  const nodes = new Set<string>();
  list(value.nodes).forEach((node, i) => {
    if (!isObject(node) || typeof node.id !== "string") return;
    if (nodes.has(node.id)) flag(`/nodes/${i}/id`, `node id ${show(node.id)} appears twice`);
    nodes.add(node.id);
  });
  const clusters = new Set<string>();
  list(value.clusters).forEach((cluster, i) => {
    if (!isObject(cluster)) return;
    const id = show(cluster.id ?? "");
    if (clusters.has(id)) flag(`/clusters/${i}/id`, `cluster id ${id} appears twice`);
    clusters.add(id);
  });
  list(value.nodes).forEach((node, i) => {
    if (isObject(node) && typeof node.cluster === "string" && !clusters.has(node.cluster)) flag(`/nodes/${i}/cluster`, `cluster ${show(node.cluster)} is not among the answer's clusters`);
  });
  const noEmbedder = value.embedder === null;
  list(value.edges).forEach((edge, i) => {
    if (!isObject(edge)) return;
    for (const end of ["source", "target"] as const) {
      const id = edge[end];
      if (typeof id !== "string" || !nodes.has(id)) flag(`/edges/${i}/${end}`, `an edge joins nodes of the answer: ${show(edge[end] ?? "")} is not one`);
    }
    if (edge.source === edge.target) flag(`/edges/${i}`, "an edge joins two different nodes");
    if (noEmbedder && edge.kind === "semantic") flag(`/edges/${i}/kind`, "a semantic edge comes from a local embedder, and this answer names none");
  });
  if (noEmbedder && !strings(value.degraded).includes("semantic")) flag("/degraded", "with no local embedder the semantic part did not run: degraded names semantic");
  return findings;
}

/**
 * FAC-SEM-186 (DEC-0188) on a `kb-search/1` answer (KL-2, KL-4, KL-6):
 * - result ids are unique and each passage's `lines.from` is not after `lines.to`;
 * - no leg is both in `methods` and in `degraded`;
 * - without a local embedder (`embedder` null or absent) the vector leg did not run: `vector` is in `degraded`, not in
 *   `methods`, and the answer stays lexical;
 * - a call with `hops` names `graph` in `methods` or in `degraded`;
 * - a fact's `valid_to` is after its `valid_from`; with `as_of`, every fact was valid then (`valid_from` at or before
 *   it, `valid_to` absent or after it).
 */
export function kbSearchRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = flagger(findings);
  const methods = strings(value.methods);
  const degraded = strings(value.degraded);
  methods.forEach((method) => {
    if (degraded.includes(method)) flag("/degraded", `${method} is named both as run and as not run`);
  });
  if (!isObject(value.embedder)) {
    if (methods.includes("vector")) flag("/methods", "the vector leg runs on a local embedder, and this answer names none");
    if (!degraded.includes("vector")) flag("/degraded", "with no local embedder the vector leg did not run: degraded names vector");
  }
  if (value.hops !== undefined && !methods.includes("graph") && !degraded.includes("graph")) flag("/methods", "a call with hops runs the graph leg or names it in degraded");
  const asOf = strictTime(value.as_of);
  const ids = new Set<string>();
  list(value.results).forEach((result, i) => {
    if (!isObject(result)) return;
    const at = `/results/${i}`;
    const id = show(result.id ?? "");
    if (ids.has(id)) flag(`${at}/id`, `result id ${id} appears twice`);
    ids.add(id);
    const lines = isObject(result.lines) ? result.lines : {};
    if (typeof lines.from === "number" && typeof lines.to === "number" && lines.from > lines.to) flag(`${at}/lines`, "a passage's first line is not after its last");
    if (!isObject(result.fact)) return;
    const from = strictTime(result.fact.valid_from);
    const to = strictTime(result.fact.valid_to);
    if (!Number.isNaN(from) && !Number.isNaN(to) && to <= from) flag(`${at}/fact/valid_to`, "a fact stops being valid after it starts");
    if (Number.isNaN(asOf)) return;
    if (!Number.isNaN(from) && from > asOf) flag(`${at}/fact/valid_from`, "with as_of, a fact that became valid later is not returned");
    if (!Number.isNaN(to) && to <= asOf) flag(`${at}/fact/valid_to`, "with as_of, a fact no longer valid then is not returned");
  });
  return findings;
}

/**
 * FAC-SEM-186 (DEC-0188) on a `kb-check/1` answer (KL-5): each language appears once, and `pass` is false when recall@5
 * fell on any language.
 */
export function kbCheckRules(value: JsonObject): Finding[] {
  const findings: Finding[] = [];
  const flag = flagger(findings);
  const seen = new Set<string>();
  let fell = false;
  list(value.languages).forEach((entry, i) => {
    if (!isObject(entry)) return;
    const language = show(entry.language ?? "");
    if (seen.has(language)) flag(`/languages/${i}/language`, `language ${language} appears twice`);
    seen.add(language);
    const recall = isObject(entry.recall_at_5) ? entry.recall_at_5 : {};
    if (typeof recall.base === "number" && typeof recall.head === "number" && recall.head < recall.base) fell = true;
  });
  if (fell && value.pass === true) flag("/pass", "a change that lowers recall@5 on a language does not pass");
  return findings;
}
// #endregion knowledge-layer
