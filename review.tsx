import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen, Card, Btn, Field, H2, Body, Row } from '../components/ui';
import { C } from '../constants/theme';
import { REWARDS } from '../constants/rewards';
import { getReview } from '../database/repository';
import { weeklySummary } from '../features/journal/weekly';
import { completeWeeklyReview } from '../features/progression/engine';
import { addDays, shortDate, toKey, weekStart } from '../utils/dates';

type Sum = Awaited<ReturnType<typeof weeklySummary>>;

export default function Review() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [ws, setWs] = useState(weekStart(toKey()));
  const [sum, setSum] = useState<Sum | null>(null);
  const [obs, setObs] = useState(''); const [goals, setGoals] = useState(''); const [prevGoals, setPrevGoals] = useState('');
  const [completed, setCompleted] = useState(false); const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setSum(await weeklySummary(db, ws));
    const r = await getReview(db, ws);
    setObs(r?.observations ?? ''); setGoals(r?.goals ?? ''); setCompleted(!!r?.completed_at); setMsg('');
    setPrevGoals((await getReview(db, addDays(ws, -7)))?.goals ?? '');
  }, [db, ws]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const save = async (complete: boolean) => {
    const prev = await getReview(db, ws);
    const doneAt = complete ? prev?.completed_at ?? new Date().toISOString() : prev?.completed_at ?? null;
    await db.runAsync('INSERT OR REPLACE INTO weekly_reviews(week_start, observations, goals, completed_at) VALUES(?,?,?,?)', [ws, obs.trim(), goals.trim(), doneAt]);
    if (complete) await completeWeeklyReview(db, ws);
    setCompleted(!!doneAt); setMsg(complete ? `Review complete (+${REWARDS.weeklyReview} XP, awarded once).` : 'Saved.');
  };

  return (
    <Screen title="Weekly review" subtitle="Plain counts from your own records. No AI, no guesses about you.">
      <Btn small kind="ghost" label="‹ Back" onPress={() => router.back()} />
      <View style={{ height: 12 }} />
      <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <Btn small kind="ghost" label="‹ Earlier" onPress={() => setWs(addDays(ws, -7))} />
        <Text style={{ color: C.ivory, fontWeight: '700' }}>{shortDate(ws)} – {shortDate(addDays(ws, 6))}</Text>
        <Btn small kind="ghost" label="Later ›" disabled={ws >= weekStart(toKey())} onPress={() => setWs(addDays(ws, 7))} />
      </Row>
      {sum ? (
        <>
          <Card>
            <H2>Journal</H2>
            <Body>{sum.entries.length} entr{sum.entries.length === 1 ? 'y' : 'ies'} completed this week.</Body>
            {sum.entries.map((e) => <Text key={e.date} style={{ color: C.muted, marginTop: 6 }}>{shortDate(e.date)}: {e.learned}</Text>)}
          </Card>
          <Card>
            <H2>Habits (days completed of {sum.daysCounted})</H2>
            {sum.per.map((p) => <Text key={p.id} style={{ color: C.ivory, paddingVertical: 2 }}>{p.title}: {p.count}</Text>)}
            {sum.most.length ? <Text style={{ color: C.gold, marginTop: 8 }}>Most consistent: {sum.most.map((m) => m.title).join(', ')}</Text> : null}
            {sum.least.length ? <Text style={{ color: C.muted, marginTop: 4 }}>Missed most often: {sum.least.map((m) => m.title).join(', ')}</Text> : null}
          </Card>
        </>
      ) : null}
      <Card>
        {prevGoals ? <><Text style={{ color: C.muted, fontSize: 12 }}>GOALS YOU SET LAST WEEK</Text><Text style={{ color: C.ivory, marginBottom: 12 }}>{prevGoals}</Text></> : null}
        <Field label="My observations about this week" multiline value={obs} onChangeText={setObs} />
        <Field label="Goals for the following week" multiline value={goals} onChangeText={setGoals} />
        <Row>
          <Btn kind="ghost" label="Save" onPress={() => save(false)} />
          <Btn label={completed ? 'Update review' : `Complete review (+${REWARDS.weeklyReview} XP)`} onPress={() => save(true)} />
        </Row>
        {msg ? <Text style={{ color: C.gold, marginTop: 8 }}>{msg}</Text> : null}
      </Card>
    </Screen>
  );
}
