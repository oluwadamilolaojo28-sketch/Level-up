import type { SQLiteDatabase } from 'expo-sqlite';
import { MISSIONS, MissionId } from '../../constants/missions';
import { REWARDS, STREAK_MIN_MISSIONS, Settings } from '../../constants/rewards';
import { RANKS } from '../../constants/ranks';
import { ACHIEVEMENTS } from '../../constants/achievements';
import { addDays, dayDiff, toKey } from '../../utils/dates';
import { getSettings } from '../../database/repository';

export type Totals = { pushups: number; water: number; reading: number; french: number; prayed: boolean; selfControl: boolean; journal: boolean };

export async function dayTotals(db: SQLiteDatabase, date: string): Promise<Totals> {
  const n = async (sql: string) => (await db.getFirstAsync<{ t: number }>(sql, [date]))?.t ?? 0;
  return {
    pushups: await n('SELECT COALESCE(SUM(reps),0) t FROM pushup_sets WHERE date=?'),
    water: await n('SELECT COALESCE(SUM(ml),0) t FROM water_entries WHERE date=?'),
    reading: await n('SELECT COALESCE(SUM(minutes),0) t FROM reading_sessions WHERE date=?'),
    french: await n('SELECT COALESCE(SUM(minutes),0) t FROM french_sessions WHERE date=?'),
    prayed: (await n('SELECT COUNT(*) t FROM prayer_log WHERE date=? AND prayed=1')) > 0,
    selfControl: (await n('SELECT COUNT(*) t FROM selfcontrol_log WHERE date=? AND completed=1')) > 0,
    journal: (await n("SELECT COUNT(*) t FROM journal WHERE date=? AND status='saved'")) > 0,
  };
}

export function evalMissions(t: Totals, s: Settings): Record<MissionId, boolean> {
  return {
    pushups: t.pushups >= REWARDS.pushupTarget,
    water: t.water >= s.waterTarget,
    selfcontrol: t.selfControl,
    reading: t.reading >= s.readingTarget,
    prayer: t.prayed,
    french: t.french >= s.frenchTarget,
    journal: t.journal,
  };
}

export function progressText(id: MissionId, t: Totals, s: Settings): string | null {
  switch (id) {
    case 'pushups': return `${t.pushups} / ${REWARDS.pushupTarget}`;
    case 'water': return `${t.water} / ${s.waterTarget} ml`;
    case 'reading': return `${t.reading} / ${s.readingTarget} min`;
    case 'french': return `${t.french} / ${s.frenchTarget} min`;
    default: return null;
  }
}

const missionXp = (id: MissionId) => (id === 'journal' ? REWARDS.journal : REWARDS.mission);

/**
 * Idempotent: recomputes which missions are complete for `date` from the raw records,
 * then adds/removes completions and XP ledger rows so rewards always match the data.
 * Ledger keys are UNIQUE, so repeated calls can never double-award.
 */
export async function reconcileDay(db: SQLiteDatabase, date: string) {
  const s = await getSettings(db);
  const t = await dayTotals(db, date);
  const done = evalMissions(t, s);
  const stamp = new Date().toISOString();
  for (const m of MISSIONS) {
    const had = await db.getFirstAsync('SELECT 1 AS x FROM completions WHERE date=? AND mission_id=?', [date, m.id]);
    const key = `m:${date}:${m.id}`;
    if (done[m.id] && !had) {
      await db.runAsync('INSERT OR IGNORE INTO completions(date, mission_id, completed_at) VALUES(?,?,?)', [date, m.id, stamp]);
      await db.runAsync('INSERT OR IGNORE INTO xp_ledger(key,date,amount,reason,created_at) VALUES(?,?,?,?,?)', [key, date, missionXp(m.id), `Completed: ${m.title}`, stamp]);
    } else if (!done[m.id] && had) {
      await db.runAsync('DELETE FROM completions WHERE date=? AND mission_id=?', [date, m.id]);
      await db.runAsync('DELETE FROM xp_ledger WHERE key=?', [key]);
    }
  }
  const c = (await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) c FROM completions WHERE date=?', [date]))?.c ?? 0;
  const bonusKey = `bonus:${date}`;
  if (c === MISSIONS.length) {
    await db.runAsync('INSERT OR IGNORE INTO xp_ledger(key,date,amount,reason,created_at) VALUES(?,?,?,?,?)', [bonusKey, date, REWARDS.allMissions, 'All daily missions complete', stamp]);
  } else {
    await db.runAsync('DELETE FROM xp_ledger WHERE key=?', [bonusKey]);
  }
  await evaluateAchievements(db);
}

