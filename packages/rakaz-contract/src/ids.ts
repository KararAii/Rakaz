/**
 * Canonical student / actor IDs used on the Firebase backend.
 * Both apps must emit and consume these IDs — never mix local demo keys in production events.
 */

/** Backend student id format, e.g. STU-24031 */
export type CanonicalStudentId = string;

/** Backend trip id format, e.g. TRIP-2026-10-07-R204-MORNING */
export type CanonicalTripId = string;

/** Firebase Auth uid */
export type FirebaseUid = string;

/**
 * Demo bridge between the two sample datasets.
 * Driver sample uses st-*; parent sample uses STU-*.
 * Production must replace this with a single Firestore `students` collection.
 */
export const DEMO_STUDENT_ID_BRIDGE: ReadonlyArray<{
  driverLocalId: string;
  canonicalId: CanonicalStudentId;
  parentLocalId: CanonicalStudentId;
  note: string;
}> = [
  {
    driverLocalId: 'st-1',
    canonicalId: 'STU-24031',
    parentLocalId: 'STU-24031',
    note: 'Demo only — names differ between apps until admin data is unified',
  },
  {
    driverLocalId: 'st-2',
    canonicalId: 'STU-24032',
    parentLocalId: 'STU-24032',
    note: 'Demo only',
  },
  {
    driverLocalId: 'st-3',
    canonicalId: 'STU-24033',
    parentLocalId: 'STU-24033',
    note: 'Demo bridge for driver sample st-3',
  },
  {
    driverLocalId: 'st-4',
    canonicalId: 'STU-24034',
    parentLocalId: 'STU-24034',
    note: 'Demo bridge for driver sample st-4',
  },
  {
    driverLocalId: 'st-5',
    canonicalId: 'STU-24035',
    parentLocalId: 'STU-24035',
    note: 'Demo bridge for driver sample st-5',
  },
];

const driverToCanonical = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.driverLocalId, row.canonicalId]));
const parentToCanonical = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.parentLocalId, row.canonicalId]));
const canonicalToDriver = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.canonicalId, row.driverLocalId]));

/** Map a driver-local student id (st-1) to the Firebase canonical id. */
export function toCanonicalStudentId(localId: string | null | undefined): CanonicalStudentId | null {
  if (!localId) return null;
  if (localId.startsWith('STU-')) return localId;
  return driverToCanonical.get(localId) ?? parentToCanonical.get(localId) ?? localId;
}

/** Map a canonical id back to the driver app's local sample id when needed for UI demo data. */
export function toDriverLocalStudentId(canonicalId: CanonicalStudentId): string {
  return canonicalToDriver.get(canonicalId) ?? canonicalId;
}

/** Build a deterministic daily trip document id. */
export function buildTripId(params: {
  dateISO: string; // YYYY-MM-DD
  routeId: string;
  tripKind: 'morning' | 'afternoon';
}): CanonicalTripId {
  const kind = params.tripKind === 'morning' ? 'MORNING' : 'AFTERNOON';
  return `TRIP-${params.dateISO}-${params.routeId}-${kind}`;
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
