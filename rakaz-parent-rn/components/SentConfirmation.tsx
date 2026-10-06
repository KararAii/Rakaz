import { CircleCheck } from 'lucide-react-native';
import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet } from 'react-native';

import { AppText } from '@/components/AppText';
import { PrimaryButton } from '@/components/Buttons';
import { Theme } from '@/constants/theme';

/** Success state shown in place of a submitted form (checkmark bounce + message + "تم"). */
export function SentConfirmation({ title, message, onDone, children }: { title: string; message: string; onDone: () => void; children?: ReactNode }) {
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(appear, { toValue: 1, speed: 14, bounciness: 12, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [appear]);
  return (
    <Animated.View style={[styles.root, { opacity: appear, transform: [{ scale: appear.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }]}>
      <CircleCheck size={66} color={Theme.white} fill={Theme.green} strokeWidth={1.8} />
      <AppText size="title2" weight="bold" align="center">
        {title}
      </AppText>
      <AppText size="subheadline" color={Theme.muted} align="center">
        {message}
      </AppText>
      {children}
      <PrimaryButton title="تم" onPress={onDone} style={styles.done} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 14, padding: 24, paddingTop: 54 },
  done: { marginTop: 10 },
});
