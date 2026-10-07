import type { LucideIcon } from 'lucide-react-native';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Theme, withAlpha } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

export interface SheetAction {
  label: string;
  icon?: LucideIcon;
  destructive?: boolean;
  onPress: () => void;
}

export interface ActionSheetProps {
  visible: boolean;
  title?: string;
  message?: string;
  actions: SheetAction[];
  onClose: () => void;
}

/** Cross-platform replacement for SwiftUI `Menu` / `confirmationDialog` (RN `Alert` has no web support). */
export function ActionSheet({ visible, title, message, actions, onClose }: ActionSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="إغلاق">
        <View style={[styles.container, { paddingBottom: insets.bottom + 10 }]}>
          <Pressable style={styles.group}>
            {title != null || message != null ? (
              <View style={styles.head}>
                {title != null ? (
                  <AppText size="footnote" weight="semibold" color={Theme.muted} align="center">
                    {title}
                  </AppText>
                ) : null}
                {message != null ? (
                  <AppText size="caption" color={Theme.muted} align="center">
                    {message}
                  </AppText>
                ) : null}
              </View>
            ) : null}
            {actions.map((a, i) => {
              const Icon = a.icon;
              const tint = a.destructive ? Theme.red : Theme.ink;
              return (
                <PressableScale
                  key={a.label}
                  scale={0.99}
                  accessibilityLabel={a.label}
                  onPress={() => {
                    Haptics.tap();
                    onClose();
                    a.onPress();
                  }}
                  style={[styles.item, i > 0 || title != null || message != null ? styles.itemBorder : null]}
                >
                  {Icon ? <Icon size={18} color={tint} /> : null}
                  <AppText size="body" weight="semibold" color={tint}>
                    {a.label}
                  </AppText>
                </PressableScale>
              );
            })}
          </Pressable>
          <PressableScale scale={0.99} accessibilityLabel="إلغاء" onPress={onClose} style={[styles.group, styles.item]}>
            <AppText size="body" weight="bold" color={Theme.gold}>
              إلغاء
            </AppText>
          </PressableScale>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: withAlpha(Theme.black, 0.35), justifyContent: 'flex-end' },
  container: { paddingHorizontal: 10, gap: 8, width: '100%', maxWidth: 560, alignSelf: 'center' },
  group: { backgroundColor: Theme.card, borderRadius: 16, overflow: 'hidden' },
  head: { paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  item: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16 },
  itemBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.line },
});
