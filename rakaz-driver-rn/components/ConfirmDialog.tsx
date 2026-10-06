import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Rakaz, withAlpha } from '@/constants/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmTitle: string;
  cancelTitle?: string;
  onConfirm: () => void;
  onDismiss: () => void;
  /** Render in place (inside another Modal) instead of opening a new one. */
  inline?: boolean;
}

/** Alert dialog with destructive confirm action (mirrors the Material AlertDialog usages). */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmTitle,
  cancelTitle = 'إلغاء',
  onConfirm,
  onDismiss,
  inline = false,
}: ConfirmDialogProps) {
  if (!visible) return null;
  const body = (
    <View style={styles.root}>
      <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel="إغلاق" />
      <View style={styles.dialog}>
        <AppText variant="titleLarge">{title}</AppText>
        <AppText variant="bodyMedium" color={Rakaz.InkSecondary}>
          {message}
        </AppText>
        <View style={styles.actions}>
          <PressableScale onPress={onDismiss} style={styles.action} accessibilityLabel={cancelTitle}>
            <AppText variant="labelLarge">{cancelTitle}</AppText>
          </PressableScale>
          <PressableScale onPress={onConfirm} style={styles.action} accessibilityLabel={confirmTitle}>
            <AppText variant="labelLarge" color={Rakaz.Red}>
              {confirmTitle}
            </AppText>
          </PressableScale>
        </View>
      </View>
    </View>
  );
  if (inline) return <View style={StyleSheet.absoluteFill}>{body}</View>;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      {body}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  scrim: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: withAlpha(Rakaz.NavyDeep, 0.45) },
  dialog: { alignSelf: 'stretch', backgroundColor: Rakaz.White, borderRadius: 28, padding: 24, gap: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  action: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
});
