/**
 * Backend mode for the parent app.
 * - `simulation`: keep local setInterval demo (default).
 * - `firebase`: subscribe via FirebaseTripLiveSource once implemented.
 */
export type ParentBackendMode = 'simulation' | 'firebase';

export const PARENT_BACKEND_MODE: ParentBackendMode = 'simulation';
