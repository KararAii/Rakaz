import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rakaz, withAlpha } from '@/constants/theme';

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: ReactNode;
  /** Rendered full-screen above the sheet (e.g. a confirmation dialog). */
  overlay?: ReactNode;
}

/** Modal bottom sheet with drag handle, scrim and safe-area padding (mirrors RakazSheet). */
export function BottomSheet({ visible, onDismiss, children, overlay }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const translate = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      translate.setValue(height);
      Animated.spring(translate, { toValue: 0, damping: 22, stiffness: 180, useNativeDriver: true }).start();
    }
  }, [visible, height, translate]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onDismiss}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.scrim} onPress={onDismiss} accessibilityLabel="إغلاق" />
        <Animated.View
          style={[styles.sheet, { maxHeight: height * 0.92, paddingBottom: insets.bottom + 8, transform: [{ translateY: translate }] }]}
        >
          <View style={styles.handle} />
          <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </Animated.View>
        {overlay}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, backgroundColor: withAlpha(Rakaz.NavyDeep, 0.45) },
  sheet: {
    backgroundColor: Rakaz.White,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  handle: { alignSelf: 'center', marginTop: 10, width: 40, height: 5, borderRadius: 3, backgroundColor: Rakaz.Line },
  content: { padding: 20, gap: 14 },
});
