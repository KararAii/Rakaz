import { LinearGradient } from 'expo-linear-gradient';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { StudentAvatar } from '@/components/Primitives';
import { Gradients, Theme, withAlpha } from '@/constants/theme';
import { useFamily } from '@/store/familyStore';
import { Haptics } from '@/utils/haptics';

/** Midnight navy header surface with faint concentric rings, as in the design file. */
export function BrandHeaderBackground({ tealTone = false, style }: { tealTone?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View pointerEvents="none" style={[styles.headerBg, style]}>
      <LinearGradient
        colors={tealTone ? Gradients.tealCard : Gradients.header}
        start={tealTone ? { x: 0, y: 0 } : { x: 0.5, y: 0 }}
        end={tealTone ? { x: 1, y: 1 } : { x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {[0, 1, 2].map((i) => {
        const d = 140 + i * 90;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: d,
              height: d,
              borderRadius: d / 2,
              borderWidth: 1,
              borderColor: withAlpha(Theme.white, 0.045),
              top: -40 - i * 45,
              start: -70 - i * 45,
            }}
          />
        );
      })}
    </View>
  );
}

export interface CircleIconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  badge?: boolean;
  accessibilityLabel?: string;
}

export function CircleIconButton({ icon: Icon, onPress, badge = false, accessibilityLabel }: CircleIconButtonProps) {
  return (
    <PressableScale
      scale={0.9}
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.tap();
        onPress();
      }}
      style={styles.circleButton}
    >
      <Icon size={19} color={Theme.white} strokeWidth={1.8} />
      {badge ? <View style={styles.badge} /> : null}
    </PressableScale>
  );
}

export interface HeaderAction {
  icon: LucideIcon;
  badge?: boolean;
  label: string;
  onPress: () => void;
}

/** Header row: leading action, centered logo or title, trailing action. */
export function HeaderBar({ leading, trailing, children }: { leading?: HeaderAction; trailing?: HeaderAction; children: ReactNode }) {
  return (
    <View style={styles.headerBar}>
      <View style={styles.headerCenter}>{children}</View>
      <View style={styles.headerSide}>
        {leading ? <CircleIconButton icon={leading.icon} badge={leading.badge} onPress={leading.onPress} accessibilityLabel={leading.label} /> : <View />}
        {trailing ? <CircleIconButton icon={trailing.icon} badge={trailing.badge} onPress={trailing.onPress} accessibilityLabel={trailing.label} /> : <View />}
      </View>
    </View>
  );
}

/** Small gold "ر" monogram tile used on the tracking and confirmation headers. */
export function MonogramTile({ size = 44 }: { size?: number }) {
  return (
    <LinearGradient colors={Gradients.gold} start={{ x: 1, y: 0.5 }} end={{ x: 0, y: 0.5 }} style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: 'center', justifyContent: 'center' }}>
      <AppText size={size * 0.45} weight="bold" color={Theme.navy} align="center">
        ر
      </AppText>
    </LinearGradient>
  );
}

export interface BrandScreenProps {
  overlap?: number;
  roundedHeader?: boolean;
  tealTone?: boolean;
  header: ReactNode;
  children: ReactNode;
}

/** Root-screen scaffold: navy header that bleeds under the status bar, with content cards overlapping its bottom edge. */
export function BrandScreen({ overlap = 0, roundedHeader = false, tealTone = false, header, children }: BrandScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View>
        <BrandHeaderBackground
          tealTone={tealTone}
          style={[styles.bleed, roundedHeader ? { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 } : null]}
        />
        <View style={[styles.headerContent, { paddingTop: insets.top + 6, paddingBottom: overlap + 22 }]}>{header}</View>
      </View>
      <View style={[styles.content, { marginTop: -overlap }]}>{children}</View>
    </ScrollView>
  );
}

/** Horizontal student switcher shown when the family has more than one child. */
export function StudentSwitcher({ dark = false, inset = 20 }: { dark?: boolean; inset?: number }) {
  const store = useFamily();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.switcher, { paddingHorizontal: inset }]}>
      {store.state.students.map((s) => {
        const selected = s.id === store.state.selectedStudentID;
        const fg = selected ? (dark ? Theme.navy : Theme.white) : dark ? Theme.white : Theme.ink;
        const bg = selected ? (dark ? Theme.white : Theme.navy) : dark ? withAlpha(Theme.white, 0.08) : Theme.card;
        return (
          <PressableScale
            key={s.id}
            accessibilityLabel={s.firstName}
            onPress={() => store.select(s.id)}
            style={[
              styles.chip,
              { backgroundColor: bg, borderColor: dark && !selected ? withAlpha(Theme.white, 0.12) : 'transparent' },
            ]}
          >
            <StudentAvatar student={s} size={26} />
            <AppText size="subheadline" weight="semibold" color={fg}>
              {s.firstName}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerBg: { overflow: 'hidden' },
  bleed: { position: 'absolute', top: -800, bottom: 0, start: 0, end: 0 },
  screen: { flex: 1, backgroundColor: Theme.canvas },
  headerContent: { paddingHorizontal: 20, width: '100%', maxWidth: 640, alignSelf: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha(Theme.white, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(Theme.white, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 9,
    end: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.goldLight,
    borderWidth: 1.5,
    borderColor: Theme.navy,
  },
  headerBar: { minHeight: 48, justifyContent: 'center' },
  headerCenter: { position: 'absolute', start: 0, end: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  headerSide: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switcher: { gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingStart: 4,
    paddingEnd: 14,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
});
