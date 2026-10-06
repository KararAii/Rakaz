import { Bus, CalendarMinus, Check, ChevronLeft, Clock, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, type LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { IconBadge, StatusPill, StudentAvatar } from '@/components/Primitives';
import { card, heroShadow, Theme, withAlpha } from '@/constants/theme';
import { useAnimatedNumber, usePulse } from '@/hooks/useAnimatedNumber';
import { useFamily } from '@/store/familyStore';
import {
  type Absence,
  AbsenceScopeTitle,
  allTripStatuses,
  eventDate,
  isActive,
  isMoving,
  isPickedUp,
  shortName,
  type Trip,
  TripKind,
  TripKindTitle,
  TripStatus,
  tripStatusTitle,
} from '@/types/models';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';

export type TimelineState = 'done' | 'current' | 'pending';

/** Hero card from the design: child, live status pill, big ETA and the boarding confirmation strip. */
export function StudentTripCard() {
  const store = useFamily();
  const trip = store.activeTrip;
  const student = store.student;
  const absent = store.isAbsent(trip.kind);
  const eta = store.etaDate(store.state.activeKind);
  const name = student.firstName;

  const shortStatus = (() => {
    switch (trip.status) {
      case TripStatus.notStarted:
        return 'مجدولة';
      case TripStatus.preparing:
        return 'يستعد';
      case TripStatus.driverOnTheWay:
        return 'السائق قادم';
      case TripStatus.arrivedAtPickup:
        return 'عند الباب';
      case TripStatus.studentPickedUp:
        return 'صعد بأمان';
      case TripStatus.onTheWayToSchool:
        return 'في الطريق';
      case TripStatus.arrivedAtSchool:
        return trip.kind === TripKind.morning ? 'وصل المدرسة' : 'وصل المنزل';
      case TripStatus.finished:
        return 'انتهت';
    }
  })();
  const early = trip.status <= TripStatus.driverOnTheWay;
  const pillTint = early ? Theme.gold : trip.status === TripStatus.arrivedAtPickup ? Theme.red : Theme.green;
  const pillSoft = early ? Theme.goldSoft : trip.status === TripStatus.arrivedAtPickup ? Theme.redSoft : Theme.greenSoft;

  const confirmation = (() => {
    if (absent) return `تم إبلاغ الإدارة والسائق بغياب ${name} عن ${TripKindTitle[trip.kind]}`;
    const arrived = eventDate(trip, TripStatus.arrivedAtSchool);
    if (trip.status >= TripStatus.arrivedAtSchool && arrived != null) {
      return trip.kind === TripKind.morning
        ? `وصلت ${name} إلى المدرسة بأمان عند ${Fmt.clock(arrived)}`
        : `وصلت ${name} إلى المنزل بأمان عند ${Fmt.clock(arrived)}`;
    }
    const picked = eventDate(trip, TripStatus.studentPickedUp);
    if (isPickedUp(trip) && picked != null) return `تم تسجيل صعود ${name} بأمان عند ${Fmt.clock(picked)}`;
    if (trip.status === TripStatus.arrivedAtPickup) return `السائق بانتظار ${name} الآن`;
    if (trip.status === TripStatus.driverOnTheWay) return `السائق ${student.driver.name} في الطريق إليكم`;
    return `تبدأ ${TripKindTitle[trip.kind]} الساعة ${Fmt.time(trip.scheduledStart)}`;
  })();
  const ConfirmIcon = absent ? CalendarMinus : isPickedUp(trip) ? ShieldCheck : Clock;

  return (
    <View style={[card(18, 26), heroShadow, styles.gap16]}>
      <View style={styles.rowTop}>
        <StudentAvatar student={student} size={48} verified={isPickedUp(trip) && !absent} />
        <View style={styles.flexGap1}>
          <AppText size="headline" weight="bold">
            {shortName(student)}
          </AppText>
          <AppText size="caption" color={Theme.muted}>
            {`${student.grade} ${student.stage.replace('المرحلة ', '')}`}
          </AppText>
        </View>
        {absent ? (
          <StatusPill title="غائب اليوم" tint={Theme.red} soft={Theme.redSoft} />
        ) : (
          <StatusPill title={shortStatus} tint={pillTint} soft={pillSoft} pulsing={isMoving(trip.status)} />
        )}
      </View>

      <View style={styles.hairline} />

      <View style={styles.rowBottom}>
        <View style={styles.gap2}>
          <AppText size="caption" color={Theme.muted}>
            {store.etaTitle(store.state.activeKind)}
          </AppText>
          <View style={styles.baseline}>
            <AppText size={36} weight="bold">
              {Fmt.clock(eta)}
            </AppText>
            <AppText size="footnote" color={Theme.muted}>
              {Fmt.period(eta)}
            </AppText>
          </View>
        </View>
        {isActive(trip.status) && !absent ? (
          <View style={styles.remaining}>
            <AppText size="caption" color={Theme.muted} align="end">
              متبقي
            </AppText>
            <AppText size="title3" weight="bold" color={Theme.gold} align="end">
              {Fmt.minutes(store.etaMinutes(store.state.activeKind))}
            </AppText>
          </View>
        ) : null}
      </View>

      <View style={styles.confirmStrip}>
        <ConfirmIcon size={16} color={Theme.gold} />
        <AppText size="caption" weight="medium" numberOfLines={2} style={styles.flex}>
          {confirmation}
        </AppText>
      </View>
    </View>
  );
}

export function PulseDot({ live, size = 8 }: { live: boolean; size?: number }) {
  const pulse = usePulse(live);
  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: live ? Theme.green : Theme.muted,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.6] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
      }}
    />
  );
}

