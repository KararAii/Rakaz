import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

// The in-app banner covers foreground delivery, so the system alert only shows in the background.
if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Bridges trip events to the system notification center.
 * In production these arrive as remote push notifications from the Rakaz backend.
 */
export const NotificationService = {
  async requestAuthorization(): Promise<boolean> {
    if (!supported) return false;
    try {
      const current = await Notifications.getPermissionsAsync();
      if (current.granted) return true;
      const asked = await Notifications.requestPermissionsAsync();
      return asked.granted;
    } catch (error) {
      console.log('[Notifications] authorization failed:', error);
      return false;
    }
  },

  post(title: string, body: string): void {
    if (!supported) return;
    Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'default' }, trigger: null }).catch((error: unknown) => {
      console.log('[Notifications] post failed:', error);
    });
  },
};
