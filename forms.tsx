import React, { useCallback, useEffect, useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Btn, Card, Chip, Field, H2, Body, Row, Bar } from '../../components/ui';
import { C } from '../../constants/theme';
import { REWARDS } from '../../constants/rewards';
import { MISS_TEXT } from '../companion/dialogue';
import {
  CounterRow, CounterTable, addCounter, addFrench, addReading, deleteCounter, deleteFrench, deleteReading, getPrayer, getSelfControl,
  listCounter, listFrench, listReading, saveMiss, savePrayer, saveSelfControl, updateCounter, getSettings, FrenchRow, ReadingRow,
} from '../../database/repository';
import { reconcileDay } from '../progression/engine';
import { toKey } from '../../utils/dates';

const num = (s: string) => parseInt(s.replace(/[^0-9]/g, ''), 10);

// ---------- shared: reflect on a missed commitment (optional) ----------
export function MissPanel({ missionId }: { missionId: string }) {
  const db = useSQLiteContext();
  const [cause, setCause] = useState('');
  const [reason, setReason] = useState('');
  const [adj, setAdj] = useState('');
  const [msg, setMsg] = useState('');
  const causes = ['Poor planning', 'Distraction', 'Lack of time', 'Low energy', 'Something else'];
  return (
    <Card>
      <H2>Not finished today?</H2>
      <Body dim>{MISS_TEXT}</Body>
      <View style={{ height: 10 }} />
      <Row>{causes.map((c) => <Chip key={c} label={c} active={cause === c} onPress={() => setCause(c)} />)}</Row>
      <View style={{ height: 12 }} />
      <Field label="What prevented me from completing this?" value={reason} onChangeText={setReason} multiline />
      <Field label="One practical adjustment for tomorrow" value={adj} onChangeText={setAdj} multiline />
      <Btn kind="ghost" label="Save reflection" disabled={!cause && !reason.trim() && !adj.trim()} onPress={async () => {
        await saveMiss(db, toKey(), missionId, cause, reason.trim(), adj.trim());
        setReason(''); setAdj(''); setCause(''); setMsg('Saved. Taking responsibility is the strong move. Keep going.');
      }} />
      {msg ? <Text style={{ color: C.gold, marginTop: 8 }}>{msg}</Text> : null}
    </Card>
  );
}

// ---------- push-ups & water (same shape) ----------
export function CounterForm({ table, unit, target, quick, title, note, max }: { table: CounterTable; unit: string; target: number; quick: number[]; title: string; note?: string; max: number }) {
  const db = useSQLiteContext();
  const today = toKey();
  const [rows, setRows] = useState<CounterRow[]>([]);
  const [val, setVal] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => setRows(await listCounter(db, table, today)), [db, table, today]);
  useEffect(() => { load(); }, [load]);
  const total = rows.reduce((a, r) => a + r.value, 0);

  const commit = async (n: number) => {
    if (!Number.isFinite(n) || n <= 0 || n > max) { setMsg(`Enter a number between 1 and ${max}.`); return; }
    if (editId !== null) await updateCounter(db, table, editId, n); else await addCounter(db, table, today, n);
    setEditId(null); setVal(''); setMsg('');
    await reconcileDay(db, today); await load();
  };
  const remove = async (id: number) => { await deleteCounter(db, table, id); if (editId === id) { setEditId(null); setVal(''); } await reconcileDay(db, today); await load(); };

  return (
    <>
      <Card>
        <Text style={{ color: C.ivory, fontSize: 30, fontWeight: '800' }}>{total}<Text style={{ color: C.muted, fontSize: 16 }}> / {target} {unit}</Text></Text>
        <View style={{ height: 8 }} /><Bar pct={(total / target) * 100} />
        <Text style={{ color: total >= target ? C.gold : C.muted, marginTop: 8 }}>{total >= target ? 'Mission complete.' : `${target - total} ${unit} to go.`}</Text>
        {note ? <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>{note}</Text> : null}
      </Card>
      <Card>
        <H2>{title}</H2>
        {editId === null ? <Row>{quick.map((q) => <Btn key={q} small label={`+${q}`} onPress={() => commit(q)} />)}</Row> : null}
        <View style={{ height: 12 }} />
        <Field label={editId !== null ? 'Correct this entry' : 'Custom amount'} value={val} onChangeText={setVal} keyboardType="number-pad" placeholder={unit} />
        <Row>
          <Btn label={editId !== null ? 'Update' : 'Add'} onPress={() => commit(num(val))} />
          {editId !== null ? <Btn kind="ghost" label="Cancel" onPress={() => { setEditId(null); setVal(''); }} /> : null}
        </Row>
        {msg ? <Text style={{ color: C.crimson, marginTop: 8 }}>{msg}</Text> : null}
      </Card>
      <Card>
        <H2>Today’s entries</H2>
        {rows.length === 0 ? <Body dim>Nothing recorded yet.</Body> : rows.map((r, i) => (
          <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: C.ivory }}>#{i + 1}  ·  {r.value} {unit}</Text>
            <Row><Btn small kind="ghost" label="Edit" onPress={() => { setEditId(r.id); setVal(String(r.value)); }} /><Btn small kind="ghost" label="Remove" onPress={() => remove(r.id)} /></Row>
          </View>
        ))}
      </Card>
      {total < target ? <MissPanel missionId={table === 'pushup_sets' ? 'pushups' : 'water'} /> : null}
    </>
  );
}

