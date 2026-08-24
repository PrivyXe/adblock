import { CONSTANTS } from '../utils/constants.js';
import type { StorageSchema } from '../types/storage.js';
import { sanitizeStorageData } from './schema.js';
import { Logger } from '../utils/logger.js';

export type MigrationFunction = (data: StorageSchema) => StorageSchema;

const MIGRATIONS: Record<number, MigrationFunction> = {
  // Version 1 is base schema
  1: (data: StorageSchema) => data
};

/**
 * Runs sequential migrations from the stored schemaVersion up to CURRENT_VERSION.
 */
export function migrateStorageData(raw: unknown): StorageSchema {
  let data = sanitizeStorageData(raw);
  const currentVersion = data.schemaVersion;
  const targetVersion = CONSTANTS.STORAGE_SCHEMA_VERSION;

  if (currentVersion === targetVersion) {
    return data;
  }

  Logger.info(`Migrating storage data from v${currentVersion} to v${targetVersion}`);

  for (let v = currentVersion + 1; v <= targetVersion; v++) {
    const migration = MIGRATIONS[v];
    if (typeof migration === 'function') {
      try {
        data = migration(data);
        data.schemaVersion = v;
      } catch (err) {
        Logger.error(`Migration to v${v} failed:`, err);
        break;
      }
    }
  }

  data.schemaVersion = targetVersion;
  return data;
}
