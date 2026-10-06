import { Compass, GraduationCap, Landmark, LocateFixed, type LucideIcon, Map, MapPin, Navigation, Sunrise, Sunset } from 'lucide-react-native';
import { Linking, Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DetailScreen } from '@/components/DetailScreen';
import { MapPinBadge } from '@/components/map/MapMarkers';
import RakazMap from '@/components/map/RakazMap';
import { regionAround } from '@/components/map/mapTypes';
import { PressableScale } from '@/components/PressableScale';
import { InfoRow, RowDivider } from '@/components/Primitives';
import { card, Theme, withAlpha } from '@/constants/theme';
import { useFamily } from '@/store/familyStore';
import { schoolCoordinate, schoolEndTime, schoolStartTime } from '@/types/models';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';

function openInMaps(latitude: number, longitude: number, name: string): void {
  const label = encodeURIComponent(name);
  const url =
    Platform.OS === 'ios'
      ? `https://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
      : Platform.OS === 'android'
        ? `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`
        : `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  void Linking.openURL(url);
}

export default function SchoolScreen() {
  const store = useFamily();
  const school = store.student.school;
  const coordinate = schoolCoordinate(school);

  return (
    <DetailScreen title="بيانات المدرسة">
      <View>
        <RakazMap
          region={regionAround(coordinate, 0.008)}
          markers={[{ id: 'school', coordinate, view: <MapPinBadge icon={GraduationCap} tint={Theme.navy} /> }]}
          interactive
          style={styles.map}
        />
        <PressableScale
          accessibilityLabel="فتح في الخرائط"
          onPress={() => {
            Haptics.tap();
            openInMaps(school.latitude, school.longitude, school.name);
          }}
          style={styles.openMaps}
        >
          <Navigation size={14} color={Theme.navy} fill={Theme.navy} />
          <AppText size="caption" weight="bold" color={Theme.navy}>
            فتح في الخرائط
          </AppText>
        </PressableScale>
      </View>

      <View style={styles.row10}>
        <TimeTile title="بداية الدوام" date={schoolStartTime(school)} icon={Sunrise} tint={Theme.gold} />
        <TimeTile title="انتهاء الدوام" date={schoolEndTime(school)} icon={Sunset} tint={Theme.teal} />
      </View>

      <View style={card(12)}>
        <InfoRow icon={Landmark} label="اسم المدرسة" value={school.name} />
        <RowDivider />
        <InfoRow icon={Map} label="عنوان المدرسة" value={school.address} />
        <RowDivider />
        <InfoRow icon={MapPin} label="موقع المدرسة" value={school.locationLabel} />
        <RowDivider />
        <InfoRow icon={Compass} label="Latitude" value={Fmt.coordinate(school.latitude)} mono copyable />
        <RowDivider />
        <InfoRow icon={LocateFixed} label="Longitude" value={Fmt.coordinate(school.longitude)} mono copyable />
      </View>
    </DetailScreen>
  );
}

function TimeTile({ title, date, icon: Icon, tint }: { title: string; date: number; icon: LucideIcon; tint: string }) {
  return (
    <View style={[card(14, 20), styles.tile]}>
      <View style={styles.row6}>
        <Icon size={14} color={tint} />
        <AppText size="caption" weight="semibold" color={tint}>
          {title}
        </AppText>
      </View>
      <View style={styles.baseline}>
        <AppText size="title" weight="bold">
          {Fmt.clock(date)}
        </AppText>
        <AppText size="caption" color={Theme.muted}>
          {Fmt.period(date)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: { height: 220, borderRadius: 24 },
  openMaps: {
    position: 'absolute',
    bottom: 12,
    start: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 19,
    backgroundColor: withAlpha(Theme.white, 0.92),
  },
  row10: { flexDirection: 'row', gap: 10 },
  row6: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tile: { flex: 1, gap: 8, alignSelf: 'auto' },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
});
