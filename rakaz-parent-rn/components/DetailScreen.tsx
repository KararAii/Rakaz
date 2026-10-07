import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Theme } from '@/constants/theme';

export interface DetailScreenProps {
  title: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  inSheet?: boolean;
  gap?: number;
  children: ReactNode;
}

/** Pushed detail page: inline title bar over a centered, width-capped scroll column (`.frame(maxWidth: 640)`). */
export function DetailScreen({ title, trailing, leading, inSheet = false, gap = 16, children }: DetailScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <ScreenHeader title={title} trailing={trailing} leading={leading} inSheet={inSheet} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { gap, paddingBottom: 16 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {children}
      </ScrollView>
    </View>
  );
}

/** `ContentUnavailableView` equivalent. */
export function EmptyState({ icon: Icon, title, message }: { icon: LucideIcon; title: string; message?: string }) {
  return (
    <View style={styles.empty}>
      <Icon size={44} color={Theme.muted} strokeWidth={1.6} />
      <AppText size="title3" weight="bold" align="center">
        {title}
      </AppText>
      {message != null ? (
        <AppText size="subheadline" color={Theme.muted} align="center">
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.canvas },
  content: { padding: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 60, paddingHorizontal: 24 },
});
