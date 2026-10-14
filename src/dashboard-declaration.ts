import type { ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import { SCHEMA_PREFIX } from "./contract.js";
import { EXTENSION_KEYS } from "./extensions.js";
import { type Finding, type JsonObject, isObject, show } from "./findings.js";
import { createValidatorSync } from "./validator.js";

// fabric-dashboard/0.1 (DEC-0036, amended by DEC-0059): how a host reads a service's dashboard declaration, and the
// contract-side check of it. docs: docs/specification/embedded-dashboard.md#the-declaration

/** The page floor a page keeps without a declaration (ED-1) and the host floor every dashboard gets (ED-7). */
export const PAGE_FLOOR = 360;
export const LEGACY_HOST_FLOOR = 480;

/** What a host takes from a well-known document for the page it shows (ED-6, ED-7, ED-9). */
export interface HostView {
  /** A valid declaration is present under the dashboard extension key. */
  declared: boolean;
  /** The key is present and its value is invalid: the host treats it as not declared and reports it (ED-9). */
  reported: boolean;
  /** The page's floor: `minWidth`, or 360 when nothing valid is declared (ED-1). */
  pageFloor: number;
  /** The width the host keeps for the page: `max(480, minWidth)`, or 480 (ED-7). */
  hostFloor: number;
  /** The carrier fields the page applies; none means it follows `prefers-color-scheme` only (ED-6). */
  appearance: string[];
  /** The theme ids the page ships, or null when it names none (ED-10). */
  themes: string[] | null;
  /** The kit the page is built from, or null. */
  kit: string | null;
  /** Why the value is invalid, one line per schema error; empty unless `reported`. */
  errors: string[];
}

let declarationShape: ValidateFunction | undefined;
/** `service-dashboard-extension.schema.json`, compiled on the first read. */
function shape(): ValidateFunction {
  declarationShape ??= createValidatorSync().getSchema(`${SCHEMA_PREFIX}schemas/service-dashboard-extension.schema.json`) as ValidateFunction;
  return declarationShape;
}

const LEGACY: Omit<HostView, "reported" | "errors"> = { declared: false, pageFloor: PAGE_FLOOR, hostFloor: LEGACY_HOST_FLOOR, appearance: [], themes: null, kit: null };

/**
 * The reference reading of a dashboard declaration (ED-9, DEC-0059). It never throws: any input that is not a
 * well-known document with a valid declaration is a legacy dashboard, and a present but invalid declaration is
 * also `reported`. Ports run `fixtures/vectors/dashboard-declaration.json`.
 */
export function hostView(wellKnown: unknown): HostView {
  const extensions = isObject(wellKnown) && isObject(wellKnown.extensions) ? wellKnown.extensions : undefined;
  // Object.hasOwn, not `in` or a plain lookup: a key such as `constructor` must not reach Object.prototype.
  if (extensions === undefined || !Object.hasOwn(extensions, EXTENSION_KEYS.dashboard)) return { ...LEGACY, reported: false, errors: [] };
  const value = extensions[EXTENSION_KEYS.dashboard];
  const validate = shape();
  if (validate(value) !== true) {
    // Ajv sets `errors` whenever a validation fails, and a message on each (its default `messages: true`).
    const errors = (validate.errors as ErrorObject[]).map((error) => `${error.instancePath || "/"} ${error.keyword}: ${show(error.message)}`);
    return { ...LEGACY, reported: true, errors };
  }
  const declaration = value as JsonObject;
  const minWidth = declaration.minWidth as number;
  return {
    declared: true,
    reported: false,
    pageFloor: minWidth,
    hostFloor: Math.max(LEGACY_HOST_FLOOR, minWidth),
    appearance: Array.isArray(declaration.appearance) ? (declaration.appearance as string[]) : [],
    themes: Array.isArray(declaration.themes) ? (declaration.themes as string[]) : null,
    kit: typeof declaration.kit === "string" ? declaration.kit : null,
    errors: []
  };
}

/** RFC 6901: `~` and `/` escaped in one reference token. */
const pointerToken = (token: string) => token.replace(/~/g, "~0").replace(/\//g, "~1");

/** FAC-SEM-080: a well-known document's dashboard declaration is valid against its schema (ED-9). */
export function dashboardDeclarationRules(value: JsonObject): Finding[] {
  const view = hostView(value);
  if (!view.reported) return [];
  const at = `/extensions/${pointerToken(EXTENSION_KEYS.dashboard)}`;
  return view.errors.map((error) => ({
    code: "FAC-SEM-080",
    instancePath: at,
    message: `the dashboard declaration is invalid (${error}); a host treats it as not declared and reports it (ED-9)`
  }));
}
