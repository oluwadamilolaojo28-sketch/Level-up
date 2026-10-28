import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { REMINDER_INFO, ReminderKey, Settings } from '../../constants/rewards';

export const validTime = (t: string) => /^([01]?\d|2[0-3]):([0-5]\d)$/.test(t.trim());

/** Cancels old reminders and schedules the enabled ones as repeating daily local notifications. Returns false if permission was refused. */
export async function applyReminders(r: Settings['reminders']): Promise<boolean> {
  const anyOn = Object.values(r).some((x) => x.on);
  let perm = await Notifications.getPermissionsAsync();
  if (!perm.granted && anyOn) perm = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: Notifications.AndroidImportance.DEFAULT });
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!perm.granted) return !anyOn;
  for (const key of Object.keys(r) as ReminderKey[]) {
    const cfg = r[key];
    if (!cfg.on || !validTime(cfg.time)) continue;
    const [h, m] = cfg.time.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'LEVEL UP', body: REMINDER_INFO[key].body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m, channelId: 'reminders' },
    });
  }
  return true;
}
