import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type FeedbackKind = 'SUCCESS' | 'WARNING' | 'ERROR';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tick for taps (mirrors the Android press haptic). */
export function tapHaptic(): void {
  if (!supported) return;
  Haptics.selectionAsync().catch(() => undefined);
}

/** Outcome haptic fired with every recorded driver action. */
export function notifyHaptic(kind: FeedbackKind): void {
  if (!supported) return;
  const type =
    kind === 'SUCCESS'
      ? Haptics.NotificationFeedbackType.Success
      : kind === 'WARNING'
        ? Haptics.NotificationFeedbackType.Warning
        : Haptics.NotificationFeedbackType.Error;
  Haptics.notificationAsync(type).catch(() => undefined);
}
