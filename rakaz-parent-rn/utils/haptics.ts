import * as ExpoHaptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

function run(task: () => Promise<void>): void {
  if (!supported) return;
  task().catch(() => undefined);
}

/** Mirrors the Swift `Haptics` helper (UIKit feedback generators). */
export const Haptics = {
  tap(): void {
    run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light));
  },
  soft(): void {
    run(() => ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Soft));
  },
  selection(): void {
    run(() => ExpoHaptics.selectionAsync());
  },
  success(): void {
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success));
  },
  error(): void {
    run(() => ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error));
  },
};
