import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { C, F } from '../constants/theme';

export default function RankBadge({ name }: { name: string }) {
  return (
    <View accessibilityLabel={`Current rank ${name}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: C.gold, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: C.goldDim + '55' }}>
      <MaterialCommunityIcons name="shield-star" size={15} color={C.gold} />
      <Text style={{ color: C.gold, fontFamily: F.display, fontWeight: '800', letterSpacing: 1, fontSize: 13 }}>{name.toUpperCase()}</Text>
    </View>
  );
}
