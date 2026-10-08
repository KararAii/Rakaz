/**
 * Backend mode for the admin dashboard.
 * - `local`: demo seed data (default) — safe without Firebase.
 * - `firebase`: use FirebaseAdminApi once the specialist fills firebaseAdmin.ts.
 */
export type DashboardBackendMode = 'local' | 'firebase';

export const DASHBOARD_BACKEND_MODE: DashboardBackendMode = 'local';
