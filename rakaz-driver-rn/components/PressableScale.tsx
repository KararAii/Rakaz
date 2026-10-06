import { type ReactNode, useRef } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { tapHaptic } from '@/utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps {
  onPress: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  haptic?: boolean;
  accessibilityLabel?: string;
}

/** Pressable with a springy press-scale and haptic tick (mirrors Modifier.pressable). */
export function PressableScale({ onPress, children, style, disabled = false, haptic = true, accessibilityLabel }: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, stiffness: 600, damping: 30, mass: 1, useNativeDriver: true }).start();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPressIn={() => animate(0.96)}
      onPressOut={() => animate(1)}
      onPress={() => {
        if (haptic) tapHaptic();
        onPress();
      }}
      style={[style, { transform: [{ scale }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
