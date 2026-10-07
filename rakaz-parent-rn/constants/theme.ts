import type { TextStyle, ViewStyle } from 'react-native';

/**
 * Brand palette sampled from the Rakaz design file: midnight navy headers, brushed gold accents,
 * warm off-white canvas and soft tinted surfaces.
 */
export const Theme = {
  navy: '#071D36',
  navyDeep: '#05152A',
  navyRaised: '#0E233B',
  teal: '#143B4A',
  tealDeep: '#0F2F3C',
  gold: '#C09034',
  goldLight: '#E0B25C',
  goldSoft: '#FBF1DF',
  cream: '#FBF4E7',
  canvas: '#F3F4F1',
  card: '#FFFFFF',
  ink: '#0E233B',
  muted: '#8191A4',
  line: '#EBEDEA',
  green: '#3D8B66',
  greenDeep: '#2D6B54',
  greenSoft: '#E4F0E9',
  red: '#C4533F',
  redSoft: '#F9E6E1',
  blue: '#3D6A93',
  blueSoft: '#E9EFF4',
  sage: '#89AAA1',
  sageSoft: '#E9F0EF',
  whatsapp: '#25A35A',
  white: '#FFFFFF',
  black: '#000000',
} as const;

/** Applies an alpha (0..1) to a #RRGGBB color. */
export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

export const Gradients = {
  header: [Theme.navyDeep, Theme.navy] as const,
  gold: [Theme.goldLight, Theme.gold] as const,
  navyCard: [Theme.navyRaised, Theme.navy] as const,
  tealCard: [Theme.teal, Theme.tealDeep] as const,
};

/** IBM Plex Sans Arabic, registered under these family names in the root layout. */
export const Fonts = {
  regular: 'IBMPlexSansArabic-Regular',
  medium: 'IBMPlexSansArabic-Medium',
  semibold: 'IBMPlexSansArabic-SemiBold',
  bold: 'IBMPlexSansArabic-Bold',
} as const;

export type FontWeight = keyof typeof Fonts;

/** Point sizes of the SwiftUI text styles used by `Font.plex`. */
export const TextSizes = {
  largeTitle: 34,
  title: 28,
  title2: 22,
  title3: 20,
  headline: 17,
  body: 17,
  callout: 16,
  subheadline: 15,
  footnote: 13,
  caption: 12,
  caption2: 11,
} as const;

export type TextStyleName = keyof typeof TextSizes;

export function plex(size: number, weight: FontWeight = 'regular'): TextStyle {
  return { fontFamily: Fonts[weight], fontSize: size, lineHeight: Math.round(size * 1.45) };
}

/** White card with the soft navy shadow used across the app (`.card()` modifier). */
export function card(padding: number = 16, radius: number = 24): ViewStyle {
  return {
    padding,
    borderRadius: radius,
    backgroundColor: Theme.card,
    alignSelf: 'stretch',
    boxShadow: shadow(6, 16, 0.06),
  };
}

/** Stronger shadow used on hero cards that overlap the header. */
export const heroShadow: ViewStyle = { boxShadow: shadow(12, 24, 0.08) };

/** CSS box-shadow in navy (SwiftUI `.shadow(color: navy.opacity(o), radius: r, y: y)`). */
export function shadow(y: number, radius: number, opacity: number, color: string = Theme.navy): string {
  return `0px ${y}px ${radius}px ${withAlpha(color, opacity)}`;
}
