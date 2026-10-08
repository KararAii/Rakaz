import type { CanonicalStudentId, CanonicalTripId, FirebaseUid } from './ids';

/**
 * Canonical Firestore collection / document paths for Rakaz.
 * Keep Cloud Functions, Security Rules, and both apps aligned to these helpers.
 */
export const FirestorePaths = {
  users: () => 'users',
  user: (uid: FirebaseUid) => `users/${uid}`,

  students: () => 'students',
  student: (studentId: CanonicalStudentId) => `students/${studentId}`,

  drivers: () => 'drivers',
  driver: (uid: FirebaseUid) => `drivers/${uid}`,

  guardians: () => 'guardians',
  guardian: (uid: FirebaseUid) => `guardians/${uid}`,
  guardianStudents: (uid: FirebaseUid) => `guardians/${uid}/students`,

  routes: () => 'routes',
  route: (routeId: string) => `routes/${routeId}`,

  trips: () => 'trips',
  trip: (tripId: CanonicalTripId) => `trips/${tripId}`,

  tripEvents: () => 'trip_events',
  tripEvent: (eventId: string) => `trip_events/${eventId}`,

  absences: () => 'absences',
  absence: (id: string) => `absences/${id}`,

  addresses: () => 'addresses',
  address: (studentId: CanonicalStudentId) => `addresses/${studentId}`,

  handovers: () => 'handovers',
  handover: (tripId: CanonicalTripId) => `handovers/${tripId}`,

  parentNotifications: (guardianUid: FirebaseUid) => `guardians/${guardianUid}/notifications`,
  parentNotification: (guardianUid: FirebaseUid, id: string) => `guardians/${guardianUid}/notifications/${id}`,

  schools: () => 'schools',
  school: (schoolId: string) => `schools/${schoolId}`,

  adminMeta: () => 'admin_meta/overview',
} as const;

/** Suggested composite indexes (document for the Firebase console). */
export const SUGGESTED_INDEXES = [
  'trip_events: tripId ASC, at ASC',
  'trip_events: studentId ASC, at DESC',
  'trips: routeId ASC, tripKind ASC, updatedAt DESC',
  'absences: studentId ASC, day DESC',
] as const;
