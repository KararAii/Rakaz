import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

// Importing expo-notifications inside Expo Go on Android throws (push support was removed in SDK 53),
// so the module is only loaded where it works; the in-app banner still covers every event.
const isAndroidExpoGo =
  Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: NotificationsModule | null = null;
if ((Platform.OS === 'ios' || Platform.OS === 'android') && !isAndroidExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsModule;
  } catch (error) {
    console.log('[Notifications] module unavailable:', error);
  }
}

// The in-app banner covers foreground delivery, so the system alert only shows in the background.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Bridges trip events to the system notification center.
 * In production these arrive as remote push notifications from the Rakaz backend.
 */
export const NotificationService = {
  async requestAuthorization(): Promise<boolean> {
    if (!Notifications) return false;
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
    if (!Notifications) return;
    Notifications.scheduleNotificationAsync({ content: { title, body, sound: 'default' }, trigger: null }).catch((error: unknown) => {
      console.log('[Notifications] post failed:', error);
    });
  },
};
