import { useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Line, Path, Rect } from 'react-native-svg';

import type { MapRegion, RakazMapProps } from '@/components/map/mapTypes';
import type { Coordinate } from '@/types/models';

const LAND = '#ECEFEA';
const STREET = '#FFFFFF';
const WATER = '#C9DCE3';
const GRID = 0.0018;

/**
 * Web fallback (react-native-maps has no web support): a stylised, pannable street grid drawn in SVG with the
 * same markers and route lines as the native map.
 */
export default function RakazMap({ region, markers = [], lines = [], interactive = false, onPanStart, onRegionChangeComplete, style }: RakazMapProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [camera, setCamera] = useState<MapRegion>(region);
  const cameraRef = useRef(camera);
  const frame = useRef<number | null>(null);
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

  const apply = (next: MapRegion) => {
    cameraRef.current = next;
    setCamera(next);
  };

  useEffect(() => {
    const from = cameraRef.current;
    const to: MapRegion = { latitude, longitude, latitudeDelta, longitudeDelta };
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 700);
      const e = 1 - Math.pow(1 - t, 3);
      apply({
        latitude: from.latitude + (to.latitude - from.latitude) * e,
        longitude: from.longitude + (to.longitude - from.longitude) * e,
        latitudeDelta: from.latitudeDelta + (to.latitudeDelta - from.latitudeDelta) * e,
        longitudeDelta: from.longitudeDelta + (to.longitudeDelta - from.longitudeDelta) * e,
      });
      frame.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    if (frame.current != null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [latitude, longitude, latitudeDelta, longitudeDelta]);

  const { w, h } = size;
  const scale = h > 0 ? h / camera.latitudeDelta : 1;
  const lngScale = Math.cos((camera.latitude * Math.PI) / 180);

  const callbacks = useRef({ onPanStart, onRegionChangeComplete, scale, lngScale, interactive });
  callbacks.current = { onPanStart, onRegionChangeComplete, scale, lngScale, interactive };

  const responder = useMemo(() => {
    let origin: MapRegion = cameraRef.current;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => callbacks.current.interactive,
      onMoveShouldSetPanResponder: (_, g) => callbacks.current.interactive && Math.abs(g.dx) + Math.abs(g.dy) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (frame.current != null) cancelAnimationFrame(frame.current);
        origin = cameraRef.current;
        callbacks.current.onPanStart?.();
      },
      onPanResponderMove: (_, g) => {
        const { scale: s, lngScale: ls } = callbacks.current;
        apply({ ...origin, latitude: origin.latitude + g.dy / s, longitude: origin.longitude - g.dx / (s * ls) });
      },
      onPanResponderRelease: () => callbacks.current.onRegionChangeComplete?.(cameraRef.current),
      onPanResponderTerminate: () => callbacks.current.onRegionChangeComplete?.(cameraRef.current),
    });
  }, []);

  const project = (c: Coordinate) => ({
    x: w / 2 + (c.longitude - camera.longitude) * lngScale * scale,
    y: h / 2 - (c.latitude - camera.latitude) * scale,
  });

  const streets = useMemo(() => {
    if (w === 0 || h === 0) return [];
    const result: { key: string; x1: number; y1: number; x2: number; y2: number; width: number }[] = [];
    const halfLat = (h / scale) / 2;
    const halfLng = (w / (scale * lngScale)) / 2;
    const lat0 = Math.floor((camera.latitude - halfLat) / GRID);
    const lat1 = Math.ceil((camera.latitude + halfLat) / GRID);
    const lng0 = Math.floor((camera.longitude - halfLng) / GRID);
    const lng1 = Math.ceil((camera.longitude + halfLng) / GRID);
    if (lat1 - lat0 > 200 || lng1 - lng0 > 200) return result;
    for (let i = lat0; i <= lat1; i += 1) {
      const y = h / 2 - (i * GRID - camera.latitude) * scale;
      result.push({ key: `a${i}`, x1: 0, y1: y, x2: w, y2: y - w * 0.08, width: i % 4 === 0 ? 7 : 3 });
    }
    for (let j = lng0; j <= lng1; j += 1) {
      const x = w / 2 + (j * GRID - camera.longitude) * lngScale * scale;
      result.push({ key: `o${j}`, x1: x, y1: 0, x2: x + h * 0.12, y2: h, width: j % 5 === 0 ? 7 : 3 });
    }
    return result;
  }, [w, h, scale, lngScale, camera.latitude, camera.longitude]);

  const river = (() => {
    if (w === 0) return null;
    const a = project({ latitude: 30.535, longitude: 47.79 });
    const b = project({ latitude: 30.5, longitude: 47.835 });
    const c = project({ latitude: 30.46, longitude: 47.87 });
    return `M${a.x},${a.y} Q${b.x},${b.y} ${c.x},${c.y}`;
  })();

  return (
    <View
      style={[styles.container, style]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      {...responder.panHandlers}
    >
      {w > 0 && h > 0 ? (
        <>
          <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={w} height={h} fill={LAND} />
            {river ? <Path d={river} stroke={WATER} strokeWidth={Math.max(18, scale * 0.004)} fill="none" strokeLinecap="round" /> : null}
            {streets.map((s) => (
              <Line key={s.key} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={STREET} strokeWidth={s.width} />
            ))}
            {lines.map((l) => {
              const d = l.coordinates
                .map(project)
                .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`)
                .join(' ');
              return (
                <Path
                  key={l.id}
                  d={d}
                  stroke={l.color}
                  strokeWidth={l.width}
                  strokeDasharray={l.dash?.join(' ')}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              );
            })}
          </Svg>
          {markers.map((m) => {
            const p = project(m.coordinate);
            return (
              <View key={m.id} pointerEvents="none" style={[styles.marker, { left: p.x, top: p.y }]}>
                <View style={{ transform: [{ translateX: '-50%' }, { translateY: m.anchor === 'bottom' ? '-100%' : '-50%' }] }}>{m.view}</View>
              </View>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: LAND },
  marker: { position: 'absolute' },
});