/** "الرحلة الصباحية مباشرة" card with a compact home → bus → school track. */
export function LiveRouteCard({ onFollow }: { onFollow: () => void }) {
  const store = useFamily();
  const trip = store.activeTrip;
  const live = isActive(trip.status) && !store.isAbsent(trip.kind);
  const name = store.student.firstName;
  const school = store.student.school.name;
  return (
    <View style={styles.liveCard}>
      <View style={styles.liveHead}>
        <PulseDot live={live} />
        <AppText size="subheadline" weight="bold" style={styles.flex}>
          {`${trip.kind === TripKind.morning ? 'الرحلة الصباحية' : 'رحلة العودة'}${live ? ' مباشرة' : ''}`}
        </AppText>
        <AppText size="caption" weight="medium" color={Theme.gold}>
          {live ? 'تحديث الآن' : Fmt.relative(trip.updatedAt)}
        </AppText>
      </View>
      <View style={styles.hairline} />
      <View style={styles.trackBox}>
        <RouteTrack
          progress={store.overallProgress(store.state.activeKind)}
          origin={trip.kind === TripKind.morning ? `منزل ${name}` : school}
          destination={trip.kind === TripKind.morning ? school : `منزل ${name}`}
          busLabel={`حافلة ${store.student.driver.vehicle.busNumber}`}
        />
      </View>
      <View style={styles.liveFoot}>
        <Bus size={14} color={Theme.ink} />
        <AppText size="caption" color={Theme.muted} style={styles.flex}>
          {'السائق: '}
          <AppText size="caption" weight="bold">
            {store.student.driver.name}
          </AppText>
        </AppText>
        <PressableScale onPress={onFollow} accessibilityLabel="متابعة الرحلة" style={styles.follow}>
          <AppText size="footnote" weight="bold" color={Theme.gold}>
            متابعة الرحلة
          </AppText>
          <ChevronLeft size={12} color={Theme.gold} strokeWidth={3} />
        </PressableScale>
      </View>
    </View>
  );
}

export interface RouteTrackProps {
  progress: number;
  origin: string;
  destination: string;
  busLabel?: string;
}

