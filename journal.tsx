import React, { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen, Card, Btn, Field, H2, Body, Row, Chip } from '../components/ui';
import { C } from '../constants/theme';
import { JournalFields, JournalRow, deleteJournal, getJournal, listJournal, saveJournal } from '../database/repository';
import { reconcileDay } from '../features/progression/engine';
import { addDays, longDate, monthLabel, shortDate, toKey } from '../utils/dates';

const EMPTY: JournalFields = { learned: '', explain: '', important: '', apply_text: '', question: '' };
const QUESTIONS: [keyof JournalFields, string][] = [
  ['learned', '1. What did I learn today?'],
  ['explain', '2. Can I explain it in my own words without looking at my notes?'],
  ['important', '3. Why is this knowledge important?'],
  ['apply_text', '4. How can I apply what I learned?'],
  ['question', '5. What question do I still have?'],
];

export default function JournalScreen() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams<{ date?: string }>();
  const [mode, setMode] = useState<'write' | 'archive'>('write');
  const [date, setDate] = useState(params.date || toKey());
  const [f, setF] = useState<JournalFields>(EMPTY);
  const [status, setStatus] = useState<'none' | 'draft' | 'saved'>('none');
  const [msg, setMsg] = useState('');
  const [query, setQuery] = useState('');
  const [list, setList] = useState<JournalRow[]>([]);

  const loadEntry = useCallback(async (d: string) => {
    const r = await getJournal(db, d);
    setF(r ? { learned: r.learned ?? '', explain: r.explain ?? '', important: r.important ?? '', apply_text: r.apply_text ?? '', question: r.question ?? '' } : EMPTY);
    setStatus(r ? r.status : 'none'); setMsg('');
  }, [db]);
  const loadList = useCallback(async (q: string) => setList(await listJournal(db, q)), [db]);

  useFocusEffect(useCallback(() => { loadEntry(date); loadList(query); }, [date, loadEntry, loadList])); // eslint-disable-line

  const save = async (st: 'draft' | 'saved') => {
    if (st === 'saved' && !f.learned.trim()) { setMsg('Write what you learned first. It can be one sentence.'); return; }
    await saveJournal(db, date, f, st);
    await reconcileDay(db, date);
    setStatus(st); setMsg(st === 'saved' ? 'Entry saved.' : 'Draft saved.'); loadList(query);
  };
  const del = () => Alert.alert('Delete this entry?', `${longDate(date)} will be permanently removed.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => { await deleteJournal(db, date); await reconcileDay(db, date); setF(EMPTY); setStatus('none'); setMsg('Entry deleted.'); loadList(query); } },
  ]);

  const groups: { month: string; items: JournalRow[] }[] = [];
  for (const r of list) { const m = monthLabel(r.date); const g = groups[groups.length - 1]; if (g && g.month === m) g.items.push(r); else groups.push({ month: m, items: [r] }); }

  return (
    <Screen title="Learning journal" subtitle="Write it down. Knowing it means being able to explain it.">
      <Row style={{ marginBottom: 14 }}>
        <Chip label="Write" active={mode === 'write'} onPress={() => setMode('write')} />
        <Chip label="Archive" active={mode === 'archive'} onPress={() => { setMode('archive'); loadList(query); }} />
      </Row>

      {mode === 'write' ? (
        <>
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <Btn small kind="ghost" label="‹" onPress={() => setDate(addDays(date, -1))} />
            <Text style={{ color: C.ivory, fontWeight: '700' }}>{longDate(date)}{status === 'saved' ? '  ✓' : status === 'draft' ? '  (draft)' : ''}</Text>
            <Btn small kind="ghost" label="›" disabled={date >= toKey()} onPress={() => setDate(addDays(date, 1))} />
          </Row>
          <Card>
            {QUESTIONS.map(([k, q]) => <Field key={k} label={q} multiline value={f[k]} onChangeText={(t) => setF({ ...f, [k]: t })} />)}
            <Row>
              {status !== 'saved' ? <Btn kind="ghost" label="Save draft" onPress={() => save('draft')} /> : null}
              <Btn label={status === 'saved' ? 'Save changes' : 'Save entry'} onPress={() => save('saved')} />
              {status !== 'none' ? <Btn kind="danger" small label="Delete" onPress={del} /> : null}
            </Row>
            {msg ? <Text style={{ color: C.gold, marginTop: 10 }}>{msg}</Text> : null}
          </Card>
        </>
      ) : (
        <>
          <Field placeholder="Search your entries…" value={query} onChangeText={(t) => { setQuery(t); loadList(t); }} />
          {groups.length === 0 ? <Card><Body dim>{query ? 'No entries match your search.' : 'No entries yet. Your first reflection will appear here.'}</Body></Card> : null}
          {groups.map((g) => (
            <View key={g.month}>
              <H2>{g.month}</H2>
              {g.items.map((r) => (
                <Pressable key={r.date} onPress={() => { setDate(r.date); setMode('write'); }}>
                  <Card>
                    <Text style={{ color: C.gold, fontWeight: '700' }}>{shortDate(r.date)}{r.status === 'draft' ? '  · draft' : ''}</Text>
                    <Text style={{ color: C.ivory, marginTop: 4 }} numberOfLines={3}>{r.learned || '(empty)'}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          ))}
        </>
      )}
    </Screen>
  );
}
