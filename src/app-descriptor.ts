import { isObject } from "./findings.js";

// #region app-descriptor — docs: docs/specification/service.md#an-apps-descriptor
/**
 * An app's own descriptor (DEC-0069, Fabric CO-263): an app a person installs and starts has no supervisor to write its
 * descriptor, so its installer writes it, or the app on a start when the installer cannot. The descriptor says the app is
 * installed, never that it runs; liveness is the app's own file, rewritten on every start and removed on quit.
 */

/**
 * What an app does with its descriptor on a start, given the descriptor it finds (or none) and its own installer string
 * (`<name> <version>`, as `installedBy.tool` writes it): `write` when there is none, when it is not an app's descriptor
 * (`installedBy` not the object form), or when its version differs (an update is a reinstall); `keep` otherwise.
 */
export function appDescriptorAction(existing: unknown, tool: string): "write" | "keep" {
  if (!isObject(existing) || !isObject(existing.installedBy)) return "write";
  return existing.installedBy.tool === tool ? "keep" : "write";
}

/**
 * Whether a reader treats a descriptor as stale: an app's descriptor (`lifecycle.manager: "person"`) whose installed app
 * (`lifecycle.app`) the reader did not find. A supervised service's descriptor is never stale by this test.
 */
export function appDescriptorStale(descriptor: unknown, appPresent: boolean): boolean {
  if (!isObject(descriptor) || !isObject(descriptor.lifecycle) || descriptor.lifecycle.manager !== "person") return false;
  return !appPresent;
}
// #endregion app-descriptor
