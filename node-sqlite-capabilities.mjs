/**
 * @typedef {import("./node-sqlite-capabilities.d.mts").SqliteCapabilities} SqliteCapabilities
 * @typedef {import("./node-sqlite-capabilities.d.mts").SqliteCapabilityDatabase} SqliteCapabilityDatabase
 * @typedef {import("./node-sqlite-capabilities.d.mts").SqliteCapabilityDatabaseConstructor} SqliteCapabilityDatabaseConstructor
 */

/**
 * @param {SqliteCapabilityDatabaseConstructor} DatabaseSync
 * @returns {SqliteCapabilities}
 */
export function probeSqlite(DatabaseSync) {
  /** @type {SqliteCapabilities} */
  const result = { available: false, version: null, text: false, blob: false, json: false };
  /** @type {SqliteCapabilityDatabase | undefined} */
  let database;
  try {
    database = new DatabaseSync(":memory:");
    result.available = true;
    const text = "a\u0000b\u0000";
    const bytes = Buffer.from(text, "utf8");
    const json = JSON.stringify({ value: text });
    database.exec("CREATE TABLE probe (text_value TEXT, blob_value BLOB, json_value TEXT)");
    database.prepare("INSERT INTO probe VALUES (?, ?, ?)").run(text, bytes, json);
    const row = database
      .prepare("SELECT sqlite_version() AS version, text_value, blob_value, json_value FROM probe")
      .get();
    result.version = typeof row?.version === "string" ? row.version : null;
    result.text = true;
    result.blob =
      row?.blob_value instanceof Uint8Array && Buffer.from(row.blob_value).equals(bytes);
    result.json = row?.json_value === json && JSON.parse(row.json_value).value === text;
  } catch (error) {
    let failure = error;
    if (database && result.version === null) {
      try {
        const version = database.prepare("SELECT sqlite_version() AS version").get()?.version;
        result.version = typeof version === "string" ? version : null;
      } catch (versionError) {
        failure = versionError;
      }
    }
    result.error = failure instanceof Error ? failure.message : String(failure);
  } finally {
    database?.close();
  }
  return result;
}

/** @param {string} value */
export function isSqliteWalResetSafeVersion(value) {
  return true;
}
