import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SampleData } from '@/data/sampleData';
import { LocationTracker } from '@/services/location';
import { NetworkMonitor } from '@/services/network';
import { PersistenceService } from '@/services/persistence';
import { ManualRouteOptimizer, NearestNeighborOptimizer } from '@/services/routeOptimizer';
import { SyncService } from '@/services/sync';
import {
  ActionKind,
  type AppSnapshot,
  type Coordinate,
  RouteOptimizationMode,
  type StopRecord,
  StopStatus,
  TripLeg,
  TripPhase,
  emptyStopRecord,
  emptyTripState,
} from '@/types/models';
import { ArabicFormat } from '@/utils/arabicFormat';
import { type FeedbackKind, notifyHaptic } from '@/utils/haptics';

import {
  type DriverDerived,
  type DriverState,
  currentLeg,
  currentPosition,
  deriveDriverState,
  findStudent,
  initialDriverState,
  isOnline,
  nearbyGps,
} from './driverState';

/** One-shot feedback (toast + haptic). */
export interface DriverToast {
  id: number;
  message: string;
  kind: FeedbackKind;
}

export interface DriverActions {
  login(phone: string, code: string): Promise<string | null>;
  logout(): void;
  startTrip(): void;
  arrive(studentId: string): void;
  pickUp(studentId: string): void;
  markAbsent(studentId: string, reason: string): void;
  undo(studentId: string): void;
  arriveSchool(): void;
  startReturn(): void;
  /** Return-leg hand-over; [pickUp] already records a drop-off when called on the afternoon leg. */
  dropOff(studentId: string): void;
  endTrip(): void;
  resetForNewDay(): void;
  triggerEmergency(type: string, note: string): void;
  resolveEmergency(): void;
  moveStop(from: number, to: number): void;
  applyOptimization(mode: RouteOptimizationMode): void;
  markAllRead(): void;
  markRead(id: string): void;
  setSimulateOffline(value: boolean): void;
  sync(): void;
  checkConnection(): void;
}

export interface DriverStore extends DriverActions {
  state: DriverState;
  derived: DriverDerived;
  hydrated: boolean;
  toast: DriverToast | null;
}

const now = (): number => Date.now();
const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function snapshotOf(s: DriverState): AppSnapshot {
  return {
    profile: s.profile,
    route: s.route,
    trip: s.trip,
    pending: s.pending,
    notifications: s.notifications,
    lastSyncAt: s.lastSyncAt,
    simulateOffline: s.simulateOffline,
    completedTripsTotal: s.completedTripsTotal,
  };
}

function fromSnapshot(snap: AppSnapshot): DriverState {
  return {
    ...initialDriverState(snap.route),
    profile: snap.profile,
    trip: snap.trip,
    pending: snap.pending,
    notifications: snap.notifications,
    lastSyncAt: snap.lastSyncAt,
    completedTripsTotal: snap.completedTripsTotal,
    simulateOffline: snap.simulateOffline,
  };
}

/**
 * Single source of truth for the driver app. Offline-first: every action updates local state,
 * is persisted immediately and queued for sync with the administration backend.
 */
