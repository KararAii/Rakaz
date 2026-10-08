import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  buildTripId,
  todayISO,
  toCanonicalStudentId,
  type RakazTripSnapshot,
  type RakazUnsubscribe,
} from '@rakaz/contract';

import { MockData } from '@/data/mockData';
import {
  getParentCommands,
  getTripLiveSource,
  patchFromTripSnapshot,
  resolveActiveTripId,
  usesLiveBackend,
} from '@/services/backend';
import { NotificationService } from '@/services/notificationService';
import * as L from '@/store/familyLogic';
import type { FamilyState } from '@/store/familyLogic';
import {
  type Absence,
  AbsenceReason,
  AbsenceScope,
  type AppNotification,
  defaultNotificationPreferences,
  eventDate,
  isMoving,
  isNotificationOn,
  makeId,
  nextStatus,
  NotificationKind,
  NotificationKindTitle,
  type NotificationPreferences,
  startOfDay,
  type StudentAddress,
  type SupportTicket,
  TicketKind,
  TicketTopic,
  type Trip,
  TripKind,
  TripStatus,
} from '@/types/models';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';
import { isRecord, Storage } from '@/utils/storage';

const Keys = {
  absences: 'rakaz.absences',
  tickets: 'rakaz.tickets',
  prefs: 'rakaz.notificationPrefs',
  addresses: 'rakaz.addresses',
} as const;

function isAbsenceList(value: unknown): value is Absence[] {
  return (
    Array.isArray(value) &&
    value.every(
      (a) =>
        isRecord(a) &&
        typeof a.id === 'string' &&
        typeof a.studentID === 'string' &&
        typeof a.day === 'number' &&
        Object.values(AbsenceScope).includes(a.scope as AbsenceScope) &&
        Object.values(AbsenceReason).includes(a.reason as AbsenceReason),
    )
  );
}

function isTicketList(value: unknown): value is SupportTicket[] {
  return (
    Array.isArray(value) &&
    value.every(
      (t) =>
        isRecord(t) &&
        typeof t.id === 'string' &&
        typeof t.body === 'string' &&
        typeof t.createdAt === 'number' &&
        Object.values(TicketKind).includes(t.kind as TicketKind) &&
        Object.values(TicketTopic).includes(t.topic as TicketTopic),
    )
  );
}

function isPreferences(value: unknown): value is NotificationPreferences {
  return isRecord(value) && isRecord(value.enabled) && Object.values(value.enabled).every((v) => typeof v === 'boolean');
}

function isAddressMap(value: unknown): value is Record<string, StudentAddress> {
  return (
    isRecord(value) &&
    Object.values(value).every((a) => isRecord(a) && typeof a.latitude === 'number' && typeof a.longitude === 'number' && typeof a.street === 'string')
  );
}

function initialState(): FamilyState {
  const { morning, ret } = L.makeInitialTrips();
  return {
    students: MockData.students,
    selectedStudentID: MockData.students[0]?.id ?? '',
    morningTrip: morning,
    returnTrip: ret,
    activeKind: TripKind.morning,
    notifications: MockData.notifications(),
    absences: [],
    tickets: [],
    preferences: defaultNotificationPreferences(),
    banner: null,
    handoverPending: false,
    handoverConfirmedAt: null,
  };
}

const randomInt = (min: number, max: number): number => min + Math.floor(Math.random() * (max - min + 1));

/**
 * Central guardian-side state: children, live trips, notifications, absences, finance and support.
 * Trip updates are simulated locally until the Rakaz realtime backend is connected.
 */
