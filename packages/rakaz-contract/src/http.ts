/** Default local linking API (rakaz-api). Override with EXPO_PUBLIC_RAKAZ_API_URL / VITE_RAKAZ_API_URL. */
export const DEFAULT_RAKAZ_API_URL = 'http://127.0.0.1:8787';

export const RakazHttpPaths = {
  health: '/health',
  overview: '/admin/overview',
  students: '/admin/students',
  student: (id: string) => `/admin/students/${encodeURIComponent(id)}`,
  drivers: '/admin/drivers',
  driver: (uid: string) => `/admin/drivers/${encodeURIComponent(uid)}`,
  routes: '/admin/routes',
  route: (id: string) => `/admin/routes/${encodeURIComponent(id)}`,
  schools: '/admin/schools',
  absences: '/admin/absences',
  absencesToday: '/admin/absences/today',
  trips: '/admin/trips',
  trip: (id: string) => `/trips/${encodeURIComponent(id)}`,
  tripEvents: (tripId: string) => `/trips/${encodeURIComponent(tripId)}/events`,
  openDailyTrips: '/admin/trips/open-daily',
  assignStudent: '/admin/assign/student',
  assignDriver: '/admin/assign/driver',
  broadcast: '/admin/broadcast',
  events: '/events',
  absence: '/absences',
  address: '/addresses',
  handover: '/handovers',
  streamTrips: '/stream/trips',
  streamTrip: (id: string) => `/stream/trips/${encodeURIComponent(id)}`,
  resolveTrip: '/trips/resolve',
} as const;

export function resolveRakazApiUrl(explicit?: string | null): string {
  if (explicit && explicit.length > 0) return explicit.replace(/\/$/, '');
  return DEFAULT_RAKAZ_API_URL;
}
