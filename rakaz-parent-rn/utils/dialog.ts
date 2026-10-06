import { Alert, Platform } from 'react-native';

/** Informational alert with a single "حسناً" button; RN `Alert` is a no-op on web, so fall back to `window.alert`. */
export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message, [{ text: 'حسناً', style: 'cancel' }]);
}