/** Horizontal origin → destination track (origin at the start edge for RTL) with a moving bus marker. */
export function RouteTrack({ progress, origin, destination, busLabel }: RouteTrackProps) {
  const [width, setWidth] = useState(0);
  const clamped = Math.min(Math.max(progress, 0), 1);
  const p = useAnimatedNumber(clamped);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const offset = p.interpolate({ inputRange: [0, 1], outputRange: [0, width] });

  return (
    <View style={styles.gap6} onLayout={onLayout}>
      {busLabel != null && width > 0 ? (
        <View style={styles.labelLane}>
          <Animated.View
            style={[
              styles.busLabel,
              { start: p.interpolate({ inputRange: [0, 1], outputRange: [Math.min(34, width / 2), Math.max(width - 34, width / 2)] }) },
            ]}
          >
            <AppText size="caption2" weight="bold" align="center" numberOfLines={1}>
              {busLabel}
            </AppText>
          </Animated.View>
        </View>
      ) : null}
      <View style={styles.trackLane}>
        <View style={styles.trackBase} />
        <Animated.View style={[styles.trackFill, { width: offset }]} />
        <View style={[styles.endDot, styles.startDot, { backgroundColor: Theme.green }]} />
        <View style={[styles.endDot, styles.finishDot, { backgroundColor: Theme.navy }]} />
        {width > 0 ? (
          <Animated.View
            style={[styles.busDot, { start: p.interpolate({ inputRange: [0, 1], outputRange: [0, Math.max(0, width - 14)] }) }]}
          />
        ) : null}
      </View>
      <View style={styles.trackLabels}>
        <AppText size="caption2" weight="medium" color={Theme.muted} numberOfLines={1} style={styles.flexShrink}>
          {origin}
        </AppText>
        <AppText size="caption2" weight="medium" color={Theme.muted} numberOfLines={1} style={styles.flexShrink}>
          {destination}
        </AppText>
      </View>
    </View>
  );
}

export function AbsenceTodayCard({ absence }: { absence: Absence }) {
  const store = useFamily();
  return (
    <View style={styles.absence}>
      <IconBadge icon={CalendarMinus} tint={Theme.red} soft={Theme.white} size={42} />
      <View style={styles.flexGap3}>
        <AppText size="subheadline" weight="bold">
          {`تم الإبلاغ عن غياب ${store.student.firstName} · ${AbsenceScopeTitle[absence.scope]}`}
        </AppText>
        <View style={styles.seenRow}>
          <SeenLabel who="الإدارة" ok={absence.seenByAdmin} />
          <SeenLabel who="السائق" ok={absence.seenByDriver} />
        </View>
      </View>
      <PressableScale
        accessibilityLabel="إلغاء"
        onPress={() => {
          Haptics.tap();
          store.cancelAbsence(absence.id);
        }}
      >
        <AppText size="footnote" weight="semibold" color={Theme.red}>
          إلغاء
        </AppText>
      </PressableScale>
    </View>
  );
}

export function SeenLabel({ who, ok }: { who: string; ok: boolean }) {
  const color = ok ? Theme.green : Theme.muted;
  return (
    <View style={styles.seen}>
      {ok ? <Check size={12} color={Theme.white} strokeWidth={3} style={[styles.seenCheck, { backgroundColor: Theme.green }]} /> : <Clock size={12} color={color} />}
      <AppText size="caption" color={color}>
        {ok ? `اطّلع ${who}` : `بانتظار ${who}`}
      </AppText>
    </View>
  );
}

