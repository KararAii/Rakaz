import type { TextStyle, ViewStyle } from 'react-native';

/** Rakaz brand palette derived from the logo: deep navy + metallic gold on warm paper. */
export const Rakaz = {
  Navy: '#10233F',
  NavyDeep: '#0A172B',
  Gold: '#C9A24A',
  GoldDeep: '#A9852F',
  GoldSoft: '#EFE3C6',
  GoldTint: '#FAF4E5',
  Canvas: '#F3F1EC',
  Card: '#FFFFFF',
  Ink: '#13233D',
  InkSecondary: '#7C8596',
  Line: '#E7E4DD',
  Chip: '#EEF0F3',
  Green: '#2B9A69',
  GreenSoft: '#E1F3E9',
  Red: '#C03F37',
  RedSoft: '#FDF2F1',
  RedLine: '#EFB9B4',
  Orange: '#D9822B',
  MapLand: '#E6ECE8',
  White: '#FFFFFF',
  EmergencyTop: '#B3261E',
  EmergencyBottom: '#7A1610',
  LoginError: '#FF9C94',
} as const;

/** Applies an alpha (0..1) to a #RRGGBB color. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const Fonts = {
  regular: 'Tajawal_400Regular',
  medium: 'Tajawal_500Medium',
  bold: 'Tajawal_700Bold',
  extraBold: 'Tajawal_800ExtraBold',
} as const;

const style = (size: number, fontFamily: string, line: number = Math.trunc(size * 1.35)): TextStyle => ({
  fontFamily,
  fontSize: size,
  lineHeight: line,
});

/** Typography scale ported from the Android Material theme. */
export const Type = {
  displaySmall: style(34, Fonts.extraBold),
  headlineMedium: style(28, Fonts.extraBold),
  headlineSmall: style(24, Fonts.extraBold),
  titleLarge: style(21, Fonts.extraBold),
  titleMedium: style(17, Fonts.bold),
  titleSmall: style(15, Fonts.bold),
  bodyLarge: style(16, Fonts.medium),
  bodyMedium: style(14, Fonts.medium),
  bodySmall: style(12, Fonts.medium),
  labelLarge: style(15, Fonts.bold),
  labelMedium: style(13, Fonts.bold),
  labelSmall: style(11, Fonts.bold),
} as const;

export type TypeVariant = keyof typeof Type;

/** White elevated card used across the app. */
export function card(radius: number = 22): ViewStyle {
  return {
    backgroundColor: Rakaz.Card,
    borderRadius: radius,
    shadowColor: Rakaz.Navy,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  };
}
