import { CircleCheck, Info } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Rakaz } from '@/constants/theme';
import type { DriverToast } from '@/store/driverStore';

import { AppText } from './AppText';

/** Navy pill toast that slides in from the top for each recorded action. */
export function Toast({ toast }: { toast: DriverToast | null }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<DriverToast | null>(toast);

  useEffect(() => {
    if (toast) {
      setShown(toast);
      Animated.spring(anim, { toValue: 1, damping: 18, stiffness: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setShown(null);
      });
    }
  }, [toast, anim]);

  if (!shown) return null;
  const success = shown.kind === 'SUCCESS';
  const Icon = success ? CircleCheck : Info;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        {
          top: insets.top + 8,
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-80, 0] }) }],
        },
      ]}
    >
      <Icon color={success ? Rakaz.Gold : Rakaz.Orange} size={18} />
      <AppText variant="labelMedium" color={Rakaz.White}>
        {shown.message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Rakaz.Navy,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
    zIndex: 100,
  },
});
