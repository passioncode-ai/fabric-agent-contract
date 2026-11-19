import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot, SCHEMA_PREFIX } from "../src/contract.js";
import { kbCheckRules, kbSearchRules, knowledgeMapRules } from "../src/knowledge-layer-rules.js";
import { evaluateSemanticRules } from "../src/semantic-rules.js";
import { createValidatorSync, validateDocument } from "../src/validator.js";

// DEC-0188: knowledge-map/1, kb-search/1, kb-check/1 and FAC-SEM-186.
type Json = Record<string, any>;
const read = (name: string): Json => JSON.parse(readFileSync(path.join(projectRoot(), `fixtures/positive/${name}.json`), "utf8")) as Json;
const show = (findings: { code: string; instancePath: string }[]) => findings.map((finding) => `${finding.code} ${finding.instancePath}`);
const validator = createValidatorSync();
const schema = (name: string) => `${SCHEMA_PREFIX}schemas/${name}.schema.json`;

describe("FAC-SEM-186: a knowledge-map/1 answer", () => {
  const codes = (doc: Json) => show(knowledgeMapRules(doc));

  it("passes for the positive fixture, through the dispatch too", () => {
    expect(codes(read("knowledge-map"))).toEqual([]);
    expect(evaluateSemanticRules("knowledge-map", read("knowledge-map"))).toEqual([]);
  });

  it("refuses repeated node and cluster ids", () => {
    const doc = read("knowledge-map");
    doc.nodes[1].id = doc.nodes[0].id;
    doc.clusters[1].id = doc.clusters[0].id;
    expect(codes(doc)).toContain("FAC-SEM-186 /nodes/1/id");
    expect(codes(doc)).toContain("FAC-SEM-186 /clusters/1/id");
  });

  it("joins only nodes of the answer, never a node to itself", () => {
    const missing = read("knowledge-map");
    missing.edges[0].target = "pattern:absent";
    expect(codes(missing)).toEqual(["FAC-SEM-186 /edges/0/target"]);
    const loop = read("knowledge-map");
    loop.edges[0].target = loop.edges[0].source;
    expect(codes(loop)).toEqual(["FAC-SEM-186 /edges/0"]);
  });

  it("names a cluster the answer holds", () => {
    const doc = read("knowledge-map");
    doc.nodes[0].cluster = "c9";
    expect(codes(doc)).toEqual(["FAC-SEM-186 /nodes/0/cluster"]);
    const none = read("knowledge-map");
    none.nodes[0].cluster = null;
    expect(codes(none)).toEqual([]);
  });

  it("with no local embedder has no semantic edge and says semantic did not run", () => {
    const doc = read("knowledge-map");
    doc.embedder = null;
    expect(codes(doc)).toEqual(["FAC-SEM-186 /edges/2/kind", "FAC-SEM-186 /degraded"]);
    doc.edges.pop();
    doc.degraded = ["semantic"];
    expect(codes(doc)).toEqual([]);
    expect(validateDocument(validator, schema("knowledge-map"), doc).valid).toBe(true);
  });

  it("never throws on malformed members", () => {
    expect(codes({ nodes: [1, { cluster: 3 }], clusters: [2, {}], edges: [null, {}] } as Json)).toEqual(["FAC-SEM-186 /edges/1/source", "FAC-SEM-186 /edges/1/target", "FAC-SEM-186 /edges/1"]);
  });
});

