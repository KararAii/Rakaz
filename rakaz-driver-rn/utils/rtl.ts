import { I18nManager, Platform } from 'react-native';

// Arabic-only app. Native builds are also forced RTL through the expo-localization plugin,
// so the very first launch is already right-to-left.
if (Platform.OS === 'web') {
  if (typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }
} else {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}