export const [FamilyStoreProvider, useFamily] = createContextHook(() => {
  const [state, setState] = useState<FamilyState>(initialState);
  const stateRef = useRef<FamilyState>(state);
  const holdTicks = useRef(0);
  const didNotifyNear = useRef(false);
  const simulation = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveUnsub = useRef<RakazUnsubscribe | null>(null);
  const lastLiveStatus = useRef<number | null>(null);

  const actions = useMemo(() => {
    const get = (): FamilyState => stateRef.current;
    const commit = (next: FamilyState): void => {
      stateRef.current = next;
      setState(next);
    };
    const patch = (partial: Partial<FamilyState>): void => commit({ ...get(), ...partial });

    const showBanner = (n: AppNotification): void => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      patch({ banner: n });
      bannerTimer.current = setTimeout(() => patch({ banner: null }), 3500);
    };

    const push = (kind: NotificationKind, body: string): void => {
      if (!isNotificationOn(get().preferences, kind)) return;
      const n: AppNotification = { id: makeId(), kind, body, date: Date.now(), isRead: false };
      patch({ notifications: [n, ...get().notifications] });
      NotificationService.post(NotificationKindTitle[kind], body);
      showBanner(n);
    };

    const notify = (status: TripStatus, kind: TripKind): void => {
      const student = L.currentStudent(get());
      const name = student.firstName;
      const now = Date.now();
      if (kind === TripKind.morning) {
        if (status === TripStatus.driverOnTheWay) push(NotificationKind.tripStarted, `بدأ السائق ${student.driver.name} رحلة الصباح وهو في الطريق إليكم.`);
        else if (status === TripStatus.studentPickedUp) push(NotificationKind.pickedUp, `تم استلام ${name} بأمان الساعة ${Fmt.time(now)}.`);
        else if (status === TripStatus.arrivedAtSchool) push(NotificationKind.arrivedSchool, `وصلت ${name} إلى ${student.school.name} الساعة ${Fmt.time(now)}.`);
      } else if (status === TripStatus.onTheWayToSchool) {
        push(NotificationKind.returnStarted, `انطلقت رحلة العودة. ${name} في الطريق إلى المنزل.`);
      } else if (status === TripStatus.arrivedAtSchool) {
        push(NotificationKind.delivered, `تم تسليم ${name} إلى المنزل بأمان الساعة ${Fmt.time(now)}.`);
      }
    };

    const setTrip = (trip: Trip): void => {
      patch(trip.kind === TripKind.morning ? { morningTrip: trip } : { returnTrip: trip });
    };

    /** Moves `trip` to its next status; side effects (notifications, handover) run after it is stored. */
    const advance = (trip: Trip): Trip => {
      const next = nextStatus(trip.status);
      if (next == null) return trip;
      holdTicks.current = 0;
      const now = Date.now();
      const advanced: Trip = {
        ...trip,
        status: next,
        progress: 0,
        speedKmh: isMoving(next) ? 32 : 0,
        events: [...trip.events, { id: makeId(), status: next, date: now, note: '' }],
      };
      if (next === TripStatus.finished || next === TripStatus.arrivedAtSchool) {
        advanced.expectedArrival = eventDate(advanced, TripStatus.arrivedAtSchool) ?? now;
      }
      setTrip(advanced);
      Haptics.soft();
      notify(next, advanced.kind);
      if (next === TripStatus.arrivedAtSchool && advanced.kind === TripKind.afternoon) {
        patch({ handoverConfirmedAt: null, handoverPending: true });
      }
      return advanced;
    };

    const tick = (): void => {
      const s = get();
      const active = L.tripFor(s, s.activeKind);
      if (L.isAbsentOn(s, active.kind)) {
        if (s.activeKind === TripKind.morning && s.morningTrip.status === TripStatus.finished && !L.isAbsentOn(s, TripKind.afternoon)) {
          patch({ activeKind: TripKind.afternoon });
        }
        return;
      }
      let trip: Trip = { ...active, updatedAt: Date.now() };
      switch (trip.status) {
        case TripStatus.notStarted:
          if (trip.kind === TripKind.afternoon) trip = advance(trip);
          break;
        case TripStatus.preparing:
          holdTicks.current += 1;
          if (holdTicks.current >= 5) trip = advance(trip);
          break;
        case TripStatus.driverOnTheWay:
        case TripStatus.onTheWayToSchool:
          trip = { ...trip, progress: Math.min(1, trip.progress + 0.022), speedKmh: randomInt(28, 44) };
          if (trip.status === TripStatus.driverOnTheWay && trip.progress > 0.78 && !didNotifyNear.current && trip.kind === TripKind.morning) {
            didNotifyNear.current = true;
            push(NotificationKind.driverNear, `السائق على بُعد دقائق من المنزل. يُرجى تجهيز ${L.currentStudent(get()).firstName}.`);
          }
          if (trip.progress >= 1) trip = advance(trip);
          break;
        case TripStatus.arrivedAtPickup:
        case TripStatus.studentPickedUp:
          holdTicks.current += 1;
          if (holdTicks.current >= 5) trip = advance(trip);
          break;
        case TripStatus.arrivedAtSchool:
          holdTicks.current += 1;
          if (holdTicks.current >= 6) trip = advance(trip);
          break;
        case TripStatus.finished:
          holdTicks.current += 1;
          if (trip.kind === TripKind.morning && holdTicks.current >= 8) {
            holdTicks.current = 0;
            patch({ activeKind: TripKind.afternoon });
            return;
          }
          break;
      }
      setTrip(trip);
    };

    const submitTicket = (kind: TicketKind, topic: TicketTopic, body: string): void => {
      const ticket: SupportTicket = { id: `#${randomInt(1000, 9999)}`, kind, topic, body, createdAt: Date.now(), status: 'قيد المراجعة' };
      const tickets = [ticket, ...get().tickets];
      patch({ tickets });
      Storage.save(Keys.tickets, tickets);
      Haptics.success();
    };

    return {
      submitTicket,

      startSimulation(): void {
        if (usesLiveBackend()) return;
        if (simulation.current != null) return;
        simulation.current = setInterval(tick, 1000);
      },

      stopSimulation(): void {
        if (simulation.current != null) clearInterval(simulation.current);
        simulation.current = null;
      },

      applyLiveSnapshot(snapshot: RakazTripSnapshot): void {
        const live = patchFromTripSnapshot(snapshot);
        const kind = live.tripKind;
        const current = kind === TripKind.morning ? get().morningTrip : get().returnTrip;
        const status = live.status ?? current.status;
        const nextTrip: Trip = {
          ...current,
          kind,
          status,
          progress: snapshot.progress,
          speedKmh: isMoving(status) ? Math.max(current.speedKmh, 28) : 0,
          updatedAt: snapshot.updatedAt,
        };
        if (lastLiveStatus.current !== status) {
          lastLiveStatus.current = status;
          if (status !== current.status) notify(status, kind);
        }
        const partial: Partial<FamilyState> = kind === TripKind.morning ? { morningTrip: nextTrip } : { returnTrip: nextTrip };
        if (live.switchToAfternoon) partial.activeKind = TripKind.afternoon;
        else partial.activeKind = kind;
        if (live.handoverPending) {
          partial.handoverPending = true;
          partial.handoverConfirmedAt = snapshot.handoverConfirmedAt;
        } else if (snapshot.handoverConfirmedAt) {
          partial.handoverPending = false;
          partial.handoverConfirmedAt = snapshot.handoverConfirmedAt;
        }
        patch(partial);
      },

      startLiveBackend(): void {
        if (!usesLiveBackend()) return;
        if (simulation.current != null) {
          clearInterval(simulation.current);
          simulation.current = null;
        }
        liveUnsub.current?.();
        liveUnsub.current = null;
        const studentId = toCanonicalStudentId(get().selectedStudentID) ?? get().selectedStudentID;
        const kind = get().activeKind === TripKind.afternoon ? 'afternoon' : 'morning';
        const applySnap = (snapshot: RakazTripSnapshot): void => {
          const live = patchFromTripSnapshot(snapshot);
          const tripKind = live.tripKind;
          const current = tripKind === TripKind.morning ? get().morningTrip : get().returnTrip;
          const status = live.status ?? current.status;
          const nextTrip: Trip = {
            ...current,
            kind: tripKind,
            status,
            progress: snapshot.progress,
            speedKmh: isMoving(status) ? Math.max(current.speedKmh, 28) : 0,
            updatedAt: snapshot.updatedAt,
          };
          if (lastLiveStatus.current !== status) {
            lastLiveStatus.current = status;
            if (status !== current.status) notify(status, tripKind);
          }
          const partial: Partial<FamilyState> = tripKind === TripKind.morning ? { morningTrip: nextTrip } : { returnTrip: nextTrip };
          if (live.switchToAfternoon) partial.activeKind = TripKind.afternoon;
          else partial.activeKind = tripKind;
          if (live.handoverPending) {
            partial.handoverPending = true;
            partial.handoverConfirmedAt = snapshot.handoverConfirmedAt;
          } else if (snapshot.handoverConfirmedAt) {
            partial.handoverPending = false;
            partial.handoverConfirmedAt = snapshot.handoverConfirmedAt;
          }
          patch(partial);
        };
        void (async () => {
          let tripId: string | null = null;
          try {
            tripId = await resolveActiveTripId(studentId, kind);
          } catch {
            tripId = buildTripId({ dateISO: todayISO(), routeId: 'R-204', tripKind: kind });
          }
          if (!tripId) return;
          liveUnsub.current = getTripLiveSource().watchTrip(
            tripId,
            (snap) => {
              if (snap) applySnap(snap);
            },
            (error) => console.log('[RakazLink] live trip error', error),
          );
        })();
      },

      stopLiveBackend(): void {
        liveUnsub.current?.();
        liveUnsub.current = null;
      },

      restartDemo(): void {
        const { morning, ret } = L.makeInitialTrips();
        holdTicks.current = 0;
        didNotifyNear.current = false;
        patch({ morningTrip: morning, returnTrip: ret, activeKind: TripKind.morning, handoverPending: false, handoverConfirmedAt: null });
        Haptics.success();
      },

      confirmHandover(): void {
        const at = Date.now();
        patch({ handoverConfirmedAt: at });
        Haptics.success();
        const studentId = toCanonicalStudentId(get().selectedStudentID) ?? get().selectedStudentID;
        void getParentCommands()
          .confirmHandover({
            tripId: buildTripId({ dateISO: todayISO(), routeId: 'R-204', tripKind: 'afternoon' }),
            studentId,
            confirmed: true,
            issueReported: false,
            at,
            guardianUid: null,
          })
          .catch((error: unknown) => console.log('[RakazLink] confirmHandover', error));
      },

      dismissHandover(): void {
        if (get().handoverPending) patch({ handoverPending: false });
      },

      select(studentID: string): void {
        if (studentID === get().selectedStudentID) return;
        Haptics.selection();
        patch({ selectedStudentID: studentID });
      },

      push,

      dismissBanner(): void {
        if (bannerTimer.current) clearTimeout(bannerTimer.current);
        patch({ banner: null });
      },

      markRead(id: string): void {
        patch({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) });
      },

      markAllRead(): void {
        patch({ notifications: get().notifications.map((n) => ({ ...n, isRead: true })) });
      },

      deleteNotification(id: string): void {
        patch({ notifications: get().notifications.filter((n) => n.id !== id) });
      },

      setPreference(kind: NotificationKind, on: boolean): void {
        const preferences: NotificationPreferences = { enabled: { ...get().preferences.enabled, [kind]: on } };
        patch({ preferences });
        Storage.save(Keys.prefs, preferences);
        Haptics.selection();
      },

      reportAbsence(day: number, scope: AbsenceScope, reason: AbsenceReason, note: string): void {
        const absence: Absence = {
          id: makeId(),
          studentID: get().selectedStudentID,
          day: startOfDay(day),
          scope,
          reason,
          note: note.trim(),
          createdAt: Date.now(),
          seenByAdmin: false,
          seenByDriver: false,
        };
        const absences = L.replaceAbsenceForDay(get().absences, absence);
        patch({ absences });
        Storage.save(Keys.absences, absences);
        Haptics.success();
        void getParentCommands()
          .reportAbsence({
            id: absence.id,
            studentId: toCanonicalStudentId(absence.studentID) ?? absence.studentID,
            day: absence.day,
            scope: absence.scope,
            reason: absence.reason,
            note: absence.note,
            createdAt: absence.createdAt,
            guardianUid: null,
          })
          .catch((error: unknown) => console.log('[RakazLink] reportAbsence', error));
        setTimeout(() => {
          const current = get().absences;
          if (!current.some((a) => a.id === absence.id)) return;
          const seen = current.map((a) => (a.id === absence.id ? { ...a, seenByAdmin: true, seenByDriver: true } : a));
          patch({ absences: seen });
          Storage.save(Keys.absences, seen);
        }, 3000);
      },

      cancelAbsence(id: string): void {
        const absences = get().absences.filter((a) => a.id !== id);
        patch({ absences });
        Storage.save(Keys.absences, absences);
      },

      updateAddress(address: StudentAddress, studentID: string): void {
        const s = get();
        if (!s.students.some((st) => st.id === studentID)) return;
        const students = s.students.map((st) => (st.id === studentID ? { ...st, address } : st));
        patch({ students });
        Storage.save(Keys.addresses, Object.fromEntries(students.map((st) => [st.id, st.address])));
        Haptics.success();
        void getParentCommands()
          .updateAddress({
            studentId: toCanonicalStudentId(studentID) ?? studentID,
            label: address.landmark || address.neighborhood || 'المنزل',
            area: address.area,
            street: address.street,
            coordinate: { latitude: address.latitude, longitude: address.longitude },
            updatedAt: Date.now(),
            guardianUid: null,
          })
          .catch((error: unknown) => console.log('[RakazLink] updateAddress', error));
      },

      /** Guardian says the student has not arrived: hand off to support and alert the operations team. */
      reportHandoverIssue(): void {
        patch({ handoverPending: false });
        const name = L.currentStudent(get()).firstName;
        submitTicket(TicketKind.complaint, TicketTopic.timing, `لم يصل ${name} إلى المنزل رغم تسجيل الوصول في رحلة العودة.`);
        const studentId = toCanonicalStudentId(get().selectedStudentID) ?? get().selectedStudentID;
        void getParentCommands()
          .reportHandoverIssue({
            tripId: buildTripId({ dateISO: todayISO(), routeId: 'R-204', tripKind: 'afternoon' }),
            studentId,
            confirmed: false,
            issueReported: true,
            at: Date.now(),
            guardianUid: null,
          })
          .catch((error: unknown) => console.log('[RakazLink] reportHandoverIssue', error));
      },
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      Storage.load(Keys.addresses, isAddressMap),
      Storage.load(Keys.absences, isAbsenceList),
      Storage.load(Keys.tickets, isTicketList),
      Storage.load(Keys.prefs, isPreferences),
    ]).then(([addresses, absences, tickets, prefs]) => {
      if (cancelled) return;
      const s = stateRef.current;
      const next: FamilyState = {
        ...s,
        students: addresses ? s.students.map((st) => (addresses[st.id] ? { ...st, address: addresses[st.id] } : st)) : s.students,
        absences: absences ?? s.absences,
        tickets: tickets ?? s.tickets,
        preferences: prefs ?? s.preferences,
      };
      stateRef.current = next;
      setState(next);
    });
    return () => {
      cancelled = true;
      if (simulation.current != null) clearInterval(simulation.current);
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
      liveUnsub.current?.();
      liveUnsub.current = null;
    };
  }, []);

  const derived = useMemo(
    () => ({
      student: L.currentStudent(state),
      activeTrip: L.tripFor(state, state.activeKind),
      unreadCount: L.unreadCount(state),
      todaysAbsence: L.todaysAbsence(state),
      subscription: MockData.subscription(state.selectedStudentID),
      payments: MockData.payments(state.selectedStudentID),
    }),
    [state],
  );

  return useMemo(
    () => ({
      state,
      ...derived,
      ...actions,
      trip: (kind: TripKind) => L.tripFor(state, kind),
      isAbsent: (kind: TripKind) => L.isAbsentOn(state, kind),
      legs: (kind: TripKind) => L.legsFor(state, kind),
      vehicleCoordinate: (kind: TripKind) => L.vehicleCoordinate(state, kind),
      homeCoordinate: L.homeCoordinate(state),
      schoolCoordinate: L.schoolCoord(state),
      etaMinutes: (kind: TripKind) => L.etaMinutes(state, kind),
      etaDate: (kind: TripKind) => L.etaDate(state, kind),
      etaTitle: (kind: TripKind) => L.etaTitle(state, kind),
      overallProgress: (kind: TripKind) => L.overallProgress(state, kind),
      remainingDistanceKm: (kind: TripKind) => L.remainingDistanceKm(state, kind),
      absencesFor: (studentID: string) => L.absencesFor(state, studentID),
      subscriptionFor: (studentID: string) => MockData.subscription(studentID),
    }),
    [state, derived, actions],
  );
});
