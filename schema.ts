export const SCHEMA_V1 = `
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pushup_sets (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, reps INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS water_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, ml INTEGER NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reading_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, title TEXT, pages INTEGER, minutes INTEGER NOT NULL, notes TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS french_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, minutes INTEGER NOT NULL, vocab TEXT, note TEXT, phrases TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS prayer_log (date TEXT PRIMARY KEY NOT NULL, prayed INTEGER NOT NULL, bible INTEGER NOT NULL, reflection TEXT);
CREATE TABLE IF NOT EXISTS selfcontrol_log (date TEXT PRIMARY KEY NOT NULL, completed INTEGER NOT NULL, a1 TEXT, a2 TEXT, a3 TEXT, a4 TEXT);
CREATE TABLE IF NOT EXISTS journal (date TEXT PRIMARY KEY NOT NULL, learned TEXT, explain TEXT, important TEXT, apply_text TEXT, question TEXT, status TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS completions (date TEXT NOT NULL, mission_id TEXT NOT NULL, completed_at TEXT NOT NULL, PRIMARY KEY (date, mission_id));
CREATE TABLE IF NOT EXISTS xp_ledger (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT UNIQUE NOT NULL, date TEXT NOT NULL, amount INTEGER NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS achievements (id TEXT PRIMARY KEY NOT NULL, unlocked_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS misses (id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT NOT NULL, mission_id TEXT NOT NULL, cause TEXT, reason TEXT, adjustment TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS weekly_reviews (week_start TEXT PRIMARY KEY NOT NULL, observations TEXT, goals TEXT, completed_at TEXT);
CREATE INDEX IF NOT EXISTS idx_pushups_date ON pushup_sets(date);
CREATE INDEX IF NOT EXISTS idx_water_date ON water_entries(date);
CREATE INDEX IF NOT EXISTS idx_comp_date ON completions(date);
`;
export const ALL_TABLES = [
  'settings', 'pushup_sets', 'water_entries', 'reading_sessions', 'french_sessions', 'prayer_log',
  'selfcontrol_log', 'journal', 'completions', 'xp_ledger', 'achievements', 'misses', 'weekly_reviews',
];
