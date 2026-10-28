// All Asta dialogue is stored locally. Selection depends on real progress, never on chance alone.
export type Mood = 'idle' | 'welcome' | 'determined' | 'celebrating' | 'proud' | 'tired' | 'concerned' | 'excited';
export type Ctx = { hour: number; done: number; total: number; daysAway: number; missedYesterday: boolean; nextTitle: string | null; dayOfMonth: number };

const pick = (arr: string[], n: number) => arr[n % arr.length];

export function pickDialogue(c: Ctx): { mood: Mood; text: string } {
  if (c.total > 0 && c.done === c.total) return { mood: 'celebrating', text: pick(["THAT'S THE SPIRIT! You're getting stronger every day!", 'Every mission kept. That is how discipline is built.'], c.dayOfMonth) };
  if (c.daysAway >= 3 && c.done === 0) return { mood: 'determined', text: "You're back. Good. Let's focus on what you can do today." };
  if (c.done > 0) return { mood: 'proud', text: pick(['Nice! Another promise kept.', `${c.done} down. Keep the momentum${c.nextTitle ? ` — ${c.nextTitle} is next.` : '.'}`], c.done + c.dayOfMonth) };
  if (c.missedYesterday) return { mood: 'concerned', text: "Yesterday didn't go to plan. Don't make excuses, but don't give up either. What's your next move?" };
  if (c.hour >= 20) return { mood: 'tired', text: 'Long day. There is still time to keep one promise before it ends. Pick the smallest one.' };
  if (c.hour < 12) return { mood: 'welcome', text: "Ready to put in the work? Let's make today count!" };
  return { mood: 'determined', text: c.nextTitle ? `Next up: ${c.nextTitle}. One step at a time.` : 'Consistency over perfection. Start with one.' };
}

export const LEVEL_UP_TEXT = 'YOUR EFFORT IS PAYING OFF! Welcome to your new rank!';
export const MISS_TEXT = "You missed this one. Don't make excuses, but don't give up either. What's your next move?";
