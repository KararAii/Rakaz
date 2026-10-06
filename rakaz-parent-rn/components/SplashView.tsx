import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { BrandHeaderBackground } from '@/components/Brand';
import { rakazLogo } from '@/components/Primitives';
import { Gradients, Theme, withAlpha } from '@/constants/theme';

export interface SplashViewProps {
  /** Called when the splash hands over to login / main (after ~2.3 s). */
  onFinish: () => void;
  /** Called once the fade-out finished and the overlay can unmount. */
  onGone: () => void;
}

/** Animated brand splash: logo pop, title fade, gold progress and a moving dashed road. */
export function SplashView({ onFinish, onGone }: SplashViewProps) {
  const { width: w, height: h } = useWindowDimensions();
  const logo = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [dashPhase, setDashPhase] = useState(0);
  const callbacks = useRef({ onFinish, onGone });
  callbacks.current = { onFinish, onGone };

  useEffect(() => {
    Animated.spring(logo, { toValue: 1, damping: 9, stiffness: 80, useNativeDriver: true }).start();
    Animated.timing(title, { toValue: 1, duration: 600, delay: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    Animated.timing(progress, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.ease), useNativeDriver: false }).start();

    let frame = 0;
    const startedAt = Date.now();
    const loop = () => {
      setDashPhase((((Date.now() - startedAt) % 3000) / 3000) * -52);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    const finish = setTimeout(() => {
      callbacks.current.onFinish();
      Animated.timing(fade, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => callbacks.current.onGone());
    }, 2300);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(finish);
    };
  }, [logo, title, progress, fade]);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
      <BrandHeaderBackground style={StyleSheet.absoluteFill} />
      <Svg width={w} height={h} style={[StyleSheet.absoluteFill, { opacity: 0.5 }]} pointerEvents="none">
        <Path d={`M -40 ${h * 0.86} Q ${w * 0.5} ${h * 0.6} ${w + 40} ${h * 0.7}`} stroke={withAlpha(Theme.white, 0.18)} strokeWidth={2} fill="none" />
        <Path
          d={`M -40 ${h * 0.9} Q ${w * 0.5} ${h * 0.66} ${w + 40} ${h * 0.76}`}
          stroke={withAlpha(Theme.gold, 0.6)}
          strokeWidth={2}
          strokeDasharray="14 12"
          strokeDashoffset={dashPhase}
          fill="none"
        />
      </Svg>

      <View style={styles.column}>
        <View style={styles.spacer} />
        <Animated.View style={[styles.logoBox, { opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }]}>
          <Image source={rakazLogo} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View
          style={[styles.titles, { opacity: title, transform: [{ translateY: title.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}
        >
          <AppText size={40} weight="bold" color={Theme.white} align="center">
            ركاز
          </AppText>
          <AppText size="headline" weight="medium" color={Theme.goldLight} align="center">
            نظام النقل المدرسي الذكي
          </AppText>
          <AppText size="footnote" color={withAlpha(Theme.white, 0.6)} align="center">
            تطبيق الطالب وولي الأمر
          </AppText>
        </Animated.View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <View style={styles.track}>
            <Animated.View
              style={[styles.fill, { width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 140] }) }]}
            >
              <LinearGradient colors={Gradients.gold} start={{ x: 1, y: 0.5 }} end={{ x: 0, y: 0.5 }} style={StyleSheet.absoluteFill} />
            </Animated.View>
          </View>
          <AppText size="caption" color={withAlpha(Theme.white, 0.5)} align="center">
            رحلة آمنة كل يوم
          </AppText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  column: { flex: 1, alignItems: 'center', paddingHorizontal: 24, gap: 28 },
  spacer: { flex: 1 },
  logoBox: {
    padding: 22,
    backgroundColor: Theme.white,
    borderRadius: 30,
    boxShadow: '0px 16px 30px rgba(0,0,0,0.35)',
  },
  logo: { width: 200, height: 200 * (827 / 1237) },
  titles: { alignItems: 'center', gap: 8 },
  footer: { alignItems: 'center', gap: 10, paddingBottom: 30 },
  track: { width: 140, height: 4, borderRadius: 2, backgroundColor: withAlpha(Theme.white, 0.12), overflow: 'hidden', alignItems: 'flex-start' },
  fill: { height: 4, borderRadius: 2, overflow: 'hidden' },
});
