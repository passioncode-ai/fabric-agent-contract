// #region extension-keys — docs: docs/specification/interop.md#extension-key
/** The one spelling of every extension key this contract defines (G-08). */
const EXTENSION_BASE = "https://fabric.passioncode.ai/agent-contract/extensions/";

export const EXTENSION_KEYS = {
  service: `${EXTENSION_BASE}service/0.1`,
  interop: `${EXTENSION_BASE}interop/0.1`
} as const;

const KNOWN = new Set<string>(Object.values(EXTENSION_KEYS));
const EXTENSION_URL = /https?:\/\/[^\s`"'<>()\]]*\/extensions\/[a-z][a-z0-9-]*\/\d+(?:\.\d+)*/g;

/** Every extension-key URL in `text` that is not one of EXTENSION_KEYS. */
export function foreignExtensionKeys(text: string): string[] {
  return [...text.matchAll(EXTENSION_URL)].map((match) => match[0]).filter((url) => !KNOWN.has(url));
}
// #endregion extension-keys
