/**
 * Backend mode for the driver app.
 * - `local`: offline queue with local stub (no shared server).
 * - `http`: shared rakaz-api (recommended for linking demos).
 * - `firebase`: production Firestore writer.
 */
export type DriverBackendMode = 'local' | 'http' | 'firebase';

export const DRIVER_BACKEND_MODE: DriverBackendMode = 'http';

/** Route id used when building canonical trip ids from the demo sample. */
export const DEMO_ROUTE_ID = 'R-204';
