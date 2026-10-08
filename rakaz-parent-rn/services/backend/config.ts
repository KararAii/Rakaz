/**
 * Backend mode for the parent app.
 * - `simulation`: local setInterval demo (offline).
 * - `http`: shared rakaz-api live trips + commands (recommended for linking).
 * - `firebase`: production Firestore listeners.
 */
export type ParentBackendMode = 'simulation' | 'http' | 'firebase';

export const PARENT_BACKEND_MODE: ParentBackendMode = 'http';