// ---------- self-control ----------
const SELF_Q = ['Did I listen carefully today?', 'Did I speak unnecessarily?', 'Did I pause before reacting?', 'What conversation could I have handled better?'];
export function SelfControlForm() {
  const db = useSQLiteContext();
  const today = toKey();
  const [a, setA] = useState(['', '', '', '']);
  const [done, setDone] = useState(false);
  useEffect(() => { (async () => { const r = await getSelfControl(db, today); if (r) { setA([r.a1 ?? '', r.a2 ?? '', r.a3 ?? '', r.a4 ?? '']); setDone(!!r.completed); } })(); }, [db, today]);
  const save = async (completed: boolean) => { await saveSelfControl(db, today, completed, a); setDone(completed); await reconcileDay(db, today); };
  return (
    <>
      <Card>
        <H2>Speak intentionally. Listen more.</H2>
        <Body dim>Reflect honestly on today’s conversations. Answers are optional and stay on this device. Honest answers are never a failure.</Body>
        <View style={{ height: 12 }} />
        {SELF_Q.map((q, i) => <Field key={q} label={q} value={a[i]} multiline onChangeText={(t) => setA(a.map((x, j) => (j === i ? t : x)))} />)}
        <Row>
          <Btn label={done ? 'Save changes' : 'Mark complete'} onPress={() => save(true)} />
          {done ? <Btn kind="ghost" label="Undo completion" onPress={() => save(false)} /> : null}
        </Row>
        {done ? <Text style={{ color: C.gold, marginTop: 8 }}>Mission complete.</Text> : null}
      </Card>
      {!done ? <MissPanel missionId="selfcontrol" /> : null}
    </>
  );
}

// ---------- reading ----------
export function ReadingForm() {
  const db = useSQLiteContext();
  const today = toKey();
  const [rows, setRows] = useState<ReadingRow[]>([]);
  const [target, setTarget] = useState(20);
  const [title, setTitle] = useState(''); const [pages, setPages] = useState(''); const [mins, setMins] = useState(''); const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => { setRows(await listReading(db, today)); setTarget((await getSettings(db)).readingTarget); }, [db, today]);
  useEffect(() => { load(); }, [load]);
  const total = rows.reduce((a, r) => a + r.minutes, 0);
  return (
    <>
      <Card>
        <Text style={{ color: C.ivory, fontSize: 30, fontWeight: '800' }}>{total}<Text style={{ color: C.muted, fontSize: 16 }}> / {target} min</Text></Text>
        <View style={{ height: 8 }} /><Bar pct={(total / target) * 100} />
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>Change the daily target in Settings.</Text>
      </Card>
      <Card>
        <H2>Record a reading session</H2>
        <Field label="Book or material" value={title} onChangeText={setTitle} />
        <Row style={{ alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}><Field label="Minutes" value={mins} onChangeText={setMins} keyboardType="number-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Pages (optional)" value={pages} onChangeText={setPages} keyboardType="number-pad" /></View>
        </Row>
        <Field label="What did I learn? (optional)" value={notes} onChangeText={setNotes} multiline />
        <Btn label="Add session" onPress={async () => {
          const m = num(mins);
          if (!m || m <= 0 || m > 1440) { setMsg('Enter the minutes you read (1–1440).'); return; }
          await addReading(db, today, { title: title.trim() || null, pages: num(pages) || null, minutes: m, notes: notes.trim() || null });
          setTitle(''); setPages(''); setMins(''); setNotes(''); setMsg(''); await reconcileDay(db, today); await load();
        }} />
        {msg ? <Text style={{ color: C.crimson, marginTop: 8 }}>{msg}</Text> : null}
      </Card>
      <Card>
        <H2>Today’s sessions</H2>
        {rows.length === 0 ? <Body dim>Nothing recorded yet.</Body> : rows.map((r) => (
          <View key={r.id} style={{ paddingVertical: 6 }}>
            <Text style={{ color: C.ivory, fontWeight: '600' }}>{r.title || 'Reading'} · {r.minutes} min{r.pages ? ` · ${r.pages} pages` : ''}</Text>
            {r.notes ? <Text style={{ color: C.muted }}>{r.notes}</Text> : null}
            <View style={{ alignSelf: 'flex-start', marginTop: 4 }}><Btn small kind="ghost" label="Remove" onPress={async () => { await deleteReading(db, r.id); await reconcileDay(db, today); await load(); }} /></View>
          </View>
        ))}
      </Card>
      {total < target ? <MissPanel missionId="reading" /> : null}
    </>
  );
}

