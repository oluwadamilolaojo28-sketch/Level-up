import { Platform } from 'react-native';
export const C = {
  bg: '#0B0B0D', surface: '#141417', raised: '#1C1C21', border: '#2A2A30',
  ivory: '#F4EEDC', muted: '#A39E8F', gold: '#C9A227', goldDim: '#5E4D14', crimson: '#8B1E2D',
};
export const R = { card: 14, btn: 12 };
export const F = { display: Platform.select({ ios: 'Georgia', default: 'serif' }) as string };
