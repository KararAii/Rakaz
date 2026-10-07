import { RouteGeometry } from '@/services/routeGeometry';
import {
  type Absence,
  AbsenceScope,
  addressCoordinate,
  type AppNotification,
  type Coordinate,
  eventDate,
  isSameDay,
  isToday,
  type NotificationPreferences,
  schoolCoordinate,
  type Student,
  type SupportTicket,
  type Trip,
  TripKind,
  TripStatus,
} from '@/types/models';

/** Central guardian-side state (Swift `FamilyStore` stored properties). */
export interface FamilyState {
  students: Student[];
  selectedStudentID: string;
  morningTrip: Trip;
  returnTrip: Trip;
  activeKind: TripKind;
  notifications: AppNotification[];
  absences: Absence[];
  tickets: SupportTicket[];
  preferences: NotificationPreferences;
  banner: AppNotification | null;
  /** Raised when the return trip drops the student home; the guardian confirms the handover. */
  handoverPending: boolean;
  handoverConfirmedAt: number | null;
}

export interface Legs {
  first: Coordinate[];
  second: Coordinate[];
}

const FIRST_LEG_MINUTES = 12;
const SECOND_LEG_MINUTES = 18;

export function currentStudent(s: FamilyState): Student {
  return s.students.find((st) => st.id === s.selectedStudentID) ?? s.students[0];
}

export function tripFor(s: FamilyState, kind: TripKind): Trip {
  return kind === TripKind.morning ? s.morningTrip : s.returnTrip;
}

export function unreadCount(s: FamilyState): number {
  return s.notifications.filter((n) => !n.isRead).length;
}

export function todaysAbsence(s: FamilyState): Absence | null {
  return s.absences.find((a) => a.studentID === s.selectedStudentID && isToday(a.day)) ?? null;
}

export function isAbsentOn(s: FamilyState, kind: TripKind): boolean {
  const a = todaysAbsence(s);
  if (a == null) return false;
  switch (a.scope) {
    case AbsenceScope.fullDay:
      return true;
    case AbsenceScope.morningOnly:
      return kind === TripKind.morning;
    case AbsenceScope.returnOnly:
      return kind === TripKind.afternoon;
  }
}

export function homeCoordinate(s: FamilyState): Coordinate {
  return addressCoordinate(currentStudent(s).address);
}

export function schoolCoord(s: FamilyState): Coordinate {
  return schoolCoordinate(currentStudent(s).school);
}

/** First leg: bus heading to the pickup point. Second leg: carrying the student. */
export function legsFor(s: FamilyState, kind: TripKind): Legs {
  const home = homeCoordinate(s);
  const toHome = RouteGeometry.toHome(home);
  const toSchool = RouteGeometry.toSchool(home, schoolCoord(s));
  if (kind === TripKind.morning) return { first: toHome, second: toSchool };
  return { first: [...toHome, ...toSchool.slice(1)], second: [...toSchool].reverse() };
}

export function pickupCoordinate(s: FamilyState, kind: TripKind): Coordinate {
  return kind === TripKind.morning ? homeCoordinate(s) : schoolCoord(s);
}

export function dropoffCoordinate(s: FamilyState, kind: TripKind): Coordinate {
  return kind === TripKind.morning ? schoolCoord(s) : homeCoordinate(s);
}

export function vehicleCoordinate(s: FamilyState, kind: TripKind): Coordinate {
  const trip = tripFor(s, kind);
  const legs = legsFor(s, kind);
  switch (trip.status) {
    case TripStatus.notStarted:
    case TripStatus.preparing:
      return RouteGeometry.depot;
    case TripStatus.driverOnTheWay:
      return RouteGeometry.point(legs.first, trip.progress);
    case TripStatus.arrivedAtPickup:
    case TripStatus.studentPickedUp:
      return legs.second[0] ?? pickupCoordinate(s, kind);
    case TripStatus.onTheWayToSchool:
      return RouteGeometry.point(legs.second, trip.progress);
    case TripStatus.arrivedAtSchool:
    case TripStatus.finished:
      return legs.second[legs.second.length - 1] ?? dropoffCoordinate(s, kind);
  }
}

/** Minutes until the next milestone (pickup before boarding, destination after). */
export function etaMinutes(s: FamilyState, kind: TripKind): number {
  const trip = tripFor(s, kind);
  switch (trip.status) {
    case TripStatus.notStarted:
      return Math.max(0, Math.trunc((trip.scheduledStart - Date.now()) / 60_000) + FIRST_LEG_MINUTES);
    case TripStatus.preparing:
      return FIRST_LEG_MINUTES + 3;
    case TripStatus.driverOnTheWay:
      return Math.max(1, Math.ceil((1 - trip.progress) * FIRST_LEG_MINUTES));
    case TripStatus.arrivedAtPickup:
    case TripStatus.studentPickedUp:
      return SECOND_LEG_MINUTES;
    case TripStatus.onTheWayToSchool:
      return Math.max(1, Math.ceil((1 - trip.progress) * SECOND_LEG_MINUTES));
    case TripStatus.arrivedAtSchool:
    case TripStatus.finished:
      return 0;
  }
}

