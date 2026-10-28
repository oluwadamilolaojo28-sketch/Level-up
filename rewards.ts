// Edit these numbers to rebalance the game. Everything reads from here.
export const REWARDS = {
  mission: 10,
  journal: 20,
  allMissions: 30,
  weeklyReview: 50,
  achievement: 25,
  pushupTarget: 100,
};
// A calendar day counts toward the streak when at least this many missions are complete.
export const STREAK_MIN_MISSIONS = 3;

export type ReminderKey = 'morning' | 'hydration' | 'reading' | 'french' | 'evening';
export const REMINDER_INFO: Record<ReminderKey, { label: string; body: string }> = {
  morning: { label: 'Morning mission review', body: 'Ready to put in the work? Look over today’s missions.' },
  hydration: { label: 'Hydration', body: 'A good moment for some water.' },
  reading: { label: 'Reading', body: 'Time for your reading session.' },
  french: { label: 'French practice', body: 'A few minutes of French keeps the streak of learning alive.' },
  evening: { label: 'Evening learning reflection', body: 'What did you learn today? Write it down.' },
};
export type ReminderCfg = { on: boolean; time: string };
export type Settings = {
  waterTarget: number; readingTarget: number; frenchTarget: number;
  sound: boolean; animations: boolean; reducedMotion: boolean;
  reminders: Record<ReminderKey, ReminderCfg>;
  lastRankIndex: number | null;
};
export const DEFAULT_SETTINGS: Settings = {
  waterTarget: 2000, readingTarget: 20, frenchTarget: 10,
  sound: true, animations: true, reducedMotion: false,
  reminders: {
    morning: { on: false, time: '07:00' }, hydration: { on: false, time: '12:00' },
    reading: { on: false, time: '19:00' }, french: { on: false, time: '18:00' },
    evening: { on: false, time: '21:00' },
  },
  lastRankIndex: null,
};
