import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkLinks, mermaidBodies } from "../src/docs-check.js";
import { projectRoot } from "../src/contract.js";

describe("documentation helpers", () => {
  it("extracts Mermaid bodies", () => {
    expect(mermaidBodies("```mermaid\nflowchart LR\nA-->B\n```\n")).toEqual(["flowchart LR\nA-->B\n"]);
  });

  it("reports a broken relative link", async () => {
    const file = path.join(projectRoot(), "README.md");
    expect(await checkLinks(file, "[missing](docs/does-not-exist.md)")).toEqual(["README.md: broken link docs/does-not-exist.md"]);
  });
});
