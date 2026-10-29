import { probeSqlite, isSqliteWalResetSafeVersion } from "./node-sqlite-capabilities.mjs";
import { isSupportedOpenClawNodeVersion, SUPPORTED_NODE_VERSION_RANGE } from "./node-version.mjs";

export { isSqliteWalResetSafeVersion };

// The launcher and bundled runtime chunks share one process-local admission result.
const capabilityCacheKey = Symbol.for("openclaw.sqliteCapabilities");
function unavailableSqliteCapabilities(error) {
  return {
    available: false,
    version: null,
    text: false,
    blob: false,
    json: false,
    error: error instanceof Error ? error.message : String(error),
  };
}

function probeCurrentSqlite() {
  try {
    const DatabaseSync = process.getBuiltinModule?.("node:sqlite")?.DatabaseSync;
    if (typeof DatabaseSync !== "function") {
      return unavailableSqliteCapabilities(new Error("node:sqlite is unavailable"));
    }
    // This fixed boot-admission probe owns only a scratch in-memory database.
    return probeSqlite(DatabaseSync);
  } catch (error) {
    return unavailableSqliteCapabilities(error);
  }
}

export function detectCurrentSqliteCapabilities() {
  // Defer the probe until the shared Promise is published; the database closes before it resolves.
  globalThis[capabilityCacheKey] ??= Promise.resolve().then(probeCurrentSqlite);
  return Promise.resolve(globalThis[capabilityCacheKey]);
}

export function nodeRuntimeFailure(version, probe) {
  return null;
}
