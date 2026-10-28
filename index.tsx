import React, { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen, Card, Btn, Body } from '../components/ui';
import ProgressRing from '../components/ProgressRing';
import RankBadge from '../components/RankBadge';
import XPDisplay from '../components/XPDisplay';
import MissionCard from '../components/MissionCard';
import AstaCompanion, { AstaAvatar } from '../components/AstaCompanion';
import { MISSIONS } from '../constants/missions';
import { C, F } from '../constants/theme';
import { getDashboard, progressText, reconcileDay } from '../features/progression/engine';
import { pickDialogue, LEVEL_UP_TEXT } from '../features/companion/dialogue';
import { setSetting } from '../database/repository';
import { longDate, toKey } from '../utils/dates';

type Dash = Awaited<ReturnType<typeof getDashboard>>;

export default function Home() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [d, setD] = useState<Dash | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [levelUp, setLevelUp] = useState<string | null>(null);
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      try {
        const today = toKey();
        await reconcileDay(db, today); // keeps rewards in sync with the records
        const data = await getDashboard(db, today);
        if (!alive) return;
        setD(data);
        const last = data.settings.lastRankIndex;
        if (last === null) await setSetting(db, 'lastRankIndex', data.rank.idx);
        else if (data.rank.idx > last) { setLevelUp(data.rank.cur.name); await setSetting(db, 'lastRankIndex', data.rank.idx); }
        else if (data.rank.idx < last) await setSetting(db, 'lastRankIndex', data.rank.idx);
      } catch (e: any) { setError(String(e?.message ?? e)); }
    })();
    return () => { alive = false; };
  }, [db]));

  if (error) return <Screen title="LEVEL UP"><Body>Something went wrong loading your data: {error}</Body></Screen>;
  if (!d) return <Screen title="LEVEL UP"><Body dim>Loading…</Body></Screen>;

  const doneCount = MISSIONS.filter((m) => d.done[m.id]).length;
  const next = MISSIONS.find((m) => !d.done[m.id]) ?? null;
  const talk = pickDialogue({ hour: new Date().getHours(), done: doneCount, total: MISSIONS.length, daysAway: d.daysAway, missedYesterday: d.missedYesterday, nextTitle: next?.title ?? null, dayOfMonth: new Date().getDate() });
  const pct = Math.round((doneCount / MISSIONS.length) * 100);
  const go = (id: string) => router.push(id === 'journal' ? '/journal' : { pathname: '/mission/[id]', params: { id } });

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontFamily: F.display, fontSize: 26, fontWeight: '900', color: C.ivory, letterSpacing: 2 }}>LEVEL <Text style={{ color: C.gold }}>UP</Text></Text>
          <Text style={{ color: C.muted, fontSize: 13 }}>{longDate(toKey())}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <RankBadge name={d.rank.cur.name} />
          <Pressable onPress={() => router.push('/settings')} accessibilityLabel="Settings" hitSlop={10}>
            <MaterialCommunityIcons name="cog-outline" size={24} color={C.muted} />
          </Pressable>
        </View>
      </View>
      <View style={{ height: 16 }} />

      {!dismissed ? <AstaCompanion mood={talk.mood} message={talk.text} onDismiss={() => setDismissed(true)} /> : null}

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <ProgressRing pct={pct} animate={d.settings.animations && !d.settings.reducedMotion}>
            <Text style={{ color: C.ivory, fontSize: 26, fontWeight: '800' }}>{doneCount}/{MISSIONS.length}</Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>{pct}% today</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: 8 }}>
            <Text style={{ color: C.ivory }}>XP today: <Text style={{ color: C.gold, fontWeight: '800' }}>+{d.xpToday}</Text></Text>
            <Text style={{ color: C.ivory }}>Streak: <Text style={{ color: C.gold, fontWeight: '800' }}>{d.streaks.current} day{d.streaks.current === 1 ? '' : 's'}</Text></Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>Best: {d.streaks.longest}</Text>
          </View>
        </View>
        <View style={{ height: 14 }} />
        <XPDisplay xp={d.xp} pct={d.rank.pct} nextName={d.rank.next?.name ?? null} toNext={d.rank.toNext} />
      </Card>

      {next ? (
        <Card style={{ borderColor: C.gold }}>
          <Text style={{ color: C.muted, fontSize: 12, marginBottom: 4 }}>NEXT ACTION</Text>
          <Text style={{ color: C.ivory, fontSize: 17, fontWeight: '700', marginBottom: 10 }}>{next.title}</Text>
          <Btn label="Start now" onPress={() => go(next.id)} />
        </Card>
      ) : null}

      <Text style={{ fontFamily: F.display, color: C.ivory, fontSize: 19, fontWeight: '700', marginVertical: 8 }}>Daily missions</Text>
      {MISSIONS.map((m) => (
        <MissionCard key={m.id} title={m.title} desc={m.desc} icon={m.icon} done={d.done[m.id]} progress={progressText(m.id, d.totals, d.settings)} onPress={() => go(m.id)} />
      ))}
      <Text style={{ color: C.muted, textAlign: 'center', marginTop: 10, fontSize: 12 }}>Take responsibility, learn from the day, and keep moving.</Text>

      <Modal visible={!!levelUp} transparent animationType="fade" onRequestClose={() => setLevelUp(null)}>
        <View style={{ flex: 1, backgroundColor: '#000000cc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: C.surface, borderColor: C.gold, borderWidth: 2, borderRadius: 18, padding: 24, alignItems: 'center', width: '100%' }}>
            <AstaAvatar mood="excited" size={120} />
            <Text style={{ color: C.gold, fontFamily: F.display, fontWeight: '900', fontSize: 30, marginTop: 8 }}>RANK UP</Text>
            <Text style={{ color: C.ivory, fontSize: 22, fontWeight: '800', marginVertical: 6 }}>{levelUp}</Text>
            <Text style={{ color: C.ivory, textAlign: 'center', marginBottom: 16 }}>{LEVEL_UP_TEXT}</Text>
            <Btn label="Continue" onPress={() => setLevelUp(null)} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
