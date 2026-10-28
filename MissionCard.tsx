import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, R } from '../constants/theme';

export default function MissionCard({ title, desc, icon, done, progress, onPress }: { title: string; desc: string; icon: string; done: boolean; progress: string | null; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}, ${done ? 'completed' : 'not completed'}`}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: done ? '#17150f' : C.surface, borderRadius: R.card, borderWidth: 1, borderColor: done ? C.goldDim : C.border, padding: 14, marginBottom: 10, opacity: pressed ? 0.85 : 1, minHeight: 72 })}>
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: done ? C.goldDim : C.raised, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon as any} size={24} color={done ? C.gold : C.ivory} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.ivory, fontWeight: '700', fontSize: 16 }}>{title}</Text>
        <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{desc}</Text>
        {progress ? <Text style={{ color: done ? C.gold : C.ivory, fontSize: 13, marginTop: 4, fontWeight: '600' }}>{progress}</Text> : null}
      </View>
      <MaterialCommunityIcons name={done ? 'check-circle' : 'chevron-right'} size={26} color={done ? C.gold : C.muted} />
    </Pressable>
  );
}
