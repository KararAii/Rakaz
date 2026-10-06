import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Rakaz, Type, type TypeVariant } from '@/constants/theme';

export interface AppTextProps extends TextProps {
  variant?: TypeVariant;
  color?: string;
}

/** Tajawal text. "left" is the logical start in native RTL; web needs the physical side. */
export function AppText({ variant = 'bodyMedium', color = Rakaz.Ink, style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[styles.base, Type[variant], { color }, style]} />;
}

const styles = StyleSheet.create({
  base: {
    textAlign: Platform.OS === 'web' ? 'right' : 'left',
    writingDirection: 'rtl',
  },
});
