import React, { useCallback, useState } from 'react';
import { Alert, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Screen, Card, Btn, Field, H2, Body, Row } from '../components/ui';
import { C } from '../constants/theme';
import { DEFAULT_SETTINGS, REMINDER_INFO, ReminderKey, Settings } from '../constants/rewards';
import { exportAll, getSettings, resetAll, restoreAll, setSetting } from '../database/repository';
import { applyReminders, validTime } from '../features/reminders/reminders';
import { reconcileDay } from '../features/progression/engine';
import { toKey } from '../utils/dates';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [water, setWater] = useState(''); const [read, setRead] = useState(''); const [fr, setFr] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const x = await getSettings(db); setS(x);
    setWater(String(x.waterTarget)); setRead(String(x.readingTarget)); setFr(String(x.frenchTarget));
  }, [db]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const saveNum = async (key: 'waterTarget' | 'readingTarget' | 'frenchTarget', raw: string, lo: number, hi: number) => {
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n < lo || n > hi) { setMsg(`Please enter a number from ${lo} to ${hi}.`); load(); return; }
    await setSetting(db, key, n); await reconcileDay(db, toKey()); setMsg('Saved.'); load();
  };
  const toggle = async (key: 'sound' | 'animations' | 'reducedMotion', v: boolean) => { await setSetting(db, key, v); setS({ ...s, [key]: v }); };

  const updateReminder = async (k: ReminderKey, patch: Partial<{ on: boolean; time: string }>) => {
    const next = { ...s.reminders, [k]: { ...s.reminders[k], ...patch } };
    if (!validTime(next[k].time)) { setS({ ...s, reminders: next }); setMsg('Use 24-hour time like 07:30.'); return; }
    const [h, m] = next[k].time.trim().split(':'); next[k].time = `${h.padStart(2, '0')}:${m}`;
    await setSetting(db, 'reminders', next); setS({ ...s, reminders: next });
    const ok = await applyReminders(next);
    setMsg(ok ? 'Reminders updated.' : 'Notification permission was not granted. Enable it in Android settings to receive reminders.');
  };

  const backup = async () => {
    try {
      const path = `${FileSystem.cacheDirectory}levelup-backup-${toKey()}.json`;
      await FileSystem.writeAsStringAsync(path, await exportAll(db));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save your LEVEL UP backup' });
      else setMsg(`Backup written to ${path}`);
    } catch (e: any) { setMsg(`Backup failed: ${e?.message ?? e}`); }
  };
  const restore = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const text = await FileSystem.readAsStringAsync(r.assets[0].uri);
      Alert.alert('Restore this backup?', 'This replaces ALL current data on this device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: async () => { try { await restoreAll(db, text); await load(); setMsg('Backup restored.'); } catch (e: any) { setMsg(`Restore failed: ${e?.message ?? e}`); } } },
      ]);
    } catch (e: any) { setMsg(`Restore failed: ${e?.message ?? e}`); }
  };
  const reset = () => Alert.alert('Reset everything?', 'All progress, journal entries and settings will be permanently deleted. Consider making a backup first.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', style: 'destructive', onPress: () => Alert.alert('Are you absolutely sure?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: async () => { await resetAll(db); await applyReminders(DEFAULT_SETTINGS.reminders); await load(); setMsg('Everything has been reset.'); } },
    ]) },
  ]);

  const sw = (label: string, v: boolean, on: (b: boolean) => void) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
      <Text style={{ color: C.ivory, fontSize: 15, flex: 1 }}>{label}</Text>
      <Switch value={v} onValueChange={on} trackColor={{ true: C.goldDim, false: C.raised }} thumbColor={v ? C.gold : C.muted} />
    </View>
  );

  return (
    <Screen title="Settings">
      {msg ? <Text style={{ color: C.gold, marginBottom: 10 }}>{msg}</Text> : null}
      <Card>
        <H2>Daily targets</H2>
        <Field label="Water target (ml). Choose what suits you." value={water} onChangeText={setWater} keyboardType="number-pad" onEndEditing={() => saveNum('waterTarget', water, 250, 8000)} />
        <Field label="Reading target (minutes)" value={read} onChangeText={setRead} keyboardType="number-pad" onEndEditing={() => saveNum('readingTarget', read, 1, 600)} />
        <Field label="French practice target (minutes)" value={fr} onChangeText={setFr} keyboardType="number-pad" onEndEditing={() => saveNum('frenchTarget', fr, 1, 600)} />
      </Card>
      <Card>
        <H2>Experience</H2>
        {sw('Sound effects (saved; audio is not added yet)', s.sound, (v) => toggle('sound', v))}
        {sw('Character & progress animations', s.animations, (v) => toggle('animations', v))}
        {sw('Reduced motion', s.reducedMotion, (v) => toggle('reducedMotion', v))}
        <Body dim>Dark theme is the default. A light theme is not included yet.</Body>
      </Card>
      <Card>
        <H2>Reminders</H2>
        {(Object.keys(REMINDER_INFO) as ReminderKey[]).map((k) => (
          <View key={k} style={{ marginBottom: 8 }}>
            {sw(REMINDER_INFO[k].label, s.reminders[k].on, (v) => updateReminder(k, { on: v }))}
            <Field value={s.reminders[k].time} onChangeText={(t) => setS({ ...s, reminders: { ...s.reminders, [k]: { ...s.reminders[k], time: t } } })} onEndEditing={() => updateReminder(k, {})} placeholder="HH:MM" />
          </View>
        ))}
      </Card>
      <Card>
        <H2>Your data</H2>
        <Body dim>Everything is stored only on this phone. Back up regularly: if you uninstall the app, the data goes with it.</Body>
        <View style={{ height: 10 }} />
        <Row><Btn label="Export / back up" onPress={backup} /><Btn kind="ghost" label="Restore backup" onPress={restore} /></Row>
        <View style={{ height: 14 }} />
        <Btn kind="danger" label="Reset all data" onPress={reset} />
      </Card>
    </Screen>
  );
}
