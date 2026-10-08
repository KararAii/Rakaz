import type { RakazAbsenceReport, RakazGeoPoint, RakazTripEvent, RakazTripKind, RakazTripSnapshot } from './events';
import type { CanonicalStudentId, CanonicalTripId, FirebaseUid } from './ids';
import type { RakazUnsubscribe } from './repositories';

/** Admin-managed student record (source of truth for both apps). */
export interface RakazAdminStudent {
  id: CanonicalStudentId;
  internalNumber: string;
  fullName: string;
  firstName: string;
  grade: string;
  schoolId: string;
  schoolName: string;
  routeId: string | null;
  guardianName: string;
  guardianPhone: string;
  home: RakazGeoPoint;
  active: boolean;
}

export interface RakazAdminDriver {
  uid: FirebaseUid;
  name: string;
  phone: string;
  vehicleLabel: string;
  plateNumber: string;
  routeId: string | null;
  active: boolean;
}

export interface RakazAdminRouteStop {
  studentId: CanonicalStudentId;
  sequence: number;
  pickupTime: string;
  dropoffTime: string;
}

export interface RakazAdminRoute {
  id: string;
  name: string;
  schoolId: string;
  driverUid: FirebaseUid | null;
  stops: RakazAdminRouteStop[];
  active: boolean;
}

export interface RakazAdminSchool {
  id: string;
  name: string;
  address: string;
  coordinate: RakazGeoPoint;
}

/** Dashboard overview counters. */
export interface RakazAdminOverview {
  activeTrips: number;
  studentsOnBoard: number;
  absencesToday: number;
  openHandovers: number;
  offlineDrivers: number;
  updatedAt: number;
}

/**
 * Admin / dashboard API — create & supervise the data the mobile apps consume.
 * Implement with Firebase Admin SDK (Cloud Functions / Next server) or client SDK + strict rules.
 */
export interface RakazAdminApi {
  // —— Reads / live ——
  getOverview(): Promise<RakazAdminOverview>;
  listStudents(): Promise<RakazAdminStudent[]>;
  listDrivers(): Promise<RakazAdminDriver[]>;
  listRoutes(): Promise<RakazAdminRoute[]>;
  listSchools(): Promise<RakazAdminSchool[]>;
  listAbsencesToday(): Promise<RakazAbsenceReport[]>;
  listLiveTrips(): Promise<RakazTripSnapshot[]>;
  watchLiveTrips(onChange: (trips: RakazTripSnapshot[]) => void): RakazUnsubscribe;
  watchTripEvents(tripId: CanonicalTripId, onEvent: (event: RakazTripEvent) => void): RakazUnsubscribe;

  // —— Writes (seed the graph both apps read) ——
  upsertStudent(student: RakazAdminStudent): Promise<void>;
  upsertDriver(driver: RakazAdminDriver): Promise<void>;
  upsertRoute(route: RakazAdminRoute): Promise<void>;
  assignStudentToRoute(studentId: CanonicalStudentId, routeId: string, sequence: number): Promise<void>;
  assignDriverToRoute(driverUid: FirebaseUid, routeId: string): Promise<void>;

  /** Open today's morning/afternoon trip docs so the driver can start writing events. */
  openDailyTrips(params: { routeId: string; dateISO: string }): Promise<{
    morningTripId: CanonicalTripId;
    afternoonTripId: CanonicalTripId;
  }>;

  /** Broadcast an admin notification to guardians of a route or student. */
  broadcastAdminNotice(params: {
    title: string;
    body: string;
    studentIds?: CanonicalStudentId[];
    routeId?: string;
  }): Promise<void>;
}

export type { RakazTripKind };
