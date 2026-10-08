import {
  FirestorePaths,
  type CanonicalTripId,
  type RakazAdminApi,
  type RakazTripEvent,
  type RakazUnsubscribe,
} from '@rakaz/contract';

/**
 * Firebase stub for the linking specialist.
 *
 * Suggested stack:
 * - Vite SPA + Firebase JS SDK (Auth email/password for admins), or
 * - Next.js App Router + Firebase Admin SDK on the server.
 *
 * Collections: see FirestorePaths in @rakaz/contract.
 */
export function createFirebaseAdminApi(): RakazAdminApi {
  const notReady = (method: string): never => {
    throw new Error(
      `[RakazLink] RakazAdminApi.${method} not implemented. ` +
        `Wire Firestore using paths from FirestorePaths (e.g. ${FirestorePaths.students()}).`,
    );
  };

  return {
    getOverview: async () => notReady('getOverview'),
    listStudents: async () => notReady('listStudents'),
    listDrivers: async () => notReady('listDrivers'),
    listRoutes: async () => notReady('listRoutes'),
    listSchools: async () => notReady('listSchools'),
    listAbsencesToday: async () => notReady('listAbsencesToday'),
    listLiveTrips: async () => notReady('listLiveTrips'),
    watchLiveTrips(): RakazUnsubscribe {
      return notReady('watchLiveTrips');
    },
    watchTripEvents(_tripId: CanonicalTripId, _onEvent: (e: RakazTripEvent) => void): RakazUnsubscribe {
      return notReady('watchTripEvents');
    },
    upsertStudent: async () => notReady('upsertStudent'),
    upsertDriver: async () => notReady('upsertDriver'),
    upsertRoute: async () => notReady('upsertRoute'),
    assignStudentToRoute: async () => notReady('assignStudentToRoute'),
    assignDriverToRoute: async () => notReady('assignDriverToRoute'),
    openDailyTrips: async () => notReady('openDailyTrips'),
    broadcastAdminNotice: async () => notReady('broadcastAdminNotice'),
  };
}
