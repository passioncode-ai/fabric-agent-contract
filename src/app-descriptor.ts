import { isObject } from "./findings.js";

// #region app-descriptor — docs: docs/specification/service.md#an-apps-descriptor
/**
 * An app's own descriptor (DEC-0069, Fabric CO-263): an app a person installs and starts has no supervisor to write its
 * descriptor, so its installer writes it, or the app on a start when the installer cannot. The descriptor says the app is
 * installed, never that it runs; liveness is the app's own file, rewritten on every start and removed on quit.
 */

/**
 * What an app that writes its own descriptor does with it on a start, given the descriptor it finds (or none), its own
 * installer string (`<name> <version>`, as `installedBy.tool` writes it) and the path it runs from: `keep` when it runs
 * from a translocated copy (macOS App Translocation, a randomised read-only path it must never record); otherwise `write`
 * when there is none, when it is not an app's descriptor (`installedBy` not the object form), when its version differs
 * (an update is a reinstall) or when its path differs from `lifecycle.app` (a moved app); `keep` otherwise.
 */
export function appDescriptorAction(existing: unknown, tool: string, appPath: string): "write" | "keep" {
  if (appPath.includes("/AppTranslocation/")) return "keep";
  if (!isObject(existing) || !isObject(existing.installedBy)) return "write";
  const recorded = isObject(existing.lifecycle) ? existing.lifecycle.app : undefined;
  return existing.installedBy.tool === tool && recorded === appPath ? "keep" : "write";
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
