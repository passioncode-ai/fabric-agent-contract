import { main } from "markdownlint-cli2";
import path from "node:path";
import { projectRoot } from "./contract.js";
import { trackedFiles } from "./tracked-files.js";

// Markdown lint over this repository's tracked Markdown, each passed as a literal path (`:` prefix), so a name
// with a space or a glob character is linted as written. An empty list is a failure, never a silent pass.
const root = projectRoot();
const files = trackedFiles(root).filter((file) => file.endsWith(".md")).map((file) => path.relative(root, file));
if (files.length === 0) {
  console.error("lint:md: no tracked Markdown file was found; refusing to report a pass");
  process.exitCode = 1;
} else {
  const code = await main({ directory: root, argv: files.map((file) => `:${file}`), logMessage: console.log, logError: console.error });
  process.exitCode = typeof code === "number" ? code : 1;
}
