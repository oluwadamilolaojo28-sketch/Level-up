import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_SETTINGS, Settings } from '../constants/rewards';
import { ALL_TABLES } from './schema';

const now = () => new Date().toISOString();

// ---------- settings ----------
export async function getSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: any = { ...DEFAULT_SETTINGS };
  for (const r of rows) { try { out[r.key] = JSON.parse(r.value); } catch {} }
  return out as Settings;
}
export async function setSetting(db: SQLiteDatabase, key: keyof Settings, value: unknown) {
  await db.runAsync('INSERT OR REPLACE INTO settings(key, value) VALUES(?, ?)', [key, JSON.stringify(value)]);
}

// ---------- counters (push-ups, water) ----------
export type CounterTable = 'pushup_sets' | 'water_entries';
const COL = { pushup_sets: 'reps', water_entries: 'ml' } as const;
export type CounterRow = { id: number; value: number };
export const listCounter = (db: SQLiteDatabase, t: CounterTable, date: string) =>
  db.getAllAsync<CounterRow>(`SELECT id, ${COL[t]} AS value FROM ${t} WHERE date = ? ORDER BY id`, [date]);
export const addCounter = (db: SQLiteDatabase, t: CounterTable, date: string, v: number) =>
  db.runAsync(`INSERT INTO ${t}(date, ${COL[t]}, created_at) VALUES(?, ?, ?)`, [date, v, now()]);
export const updateCounter = (db: SQLiteDatabase, t: CounterTable, id: number, v: number) =>
  db.runAsync(`UPDATE ${t} SET ${COL[t]} = ? WHERE id = ?`, [v, id]);
export const deleteCounter = (db: SQLiteDatabase, t: CounterTable, id: number) =>
  db.runAsync(`DELETE FROM ${t} WHERE id = ?`, [id]);

// ---------- reading ----------
export type ReadingRow = { id: number; title: string | null; pages: number | null; minutes: number; notes: string | null };
export const listReading = (db: SQLiteDatabase, date: string) =>
  db.getAllAsync<ReadingRow>('SELECT id, title, pages, minutes, notes FROM reading_sessions WHERE date = ? ORDER BY id', [date]);
export const addReading = (db: SQLiteDatabase, date: string, r: Omit<ReadingRow, 'id'>) =>
  db.runAsync('INSERT INTO reading_sessions(date, title, pages, minutes, notes, created_at) VALUES(?,?,?,?,?,?)',
    [date, r.title, r.pages, r.minutes, r.notes, now()]);
export const deleteReading = (db: SQLiteDatabase, id: number) => db.runAsync('DELETE FROM reading_sessions WHERE id = ?', [id]);

// ---------- french ----------
export type FrenchRow = { id: number; minutes: number; vocab: string | null; note: string | null; phrases: string | null };
export const listFrench = (db: SQLiteDatabase, date: string) =>
  db.getAllAsync<FrenchRow>('SELECT id, minutes, vocab, note, phrases FROM french_sessions WHERE date = ? ORDER BY id', [date]);
export const addFrench = (db: SQLiteDatabase, date: string, r: Omit<FrenchRow, 'id'>) =>
  db.runAsync('INSERT INTO french_sessions(date, minutes, vocab, note, phrases, created_at) VALUES(?,?,?,?,?,?)',
    [date, r.minutes, r.vocab, r.note, r.phrases, now()]);
export const deleteFrench = (db: SQLiteDatabase, id: number) => db.runAsync('DELETE FROM french_sessions WHERE id = ?', [id]);

// ---------- prayer / self-control ----------
export const getPrayer = (db: SQLiteDatabase, date: string) =>
  db.getFirstAsync<{ prayed: number; bible: number; reflection: string | null }>('SELECT prayed, bible, reflection FROM prayer_log WHERE date = ?', [date]);
export const savePrayer = (db: SQLiteDatabase, date: string, prayed: boolean, bible: boolean, reflection: string) =>
  db.runAsync('INSERT OR REPLACE INTO prayer_log(date, prayed, bible, reflection) VALUES(?,?,?,?)', [date, prayed ? 1 : 0, bible ? 1 : 0, reflection]);

