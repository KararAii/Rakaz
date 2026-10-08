import {
  RakazHttpPaths,
  type CanonicalStudentId,
  type CanonicalTripId,
  type FirebaseUid,
  type RakazAbsenceReport,
  type RakazAdminApi,
  type RakazAdminDriver,
  type RakazAdminOverview,
  type RakazAdminRoute,
  type RakazAdminSchool,
  type RakazAdminStudent,
  type RakazTripEvent,
  type RakazTripSnapshot,
  type RakazUnsubscribe,
} from '@rakaz/contract';

import { getRakazApiUrl } from './apiUrl';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getRakazApiUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    throw new Error(`[RakazAPI] ${response.status} ${path}: ${await response.text()}`);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function createHttpAdminApi(): RakazAdminApi {
  return {
    getOverview: () => request<RakazAdminOverview>(RakazHttpPaths.overview),
    listStudents: () => request<RakazAdminStudent[]>(RakazHttpPaths.students),
    listDrivers: () => request<RakazAdminDriver[]>(RakazHttpPaths.drivers),
    listRoutes: () => request<RakazAdminRoute[]>(RakazHttpPaths.routes),
    listSchools: () => request<RakazAdminSchool[]>(RakazHttpPaths.schools),
    listAbsencesToday: () => request<RakazAbsenceReport[]>(RakazHttpPaths.absencesToday),
    listLiveTrips: () => request<RakazTripSnapshot[]>(RakazHttpPaths.trips),
    watchLiveTrips(onChange): RakazUnsubscribe {
      const url = `${getRakazApiUrl()}${RakazHttpPaths.streamTrips}`;
      const source = new EventSource(url);
      source.onmessage = (ev) => {
        try {
          onChange(JSON.parse(ev.data) as RakazTripSnapshot[]);
        } catch {
          /* ignore */
        }
      };
      source.onerror = () => {
        /* browser auto-reconnects */
      };
      return () => source.close();
    },
    watchTripEvents(tripId: CanonicalTripId, onEvent: (event: RakazTripEvent) => void): RakazUnsubscribe {
      const url = `${getRakazApiUrl()}${RakazHttpPaths.streamTrip(tripId)}`;
      const source = new EventSource(url);
      source.addEventListener('trip_event', (ev) => {
        try {
          onEvent(JSON.parse((ev as MessageEvent).data) as RakazTripEvent);
        } catch {
          /* ignore */
        }
      });
      return () => source.close();
    },
    async upsertStudent(student: RakazAdminStudent): Promise<void> {
      await request(RakazHttpPaths.student(student.id), { method: 'PUT', body: JSON.stringify(student) });
    },
    async upsertDriver(driver: RakazAdminDriver): Promise<void> {
      await request(RakazHttpPaths.driver(driver.uid), { method: 'PUT', body: JSON.stringify(driver) });
    },
    async upsertRoute(route: RakazAdminRoute): Promise<void> {
      await request(RakazHttpPaths.route(route.id), { method: 'PUT', body: JSON.stringify(route) });
    },
    async assignStudentToRoute(studentId: CanonicalStudentId, routeId: string, sequence: number): Promise<void> {
      await request(RakazHttpPaths.assignStudent, {
        method: 'POST',
        body: JSON.stringify({ studentId, routeId, sequence }),
      });
    },
    async assignDriverToRoute(driverUid: FirebaseUid, routeId: string): Promise<void> {
      await request(RakazHttpPaths.assignDriver, {
        method: 'POST',
        body: JSON.stringify({ driverUid, routeId }),
      });
    },
    openDailyTrips: (params) =>
      request(RakazHttpPaths.openDailyTrips, { method: 'POST', body: JSON.stringify(params) }),
    async broadcastAdminNotice(params): Promise<void> {
      await request(RakazHttpPaths.broadcast, { method: 'POST', body: JSON.stringify(params) });
    },
  };
}
