import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { C } from '../constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ProgressRing({ pct, size = 130, stroke = 10, animate = true, children }: { pct: number; size?: number; stroke?: number; animate?: boolean; children?: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (animate) Animated.timing(v, { toValue: pct, duration: 700, useNativeDriver: false }).start();
    else v.setValue(pct);
  }, [pct, animate, v]);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = v.interpolate({ inputRange: [0, 100], outputRange: [c, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.raised} strokeWidth={stroke} fill="none" />
        <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={C.gold} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset as any} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`} />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>{children}</View>
    </View>
  );
}