// ---------- prayer ----------
export function PrayerForm() {
  const db = useSQLiteContext();
  const today = toKey();
  const [prayed, setPrayed] = useState(false); const [bible, setBible] = useState(false); const [ref, setRef] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => { (async () => { const r = await getPrayer(db, today); if (r) { setPrayed(!!r.prayed); setBible(!!r.bible); setRef(r.reflection ?? ''); setSaved(!!r.prayed); } })(); }, [db, today]);
  return (
    <>
      <Card>
        <H2>Prayer and spiritual growth</H2>
        <Body dim>Keep this in whatever form is meaningful to you. Nothing here is required beyond marking it done.</Body>
        <View style={{ height: 10 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ color: C.ivory, fontSize: 16 }}>Prayer completed</Text>
          <Switch value={prayed} onValueChange={setPrayed} trackColor={{ true: C.goldDim, false: C.raised }} thumbColor={prayed ? C.gold : C.muted} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: C.ivory, fontSize: 16 }}>Bible study (optional)</Text>
          <Switch value={bible} onValueChange={setBible} trackColor={{ true: C.goldDim, false: C.raised }} thumbColor={bible ? C.gold : C.muted} />
        </View>
        <Field label="Private reflection (optional)" value={ref} onChangeText={setRef} multiline />
        <Btn label="Save" onPress={async () => { await savePrayer(db, today, prayed, bible, ref.trim()); setSaved(prayed); await reconcileDay(db, today); }} />
        {saved ? <Text style={{ color: C.gold, marginTop: 8 }}>Mission complete.</Text> : null}
      </Card>
      {!saved ? <MissPanel missionId="prayer" /> : null}
    </>
  );
}

// ---------- french ----------
export function FrenchForm() {
  const db = useSQLiteContext();
  const today = toKey();
  const [rows, setRows] = useState<FrenchRow[]>([]);
  const [target, setTarget] = useState(10);
  const [mins, setMins] = useState(''); const [vocab, setVocab] = useState(''); const [note, setNote] = useState(''); const [phr, setPhr] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => { setRows(await listFrench(db, today)); setTarget((await getSettings(db)).frenchTarget); }, [db, today]);
  useEffect(() => { load(); }, [load]);
  const total = rows.reduce((a, r) => a + r.minutes, 0);
  return (
    <>
      <Card>
        <Text style={{ color: C.ivory, fontSize: 30, fontWeight: '800' }}>{total}<Text style={{ color: C.muted, fontSize: 16 }}> / {target} min</Text></Text>
        <View style={{ height: 8 }} /><Bar pct={(total / target) * 100} />
      </Card>
      <Card>
        <H2>Record French practice</H2>
        <Field label="Minutes practised" value={mins} onChangeText={setMins} keyboardType="number-pad" />
        <Field label="Vocabulary learned (optional)" value={vocab} onChangeText={setVocab} multiline />
        <Field label="Short note about the lesson (optional)" value={note} onChangeText={setNote} multiline />
        <Field label="Phrases to remember (optional)" value={phr} onChangeText={setPhr} multiline />
        <Btn label="Add session" onPress={async () => {
          const m = num(mins);
          if (!m || m <= 0 || m > 1440) { setMsg('Enter the minutes you practised (1–1440).'); return; }
          await addFrench(db, today, { minutes: m, vocab: vocab.trim() || null, note: note.trim() || null, phrases: phr.trim() || null });
          setMins(''); setVocab(''); setNote(''); setPhr(''); setMsg(''); await reconcileDay(db, today); await load();
        }} />
        {msg ? <Text style={{ color: C.crimson, marginTop: 8 }}>{msg}</Text> : null}
      </Card>
      <Card>
        <H2>Today’s sessions</H2>
        {rows.length === 0 ? <Body dim>Nothing recorded yet.</Body> : rows.map((r) => (
          <View key={r.id} style={{ paddingVertical: 6 }}>
            <Text style={{ color: C.ivory, fontWeight: '600' }}>{r.minutes} min</Text>
            {r.vocab ? <Text style={{ color: C.muted }}>Vocabulary: {r.vocab}</Text> : null}
            {r.note ? <Text style={{ color: C.muted }}>Note: {r.note}</Text> : null}
            {r.phrases ? <Text style={{ color: C.muted }}>Phrases: {r.phrases}</Text> : null}
            <View style={{ alignSelf: 'flex-start', marginTop: 4 }}><Btn small kind="ghost" label="Remove" onPress={async () => { await deleteFrench(db, r.id); await reconcileDay(db, today); await load(); }} /></View>
          </View>
        ))}
      </Card>
      {total < target ? <MissPanel missionId="french" /> : null}
    </>
  );
}

export { REWARDS };
