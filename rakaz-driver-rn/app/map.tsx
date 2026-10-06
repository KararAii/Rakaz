import { router } from 'expo-router';
import { LocateFixed, Navigation, X } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { BrandButton, MapChip } from '@/components/Components';
import RouteMap from '@/components/RouteMap';
import { Rakaz, card } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import { useUiStore } from '@/store/uiStore';
import { ArabicFormat } from '@/utils/arabicFormat';

/** Full-screen map with route summary, opened from the map card. */
export default function FullMapScreen() {
  const { state, derived } = useDriverStore();
  const ui = useUiStore();
  const insets = useSafeAreaInsets();
  const [zoomed, setZoomed] = useState(false);
  const next = derived.nextStop;
  const school = state.route.school;

  return (
    <View style={styles.root}>
      <RouteMap style={StyleSheet.absoluteFill} interactive focus={zoomed ? derived.currentPosition : null} zoom={zoomed ? 1.8 : 1} />
      <View style={[styles.chips, { top: insets.top + 16 }]}>
        <MapChip icon={X} label="إغلاق" onPress={() => router.back()} />
        <MapChip icon={LocateFixed} label="توسيط" onPress={() => setZoomed((v) => !v)} />
      </View>
      <View style={[card(24), styles.summary, { bottom: insets.bottom + 16 }]}>
        <AppText variant="labelMedium" color={Rakaz.Gold}>
          {derived.routeSubtitle}
        </AppText>
        <AppText variant="titleLarge">{next?.student.name ?? school.name}</AppText>
        <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
          {`${ArabicFormat.km(derived.remainingMeters)} كم · الوصول ${ArabicFormat.time(derived.etaToDestination)}`}
        </AppText>
        <BrandButton
          title="بدء الملاحة"
          icon={Navigation}
          kind="NAVY"
          onPress={() =>
            ui.openNavigation(
              next ? { title: next.student.name, coordinate: next.student.home } : { title: school.name, coordinate: school.coordinate },
            )
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Rakaz.MapLand },
  chips: { position: 'absolute', start: 16, gap: 10 },
  summary: { position: 'absolute', start: 16, end: 16, padding: 18, gap: 12 },
});
