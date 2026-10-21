import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { JWT_SHAPE, secretUrl } from "./secret-shape.js";
import { createValidatorSync } from "./validator.js";

// extensions/connections/0.1 (DEC-0096): what an agent uses, and the contract-side check of it.
// docs: docs/specification/connections.md

export type ConnectionKind = "service" | "model" | "connector" | "store" | "channel";
export type ConnectionState = "ok" | "degraded" | "down" | "unknown";
export interface Connection {
  id: string;
  kind: ConnectionKind;
  target: string;
  capability?: string;
  state: ConnectionState;
  label?: string;
  purpose?: string;
  reason?: string;
  lastAt?: string;
}
/** What a host takes from a well-known document's connections (DEC-0096). */
export interface ConnectionsView {
  /** A valid list is present under the connections extension key. */
  declared: boolean;
  /** The key is present and its value is invalid: the host treats it as not declared and reports it. */
  reported: boolean;
  /** The connections, each with `failing` set when a `degraded[].source` names its id; empty unless `declared`. */
  connections: Array<Connection & { failing: boolean }>;
  /** Why the value is invalid, one line per problem; empty unless `reported`. */
  errors: string[];
}

let connectionsShape: ValidateFunction | undefined;
function shape(): ValidateFunction {
  connectionsShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-connections-extension.schema.json`) as ValidateFunction;
  return connectionsShape;
}

const NONE: ConnectionsView = { declared: false, reported: false, connections: [], errors: [] };
const TEXT_MEMBERS = ["target", "label", "purpose", "reason"] as const;
// A provider key's shape where it starts a word: a name such as `flask-server` or `risk-assessment` holds `sk-` inside
// a word and is not a key (the shared SECRET_VALUE has no such boundary).
const KEY_SHAPE = /(?:^|[^A-Za-z0-9])(?:sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|xox[abposr]-[A-Za-z0-9-]{10,}|AKIA[0-9A-Z]{16}|glpat-[A-Za-z0-9_-]{20,})|\bbearer\s+\S{12,}/i;
/** A credential in a connection's text: a token's shape, or a URL that carries one (`secretUrl`, for a URL only). */
const credential = (value: string): boolean => JWT_SHAPE.test(value) || KEY_SHAPE.test(value) || (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) && secretUrl(value));

/** The problems the schema cannot state: an id named twice, a credential in a text member. */
function beyondShape(list: Connection[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  list.forEach((connection, index) => {
    if (seen.has(connection.id)) errors.push(`/connections/${index}/id duplicate: ${show(connection.id)} is named twice`);
    seen.add(connection.id);
    for (const member of TEXT_MEMBERS) {
      const value = connection[member];
      if (typeof value === "string" && credential(value)) errors.push(`/connections/${index}/${member} credential: a connection never carries a credential`);
    }
  });
  return errors;
}

/**
 * The reference reading of a service's connections (DEC-0096). It never throws: a document without the key declares
 * none, and a present but invalid value (the schema's, a repeated id, a credential) is not declared and is `reported`.
 * Ports run `fixtures/vectors/connections.json`.
 */
export function connectionsView(wellKnown: unknown): ConnectionsView {
  const extensions = isObject(wellKnown) && isObject(wellKnown.extensions) ? wellKnown.extensions : undefined;
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.connections)) return NONE;
  const value = extensions[EXTENSION_KEYS.connections];
  const validate = shape();
  if (validate(value) !== true) {
    const errors = (validate.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}: ${show(error.message)}`);
    return { ...NONE, reported: true, errors };
  }
  const list = (value as { connections: Connection[] }).connections;
  const errors = beyondShape(list);
  if (errors.length > 0) return { ...NONE, reported: true, errors };
  const degraded = Array.isArray((wellKnown as JsonObject).degraded) ? ((wellKnown as JsonObject).degraded as unknown[]) : [];
  const failing = new Set(degraded.filter(isObject).map((entry) => entry.source).filter((source): source is string => typeof source === "string"));
  return { declared: true, reported: false, connections: list.map((connection) => ({ ...connection, failing: failing.has(connection.id) })), errors: [] };
}

const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");

/** FAC-SEM-127: a well-known document's connections are valid against their schema, each id once, no credential. */
export function connectionsRules(value: JsonObject): Finding[] {
  const view = connectionsView(value);
  if (!view.reported) return [];
  const at = `/extensions/${pointerToken(EXTENSION_KEYS.connections)}`;
  return view.errors.map((error) => ({
    code: "FAC-SEM-127",
    instancePath: at,
    message: `the connections declaration is invalid (${error}); a host treats it as not declared and reports it (DEC-0096)`
  }));
}
