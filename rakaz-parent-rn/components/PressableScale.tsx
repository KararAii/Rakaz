import { type ReactNode, useRef } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Pressed scale (SwiftUI `PressableStyle(scale:)`). */
  scale?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  hitSlop?: number;
  onLongPress?: () => void;
  accessibilityState?: { selected?: boolean };
}

/** Springy press feedback used across tappable cards and buttons. */
export function PressableScale({
  onPress,
  onLongPress,
  children,
  style,
  scale = 0.97,
  disabled = false,
  accessibilityLabel,
  accessibilityState,
  hitSlop,
}: PressableScaleProps) {
  const value = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const animate = (pressed: boolean) => {
    Animated.parallel([
      Animated.spring(value, { toValue: pressed ? scale : 1, stiffness: 420, damping: 26, mass: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: pressed ? 0.9 : 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...accessibilityState, disabled }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPressIn={() => animate(true)}
      onPressOut={() => animate(false)}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[style, { opacity, transform: [{ scale: value }] }]}
    >
      {children}
    </AnimatedPressable>
  );
}
