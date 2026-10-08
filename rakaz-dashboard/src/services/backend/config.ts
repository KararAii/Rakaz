/**
 * Backend mode for the admin dashboard.
 * - `local`: in-memory demo (no server).
 * - `http`: shared rakaz-api (recommended for linking).
 * - `firebase`: production Firestore admin API.
 */
export type DashboardBackendMode = 'local' | 'http' | 'firebase';

export const DASHBOARD_BACKEND_MODE: DashboardBackendMode = 'http';