export function etaDate(s: FamilyState, kind: TripKind): number {
  const trip = tripFor(s, kind);
  if (trip.status >= TripStatus.arrivedAtSchool) return eventDate(trip, TripStatus.arrivedAtSchool) ?? trip.expectedArrival;
  if (trip.status === TripStatus.notStarted) return trip.expectedArrival;
  return Date.now() + etaMinutes(s, kind) * 60_000;
}

export function etaTitle(s: FamilyState, kind: TripKind): string {
  const trip = tripFor(s, kind);
  const morning = trip.kind === TripKind.morning;
  if (trip.status === TripStatus.notStarted) return morning ? 'الوصول المتوقع للمدرسة' : 'الوصول المتوقع للمنزل';
  if (trip.status < TripStatus.arrivedAtPickup) return morning ? 'وصول السائق إلى المنزل' : 'وصول السائق إلى المدرسة';
  if (trip.status >= TripStatus.arrivedAtSchool) return morning ? 'وصل إلى المدرسة' : 'وصل إلى المنزل';
  return morning ? 'الوصول المتوقع للمدرسة' : 'الوصول المتوقع للمنزل';
}

/** 0...1 progress across the whole trip (both legs). */
export function overallProgress(s: FamilyState, kind: TripKind): number {
  const trip = tripFor(s, kind);
  switch (trip.status) {
    case TripStatus.notStarted:
      return 0;
    case TripStatus.preparing:
      return 0.04;
    case TripStatus.driverOnTheWay:
      return 0.05 + trip.progress * 0.35;
    case TripStatus.arrivedAtPickup:
      return 0.42;
    case TripStatus.studentPickedUp:
      return 0.46;
    case TripStatus.onTheWayToSchool:
      return 0.48 + trip.progress * 0.5;
    case TripStatus.arrivedAtSchool:
    case TripStatus.finished:
      return 1;
  }
}

export function remainingDistanceKm(s: FamilyState, kind: TripKind): number {
  const trip = tripFor(s, kind);
  const legs = legsFor(s, trip.kind);
  const l1 = RouteGeometry.length(legs.first) / 1000;
  const l2 = RouteGeometry.length(legs.second) / 1000;
  switch (trip.status) {
    case TripStatus.notStarted:
    case TripStatus.preparing:
      return l1 + l2;
    case TripStatus.driverOnTheWay:
      return l1 * (1 - trip.progress) + l2;
    case TripStatus.arrivedAtPickup:
    case TripStatus.studentPickedUp:
      return l2;
    case TripStatus.onTheWayToSchool:
      return l2 * (1 - trip.progress);
    case TripStatus.arrivedAtSchool:
    case TripStatus.finished:
      return 0;
  }
}

export function absencesFor(s: FamilyState, studentID: string): Absence[] {
  return s.absences.filter((a) => a.studentID === studentID);
}

export function replaceAbsenceForDay(absences: Absence[], absence: Absence): Absence[] {
  const rest = absences.filter((a) => !(a.studentID === absence.studentID && isSameDay(a.day, absence.day)));
  return [absence, ...rest].sort((a, b) => b.day - a.day);
}

export function makeInitialTrips(): { morning: Trip; ret: Trip } {
  const now = Date.now();
  const morning: Trip = {
    id: 'TRIP-AM',
    kind: TripKind.morning,
    status: TripStatus.driverOnTheWay,
    scheduledStart: now - 60_000 * 6,
    expectedArrival: now + 60_000 * 8,
    progress: 0.32,
    distanceKm: 3.2,
    speedKmh: 34,
    events: [
      { id: 'ev-am-0', status: TripStatus.notStarted, date: now - 60_000 * 30, note: '' },
      { id: 'ev-am-1', status: TripStatus.preparing, date: now - 60_000 * 9, note: '' },
      { id: 'ev-am-2', status: TripStatus.driverOnTheWay, date: now - 60_000 * 5, note: '' },
    ],
    updatedAt: now,
  };
  const startDate = new Date(now);
  startDate.setHours(13, 15, 0, 0);
  const start = startDate.getTime();
  const ret: Trip = {
    id: 'TRIP-PM',
    kind: TripKind.afternoon,
    status: TripStatus.notStarted,
    scheduledStart: start,
    expectedArrival: start + 60_000 * 30,
    progress: 0,
    distanceKm: 4.6,
    speedKmh: 0,
    events: [],
    updatedAt: now,
  };
  return { morning, ret };
}
