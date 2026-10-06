import { CloudOff, Menu, RefreshCw, type LucideIcon } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import rakazLogo from '@/assets/images/rakaz_logo.png';
import { Fonts, Rakaz, withAlpha } from '@/constants/theme';
import { StopStatus, StopStatusTitle } from '@/types/models';
import { ArabicFormat } from '@/utils/arabicFormat';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export { rakazLogo };

export type BrandButtonKind = 'GOLD' | 'NAVY' | 'DANGER' | 'OUTLINE';

const buttonColors: Record<BrandButtonKind, { bg: string; fg: string }> = {
  GOLD: { bg: Rakaz.Gold, fg: Rakaz.Ink },
  NAVY: { bg: Rakaz.Navy, fg: Rakaz.White },
  DANGER: { bg: Rakaz.Red, fg: Rakaz.White },
  OUTLINE: { bg: Rakaz.White, fg: Rakaz.Ink },
};

export interface BrandButtonProps {
  title: string;
  icon?: LucideIcon;
  kind?: BrandButtonKind;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
}

export function BrandButton({ title, icon: Icon, kind = 'GOLD', enabled = true, style, onPress }: BrandButtonProps) {
  const { bg, fg } = buttonColors[kind];
  const outline = kind === 'OUTLINE';
  return (
    <PressableScale
      onPress={onPress}
      disabled={!enabled}
      accessibilityLabel={title}
      style={[
        styles.brandButton,
        { backgroundColor: bg, shadowColor: bg },
        outline ? styles.brandButtonOutline : styles.brandButtonShadow,
        !enabled && styles.disabled,
        style,
      ]}
    >
      {Icon ? <Icon color={fg} size={20} strokeWidth={2.2} /> : null}
      <AppText variant="labelLarge" color={fg}>
        {title}
      </AppText>
    </PressableScale>
  );
}

export interface SquareIconButtonProps {
  icon: LucideIcon;
  accessibilityLabel: string;
  size?: number;
  background?: string;
  tint?: string;
  onPress: () => void;
}

export function SquareIconButton({
  icon: Icon,
  accessibilityLabel,
  size = 56,
  background = Rakaz.Navy,
  tint = Rakaz.White,
  onPress,
}: SquareIconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[styles.center, { width: size, height: size, borderRadius: size * 0.32, backgroundColor: background }]}
    >
      <Icon color={tint} size={size * 0.42} strokeWidth={2.2} />
    </PressableScale>
  );
}

export interface InitialsAvatarProps {
  initials: string;
  size?: number;
  fill?: string;
  foreground?: string;
  corner?: number;
}

export function InitialsAvatar({
  initials,
  size = 40,
  fill = Rakaz.GoldSoft,
  foreground = Rakaz.GoldDeep,
  corner,
}: InitialsAvatarProps) {
  return (
    <View
      style={[styles.center, { width: size, height: size, borderRadius: corner ?? size / 2, backgroundColor: fill }]}
    >
      <AppText
        variant="labelMedium"
        color={foreground}
        style={{ fontFamily: Fonts.extraBold, fontSize: size * 0.36, lineHeight: size * 0.5, textAlign: 'center' }}
      >
        {initials}
      </AppText>
    </View>
  );
}

const badgeColors: Record<StopStatus, { bg: string; fg: string }> = {
  [StopStatus.PICKED_UP]: { bg: Rakaz.GreenSoft, fg: Rakaz.Green },
  [StopStatus.DROPPED_OFF]: { bg: Rakaz.GreenSoft, fg: Rakaz.Green },
  [StopStatus.ABSENT]: { bg: Rakaz.RedSoft, fg: Rakaz.Red },
  [StopStatus.ARRIVED]: { bg: Rakaz.GoldSoft, fg: Rakaz.GoldDeep },
  [StopStatus.PENDING]: { bg: Rakaz.Chip, fg: Rakaz.InkSecondary },
};

export function StatusBadge({ status }: { status: StopStatus }) {
  const { bg, fg } = badgeColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText variant="labelSmall" color={fg}>
        {StopStatusTitle[status]}
      </AppText>
    </View>
  );
}

