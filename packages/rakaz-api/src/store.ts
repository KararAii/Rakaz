import {
  mapDriverActionToParent,
  type RakazAbsenceReport,
  type RakazAddressUpdate,
  type RakazAdminDriver,
  type RakazAdminOverview,
  type RakazAdminRoute,
  type RakazAdminSchool,
  type RakazAdminStudent,
  type RakazHandoverResult,
  type RakazParentNotification,
  type RakazTripEvent,
  type RakazTripSnapshot,
  buildTripId,
  todayISO,
} from '@rakaz/contract';

import { SEED_DRIVER, SEED_ROUTE, SEED_SCHOOL, SEED_STUDENTS, seedTrips } from './seed.js';

type Listener = (payload: unknown) => void;

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export class RakazStore {
  students = [...SEED_STUDENTS];
  drivers = [SEED_DRIVER];
  routes = [SEED_ROUTE];
  schools = [SEED_SCHOOL];
  trips = seedTrips();
  events: RakazTripEvent[] = [];
  absences: RakazAbsenceReport[] = [];
  addresses = new Map<string, RakazAddressUpdate>();
  handovers: RakazHandoverResult[] = [];
  notifications: RakazParentNotification[] = [];

  private tripListeners = new Set<Listener>();
  private tripEventListeners = new Map<string, Set<Listener>>();

  overview(): RakazAdminOverview {
    const active = this.trips.filter((t) => t.status > 0 && t.status < 7);
    return {
      activeTrips: active.length,
      studentsOnBoard: active.filter((t) => t.status >= 4 && t.status <= 5).length,
      absencesToday: this.absencesToday().length,
      openHandovers: this.trips.filter((t) => t.handoverPending).length,
      offlineDrivers: this.drivers.filter((d) => !d.active).length,
      updatedAt: Date.now(),
    };
  }

  absencesToday(): RakazAbsenceReport[] {
    const start = startOfToday();
    const end = start + 86_400_000;
    return this.absences.filter((a) => a.day >= start && a.day < end);
  }

  upsertStudent(student: RakazAdminStudent): void {
    const i = this.students.findIndex((s) => s.id === student.id);
    if (i >= 0) this.students[i] = student;
    else this.students.push(student);
  }

  upsertDriver(driver: RakazAdminDriver): void {
    const i = this.drivers.findIndex((d) => d.uid === driver.uid);
    if (i >= 0) this.drivers[i] = driver;
    else this.drivers.push(driver);
  }

  upsertRoute(route: RakazAdminRoute): void {
    const i = this.routes.findIndex((r) => r.id === route.id);
    if (i >= 0) this.routes[i] = route;
    else this.routes.push(route);
  }

  upsertSchool(school: RakazAdminSchool): void {
    const i = this.schools.findIndex((s) => s.id === school.id);
    if (i >= 0) this.schools[i] = school;
    else this.schools.push(school);
  }

  assignStudent(studentId: string, routeId: string, sequence: number): void {
    const student = this.students.find((s) => s.id === studentId);
    if (student) student.routeId = routeId;
    const route = this.routes.find((r) => r.id === routeId);
    if (!route) return;
    const existing = route.stops.find((s) => s.studentId === studentId);
    if (existing) existing.sequence = sequence;
    else route.stops.push({ studentId, sequence, pickupTime: '07:00', dropoffTime: '13:30' });
    route.stops.sort((a, b) => a.sequence - b.sequence);
  }

  assignDriver(driverUid: string, routeId: string): void {
    const driver = this.drivers.find((d) => d.uid === driverUid);
    if (driver) driver.routeId = routeId;
    const route = this.routes.find((r) => r.id === routeId);
    if (route) route.driverUid = driverUid;
  }

  openDailyTrips(routeId: string, dateISO: string): { morningTripId: string; afternoonTripId: string } {
    const morningTripId = buildTripId({ dateISO, routeId, tripKind: 'morning' });
    const afternoonTripId = buildTripId({ dateISO, routeId, tripKind: 'afternoon' });
    const driverUid = this.routes.find((r) => r.id === routeId)?.driverUid ?? null;
    const vehicleLabel = this.drivers.find((d) => d.uid === driverUid)?.vehicleLabel ?? null;
    const base = {
      routeId,
      status: 0,
      progress: 0,
      driverUid,
      vehicleLabel,
      updatedAt: Date.now(),
      handoverPending: false,
      handoverConfirmedAt: null,
      busLocation: null as { latitude: number; longitude: number } | null,
    };
    const next: RakazTripSnapshot[] = [
      { ...base, tripId: morningTripId, tripKind: 'morning' },
      { ...base, tripId: afternoonTripId, tripKind: 'afternoon' },
    ];
    this.trips = [...this.trips.filter((t) => t.routeId !== routeId || !t.tripId.includes(dateISO)), ...next];
    this.emitTrips();
    return { morningTripId, afternoonTripId };
  }

  writeEvents(events: RakazTripEvent[]): void {
    for (const event of events) {
      const i = this.events.findIndex((e) => e.id === event.id);
      if (i >= 0) this.events[i] = event;
      else this.events.push(event);

      const patch = mapDriverActionToParent(event.action, event.tripKind);
      let trip = this.trips.find((t) => t.tripId === event.tripId);
      let status = patch.status ?? trip?.status ?? 0;
      if (event.action === 'PICKED_UP') status = 5; // onTheWayToSchool — matches parent mock UX

      if (!trip) {
        trip = {
          tripId: event.tripId,
          routeId: event.routeId,
          tripKind: event.tripKind,
          status,
          progress: 0,
          driverUid: event.driverUid,
          vehicleLabel: null,
          updatedAt: event.at,
          handoverPending: patch.handoverPending === true,
          handoverConfirmedAt: null,
          busLocation: event.location,
        };
        this.trips.push(trip);
      } else {
        trip.status = status;
        trip.updatedAt = event.at;
        trip.busLocation = event.location ?? trip.busLocation;
        trip.handoverPending = patch.handoverPending === true ? true : trip.handoverPending;
        if (patch.switchToAfternoon) trip.tripKind = 'afternoon';
      }

      if (patch.notification) {
        this.notifications.unshift({
          id: `n-${event.id}`,
          kind: patch.notification,
          title: patch.notification,
          body: `${event.action} · ${event.studentId ?? event.tripId}`,
          studentId: event.studentId,
          tripId: event.tripId,
          at: event.at,
          read: false,
        });
      }

      this.emitTripEvents(event.tripId, event);
    }
    this.emitTrips();
  }

  upsertTrip(partial: Partial<RakazTripSnapshot> & Pick<RakazTripSnapshot, 'tripId'>): void {
    const i = this.trips.findIndex((t) => t.tripId === partial.tripId);
    if (i >= 0) this.trips[i] = { ...this.trips[i]!, ...partial, updatedAt: Date.now() };
    else {
      this.trips.push({
        tripId: partial.tripId,
        routeId: partial.routeId ?? 'R-204',
        tripKind: partial.tripKind ?? 'morning',
        status: partial.status ?? 0,
        progress: partial.progress ?? 0,
        driverUid: partial.driverUid ?? null,
        vehicleLabel: partial.vehicleLabel ?? null,
        updatedAt: Date.now(),
        handoverPending: partial.handoverPending ?? false,
        handoverConfirmedAt: partial.handoverConfirmedAt ?? null,
        busLocation: partial.busLocation ?? null,
      });
    }
    this.emitTrips();
  }

  reportAbsence(report: RakazAbsenceReport): void {
    const i = this.absences.findIndex((a) => a.id === report.id);
    if (i >= 0) this.absences[i] = report;
    else this.absences.push(report);
  }

  updateAddress(update: RakazAddressUpdate): void {
    this.addresses.set(update.studentId, update);
    const student = this.students.find((s) => s.id === update.studentId);
    if (student) {
      student.home = update.coordinate;
    }
  }

  confirmHandover(result: RakazHandoverResult): void {
    this.handovers.push(result);
    const trip = this.trips.find((t) => t.tripId === result.tripId);
    if (trip) {
      trip.handoverPending = false;
      trip.handoverConfirmedAt = result.at;
      trip.updatedAt = result.at;
      this.emitTrips();
    }
  }

  resolveTripId(studentId: string, tripKind: 'morning' | 'afternoon', dateISO = todayISO()): string | null {
    const student = this.students.find((s) => s.id === studentId);
    const routeId = student?.routeId ?? 'R-204';
    return buildTripId({ dateISO, routeId, tripKind });
  }

  broadcast(params: { title: string; body: string; studentIds?: string[]; routeId?: string }): void {
    const targets =
      params.studentIds ??
      this.students.filter((s) => !params.routeId || s.routeId === params.routeId).map((s) => s.id);
    for (const studentId of targets) {
      this.notifications.unshift({
        id: `admin-${Date.now()}-${studentId}`,
        kind: 'admin',
        title: params.title,
        body: params.body,
        studentId,
        tripId: null,
        at: Date.now(),
        read: false,
      });
    }
  }

  onTrips(listener: Listener): () => void {
    this.tripListeners.add(listener);
    listener(this.trips);
    return () => this.tripListeners.delete(listener);
  }

  onTripEvents(tripId: string, listener: Listener): () => void {
    if (!this.tripEventListeners.has(tripId)) this.tripEventListeners.set(tripId, new Set());
    this.tripEventListeners.get(tripId)!.add(listener);
    return () => this.tripEventListeners.get(tripId)?.delete(listener);
  }

  private emitTrips(): void {
    for (const listener of this.tripListeners) listener([...this.trips]);
  }

  private emitTripEvents(tripId: string, event: RakazTripEvent): void {
    const set = this.tripEventListeners.get(tripId);
    if (!set) return;
    for (const listener of set) listener(event);
  }
}

export const store = new RakazStore();