describe("FAC-SEM-186: a kb-search/1 answer", () => {
  const codes = (doc: Json) => show(kbSearchRules(doc));

  it("passes for the positive fixture, through the dispatch too", () => {
    expect(codes(read("kb-search"))).toEqual([]);
    expect(evaluateSemanticRules("kb-search", read("kb-search"))).toEqual([]);
  });

  it("refuses a repeated result and a passage whose lines run backwards", () => {
    const doc = read("kb-search");
    doc.results[1].id = doc.results[0].id;
    doc.results[0].lines = { from: 9, to: 3 };
    expect(codes(doc)).toEqual(["FAC-SEM-186 /results/0/lines", "FAC-SEM-186 /results/1/id"]);
  });

  it("never names a leg both as run and as not run", () => {
    const doc = read("kb-search");
    doc.degraded = ["rerank"];
    expect(codes(doc)).toEqual(["FAC-SEM-186 /degraded"]);
  });

  it("stays lexical and says so without a local embedder", () => {
    const doc = read("kb-search");
    delete doc.embedder;
    expect(codes(doc)).toEqual(["FAC-SEM-186 /methods", "FAC-SEM-186 /degraded"]);
    doc.methods = ["bm25", "trigram", "rerank", "graph"];
    doc.degraded = ["vector"];
    expect(codes(doc)).toEqual([]);
    doc.embedder = null;
    expect(codes(doc)).toEqual([]);
    expect(validateDocument(validator, schema("kb-search"), doc).valid).toBe(true);
  });

  it("runs the graph leg for a call with hops, or says it did not", () => {
    const doc = read("kb-search");
    doc.methods = ["bm25", "trigram", "vector", "rerank"];
    expect(codes(doc)).toEqual(["FAC-SEM-186 /methods"]);
    doc.degraded = ["graph"];
    expect(codes(doc)).toEqual([]);
    delete doc.hops;
    doc.degraded = [];
    expect(codes(doc)).toEqual([]);
  });

  it("keeps a fact's window ordered and returns only facts valid at as_of", () => {
    const backwards = read("kb-search");
    backwards.results[1].fact.valid_to = "2026-11-17T00:00:00Z";
    expect(codes(backwards)).toEqual(["FAC-SEM-186 /results/1/fact/valid_to", "FAC-SEM-186 /results/1/fact/valid_to"]);
    const later = read("kb-search");
    later.as_of = "2026-11-18T12:00:00Z";
    expect(codes(later)).toEqual(["FAC-SEM-186 /results/0/fact/valid_from"]);
    const ended = read("kb-search");
    ended.as_of = "2026-12-01T00:00:00Z";
    expect(codes(ended)).toEqual(["FAC-SEM-186 /results/1/fact/valid_to"]);
    const noAsOf = read("kb-search");
    delete noAsOf.as_of;
    noAsOf.results[0].fact.valid_from = "2027-01-01T00:00:00Z";
    expect(codes(noAsOf)).toEqual([]);
  });

  it("never throws on malformed members", () => {
    expect(() => kbSearchRules({ methods: "x", results: [null, { lines: 3, fact: 1 }, { fact: { valid_from: "x" } }], as_of: "nope" } as Json)).not.toThrow();
  });
});

describe("FAC-SEM-186: a kb-check/1 answer", () => {
  const codes = (doc: Json) => show(kbCheckRules(doc));

  it("passes for the positive fixture, through the dispatch too", () => {
    expect(codes(read("kb-check"))).toEqual([]);
    expect(evaluateSemanticRules("kb-check", read("kb-check"))).toEqual([]);
  });

  it("does not pass a change that lowers recall@5", () => {
    const doc = read("kb-check");
    doc.languages[1].recall_at_5.head = 0.775;
    expect(codes(doc)).toEqual(["FAC-SEM-186 /pass"]);
    doc.pass = false;
    expect(codes(doc)).toEqual([]);
  });

  it("names each language once", () => {
    const doc = read("kb-check");
    doc.languages[1].language = "en";
    expect(codes(doc)).toEqual(["FAC-SEM-186 /languages/1/language"]);
  });

  it("never throws on malformed members", () => {
    expect(kbCheckRules({ languages: [null, { recall_at_5: 2 }, { language: "en", recall_at_5: { base: "x" } }], pass: true } as Json)).toEqual([]);
  });
});

describe("DEC-0188 $defs", () => {
  it("validate kb.search's input and kb.rag_check's input and answer", () => {
    const ok = (ref: string, value: unknown) => validateDocument(validator, `${schema("kb-search")}#/$defs/${ref}`, value).valid;
    expect(ok("searchInput", { query: "who decides", limit: 5, hops: 2, as_of: "2026-11-19T00:00:00Z" })).toBe(true);
    expect(ok("searchInput", { query: "" })).toBe(false);
    const claim = { text: "Only verbatim claims are kept.", quote: "Only claims whose quote is found verbatim are kept.", path: "patterns/hybrid-retrieval/README.md" };
    expect(ok("ragCheckInput", { claims: [claim] })).toBe(true);
    expect(ok("ragCheckInput", { claims: [] })).toBe(false);
    expect(ok("ragCheckResult", { schema: "kb-rag-check/1", revision: "1be06d9e", kept: [claim], dropped: [{ claim, reason: "number-not-in-quote" }] })).toBe(true);
    expect(ok("ragCheckResult", { schema: "kb-rag-check/1", revision: "1be06d9e", kept: [], dropped: [{ claim, reason: "paraphrase" }] })).toBe(false);
  });
});
