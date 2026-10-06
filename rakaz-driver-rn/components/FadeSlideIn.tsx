import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

/** Fades and slides its content in on mount; re-key it to replay (mirrors AnimatedContent). */
export function FadeSlideIn({ children, style, offset = 24 }: { children: ReactNode; style?: StyleProp<ViewStyle>; offset?: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(progress, { toValue: 1, damping: 20, stiffness: 160, useNativeDriver: true }).start();
  }, [progress]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-offset, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