/** "محطات رحلة ليان": the key milestones of the active trip, with the full 8-state list on demand. */
export function TripStationsCard({ kind }: { kind?: TripKind }) {
  const store = useFamily();
  const [expanded, setExpanded] = useState(false);
  const tripKind = kind ?? store.state.activeKind;
  const trip = store.trip(tripKind);
  const absent = store.isAbsent(trip.kind);
  const statuses = expanded
    ? allTripStatuses.filter((s) => s !== TripStatus.notStarted)
    : [TripStatus.studentPickedUp, TripStatus.onTheWayToSchool, TripStatus.arrivedAtSchool];

  const stateOf = (status: TripStatus): TimelineState => {
    if (absent) return 'pending';
    if (
      status < trip.status ||
      (status === trip.status && (status === TripStatus.finished || status === TripStatus.studentPickedUp || status === TripStatus.arrivedAtSchool))
    ) {
      return 'done';
    }
    if (status === trip.status) return 'current';
    return 'pending';
  };

  const title = (status: TripStatus): string => {
    if (expanded) return tripStatusTitle(status, trip.kind);
    switch (status) {
      case TripStatus.studentPickedUp:
        return 'تم الصعود';
      case TripStatus.onTheWayToSchool:
        return 'في الطريق';
      case TripStatus.arrivedAtSchool:
        return trip.kind === TripKind.morning ? 'الوصول للمدرسة' : 'الوصول للمنزل';
      default:
        return tripStatusTitle(status, trip.kind);
    }
  };

  const subtitle = (status: TripStatus, t: Trip): string | null => {
    const date = eventDate(t, status);
    switch (status) {
      case TripStatus.studentPickedUp: {
        const place = t.kind === TripKind.morning ? `منزل ${store.student.firstName}` : 'بوابة المدرسة';
        return date != null ? `${place} · ${Fmt.clock(date)}` : place;
      }
      case TripStatus.onTheWayToSchool:
        if (t.status === TripStatus.onTheWayToSchool) return `${store.student.address.neighborhood} · الآن`;
        return date != null ? Fmt.time(date) : null;
      case TripStatus.arrivedAtSchool:
        return date != null ? Fmt.time(date) : `متوقع ${Fmt.clock(store.etaDate(t.kind))}`;
      default:
        return date != null ? Fmt.time(date) : status === t.status ? 'الآن' : null;
    }
  };

  const toggle = (next: boolean) => {
    Haptics.tap();
    setExpanded(next);
  };

  return (
    <View style={[card(18), styles.gap14]}>
      <View style={styles.between}>
        <AppText size="headline" weight="bold">
          {`محطات رحلة ${store.student.firstName}`}
        </AppText>
        <PressableScale onPress={() => toggle(!expanded)} accessibilityLabel={expanded ? 'عرض أقل' : TripKindTitle[trip.kind]} style={styles.min32}>
          <AppText size="caption" weight="medium" color={expanded ? Theme.gold : Theme.muted}>
            {expanded ? 'عرض أقل' : TripKindTitle[trip.kind]}
          </AppText>
        </PressableScale>
      </View>
      <View>
        {statuses.map((status, index) => (
          <TimelineRow key={status} title={title(status)} subtitle={subtitle(status, trip)} state={stateOf(status)} isLast={index === statuses.length - 1} />
        ))}
      </View>
      {!expanded ? (
        <PressableScale onPress={() => toggle(true)} accessibilityLabel="كل حالات الرحلة" style={styles.allStates}>
          <AppText size="caption" weight="semibold" color={Theme.gold} align="center">
            كل حالات الرحلة (٨)
          </AppText>
        </PressableScale>
      ) : null}
    </View>
  );
}

function DashedLine({ minHeight }: { minHeight: number }) {
  const [h, setH] = useState(minHeight);
  return (
    <View style={{ width: 2, flex: 1, minHeight }} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      <Svg width={2} height={h}>
        <Line x1={1} y1={2} x2={1} y2={Math.max(2, h - 2)} stroke={withAlpha(Theme.muted, 0.35)} strokeWidth={1.5} strokeDasharray="3 3" />
      </Svg>
    </View>
  );
}

export interface TimelineRowProps {
  title: string;
  subtitle: string | null;
  state: TimelineState;
  isLast: boolean;
}

