/**
 * Backend mode for the driver app.
 * - `local`: current offline queue + simulated SyncService (default, safe for Expo Go).
 * - `firebase`: use FirebaseTripEventWriter once the specialist fills in firebaseWriter.ts.
 */
export type DriverBackendMode = 'local' | 'firebase';

export const DRIVER_BACKEND_MODE: DriverBackendMode = 'local';

/** Route id used when building canonical trip ids from the demo sample. */
export const DEMO_ROUTE_ID = 'R-204';
