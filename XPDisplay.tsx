import React from 'react';
import { Text, View } from 'react-native';
import { Bar } from './ui';
import { C } from '../constants/theme';

export default function XPDisplay({ xp, pct, nextName, toNext }: { xp: number; pct: number; nextName: string | null; toNext: number }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: C.ivory, fontWeight: '700' }}>{xp} XP</Text>
        <Text style={{ color: C.muted }}>{nextName ? `${toNext} XP to ${nextName}` : 'Highest rank reached'}</Text>
      </View>
      <Bar pct={pct} />
    </View>
  );
}
