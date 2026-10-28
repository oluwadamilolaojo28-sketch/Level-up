import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Line, Ellipse } from 'react-native-svg';
import { C, R } from '../constants/theme';
import type { Mood } from '../features/companion/dialogue';
import { ASTA_IMAGES } from '../features/companion/assets';

// PLACEHOLDER ART: a generic hand-drawn stand-in, NOT official Asta artwork.
// See features/companion/assets.ts to swap in your own illustrations per mood.
type Face = { d: number; mouth: string; fill?: boolean; eyes: 'open' | 'happy' | 'tired' };
const FACES: Record<Mood, Face> = {
  idle: { d: 0, mouth: 'M48 84 Q60 89 72 84', eyes: 'open' },
  welcome: { d: 0, mouth: 'M44 80 Q60 96 76 80', eyes: 'open' },
  determined: { d: 4, mouth: 'M46 84 Q60 88 74 80', eyes: 'open' },
  celebrating: { d: 0, mouth: 'M42 78 Q60 102 78 78 Z', fill: true, eyes: 'happy' },
  proud: { d: 1, mouth: 'M44 82 Q60 92 76 82', eyes: 'happy' },
  tired: { d: -1, mouth: 'M48 85 L72 85', eyes: 'tired' },
  concerned: { d: -4, mouth: 'M46 88 Q60 80 74 88', eyes: 'open' },
  excited: { d: 3, mouth: 'M40 76 Q60 106 80 76 Z', fill: true, eyes: 'happy' },
};

function PlaceholderFace({ mood, size }: { mood: Mood; size: number }) {
  const f = FACES[mood];
  const eye = (cx: number) => f.eyes === 'open'
    ? <Circle cx={cx} cy={58} r={5} fill="#1b1b1b" />
    : f.eyes === 'happy'
      ? <Path d={`M${cx - 8} 60 Q${cx} 50 ${cx + 8} 60`} stroke="#1b1b1b" strokeWidth={3} fill="none" strokeLinecap="round" />
      : <Line x1={cx - 8} y1={58} x2={cx + 8} y2={58} stroke="#1b1b1b" strokeWidth={3} strokeLinecap="round" />;
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120" accessibilityLabel={`Companion, mood ${mood}`}>
      <Circle cx={60} cy={66} r={38} fill="#E8C39E" />
      <Path d="M20 58 L12 32 L32 42 L36 12 L50 36 L60 8 L70 36 L84 12 L88 42 L108 32 L100 58 Q60 34 20 58 Z" fill="#E9E3CF" stroke="#bdb59b" strokeWidth={1.5} />
      <Line x1={36} y1={50 - f.d} x2={52} y2={50 + f.d} stroke="#6b5a3a" strokeWidth={3} strokeLinecap="round" />
      <Line x1={68} y1={50 + f.d} x2={84} y2={50 - f.d} stroke="#6b5a3a" strokeWidth={3} strokeLinecap="round" />
      {eye(44)}{eye(76)}
      <Path d={f.mouth} stroke="#7a3b2e" strokeWidth={3} strokeLinecap="round" fill={f.fill ? '#7a3b2e' : 'none'} />
      {mood === 'tired' ? <Ellipse cx={60} cy={100} rx={0} ry={0} /> : null}
    </Svg>
  );
}

export function AstaAvatar({ mood, size = 96 }: { mood: Mood; size?: number }) {
  const img = ASTA_IMAGES[mood];
  if (img) return <Image source={img} style={{ width: size, height: size }} resizeMode="contain" />;
  return <PlaceholderFace mood={mood} size={size} />;
}

export default function AstaCompanion({ mood, message, onDismiss }: { mood: Mood; message: string; onDismiss?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 14 }}>
      <View style={{ alignItems: 'center' }}>
        <AstaAvatar mood={mood} size={84} />
        <Text style={{ color: C.muted, fontSize: 9, marginTop: 2 }}>placeholder art</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.ivory, fontSize: 15, lineHeight: 21 }}>{message}</Text>
      </View>
      {onDismiss ? (
        <Pressable onPress={onDismiss} accessibilityLabel="Dismiss message" hitSlop={12} style={{ alignSelf: 'flex-start', padding: 4 }}>
          <Text style={{ color: C.muted, fontSize: 20 }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
