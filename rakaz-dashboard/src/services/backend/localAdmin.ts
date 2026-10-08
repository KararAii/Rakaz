import {
  buildTripId,
  type CanonicalStudentId,
  type CanonicalTripId,
  type FirebaseUid,
  type RakazAbsenceReport,
  type RakazAdminApi,
  type RakazAdminDriver,
  type RakazAdminRoute,
  type RakazAdminStudent,
  type RakazTripEvent,
  type RakazTripSnapshot,
  type RakazUnsubscribe,
} from '@rakaz/contract';

import {
  DEMO_DRIVER,
  DEMO_ROUTE,
  DEMO_SCHOOL,
  DEMO_STUDENTS,
  demoAbsences,
  demoLiveTrips,
  demoOverview,
} from '@/data/demo';

/** In-memory admin API seeded with the same canonical IDs as the mobile demos. */
export function createLocalAdminApi(): RakazAdminApi {
  const students = [...DEMO_STUDENTS];
  const drivers = [DEMO_DRIVER];
  const routes = [DEMO_ROUTE];
  const schools = [DEMO_SCHOOL];
  let trips = demoLiveTrips();
  const absences: RakazAbsenceReport[] = demoAbsences();
  const tripListeners = new Set<(trips: RakazTripSnapshot[]) => void>();

  const emitTrips = (): void => {
    for (const listener of tripListeners) listener([...trips]);
  };

  return {
    async getOverview() {
      const active = trips.filter((t) => t.status > 0 && t.status < 7);
      return {
        ...demoOverview(),
        activeTrips: active.length,
        studentsOnBoard: active.filter((t) => t.status >= 4 && t.status <= 5).length,
        absencesToday: absences.length,
        openHandovers: trips.filter((t) => t.handoverPending).length,
        updatedAt: Date.now(),
      };
    },
    async listStudents() {
      return [...students];
    },
    async listDrivers() {
      return [...drivers];
    },
    async listRoutes() {
      return [...routes];
    },
    async listSchools() {
      return [...schools];
    },
    async listAbsencesToday() {
      return [...absences];
    },
    async listLiveTrips() {
      return [...trips];
    },
    watchLiveTrips(onChange): RakazUnsubscribe {
      tripListeners.add(onChange);
      onChange([...trips]);
      return () => {
        tripListeners.delete(onChange);
      };
    },
    watchTripEvents(_tripId: CanonicalTripId, _onEvent: (event: RakazTripEvent) => void): RakazUnsubscribe {
      return () => undefined;
    },
    async upsertStudent(student: RakazAdminStudent) {
      const i = students.findIndex((s) => s.id === student.id);
      if (i >= 0) students[i] = student;
      else students.push(student);
    },
    async upsertDriver(driver: RakazAdminDriver) {
      const i = drivers.findIndex((d) => d.uid === driver.uid);
      if (i >= 0) drivers[i] = driver;
      else drivers.push(driver);
    },
    async upsertRoute(route: RakazAdminRoute) {
      const i = routes.findIndex((r) => r.id === route.id);
      if (i >= 0) routes[i] = route;
      else routes.push(route);
    },
    async assignStudentToRoute(studentId: CanonicalStudentId, routeId: string, sequence: number) {
      const student = students.find((s) => s.id === studentId);
      if (student) student.routeId = routeId;
      const route = routes.find((r) => r.id === routeId);
      if (!route) return;
      const existing = route.stops.find((s) => s.studentId === studentId);
      if (existing) existing.sequence = sequence;
      else route.stops.push({ studentId, sequence, pickupTime: '07:00', dropoffTime: '13:30' });
      route.stops.sort((a, b) => a.sequence - b.sequence);
    },
    async assignDriverToRoute(driverUid: FirebaseUid, routeId: string) {
      const driver = drivers.find((d) => d.uid === driverUid);
      if (driver) driver.routeId = routeId;
      const route = routes.find((r) => r.id === routeId);
      if (route) route.driverUid = driverUid;
    },
    async openDailyTrips({ routeId, dateISO }) {
      const morningTripId = buildTripId({ dateISO, routeId, tripKind: 'morning' });
      const afternoonTripId = buildTripId({ dateISO, routeId, tripKind: 'afternoon' });
      const base = {
        routeId,
        status: 0,
        progress: 0,
        driverUid: routes.find((r) => r.id === routeId)?.driverUid ?? null,
        vehicleLabel: drivers.find((d) => d.routeId === routeId)?.vehicleLabel ?? null,
        updatedAt: Date.now(),
        handoverPending: false,
        handoverConfirmedAt: null,
        busLocation: null,
      };
      trips = [
        { ...base, tripId: morningTripId, tripKind: 'morning' },
        { ...base, tripId: afternoonTripId, tripKind: 'afternoon' },
      ];
      emitTrips();
      return { morningTripId, afternoonTripId };
    },
    async broadcastAdminNotice(params) {
      console.log('[RakazAdmin/local] broadcast', params.title, params.body);
    },
  };
}