export const [DriverStoreProvider, useDriverStore] = createContextHook<DriverStore>(() => {
  const [state, setState] = useState<DriverState>(() => fromSnapshot(SampleData.snapshot()));
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<DriverToast | null>(null);

  // Mirrors the latest state synchronously so chained actions read fresh values (like StateFlow.value).
  const stateRef = useRef(state);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useRef(new LocationTracker()).current;
  const network = useRef(new NetworkMonitor()).current;

  const actions = useMemo<DriverActions>(() => {
    const get = (): DriverState => stateRef.current;

    const update = (change: (s: DriverState) => DriverState): void => {
      const next = change(stateRef.current);
      stateRef.current = next;
      setState(next);
    };

    const persist = (): void => {
      void PersistenceService.save(snapshotOf(get()));
    };

    const emit = (message: string, kind: FeedbackKind = 'SUCCESS'): void => {
      notifyHaptic(kind);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ id: now(), message, kind });
      toastTimer.current = setTimeout(() => setToast(null), 2200);
    };

    /** GPS when it is within 60 km of the school; otherwise the fallback, flagged as estimated. */
    const stamp = (fallback: Coordinate | null | undefined): { coord: Coordinate | null; estimated: boolean } => {
      const gps = nearbyGps(get());
      return gps ? { coord: gps, estimated: false } : { coord: fallback ?? null, estimated: true };
    };

    const mutateRecord = (studentId: string, change: (r: StopRecord) => StopRecord): void => {
      update((s) => {
        const trip =
          currentLeg(s) === TripLeg.MORNING
            ? { ...s.trip, morning: { ...s.trip.morning, [studentId]: change(s.trip.morning[studentId] ?? emptyStopRecord()) } }
            : { ...s.trip, afternoon: { ...s.trip.afternoon, [studentId]: change(s.trip.afternoon[studentId] ?? emptyStopRecord()) } };
        return { ...s, trip };
      });
    };

    const sync = (): void => {
      const s = get();
      if (!isOnline(s) || s.isSyncing || s.pending.length === 0) return;
      update((st) => ({ ...st, isSyncing: true }));
      void (async () => {
        const batch = get().pending;
        try {
          await SyncService.send(batch);
          const sent = new Set(batch.map((a) => a.id));
          update((st) => ({ ...st, pending: st.pending.filter((a) => !sent.has(a.id)), lastSyncAt: now() }));
        } catch {
          console.warn('Sync: sync failed');
        }
        update((st) => ({ ...st, isSyncing: false }));
        persist();
      })();
    };

    const record = (
      kind: ActionKind,
      studentId: string | null = null,
      locationStamp: Coordinate | null = null,
      detail: string | null = null,
    ): void => {
      const action = { id: uuid(), kind, studentId, timestamp: now(), location: locationStamp, detail };
      update((s) => ({ ...s, pending: [...s.pending, action] }));
      persist();
      sync();
    };

    const startTrip = (): void => {
      if (get().trip.phase !== TripPhase.IDLE) return;
      update((s) => ({ ...s, trip: { ...s.trip, phase: TripPhase.MORNING_PICKUP, startedAt: now() } }));
      record(ActionKind.START_TRIP);
    };

    const pickUp = (studentId: string): void => {
      const { coord, estimated } = stamp(findStudent(get(), studentId)?.home);
      const morning = currentLeg(get()) === TripLeg.MORNING;
      mutateRecord(studentId, (r) => ({
        ...r,
        status: morning ? StopStatus.PICKED_UP : StopStatus.DROPPED_OFF,
        completedAt: now(),
        location: coord,
        isEstimatedLocation: estimated,
        arrivedAt: r.arrivedAt ?? now(),
      }));
      record(morning ? ActionKind.PICKED_UP : ActionKind.DROPPED_OFF, studentId, coord);
      emit((morning ? 'تم الاستلام · ' : 'تم التسليم · ') + ArabicFormat.time(now()));
    };

    return {
      async login(phone, code) {
        await delay(900);
        const digits = phone.replace(/[^0-9٠-٩]/g, '');
        if (digits.length < 10) return 'رقم الهاتف غير صحيح';
        if (code.length < 4) return 'رمز الدخول يجب أن يكون ٤ أرقام على الأقل';
        update((s) => ({ ...s, profile: { ...SampleData.profile, phone: digits } }));
        notifyHaptic('SUCCESS');
        persist();
        return null;
      },

      logout() {
        void PersistenceService.clear();
        const fresh = SampleData.snapshot();
        notifyHaptic('WARNING');
        update((s) => ({
          ...s,
          profile: null,
          route: fresh.route,
          trip: emptyTripState(),
          pending: [],
          notifications: fresh.notifications,
          emergencyActive: false,
        }));
      },

      startTrip,

      arrive(studentId) {
        if (get().trip.phase === TripPhase.IDLE) startTrip();
        const { coord, estimated } = stamp(findStudent(get(), studentId)?.home);
        mutateRecord(studentId, (r) => ({
          ...r,
          status: StopStatus.ARRIVED,
          arrivedAt: now(),
          location: coord,
          isEstimatedLocation: estimated,
        }));
        record(ActionKind.ARRIVED_AT_STOP, studentId, coord);
        emit('تم تسجيل الوصول · أُبلغ ولي الأمر');
      },

      pickUp,

      dropOff: pickUp,

      markAbsent(studentId, reason) {
        if (get().trip.phase === TripPhase.IDLE) startTrip();
        const { coord, estimated } = stamp(findStudent(get(), studentId)?.home);
        mutateRecord(studentId, (r) => ({
          ...r,
          status: StopStatus.ABSENT,
          completedAt: now(),
          location: coord,
          isEstimatedLocation: estimated,
        }));
        record(ActionKind.MARKED_ABSENT, studentId, coord, reason);
        emit('تم تسجيل الغياب', 'WARNING');
      },

      undo(studentId) {
        mutateRecord(studentId, () => emptyStopRecord());
        notifyHaptic('WARNING');
        persist();
      },

      arriveSchool() {
        if (get().trip.phase !== TripPhase.MORNING_PICKUP) return;
        const { coord } = stamp(get().route.school.coordinate);
        update((s) => ({
          ...s,
          trip: { ...s.trip, phase: TripPhase.AT_SCHOOL, schoolArrivalAt: now(), schoolArrivalLocation: coord },
        }));
        record(ActionKind.ARRIVED_AT_SCHOOL, null, coord);
        emit('تم تسجيل الوصول إلى المدرسة');
      },

      startReturn() {
        if (get().trip.phase !== TripPhase.AT_SCHOOL) return;
        update((s) => ({ ...s, trip: { ...s.trip, phase: TripPhase.RETURN_TRIP, returnStartedAt: now() } }));
        notifyHaptic('SUCCESS');
        record(ActionKind.START_RETURN);
      },

      endTrip() {
        update((s) => ({
          ...s,
          trip: { ...s.trip, phase: TripPhase.COMPLETED, completedAt: now() },
          completedTripsTotal: s.completedTripsTotal + 1,
        }));
        record(ActionKind.END_TRIP);
        emit('تم إرسال تقرير الرحلة إلى الإدارة');
      },

      resetForNewDay() {
        update((s) => ({ ...s, trip: emptyTripState() }));
        notifyHaptic('SUCCESS');
        persist();
      },

      triggerEmergency(type, note) {
        update((s) => ({ ...s, emergencyActive: true }));
        notifyHaptic('ERROR');
        record(ActionKind.EMERGENCY, null, stamp(currentPosition(get())).coord, `${type} — ${note}`);
      },

      resolveEmergency() {
        notifyHaptic('SUCCESS');
        update((s) => ({ ...s, emergencyActive: false }));
      },

      moveStop(from, to) {
        const stops = [...get().route.stops];
        if (from < 0 || from >= stops.length || to < 0 || to >= stops.length) return;
        const [moved] = stops.splice(from, 1);
        if (!moved) return;
        stops.splice(to, 0, moved);
        update((s) => ({
          ...s,
          route: { ...s.route, stops, optimizationMode: RouteOptimizationMode.MANUAL, updatedAt: now() },
        }));
        record(ActionKind.REORDER_STOPS, null, null, stops.map((st) => st.studentId).join(','));
      },

      applyOptimization(mode) {
        const route = get().route;
        const optimizer = mode === RouteOptimizationMode.AUTOMATIC ? NearestNeighborOptimizer : ManualRouteOptimizer;
        const pickups = route.stops.map((st) => st.pickupTime);
        const ordered = optimizer
          .order(route.stops, route.students, route.depot, route.school.coordinate)
          .map((stop, i) => ({ ...stop, pickupTime: pickups[i] ?? stop.pickupTime }));
        update((s) => ({ ...s, route: { ...s.route, stops: ordered, optimizationMode: mode, updatedAt: now() } }));
        record(ActionKind.REORDER_STOPS, null, null, mode);
        emit(mode === RouteOptimizationMode.AUTOMATIC ? 'تم تحسين الترتيب تلقائياً' : 'تم اعتماد الترتيب يدوياً');
      },

      markAllRead() {
        update((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, isRead: true })) }));
        notifyHaptic('SUCCESS');
        persist();
      },

      markRead(id) {
        update((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
        persist();
      },

      setSimulateOffline(value) {
        update((s) => ({ ...s, simulateOffline: value }));
        notifyHaptic(value ? 'WARNING' : 'SUCCESS');
        persist();
        if (!value) sync();
      },

      sync,

      checkConnection() {
        update((s) => ({ ...s, isChecking: true }));
        void (async () => {
          const ok = await SyncService.ping();
          update((s) => ({ ...s, isChecking: false }));
          if (ok && isOnline(get())) {
            sync();
            emit(get().pending.length === 0 ? 'الاتصال ممتاز · كل البيانات متزامنة' : 'متصل · جارٍ المزامنة');
          } else {
            emit('غير متصل · سيتم حفظ الإجراءات ومزامنتها لاحقاً', 'WARNING');
          }
        })();
      },
    };
  }, []);

  // Restore the persisted snapshot, then start connectivity monitoring and flush the queue.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [snap, connected] = await Promise.all([PersistenceService.load(), network.isConnectedNow()]);
      if (cancelled) return;
      const base = snap ? fromSnapshot(snap) : stateRef.current;
      stateRef.current = { ...base, networkConnected: connected };
      setState(stateRef.current);
      setHydrated(true);
      network.start((isConnected) => {
        const wasOnline = isOnline(stateRef.current);
        stateRef.current = { ...stateRef.current, networkConnected: isConnected };
        setState(stateRef.current);
        if (!wasOnline && isOnline(stateRef.current)) actions.sync();
      });
      actions.sync();
    })();
    return () => {
      cancelled = true;
      network.stop();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [actions, network]);

  // Ask for location once the driver is signed in, then stream GPS fixes into state.
  const loggedIn = state.profile != null;
  useEffect(() => {
    if (!loggedIn) return undefined;
    void (async () => {
      await location.requestPermission();
      await location.start((gps) => {
        stateRef.current = { ...stateRef.current, gps };
        setState(stateRef.current);
      });
    })();
    return () => location.stop();
  }, [loggedIn, location]);

  const derived = useMemo(() => deriveDriverState(state), [state]);

  return { state, derived, hydrated, toast, ...actions };
});