export async function completeWeeklyReview(db: SQLiteDatabase, weekStartKey: string) {
  await db.runAsync('INSERT OR IGNORE INTO xp_ledger(key,date,amount,reason,created_at) VALUES(?,?,?,?,?)',
    [`week:${weekStartKey}`, toKey(), REWARDS.weeklyReview, 'Weekly review completed', new Date().toISOString()]);
}

// ---------- streaks ----------
/**
 * A day counts toward the streak when at least STREAK_MIN_MISSIONS missions were completed on it.
 * Current streak = consecutive qualifying days ending today (or yesterday, if today hasn't qualified yet,
 * so the streak is not shown as broken until the day is actually over).
 * Longest streak = best run ever. Missing a day never removes achievements or XP.
 */
export function computeStreaks(counts: Map<string, number>, today: string) {
  const days = [...counts.entries()].filter(([, c]) => c >= STREAK_MIN_MISSIONS).map(([d]) => d).sort();
  const set = new Set(days);
  let longest = 0, run = 0, prev: string | null = null;
  for (const d of days) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  let cur = 0;
  let cursor = set.has(today) ? today : addDays(today, -1);
  while (set.has(cursor)) { cur++; cursor = addDays(cursor, -1); }
  return { current: cur, longest };
}

export async function countsByDate(db: SQLiteDatabase) {
  const rows = await db.getAllAsync<{ date: string; c: number }>('SELECT date, COUNT(*) c FROM completions GROUP BY date');
  return new Map(rows.map((r) => [r.date, r.c]));
}

// ---------- achievements ----------
export async function evaluateAchievements(db: SQLiteDatabase) {
  const counts = await countsByDate(db);
  const { longest } = computeStreaks(counts, toKey());
  const journalCount = (await db.getFirstAsync<{ c: number }>("SELECT COUNT(*) c FROM journal WHERE status='saved'"))?.c ?? 0;
  const pushupDay = await db.getFirstAsync('SELECT 1 AS x FROM completions WHERE mission_id=?', ['pushups']);
  const checks: Record<string, boolean> = {
    first_mission: counts.size > 0,
    first_full_day: [...counts.values()].some((c) => c >= MISSIONS.length),
    streak_3: longest >= 3,
    streak_7: longest >= 7,
    reflection_week: journalCount >= 7,
    pushups_100: !!pushupDay,
    streak_30: longest >= 30,
  };
  const stamp = new Date().toISOString();
  for (const a of ACHIEVEMENTS) {
    if (!checks[a.id]) continue;
    const r = await db.runAsync('INSERT OR IGNORE INTO achievements(id, unlocked_at) VALUES(?,?)', [a.id, stamp]);
    if (r.changes > 0) {
      await db.runAsync('INSERT OR IGNORE INTO xp_ledger(key,date,amount,reason,created_at) VALUES(?,?,?,?,?)',
        [`ach:${a.id}`, toKey(), REWARDS.achievement, `Achievement: ${a.title}`, stamp]);
    }
  }
}

// ---------- XP / rank ----------
export const totalXp = async (db: SQLiteDatabase) =>
  (await db.getFirstAsync<{ t: number }>('SELECT COALESCE(SUM(amount),0) t FROM xp_ledger'))?.t ?? 0;

export function rankInfo(xp: number) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (xp >= r.xp) idx = i; });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] ?? null;
  const pct = next ? ((xp - cur.xp) / (next.xp - cur.xp)) * 100 : 100;
  return { idx, cur, next, pct, toNext: next ? next.xp - xp : 0 };
}

export async function getDashboard(db: SQLiteDatabase, today: string) {
  const settings = await getSettings(db);
  const totals = await dayTotals(db, today);
  const done = evalMissions(totals, settings);
  const counts = await countsByDate(db);
  const xp = await totalXp(db);
  const xpToday = (await db.getFirstAsync<{ t: number }>('SELECT COALESCE(SUM(amount),0) t FROM xp_ledger WHERE date=?', [today]))?.t ?? 0;
  const streaks = computeStreaks(counts, today);
  const last = await db.getFirstAsync<{ d: string | null }>('SELECT MAX(date) d FROM completions WHERE date < ?', [today]);
  const daysAway = !counts.get(today) && last?.d ? dayDiff(last.d, today) : 0;
  const hasHistory = counts.size > 0;
  const yCount = counts.get(addDays(today, -1)) ?? 0;
  const missedYesterday = hasHistory && yCount < STREAK_MIN_MISSIONS && daysAway <= 1;
  return { settings, totals, done, xp, xpToday, streaks, daysAway, missedYesterday, rank: rankInfo(xp) };
}
