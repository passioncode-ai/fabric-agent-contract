// #region registry-rules — docs: docs/specification/provider.md#semantic-rules
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject } from "./findings.js";

const list = (value: unknown): JsonObject[] => (Array.isArray(value) ? value.filter(isObject) : []);

/** FAC-SEM-013: an id appears in at most one of services/ and providers/, and once in providers/. */
function providerDirectory(value: JsonObject): Finding[] {
  const services = new Set(list(value.services).map((descriptor) => String(descriptor.id)));
  const seen = new Set<string>();
  const findings: Finding[] = [];
  list(value.providers).forEach((entry, index) => {
    const id = String(entry.id);
    if (services.has(id)) findings.push({ code: "FAC-SEM-013", instancePath: `/providers/${index}/id`, message: `${id} is both a service and a provider` });
    if (seen.has(id)) findings.push({ code: "FAC-SEM-013", instancePath: `/providers/${index}/id`, message: `${id} is declared more than once in providers/` });
    seen.add(id);
  });
  return findings;
}

/**
 * FAC-SEM-014 (DEC-0017): equality is between like things. The entry's slug `id` equals
 * the stem of its file name, `providers/<id>.json`; the entry's `providerId` (a URI)
 * equals the `provider.id` (a URI) of the manifest it names, and that manifest resolves.
 */
function providerObservation(value: JsonObject): Finding[] {
  const entry = isObject(value.entry) ? value.entry : {};
  const findings: Finding[] = [];
  if (typeof value.file === "string") {
    const stem = value.file.replace(/^.*\//, "").replace(/\.json$/, "");
    if (stem !== entry.id) findings.push({ code: "FAC-SEM-014", instancePath: "/entry/id", message: `entry ${String(entry.id)} is stored as ${value.file}; the file is named <id>.json` });
  }
  const manifest = value.manifest;
  if (!(isObject(manifest) && isObject(manifest.provider) && Array.isArray(manifest.capabilities))) {
    findings.push({ code: "FAC-SEM-014", instancePath: "/manifest", message: `the manifest of ${String(entry.id)} does not resolve to a provider manifest` });
  } else if (manifest.provider.id !== entry.providerId) {
    findings.push({ code: "FAC-SEM-014", instancePath: "/entry/providerId", message: `entry ${String(entry.id)} names provider ${String(entry.providerId)}, but its manifest is ${String(manifest.provider.id)}` });
  }
  return findings;
}

// Credential shapes: provider-issued token prefixes, a PEM block, a JWT, or a long
// run of mixed-case key-alphabet characters with digits and no path separator.
const CREDENTIAL_SHAPES: RegExp[] = [
  /^(sk|pk|rk)[-_](live|test|proj|or|ant)?[-_]?[A-Za-z0-9_-]{16,}/,
  /^(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/,
  /^github_pat_[A-Za-z0-9_]{20,}/,
  /^xox[abprs]-[A-Za-z0-9-]{10,}/,
  /^(AKIA|ASIA)[A-Z0-9]{16}$/,
  /^lin_api_[A-Za-z0-9]{20,}/,
  /^AIza[0-9A-Za-z_-]{30,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9+=_-]{32,}$/
];

/** True when `value` looks like a credential rather than the name of one. */
export function looksLikeCredential(value: string): boolean {
  return CREDENTIAL_SHAPES.some((shape) => shape.test(value));
}

/**
 * FAC-SEM-015 (DEC-0017): name patterns apply to names; an env VALUE is checked by its
 * form, `secret-ref:NAME`, and a reference whose body has a credential's shape is refused.
 */
function providerEntry(value: JsonObject): Finding[] {
  const run = isObject(value.run) && isObject(value.run.mcp) ? value.run.mcp : {};
  const env = isObject(run.stdio) && isObject(run.stdio.env) ? run.stdio.env : {};
  const findings: Finding[] = [];
  for (const [name, raw] of Object.entries(env)) {
    const text = String(raw);
    const reference = /^secret-ref:(.+)$/.exec(text)?.[1];
    if (reference === undefined || looksLikeCredential(reference)) {
      findings.push({ code: "FAC-SEM-015", instancePath: `/run/mcp/stdio/env/${name}`, message: `env ${name} must be a secret reference, not a secret value` });
    }
  }
  return findings;
}

/** FAC-SEM-016: a runner names one default `drive`, and it is present in `drives`. */
function runner(value: JsonObject, at = ""): Finding[] {
  const drives = isObject(value.drives) ? value.drives : {};
  if (typeof value.drive === "string" && Object.hasOwn(drives, value.drive)) return [];
  return [{ code: "FAC-SEM-016", instancePath: `${at}/drive`, message: `runner ${String(value.kind)} names default drive ${String(value.drive)}, which is not in drives` }];
}

/** FAC-SEM-016 per entry, and FAC-SEM-021: one catalogue entry per runner kind. */
function runnerCatalogue(value: unknown): Finding[] {
  const findings: Finding[] = [];
  const kinds = new Set<string>();
  list(value).forEach((entry, index) => {
    findings.push(...runner(entry, `/${index}`));
    const kind = String(entry.kind);
    if (kinds.has(kind)) findings.push({ code: "FAC-SEM-021", instancePath: `/${index}/kind`, message: `runner kind ${kind} is catalogued more than once` });
    kinds.add(kind);
  });
  return findings;
}

/** FAC-SEM-020 (G-07): a descriptor's `fabricManifest` and that manifest's service key name each other. */
function serviceManifest(value: JsonObject): Finding[] {
  const descriptor = isObject(value.descriptor) ? value.descriptor : {};
  if (descriptor.fabricManifest === undefined) return [];
  const key = `${String(descriptor.id)}.${String(descriptor.instance ?? "default")}`;
  const manifest = value.manifest;
  const provider = isObject(manifest) && isObject(manifest.provider) ? manifest.provider : undefined;
  if (!provider) return [{ code: "FAC-SEM-020", instancePath: "/descriptor/fabricManifest", message: `${key} names a manifest that does not resolve` }];
  const extensions = isObject(provider.extensions) ? provider.extensions : {};
  const block = extensions[EXTENSION_KEYS.service];
  const named = isObject(block) ? block.descriptor : undefined;
  if (named === key) return [];
  return [{ code: "FAC-SEM-020", instancePath: "/manifest/provider/extensions", message: named === undefined ? `the manifest of ${key} does not carry the service extension key naming it` : `the manifest of ${key} names ${String(named)} instead` }];
}

export function registryRules(kind: string, value: unknown): Finding[] | undefined {
  if (kind === "runner-catalogue") return runnerCatalogue(value);
  if (!isObject(value)) return undefined;
  if (kind === "provider-directory") return providerDirectory(value);
  if (kind === "provider-observation") return providerObservation(value);
  if (kind === "provider-entry") return providerEntry(value);
  if (kind === "runner") return runner(value);
  if (kind === "service-manifest") return serviceManifest(value);
  return undefined;
}
// #endregion registry-rules
