import { LinearGradient } from 'expo-linear-gradient';
import { Phone, TriangleAlert } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz, withAlpha } from '@/constants/theme';

function Ring({ delay }: { delay: number }) {
  const p = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(p, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [p, delay]);
  return (
    <Animated.View
      style={[
        styles.ring,
        {
          opacity: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
        },
      ]}
    />
  );
}

export interface EmergencyActiveScreenProps {
  visible: boolean;
  isOnline: boolean;
  adminPhone: string | null;
  onCall: (phone: string) => void;
  onResolve: () => void;
}

/** Full-screen red takeover shown while an emergency is active. */
export function EmergencyActiveScreen({ visible, isOnline, adminPhone, onCall, onResolve }: EmergencyActiveScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => undefined}>
      <LinearGradient colors={[Rakaz.EmergencyTop, Rakaz.EmergencyBottom]} style={styles.root}>
        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.spacer} />
          <View style={styles.sos}>
            {[0, 600, 1200].map((d) => (
              <Ring key={d} delay={d} />
            ))}
            <View style={styles.sosCore}>
              <TriangleAlert color={Rakaz.EmergencyTop} size={60} />
            </View>
          </View>
          <View style={styles.texts}>
            <AppText variant="headlineMedium" color={Rakaz.White} style={styles.center}>
              تم إرسال بلاغ الطوارئ
            </AppText>
            <AppText variant="titleMedium" color={withAlpha(Rakaz.White, 0.85)} style={styles.center}>
              {isOnline ? 'الإدارة تتابع موقعك الآن' : 'سيُرسل البلاغ فور عودة الاتصال'}
            </AppText>
          </View>
          <View style={styles.spacer} />
          {adminPhone ? (
            <PressableScale onPress={() => onCall(adminPhone)} accessibilityLabel="اتصال بالإدارة" style={styles.call}>
              <Phone color={Rakaz.EmergencyTop} size={22} />
              <AppText variant="labelLarge" color={Rakaz.EmergencyTop}>
                اتصال بالإدارة
              </AppText>
            </PressableScale>
          ) : null}
          <PressableScale onPress={onResolve} accessibilityLabel="تم حل الحالة" style={styles.resolve}>
            <AppText variant="labelLarge" color={Rakaz.White}>
              تم حل الحالة
            </AppText>
          </PressableScale>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, alignItems: 'center', gap: 12 },
  spacer: { flex: 1 },
  center: { textAlign: 'center' },
  sos: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  ring: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: withAlpha(Rakaz.White, 0.4),
  },
  sosCore: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Rakaz.White,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { gap: 4, alignItems: 'center' },
  call: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 18,
    backgroundColor: Rakaz.White,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  resolve: {
    alignSelf: 'stretch',
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: withAlpha(Rakaz.White, 0.6),
    alignItems: 'center',
    justifyContent: 'center',
  },
});
