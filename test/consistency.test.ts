import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { projectRoot } from "../src/contract.js";
import { EXTENSION_KEYS, foreignExtensionKeys } from "../src/extensions.js";
import { findPinDrift } from "../src/pin-check.js";
import { contextProfileNames, schemaProfileKinds } from "../src/docs-check.js";

const PIN = { contract: "fabric-agent-contract", version: "0.1.0", repository: "https://github.com/passioncode-ai/fabric-agent-contract", commit: "a5a27092ba0dcc5facfbeae8b359146dfb403e9a" };

describe("G-08: one spelling of every extension key", () => {
  it("names the service, interop and memory keys on one host and path", () => {
    expect(EXTENSION_KEYS).toEqual({
      service: "https://fabric.passioncode.ai/agent-contract/extensions/service/0.1",
      interop: "https://fabric.passioncode.ai/agent-contract/extensions/interop/0.1",
      memory: "https://fabric.passioncode.ai/agent-contract/extensions/memory/0.1"
    });
  });

  it("flags any other spelling of an extension key", () => {
    const retired = ["https:/", "/passioncode.ai/fabric/extensions/service/0.1"].join("");
    expect(foreignExtensionKeys(`keyed \`${retired}\``)).toEqual([retired]);
    expect(foreignExtensionKeys(`"https://fabric.passioncode.ai/agent-contract/extensions/pipeline/0.1"`)).toHaveLength(1);
    expect(foreignExtensionKeys(`${EXTENSION_KEYS.service} and ${EXTENSION_KEYS.interop}`)).toEqual([]);
  });
});

describe("G-11: one contract pin per consuming repository", () => {
  const files = (text: string) => [{ path: "README.md", text }];

  it("accepts mentions that equal the pin, in full or abbreviated", () => {
    expect(findPinDrift(files(`Fabric Agent Contract \`0.1.0\` at \`${PIN.commit}\`\ncontract pin a5a2709`), PIN)).toEqual([]);
  });

  it("flags a contract commit that is not the pin", () => {
    const drift = findPinDrift(files(`- contract commit: \`20a818e648a4c09a60df0126d11626922e8b9094\``), PIN);
    expect(drift).toHaveLength(1);
    expect(drift[0]).toMatchObject({ path: "README.md", line: 1, found: "20a818e648a4c09a60df0126d11626922e8b9094" });
  });

  it("flags a tree link to another contract revision", () => {
    expect(findPinDrift(files("[contract](https://github.com/passioncode-ai/fabric-agent-contract/tree/489737051828fafec92463df04b6a6fd3280c7b7)"), PIN)).toHaveLength(1);
  });

  it("ignores hashes on lines that are not about the contract", () => {
    expect(findPinDrift(files("build 8b80be9 shipped; sha256:" + "0".repeat(64)), PIN)).toEqual([]);
  });

  it("reads a line under a heading that names the contract pin", () => {
    const text = "## Contract pin\n\n- version: `0.1.0`\n- commit: `20a818e648a4c09a60df0126d11626922e8b9094`\n\n## License\n\nbuilt at 20a818e";
    expect(findPinDrift(files(text), PIN).map((drift) => drift.line)).toEqual([4]);
  });

  it("does not read another contract of the same word", () => {
    expect(findPinDrift(files("the persistence contract landed in 82bc950"), PIN)).toEqual([]);
  });
});

describe("G-12: CONTEXT profile names are the schema's profile kinds", () => {
  it("reads the same names from CONTEXT.md and manifest.schema.json", async () => {
    const context = await readFile(path.join(projectRoot(), "CONTEXT.md"), "utf8");
    const manifest = JSON.parse(await readFile(path.join(projectRoot(), "schemas/manifest.schema.json"), "utf8"));
    expect(schemaProfileKinds(manifest)).toEqual(["a2a", "local-runner", "mcp"]);
    expect(contextProfileNames(context)).toEqual(schemaProfileKinds(manifest));
  });

  it("fails a glossary that names a profile the schema does not have", () => {
    expect(contextProfileNames("**Profile**: A mode: `peer-agent`, `mcp` or `local-runner`.")).toEqual(["local-runner", "mcp", "peer-agent"]);
  });
});
