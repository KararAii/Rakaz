import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';

import { Fonts, Rakaz, withAlpha } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import type { Coordinate } from '@/types/models';
import { ArabicFormat } from '@/utils/arabicFormat';

import { type RouteMapProps, buildRouteMapModel } from './routeMapModel';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Web fallback (react-native-maps has no web support): the stylised offline map from the Android app —
 * muted streets, the Shatt al-Arab, a gold route, numbered stops, the school and a pulsing bus marker.
 */
export default function RouteMap({ focus = null, zoom = 1, style }: RouteMapProps) {
  const { state, derived } = useDriverStore();
  const model = useMemo(() => buildRouteMapModel(state, derived), [state, derived]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const { w, h } = size;
  const pad = 36;
  const { minLat, maxLat, minLng, maxLng } = model.bounds;
  const lngScale = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const spanX = Math.max((maxLng - minLng) * lngScale, 0.004);
  const spanY = Math.max(maxLat - minLat, 0.004);
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY) * zoom;
  const center = focus ?? { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 };

  // Map is drawn north-up regardless of RTL layout.
  const project = (c: Coordinate) => ({
    x: w / 2 + (c.longitude - center.longitude) * lngScale * scale,
    y: h / 2 - (c.latitude - center.latitude) * scale,
  });

  const route = model.path.map(project);
  const routeD = route.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  const streets: { x1: number; y1: number; x2: number; y2: number; width: number }[] = [];
  const step = 32;
  for (let x = -h; x < w + h; x += step * 1.6) streets.push({ x1: x, y1: 0, x2: x + h * 0.35, y2: h, width: 3.5 });
  for (let y = 9; y < h; y += step) {
    streets.push({ x1: 0, y1: y, x2: w, y2: y - w * 0.12, width: Math.round(y / step) % 3 === 0 ? 6 : 3 });
  }

  const bus = project(model.bus);
  const school = model.school ? project(model.school) : null;

  return (
    <View style={[styles.container, style]} onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {w > 0 && h > 0 ? (
        <Svg width={w} height={h}>
          <Path
            d={`M${w * 0.86},-20 C${w * 0.7},${h * 0.3} ${w * 1.02},${h * 0.6} ${w * 0.82},${h + 20}`}
            stroke="#BFD7DF"
            strokeWidth={23}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={`M${w * 0.86},-20 C${w * 0.7},${h * 0.3} ${w * 1.02},${h * 0.6} ${w * 0.82},${h + 20}`}
            stroke="#CFE2E8"
            strokeWidth={15}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={w * 0.18} cy={h * 0.78} r={Math.min(w, h) * 0.12} fill="#D5E5D2" />
          <Circle cx={w * 0.62} cy={h * 0.16} r={Math.min(w, h) * 0.08} fill="#D5E5D2" />
          {streets.map((s, i) => (
            <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={Rakaz.White} strokeWidth={s.width} />
          ))}

          {route.length > 1 ? (
            <G>
              <Path d={routeD} stroke={withAlpha(Rakaz.Navy, 0.18)} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={routeD} stroke={Rakaz.Gold} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={routeD} stroke={withAlpha(Rakaz.White, 0.7)} strokeWidth={1.5} strokeDasharray="7 13" strokeLinecap="round" fill="none" />
            </G>
          ) : null}

          {school ? (
            <G>
              <Rect x={school.x - 16} y={school.y - 16} width={32} height={32} rx={10} fill={Rakaz.Navy} stroke={Rakaz.White} strokeWidth={2} />
              <Polygon points={`${school.x - 8},${school.y - 2} ${school.x},${school.y - 9} ${school.x + 8},${school.y - 2}`} fill={Rakaz.White} />
              <Rect x={school.x - 7} y={school.y - 1} width={3} height={8} fill={Rakaz.White} />
              <Rect x={school.x - 1.5} y={school.y - 1} width={3} height={8} fill={Rakaz.White} />
              <Rect x={school.x + 4} y={school.y - 1} width={3} height={8} fill={Rakaz.White} />
              <Rect x={school.x - 9} y={school.y + 7} width={18} height={2} fill={Rakaz.White} />
            </G>
          ) : null}

          {model.pins.map((pin) => {
            const p = project(pin.coordinate);
            const r = pin.size / 2;
            return (
              <G key={pin.key}>
                <Circle cx={p.x} cy={p.y} r={r} fill={pin.fill} stroke={pin.border} strokeWidth={2} />
                <SvgText x={p.x} y={p.y + 4} fontSize={12} fontFamily={Fonts.bold} fill={pin.foreground} textAnchor="middle">
                  {ArabicFormat.number(pin.index + 1)}
                </SvgText>
              </G>
            );
          })}

          <AnimatedCircle
            cx={bus.x}
            cy={bus.y}
            r={pulse.interpolate({ inputRange: [0, 1], outputRange: [17, 35] })}
            fill={withAlpha(Rakaz.Gold, 0.35)}
            opacity={pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })}
          />
          <Circle cx={bus.x} cy={bus.y} r={17} fill={Rakaz.Gold} stroke={Rakaz.Navy} strokeWidth={3} />
          <G transform={`rotate(${model.heading} ${bus.x} ${bus.y})`}>
            <Polygon points={`${bus.x},${bus.y - 8} ${bus.x + 6},${bus.y + 7} ${bus.x},${bus.y + 3} ${bus.x - 6},${bus.y + 7}`} fill={Rakaz.White} />
          </G>
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Rakaz.MapLand, overflow: 'hidden' },
});
