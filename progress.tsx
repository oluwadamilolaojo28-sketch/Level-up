import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Screen, Card, Btn, H2, Body, Row } from '../components/ui';
import RankBadge from '../components/RankBadge';
import XPDisplay from '../components/XPDisplay';
import { C } from '../constants/theme';
import { MISSIONS } from '../constants/missions';
import { STREAK_MIN_MISSIONS } from '../constants/rewards';
import { computeStreaks, countsByDate, rankInfo, totalXp } from '../features/progression/engine';
import { addDays, shortDate, toKey } from '../utils/dates';

export default function Progress() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  useFocusEffect(useCallback(() => {
    (async () => {
      const today = toKey();
      const counts = await countsByDate(db);
      const xp = await totalXp(db);
      const per = await db.getAllAsync<{ mission_id: string; c: number }>('SELECT mission_id, COUNT(*) c FROM completions WHERE date >= ? GROUP BY mission_id', [addDays(today, -29)]);
      const ledger = await db.getAllAsync<{ date: string; amount: number; reason: string }>('SELECT date, amount, reason FROM xp_ledger ORDER BY id DESC LIMIT 12');
      setData({ today, counts, xp, rank: rankInfo(xp), streaks: computeStreaks(counts, today), per: new Map(per.map((p) => [p.mission_id, p.c])), ledger });
    })();
  }, [db]));
  if (!data) return <Screen title="Progress"><Body dim>Loading…</Body></Screen>;
  const { today, counts, rank, streaks } = data;
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, i - 29));
  const weekDone = last7.reduce((a, d) => a + (counts.get(d) ?? 0), 0);
  const monthDays = last30.filter((d) => (counts.get(d) ?? 0) >= STREAK_MIN_MISSIONS).length;

  return (
    <Screen title="Progress">
      <Card>
        <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ color: C.ivory, fontSize: 28, fontWeight: '800' }}>{data.xp} XP</Text><RankBadge name={rank.cur.name} />
        </Row>
        <XPDisplay xp={data.xp} pct={rank.pct} nextName={rank.next?.name ?? null} toNext={rank.toNext} />
      </Card>
      <Card>
        <Row style={{ justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}><Text style={{ color: C.gold, fontSize: 28, fontWeight: '800' }}>{streaks.current}</Text><Text style={{ color: C.muted }}>current streak</Text></View>
          <View style={{ alignItems: 'center' }}><Text style={{ color: C.ivory, fontSize: 28, fontWeight: '800' }}>{streaks.longest}</Text><Text style={{ color: C.muted }}>longest ever</Text></View>
        </Row>
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>A day counts toward the streak when you complete at least {STREAK_MIN_MISSIONS} missions. Missing a day pauses your streak; it never removes XP or achievements.</Text>
      </Card>
      <Card>
        <H2>This week · {Math.round((weekDone / (7 * MISSIONS.length)) * 100)}% of all missions</H2>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 90 }}>
          {last7.map((d) => {
            const c = counts.get(d) ?? 0;
            return (
              <View key={d} style={{ alignItems: 'center', flex: 1 }}>
                <View style={{ width: 18, height: Math.max(4, (c / MISSIONS.length) * 70), backgroundColor: c ? C.gold : C.raised, borderRadius: 4 }} />
                <Text style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>{shortDate(d).slice(0, 3)}</Text>
              </View>
            );
          })}
        </View>
      </Card>
      <Card>
        <H2>Last 30 days · {monthDays} consistent days</H2>
        <Row style={{ gap: 5 }}>
          {last30.map((d) => {
            const c = counts.get(d) ?? 0;
            return <View key={d} accessibilityLabel={`${d}: ${c} missions`} style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: c === 0 ? C.raised : c >= MISSIONS.length ? C.gold : c >= STREAK_MIN_MISSIONS ? '#8f7a1f' : C.goldDim }} />;
          })}
        </Row>
      </Card>
      <Card>
        <H2>Missions, last 30 days</H2>
        {MISSIONS.map((m) => <Text key={m.id} style={{ color: C.ivory, paddingVertical: 2 }}>{m.title}: <Text style={{ color: C.gold }}>{data.per.get(m.id) ?? 0}</Text> days</Text>)}
      </Card>
      <Card>
        <H2>Recent XP</H2>
        {data.ledger.length === 0 ? <Body dim>No XP yet. Complete a mission to begin.</Body> : data.ledger.map((l: any, i: number) => <Text key={i} style={{ color: C.muted, paddingVertical: 2 }}>{l.date} · +{l.amount} · {l.reason}</Text>)}
      </Card>
      <Btn kind="ghost" label="Open weekly review" onPress={() => router.push('/review')} />
    </Screen>
  );
}