export function TimelineRow({ title, subtitle, state, isLast }: TimelineRowProps) {
  const ring = state === 'done' ? Theme.green : state === 'current' ? Theme.gold : Theme.line;
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineRail}>
        <View style={[styles.timelineDotWrap, { backgroundColor: state === 'pending' ? 'transparent' : withAlpha(ring, 0.15) }]}>
          <View style={[styles.timelineRing, { borderColor: ring }]}>
            <View style={[styles.timelineDot, { backgroundColor: ring }]} />
          </View>
        </View>
        {isLast ? null : <DashedLine minHeight={30} />}
      </View>
      <View style={[styles.timelineBody, { paddingBottom: isLast ? 0 : 14 }]}>
        <View style={styles.flexGap1}>
          <AppText size="subheadline" weight="bold" color={state === 'pending' ? withAlpha(Theme.muted, 0.7) : Theme.ink}>
            {title}
          </AppText>
          {subtitle != null ? (
            <AppText size="caption" color={Theme.muted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {state === 'done' ? <Check size={15} color={Theme.green} strokeWidth={2.6} /> : null}
        {state === 'current' ? (
          <AppText size="caption" weight="bold" color={Theme.gold}>
            جارية
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export interface StationRowProps {
  title: string;
  subtitle: string;
  time: number | null;
  state: TimelineState;
  isLast: boolean;
}

export function StationRow({ title, subtitle, time, state, isLast }: StationRowProps) {
  const ring = state === 'done' ? Theme.green : state === 'current' ? Theme.gold : withAlpha(Theme.muted, 0.4);
  return (
    <View style={[styles.timelineRow, { paddingBottom: isLast ? 0 : 10 }]}>
      <View style={styles.timelineRail}>
        <View style={styles.stationDotWrap}>
          <View style={[styles.timelineRing, { borderColor: ring }]}>
            {state === 'done' ? <Check size={10} color={Theme.green} strokeWidth={3.5} /> : null}
            {state === 'current' ? <View style={[styles.timelineDot, { backgroundColor: Theme.gold }]} /> : null}
          </View>
        </View>
        {isLast ? null : <DashedLine minHeight={32} />}
      </View>
      <View style={styles.flexGap1}>
        <AppText size="subheadline" weight="bold" color={state === 'pending' ? withAlpha(Theme.ink, 0.75) : Theme.ink}>
          {title}
        </AppText>
        <AppText size="caption" color={Theme.muted}>
          {subtitle}
        </AppText>
      </View>
      {time != null ? (
        <AppText size="footnote" weight="bold" color={state === 'current' ? Theme.gold : Theme.ink} style={styles.stationTime}>
          {Fmt.clock(time)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  flexGap1: { flex: 1, gap: 1 },
  flexGap3: { flex: 1, gap: 3 },
  gap2: { gap: 2 },
  gap6: { gap: 6 },
  gap14: { gap: 14 },
  gap16: { gap: 16 },
  min32: { minHeight: 32, justifyContent: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rowBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  baseline: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  remaining: { gap: 2, paddingBottom: 4, alignItems: 'flex-end' },
  hairline: { height: 1, backgroundColor: Theme.line },
  confirmStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: Theme.canvas },
  liveCard: { backgroundColor: Theme.card, borderRadius: 24, boxShadow: '0px 6px 16px rgba(7,29,54,0.06)', alignSelf: 'stretch' },
  liveHead: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14 },
  trackBox: { margin: 16, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: Theme.blueSoft },
  liveFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingBottom: 6 },
  follow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  labelLane: { height: 16 },
  busLabel: { position: 'absolute', top: 0, width: 120, marginStart: -60, alignItems: 'center' },
  trackLane: { height: 18, justifyContent: 'center' },
  trackBase: { position: 'absolute', start: 0, end: 0, height: 2, borderRadius: 1, backgroundColor: withAlpha(Theme.muted, 0.25) },
  trackFill: { position: 'absolute', start: 0, height: 2, borderRadius: 1, backgroundColor: withAlpha(Theme.green, 0.6) },
  endDot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, borderWidth: 2.5, borderColor: Theme.white },
  startDot: { start: 0 },
  finishDot: { end: 0 },
  busDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.gold,
    borderWidth: 3,
    borderColor: Theme.white,
    boxShadow: `0px 0px 4px ${withAlpha(Theme.gold, 0.5)}`,
  },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  absence: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: Theme.redSoft, alignSelf: 'stretch' },
  seenRow: { flexDirection: 'row', gap: 10 },
  seen: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seenCheck: { borderRadius: 6 },
  allStates: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timelineRail: { alignItems: 'center', alignSelf: 'stretch' },
  timelineDotWrap: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  stationDotWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  timelineRing: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timelineDot: { width: 10, height: 10, borderRadius: 5 },
  timelineBody: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  stationTime: { paddingTop: 2 },
});
