import type { SQLiteDatabase } from 'expo-sqlite';
import { SCHEMA_V1 } from './schema';

// Add future schema changes as new `if (version < N)` blocks. Never edit old ones.
export async function migrate(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync('PRAGMA user_version = 1');
  }
}
