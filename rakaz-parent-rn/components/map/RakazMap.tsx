import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { type MapStyleElement, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import type { RakazMapProps } from '@/components/map/mapTypes';

/** Google equivalent of MapKit's muted standard style without points of interest (ignored by Apple Maps). */
const mutedStyle: MapStyleElement[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'geometry', stylers: [{ saturation: -60 }] },
];

export default function RakazMap({ region, markers = [], lines = [], interactive = false, onPanStart, onRegionChangeComplete, style }: RakazMapProps) {
  const mapRef = useRef<MapView>(null);
  const initialRegion = useRef(region).current;
  const { latitude, longitude, latitudeDelta, longitudeDelta } = region;

  useEffect(() => {
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta, longitudeDelta }, 900);
  }, [latitude, longitude, latitudeDelta, longitudeDelta]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={mutedStyle}
        showsPointsOfInterests={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={onPanStart}
        onRegionChangeComplete={(r) => onRegionChangeComplete?.(r)}
      >
        {lines.map((l) => (
          <Polyline key={l.id} coordinates={l.coordinates} strokeColor={l.color} strokeWidth={l.width} lineDashPattern={l.dash} lineCap="round" lineJoin="round" />
        ))}
        {markers.map((m) => (
          <Marker
            key={m.id}
            coordinate={m.coordinate}
            anchor={m.anchor === 'bottom' ? { x: 0.5, y: 1 } : { x: 0.5, y: 0.5 }}
            tracksViewChanges={m.animated ?? false}
          >
            {m.view}
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: '#E8ECE6' },
});