export function LogoBadge({ size = 44 }: { size?: number }) {
  return (
    <View
      style={[styles.center, { width: size, height: size, borderRadius: size * 0.28, backgroundColor: Rakaz.White, padding: size * 0.08 }]}
    >
      <Image source={rakazLogo} resizeMode="contain" style={styles.fill} accessibilityLabel="ركاز" />
    </View>
  );
}

export interface BrandHeaderProps {
  subtitle: string;
  title: string;
  isOnline: boolean;
  pendingCount: number;
  onMenu: () => void;
}

/** Navy brand header from the design: logo, subtitle/title, sync pill and menu button. */
export function BrandHeader({ subtitle, title, isOnline, pendingCount, onMenu }: BrandHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <LogoBadge size={46} />
      <View style={styles.flex}>
        <AppText variant="labelMedium" color={Rakaz.Gold}>
          {subtitle}
        </AppText>
        <AppText variant="titleMedium" color={Rakaz.White} numberOfLines={1}>
          {title}
        </AppText>
      </View>
      <SyncPill isOnline={isOnline} pendingCount={pendingCount} />
      <PressableScale onPress={onMenu} accessibilityLabel="القائمة" style={styles.menuButton}>
        <Menu color={Rakaz.White} size={22} />
      </PressableScale>
    </View>
  );
}

export function SyncPill({ isOnline, pendingCount }: { isOnline: boolean; pendingCount: number }) {
  const config: { icon: LucideIcon | null; label: string; tint: string } = !isOnline
    ? { icon: CloudOff, label: 'دون اتصال', tint: Rakaz.Orange }
    : pendingCount > 0
      ? { icon: RefreshCw, label: ArabicFormat.number(pendingCount), tint: Rakaz.Gold }
      : { icon: null, label: 'متصل', tint: Rakaz.Green };
  const Icon = config.icon;
  return (
    <View style={styles.syncPill}>
      {Icon ? <Icon color={config.tint} size={15} /> : <View style={[styles.dot, { backgroundColor: config.tint }]} />}
      <AppText variant="labelSmall" color={Rakaz.White}>
        {config.label}
      </AppText>
    </View>
  );
}

export function SectionTitle({ title, icon: Icon }: { title: string; icon: LucideIcon }) {
  return (
    <View style={styles.row}>
      <Icon color={Rakaz.Gold} size={20} />
      <AppText variant="titleSmall">{title}</AppText>
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const value = useRef(new Animated.Value(progress)).current;
  const [width, setWidth] = useState(0);
  useEffect(() => {
    Animated.spring(value, { toValue: Math.min(1, Math.max(0, progress)), damping: 18, stiffness: 120, useNativeDriver: false }).start();
  }, [progress, value]);
  return (
    <View style={styles.progressTrack} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Animated.View
        style={[styles.progressFill, { width: value.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) }]}
      />
    </View>
  );
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <AppText variant="bodyMedium" color={Rakaz.InkSecondary} style={styles.emptyNote}>
      {text}
    </AppText>
  );
}

export function MapChip({ icon: Icon, label, onPress }: { icon: LucideIcon; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={label} style={[styles.mapChip]}>
      <Icon color={Rakaz.Ink} size={22} />
    </PressableScale>
  );
}

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  fill: { width: '100%', height: '100%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disabled: { opacity: 0.5 },
  brandButton: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
  },
  brandButtonShadow: { shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  brandButtonOutline: { borderWidth: 1.2, borderColor: Rakaz.Line },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  header: {
    backgroundColor: Rakaz.Navy,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: withAlpha(Rakaz.White, 0.08),
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: withAlpha(Rakaz.White, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Rakaz.White, 0.1),
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: Rakaz.Chip, overflow: 'hidden', alignSelf: 'stretch' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Rakaz.Gold },
  emptyNote: { textAlign: 'center', padding: 24 },
  mapChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Rakaz.Card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Rakaz.Navy,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
