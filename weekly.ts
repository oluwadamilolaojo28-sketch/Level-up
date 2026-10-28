import type { SQLiteDatabase } from 'expo-sqlite';
import { MISSIONS } from '../../constants/missions';
import { addDays, dayDiff, toKey } from '../../utils/dates';

// Transparent local rules only: counts and sorting. No AI, no psychological claims.
export async function weeklySummary(db: SQLiteDatabase, ws: string) {
  const we = addDays(ws, 6);
  const today = toKey();
  const daysCounted = Math.max(1, Math.min(7, dayDiff(ws, today) + 1));
  const entries = await db.getAllAsync<{ date: string; learned: string }>(
    "SELECT date, learned FROM journal WHERE date BETWEEN ? AND ? AND status='saved' ORDER BY date", [ws, we]);
  const comp = await db.getAllAsync<{ mission_id: string; c: number }>(
    'SELECT mission_id, COUNT(*) c FROM completions WHERE date BETWEEN ? AND ? GROUP BY mission_id', [ws, we]);
  const map = new Map(comp.map((r) => [r.mission_id, r.c]));
  const per = MISSIONS.map((m) => ({ id: m.id, title: m.title, count: map.get(m.id) ?? 0 }));
  const max = Math.max(...per.map((p) => p.count));
  const min = Math.min(...per.map((p) => p.count));
  return {
    daysCounted, entries, per,
    most: max > 0 ? per.filter((p) => p.count === max) : [],
    least: max === min ? [] : per.filter((p) => p.count === min),
  };
}
