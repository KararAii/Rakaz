import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Gradients, Theme, withAlpha } from '@/constants/theme';
import { NotificationKindIcon } from '@/constants/visuals';
import { type AppNotification, NotificationKindTitle } from '@/types/models';
import { Haptics } from '@/utils/haptics';

export interface NotificationBannerProps {
  notification: AppNotification;
  onPress: () => void;
}

/** In-app banner that slides from the top for each pushed notification. */
export function NotificationBanner({ notification, onPress }: NotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const enter = useRef(new Animated.Value(0)).current;
  const Icon = NotificationKindIcon[notification.kind];

  useEffect(() => {
    Haptics.tap();
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, damping: 16, stiffness: 160, useNativeDriver: true }).start();
  }, [notification.id, enter]);

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 6 }]}>
      <Animated.View
        style={{
          width: '100%',
          maxWidth: 560,
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
        }}
      >
        <PressableScale onPress={onPress} accessibilityLabel={NotificationKindTitle[notification.kind]} style={styles.banner}>
          <LinearGradient colors={Gradients.gold} start={{ x: 1, y: 0.5 }} end={{ x: 0, y: 0.5 }} style={styles.icon}>
            <Icon size={17} color={Theme.navy} strokeWidth={2.2} />
          </LinearGradient>
          <View style={styles.text}>
            <AppText size="subheadline" weight="bold" color={Theme.white}>
              {NotificationKindTitle[notification.kind]}
            </AppText>
            <AppText size="caption" color={withAlpha(Theme.white, 0.72)} numberOfLines={2}>
              {notification.body}
            </AppText>
          </View>
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', start: 14, end: 14, alignItems: 'center' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 22,
    backgroundColor: withAlpha(Theme.navy, 0.97),
    borderWidth: 1,
    borderColor: withAlpha(Theme.gold, 0.3),
    boxShadow: '0px 10px 20px rgba(0,0,0,0.25)',
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 1 },
});
