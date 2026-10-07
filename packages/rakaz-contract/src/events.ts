import type { CanonicalStudentId, CanonicalTripId, FirebaseUid } from './ids';

/** Geo point shared by both apps and Firestore. */
export interface RakazGeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * Driver action kinds — must stay identical to `ActionKind` in rakaz-driver-rn/types/models.ts.
 * The Firebase specialist writes these as `trip_events.action`.
 */
export enum RakazActionKind {
  START_TRIP = 'START_TRIP',
  ARRIVED_AT_STOP = 'ARRIVED_AT_STOP',
  PICKED_UP = 'PICKED_UP',
  MARKED_ABSENT = 'MARKED_ABSENT',
  ARRIVED_AT_SCHOOL = 'ARRIVED_AT_SCHOOL',
  START_RETURN = 'START_RETURN',
  DROPPED_OFF = 'DROPPED_OFF',
  END_TRIP = 'END_TRIP',
  EMERGENCY = 'EMERGENCY',
  REORDER_STOPS = 'REORDER_STOPS',
}

export type RakazTripKind = 'morning' | 'afternoon';

/**
 * One immutable event written by the driver app (or SyncService flush).
 * This is the primary wire format between driver → Firestore → parent.
 */
export interface RakazTripEvent {
  /** Client-generated uuid; also used as Firestore document id for idempotent writes. */
  id: string;
  tripId: CanonicalTripId;
  routeId: string;
  tripKind: RakazTripKind;
  action: RakazActionKind;
  /** Canonical STU-* id when the event is about a student; null for trip-level actions. */
  studentId: CanonicalStudentId | null;
  /** Epoch ms (device clock). Cloud Function may also set serverTimestamp. */
  at: number;
  location: RakazGeoPoint | null;
  /** Free-text detail (absence reason, emergency note, reorder payload). */
  detail: string | null;
  driverUid: FirebaseUid | null;
  /** Schema version for forward-compatible Cloud Functions. */
  schemaVersion: 1;
}

/**
 * Live trip document mirrored in Firestore `trips/{tripId}`.
 * Parent app listens to this (preferred) or derives state from trip_events.
 */
export interface RakazTripSnapshot {
  tripId: CanonicalTripId;
  routeId: string;
  tripKind: RakazTripKind;
  /** Parent TripStatus numeric value 0..7 — see mapping.ts */
  status: number;
  /** 0..1 progress hint for map animation; optional. */
  progress: number;
  driverUid: FirebaseUid | null;
  vehicleLabel: string | null;
  updatedAt: number;
  /** Set when afternoon drop-off happens; parent shows handover sheet. */
  handoverPending: boolean;
  handoverConfirmedAt: number | null;
  /** Last known bus position for the live map. */
  busLocation: RakazGeoPoint | null;
}

/** Parent → backend absence report. */
export interface RakazAbsenceReport {
  id: string;
  studentId: CanonicalStudentId;
  /** Start of local calendar day as epoch ms. */
  day: number;
  scope: 'fullDay' | 'morningOnly' | 'returnOnly';
  reason: 'none' | 'sick' | 'family' | 'travel' | 'appointment' | 'other';
  note: string;
  createdAt: number;
  guardianUid: FirebaseUid | null;
}

/** Parent → backend home address update. */
export interface RakazAddressUpdate {
  studentId: CanonicalStudentId;
  label: string;
  area: string;
  street: string;
  coordinate: RakazGeoPoint;
  updatedAt: number;
  guardianUid: FirebaseUid | null;
}

/** Parent → backend handover confirmation / issue. */
export interface RakazHandoverResult {
  tripId: CanonicalTripId;
  studentId: CanonicalStudentId;
  confirmed: boolean;
  issueReported: boolean;
  at: number;
  guardianUid: FirebaseUid | null;
}

/** Push / in-app notification kinds on the parent side. */
export type RakazNotificationKind =
  | 'tripReminder'
  | 'tripStarted'
  | 'driverNear'
  | 'pickedUp'
  | 'arrivedSchool'
  | 'returnStarted'
  | 'delivered'
  | 'payment'
  | 'delay'
  | 'admin';

export interface RakazParentNotification {
  id: string;
  kind: RakazNotificationKind;
  title: string;
  body: string;
  studentId: CanonicalStudentId | null;
  tripId: CanonicalTripId | null;
  at: number;
  read: boolean;
}
