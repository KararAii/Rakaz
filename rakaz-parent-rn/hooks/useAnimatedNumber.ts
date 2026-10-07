import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

/** Animated.Value that follows `target` linearly (SwiftUI `.animation(.linear(duration: 0.95), value:)`). */
export function useAnimatedNumber(target: number, duration: number = 950): Animated.Value {
  const value = useRef(new Animated.Value(target)).current;
  useEffect(() => {
    const anim = Animated.timing(value, { toValue: target, duration, easing: Easing.linear, useNativeDriver: false });
    anim.start();
    return () => anim.stop();
  }, [target, duration, value]);
  return value;
}

/** Repeating 0 → 1 → 0 pulse while `active` (phase animators / repeatForever(autoreverses: true)). */
export function usePulse(active: boolean, duration: number = 900, autoreverse: boolean = true): Animated.Value {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      value.setValue(0);
      return;
    }
    const half = Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true });
    const loop = autoreverse
      ? Animated.loop(Animated.sequence([half, Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true })]))
      : Animated.loop(Animated.timing(value, { toValue: 1, duration, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => {
      loop.stop();
      value.setValue(0);
    };
  }, [active, duration, autoreverse, value]);
  return value;
}
