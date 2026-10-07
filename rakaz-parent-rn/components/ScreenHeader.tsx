import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Theme } from '@/constants/theme';

export interface ScreenHeaderProps {
  title: string;
  /** Leading control; defaults to a back chevron. */
  leading?: ReactNode;
  trailing?: ReactNode;
  /** iOS page sheets are presented below the status bar, so they skip the top inset. */
  inSheet?: boolean;
}

/** Inline navigation bar for pushed detail screens (SwiftUI `.navigationBarTitleDisplayMode(.inline)`). */
export function ScreenHeader({ title, leading, trailing, inSheet = false }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: inSheet && Platform.OS === 'ios' ? 10 : insets.top + 4 }]}>
      <View style={styles.side}>
        {leading ?? (
          <PressableScale accessibilityLabel="رجوع" onPress={() => router.back()} style={styles.back} hitSlop={8}>
            <ChevronRight size={26} color={Theme.gold} strokeWidth={2.4} />
          </PressableScale>
        )}
      </View>
      <AppText size="headline" weight="bold" align="center" numberOfLines={1} style={styles.title}>
        {title}
      </AppText>
      <View style={[styles.side, styles.end]}>{trailing}</View>
    </View>
  );
}

export function HeaderTextButton({ title, onPress, bold = false }: { title: string; onPress: () => void; bold?: boolean }) {
  return (
    <PressableScale accessibilityLabel={title} onPress={onPress} style={styles.textButton} hitSlop={8}>
      <AppText size="body" weight={bold ? 'bold' : 'semibold'} color={Theme.gold}>
        {title}
      </AppText>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: Theme.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.line,
  },
  side: { width: 92, flexDirection: 'row', alignItems: 'center' },
  end: { justifyContent: 'flex-end' },
  title: { flex: 1 },
  back: { width: 40, height: 40, justifyContent: 'center' },
  textButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 4 },
});
