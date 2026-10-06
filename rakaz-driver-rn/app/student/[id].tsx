import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowRight,
  CircleUserRound,
  ClipboardList,
  Clock,
  House,
  Info,
  Landmark,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { InitialsAvatar, SectionTitle, SquareIconButton, StatusBadge } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import RouteMap from '@/components/RouteMap';
import { Rakaz, card, withAlpha } from '@/constants/theme';
import { NavigationLauncher } from '@/services/navigationLauncher';
import { findStudent } from '@/store/driverState';
import { useDriverStore } from '@/store/driverStore';
import { useUiStore } from '@/store/uiStore';
import { type StopRecord, StopStatus, TripLeg, emptyStopRecord, studentInitials } from '@/types/models';
import { ArabicFormat, arabicDigits } from '@/utils/arabicFormat';

function InfoCard({ title, icon: Icon, lines, onNavigate }: { title: string; icon: LucideIcon; lines: string[]; onNavigate: () => void }) {
  return (
    <View style={[card(20), styles.infoCard]}>
      <View style={styles.infoIcon}>
        <Icon color={Rakaz.GoldDeep} size={22} />
      </View>
      <View style={styles.flex}>
        <AppText variant="labelSmall" color={Rakaz.Gold}>
          {title}
        </AppText>
        {lines.map((line) => (
          <AppText key={line} variant="titleSmall">
            {line}
          </AppText>
        ))}
      </View>
      <SquareIconButton icon={Navigation} accessibilityLabel="الملاحة" size={44} onPress={onNavigate} />
    </View>
  );
}

function TimeTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <View style={[card(20), styles.timeTile]}>
      <View style={styles.inline}>
        <Icon color={Rakaz.InkSecondary} size={15} />
        <AppText variant="labelSmall" color={Rakaz.InkSecondary}>
          {label}
        </AppText>
      </View>
      <AppText variant="headlineMedium">{arabicDigits(value)}</AppText>
    </View>
  );
}

function RecordRow({ title, record }: { title: string; record: StopRecord }) {
  const time = record.completedAt ?? record.arrivedAt;
  return (
    <View style={styles.recordRow}>
      <View style={styles.inline}>
        <AppText variant="titleSmall" style={styles.flex}>
          {title}
        </AppText>
        <StatusBadge status={record.status} />
      </View>
      {time != null ? (
        <View style={styles.inline}>
          <Clock color={Rakaz.InkSecondary} size={14} />
          <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
            {ArabicFormat.time(time)}
          </AppText>
        </View>
      ) : null}
      {record.location ? (
        <View style={styles.inline}>
          <MapPin color={Rakaz.InkSecondary} size={14} />
          <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
            {ArabicFormat.coordinate(record.location) + (record.isEstimatedLocation ? ' (تقديري)' : '')}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useDriverStore();
  const ui = useUiStore();
  const insets = useSafeAreaInsets();
  const { state, derived } = store;

  const student = findStudent(state, id ?? '');
  if (!student) return null;
  const stop = state.route.stops.find((s) => s.studentId === student.id);
  const morning = state.trip.morning[student.id] ?? emptyStopRecord();
  const afternoon = state.trip.afternoon[student.id] ?? emptyStopRecord();
  const school = state.route.school;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <PressableScale onPress={() => router.back()} accessibilityLabel="رجوع" style={styles.back}>
          <ArrowRight color={Rakaz.Ink} size={24} />
        </PressableScale>
        <AppText variant="titleMedium">{student.name}</AppText>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[card(), styles.profile]}>
          <InitialsAvatar initials={studentInitials(student)} size={64} corner={20} />
          <View style={styles.flex}>
            <AppText variant="headlineSmall">{student.name}</AppText>
            <AppText variant="bodyMedium" color={Rakaz.InkSecondary}>
              {student.grade}
            </AppText>
          </View>
          <StatusBadge status={derived.currentLeg === TripLeg.MORNING ? morning.status : afternoon.status} />
        </View>

        <View style={styles.map}>
          <RouteMap style={StyleSheet.absoluteFill} focus={student.home} zoom={2.2} />
        </View>

        <InfoCard
          title="المنزل"
          icon={House}
          lines={[student.area, student.street]}
          onNavigate={() => ui.openNavigation({ title: student.name, coordinate: student.home })}
        />
        <InfoCard
          title="المدرسة"
          icon={Landmark}
          lines={[school.name, school.address, `بداية الدوام ${arabicDigits(school.startTime)}`]}
          onNavigate={() => ui.openNavigation({ title: school.name, coordinate: school.coordinate })}
        />

        <View style={styles.timeRow}>
          <TimeTile label="وقت الصعود" value={stop?.pickupTime ?? '—'} icon={Sun} />
          <TimeTile label="وقت النزول" value={stop?.dropoffTime ?? '—'} icon={Moon} />
        </View>

        <View style={[card(20), styles.guardian]}>
          <CircleUserRound color={withAlpha(Rakaz.Navy, 0.8)} size={40} />
          <View style={styles.flex}>
            <AppText variant="labelSmall" color={Rakaz.Gold}>
              ولي الأمر
            </AppText>
            <AppText variant="titleSmall">{student.guardianName}</AppText>
            <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
              {arabicDigits(student.guardianPhone)}
            </AppText>
          </View>
          <PressableScale
            onPress={() => void NavigationLauncher.dial(student.guardianPhone)}
            accessibilityLabel="اتصال بولي الأمر"
            style={styles.call}
          >
            <Phone color={Rakaz.White} size={20} />
          </PressableScale>
        </View>

        {student.notes ? (
          <View style={styles.notes}>
            <Info color={Rakaz.GoldDeep} size={22} />
            <AppText variant="titleSmall" color={Rakaz.GoldDeep} style={styles.flex}>
              {student.notes}
            </AppText>
          </View>
        ) : null}

        {morning.status !== StopStatus.PENDING || afternoon.status !== StopStatus.PENDING ? (
          <View style={[card(20), styles.log]}>
            <SectionTitle title="سجل اليوم" icon={ClipboardList} />
            <RecordRow title="الصباح" record={morning} />
            {afternoon.status !== StopStatus.PENDING ? <RecordRow title="العودة" record={afternoon} /> : null}
            <PressableScale onPress={() => store.undo(student.id)} accessibilityLabel="تراجع عن آخر تسجيل" style={styles.undo}>
              <AppText variant="labelMedium" color={Rakaz.Red}>
                تراجع عن آخر تسجيل
              </AppText>
            </PressableScale>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Rakaz.Canvas },
  flex: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6, backgroundColor: Rakaz.Canvas },
  back: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 16, gap: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  map: { height: 160, borderRadius: 22, overflow: 'hidden' },
  infoCard: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: Rakaz.GoldSoft, alignItems: 'center', justifyContent: 'center' },
  timeRow: { flexDirection: 'row', gap: 10 },
  timeTile: { flex: 1, padding: 16, gap: 6 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  guardian: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  call: { width: 44, height: 44, borderRadius: 22, backgroundColor: Rakaz.Green, alignItems: 'center', justifyContent: 'center' },
  notes: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: Rakaz.GoldTint, padding: 16 },
  log: { padding: 16, gap: 10 },
  recordRow: { gap: 4 },
  undo: { minHeight: 44, paddingVertical: 12, alignSelf: 'flex-start' },
});
