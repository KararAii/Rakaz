import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { type FontWeight, plex, TextSizes, type TextStyleName, Theme } from '@/constants/theme';

export interface AppTextProps extends TextProps {
  /** SwiftUI text style name or an explicit point size. */
  size?: TextStyleName | number;
  weight?: FontWeight;
  color?: string;
  align?: 'start' | 'center' | 'end';
}

const START = Platform.OS === 'web' ? 'right' : 'left';
const END = Platform.OS === 'web' ? 'left' : 'right';

/** IBM Plex Sans Arabic text. "left" is the logical start in native RTL; web needs the physical side. */
export function AppText({ size = 'body', weight = 'regular', color = Theme.ink, align = 'start', style, ...rest }: AppTextProps) {
  const points = typeof size === 'number' ? size : TextSizes[size];
  const textAlign = align === 'center' ? 'center' : align === 'end' ? END : START;
  return <Text {...rest} style={[styles.base, plex(points, weight), { color, textAlign }, style]} />;
}

const styles = StyleSheet.create({
  base: { writingDirection: 'rtl' },
});
