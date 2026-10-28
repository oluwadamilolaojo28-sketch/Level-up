import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, R, F } from '../constants/theme';

export function Screen({ children, title, subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 56 }} keyboardShouldPersistTaps="handled">
        {title ? <Text style={s.h1}>{title}</Text> : null}
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[s.card, style]}>{children}</View>;
export const H2 = ({ children }: { children: React.ReactNode }) => <Text style={s.h2}>{children}</Text>;
export const Body = ({ children, dim }: { children: React.ReactNode; dim?: boolean }) => <Text style={[s.body, dim && { color: C.muted }]}>{children}</Text>;

export function Btn({ label, onPress, kind = 'gold', disabled, small }: { label: string; onPress: () => void; kind?: 'gold' | 'ghost' | 'danger'; disabled?: boolean; small?: boolean }) {
  const bg = kind === 'gold' ? C.gold : kind === 'danger' ? C.crimson : 'transparent';
  const fg = kind === 'gold' ? '#14110a' : C.ivory;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: bg, borderColor: kind === 'ghost' ? C.border : bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1, minHeight: small ? 40 : 48 }]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: small ? 14 : 15 }}>{label}</Text>
    </Pressable>
  );
}
export function Field({ label, ...p }: { label?: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <TextInput placeholderTextColor="#6d695e" {...p}
        style={[s.input, p.multiline && { minHeight: 84, textAlignVertical: 'top' }, p.style]} />
    </View>
  );
}
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.chip, active && { backgroundColor: C.gold, borderColor: C.gold }]}>
      <Text style={{ color: active ? '#14110a' : C.ivory, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}
export const Row = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, style]}>{children}</View>;
export function Bar({ pct }: { pct: number }) {
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: C.raised, overflow: 'hidden' }}>
      <View style={{ height: 8, width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: C.gold }} />
    </View>
  );
}
export const Gap = ({ h = 12 }: { h?: number }) => <View style={{ height: h }} />;

const s = StyleSheet.create({
  h1: { fontFamily: F.display, fontSize: 30, fontWeight: '800', color: C.ivory, letterSpacing: 0.5 },
  sub: { color: C.muted, marginTop: 4, marginBottom: 16, fontSize: 14 },
  h2: { fontFamily: F.display, fontSize: 19, fontWeight: '700', color: C.ivory, marginBottom: 8 },
  body: { color: C.ivory, fontSize: 15, lineHeight: 22 },
  card: { backgroundColor: C.surface, borderRadius: R.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14 },
  btn: { borderRadius: R.btn, borderWidth: 1, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  label: { color: C.muted, fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: C.raised, borderRadius: 10, borderWidth: 1, borderColor: C.border, color: C.ivory, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, minHeight: 46 },
  chip: { borderRadius: 20, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 8, minHeight: 38, justifyContent: 'center' },
});