export type SelfRow = { completed: number; a1: string | null; a2: string | null; a3: string | null; a4: string | null };
export const getSelfControl = (db: SQLiteDatabase, date: string) =>
  db.getFirstAsync<SelfRow>('SELECT completed, a1, a2, a3, a4 FROM selfcontrol_log WHERE date = ?', [date]);
export const saveSelfControl = (db: SQLiteDatabase, date: string, completed: boolean, a: string[]) =>
  db.runAsync('INSERT OR REPLACE INTO selfcontrol_log(date, completed, a1, a2, a3, a4) VALUES(?,?,?,?,?,?)',
    [date, completed ? 1 : 0, a[0], a[1], a[2], a[3]]);

// ---------- misses ----------
export const saveMiss = (db: SQLiteDatabase, date: string, mission: string, cause: string, reason: string, adjustment: string) =>
  db.runAsync('INSERT INTO misses(date, mission_id, cause, reason, adjustment, created_at) VALUES(?,?,?,?,?,?)',
    [date, mission, cause, reason, adjustment, now()]);

// ---------- journal ----------
export type JournalFields = { learned: string; explain: string; important: string; apply_text: string; question: string };
export type JournalRow = JournalFields & { date: string; status: 'draft' | 'saved' };
export const getJournal = (db: SQLiteDatabase, date: string) =>
  db.getFirstAsync<JournalRow>('SELECT * FROM journal WHERE date = ?', [date]);
export const saveJournal = (db: SQLiteDatabase, date: string, f: JournalFields, status: 'draft' | 'saved') =>
  db.runAsync('INSERT OR REPLACE INTO journal(date, learned, explain, important, apply_text, question, status, updated_at) VALUES(?,?,?,?,?,?,?,?)',
    [date, f.learned, f.explain, f.important, f.apply_text, f.question, status, now()]);
export const deleteJournal = (db: SQLiteDatabase, date: string) => db.runAsync('DELETE FROM journal WHERE date = ?', [date]);
export async function listJournal(db: SQLiteDatabase, query: string) {
  const q = `%${query.trim()}%`;
  if (!query.trim()) return db.getAllAsync<JournalRow>('SELECT * FROM journal ORDER BY date DESC LIMIT 400');
  return db.getAllAsync<JournalRow>(
    `SELECT * FROM journal WHERE learned LIKE ?1 OR explain LIKE ?1 OR important LIKE ?1 OR apply_text LIKE ?1 OR question LIKE ?1 OR date LIKE ?1 ORDER BY date DESC LIMIT 400`, [q]);
}

// ---------- weekly review ----------
export type ReviewRow = { week_start: string; observations: string | null; goals: string | null; completed_at: string | null };
export const getReview = (db: SQLiteDatabase, ws: string) =>
  db.getFirstAsync<ReviewRow>('SELECT * FROM weekly_reviews WHERE week_start = ?', [ws]);

// ---------- backup / reset ----------
export async function exportAll(db: SQLiteDatabase) {
  const tables: Record<string, unknown[]> = {};
  for (const t of ALL_TABLES) tables[t] = await db.getAllAsync(`SELECT * FROM ${t}`);
  return JSON.stringify({ app: 'level-up', version: 1, exported_at: now(), tables });
}
export async function restoreAll(db: SQLiteDatabase, json: string) {
  const data = JSON.parse(json);
  if (data?.app !== 'level-up' || typeof data.tables !== 'object') throw new Error('Not a LEVEL UP backup file.');
  await db.withTransactionAsync(async () => {
    for (const t of ALL_TABLES) await db.runAsync(`DELETE FROM ${t}`);
    for (const t of ALL_TABLES) {
      const rows = (data.tables[t] ?? []) as Record<string, unknown>[];
      for (const row of rows) {
        const cols = Object.keys(row);
        if (!cols.length || !cols.every((c) => /^[a-z_0-9]+$/.test(c))) continue;
        await db.runAsync(`INSERT OR REPLACE INTO ${t}(${cols.join(',')}) VALUES(${cols.map(() => '?').join(',')})`, cols.map((c) => row[c] as any));
      }
    }
  });
}
export async function resetAll(db: SQLiteDatabase) {
  await db.withTransactionAsync(async () => { for (const t of ALL_TABLES) await db.runAsync(`DELETE FROM ${t}`); });
}
