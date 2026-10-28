const pad = (n: number) => String(n).padStart(2, '0');
export const toKey = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (k: string, n: number) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d); };
export const dayDiff = (a: string, b: string) => Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86400000);
export const weekStart = (k: string) => addDays(k, -((fromKey(k).getDay() + 6) % 7)); // Monday
export const longDate = (k: string) => fromKey(k).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
export const shortDate = (k: string) => fromKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
export const monthLabel = (k: string) => fromKey(k).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
