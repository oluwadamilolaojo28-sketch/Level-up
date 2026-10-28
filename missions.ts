export type MissionId = 'pushups' | 'water' | 'selfcontrol' | 'reading' | 'prayer' | 'french' | 'journal';
export const MISSIONS: { id: MissionId; title: string; desc: string; icon: string }[] = [
  { id: 'pushups', title: 'Physical discipline', desc: '100 push-ups, in as many sets as you need.', icon: 'arm-flex' },
  { id: 'water', title: 'Hydration', desc: 'Reach your daily water target.', icon: 'water' },
  { id: 'selfcontrol', title: 'Self-control', desc: 'Speak intentionally. Listen more.', icon: 'account-voice' },
  { id: 'reading', title: 'Reading', desc: 'Read, and note what you learned.', icon: 'book-open-variant' },
  { id: 'prayer', title: 'Prayer', desc: 'Time set apart for prayer and reflection.', icon: 'hands-pray' },
  { id: 'french', title: 'French practice', desc: 'Practise a little, every day.', icon: 'translate' },
  { id: 'journal', title: 'Learning reflection', desc: 'Write what you learned today.', icon: 'notebook-edit' },
];
