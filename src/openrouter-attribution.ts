import { type Finding, isObject } from "./findings.js";

// #region openrouter-attribution — docs: docs/specification/openrouter-attribution.md
/**
 * OpenRouter app attribution for the organization's own products (DEC-0065, roadmap RM-16): the setting a product keeps
 * (`openrouter-attribution`, `FAC-SEM-098`) and the headers it adds to a request, or the reason it adds none. The
 * attribution headers and the recognized categories are OpenRouter's *App Attribution* page as retrieved on 2026-10-12
 * (docs/evidence/sources.md). The function returns only those three headers: it never reads, moves or returns a key.
 */

/** The recognized categories on OpenRouter's App Attribution page (retrieved 2026-10-12). */
export const OPENROUTER_CATEGORIES: ReadonlySet<string> = new Set([
  "cli-agent", "ide-extension", "cloud-agent", "programming-app", "native-app-builder",
  "creative-writing", "video-gen", "image-gen", "audio-gen",
  "writing-assistant", "general-chat", "personal-agent", "legal",
  "roleplay", "game",
]);
/** OpenRouter takes at most two categories per request. */
export const MAX_CATEGORIES = 2;
/** The one host the headers go to. */
export const OPENROUTER_HOST = "openrouter.ai";
/** Every product is one app, identified by its product page under this origin (Fabric ADR-0090). */
export const PRODUCT_ORIGIN = "https://passioncode.ai";

const PRODUCT = /^[a-z][a-z0-9-]{0,62}$/;
const TITLE = /^[\x21-\x7e](?:[\x20-\x7e]{0,98}[\x21-\x7e])?$/;
/** The attribution headers, in lower case; a request that already carries one keeps the user's attribution. */
const ATTRIBUTION_HEADERS = new Set(["http-referer", "referer", "x-openrouter-title", "x-title", "x-openrouter-categories"]);

export type AttributionSetting = { product: string; title: string; categories?: string[] };
export type AttributionRequest = { url: string; originated: boolean; headers?: Record<string, string> };
export type AttributionAnswer =
  | { headers: Record<string, string> }
  | { headers: Record<string, never>; none: "no-setting" | "invalid-setting" | "not-openrouter" | "forwarded" | "user-set" };

/** FAC-SEM-098: a product's attribution setting names a product slug, a printable title and at most two recognized categories, each once. */
export function attributionSettingFindings(value: unknown): Finding[] {
  if (!isObject(value)) return [{ code: "FAC-SEM-098", instancePath: "", message: "an attribution setting is an object" }];
  const findings: Finding[] = [];
  const flag = (instancePath: string, message: string) => findings.push({ code: "FAC-SEM-098", instancePath, message });
  if (typeof value.product !== "string" || !PRODUCT.test(value.product)) flag("/product", "the product is a lower-case slug, the last segment of its product page");
  if (typeof value.title !== "string" || !TITLE.test(value.title)) flag("/title", "the title is the product's full name: printable ASCII, 1 to 100 characters, no space at either end");
  if (value.categories !== undefined) {
    if (!Array.isArray(value.categories)) flag("/categories", "categories are a list");
    else {
      if (value.categories.length > MAX_CATEGORIES) flag("/categories", `at most ${MAX_CATEGORIES} categories per request`);
      const seen = new Set<string>();
      value.categories.forEach((category: unknown, i: number) => {
        if (typeof category !== "string" || !OPENROUTER_CATEGORIES.has(category)) flag(`/categories/${i}`, "a category is one OpenRouter recognizes; it drops others without an error");
        else if (seen.has(category)) flag(`/categories/${i}`, "each category once");
        else seen.add(category);
      });
    }
  }
  return findings;
}

function isOpenRouter(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname === OPENROUTER_HOST && parsed.port === "" && parsed.username === "" && parsed.password === "";
  } catch {
    return false;
  }
}

/**
 * The headers a product adds to one request, or none with the reason. In order: no setting (attribution is off by
 * default); a setting `FAC-SEM-098` refuses; a request not to `https://openrouter.ai`; traffic the product forwards for
 * someone else; a request that already carries an attribution header (the user's own setting wins, whole).
 */
export function attributionHeaders(setting: unknown, request: AttributionRequest): AttributionAnswer {
  if (setting === undefined || setting === null) return { headers: {}, none: "no-setting" };
  if (attributionSettingFindings(setting).length) return { headers: {}, none: "invalid-setting" };
  if (typeof request.url !== "string" || !isOpenRouter(request.url)) return { headers: {}, none: "not-openrouter" };
  if (request.originated !== true) return { headers: {}, none: "forwarded" };
  const present = isObject(request.headers) ? Object.keys(request.headers).map((name) => name.toLowerCase()) : [];
  if (present.some((name) => ATTRIBUTION_HEADERS.has(name))) return { headers: {}, none: "user-set" };
  const { product, title, categories } = setting as AttributionSetting;
  const headers: Record<string, string> = { "HTTP-Referer": `${PRODUCT_ORIGIN}/${product}/`, "X-OpenRouter-Title": title };
  if (categories?.length) headers["X-OpenRouter-Categories"] = categories.join(",");
  return { headers };
}

export function attributionRules(kind: string, value: unknown): Finding[] | undefined {
  return kind === "openrouter-attribution" ? attributionSettingFindings(value) : undefined;
}
// #endregion openrouter-attribution
