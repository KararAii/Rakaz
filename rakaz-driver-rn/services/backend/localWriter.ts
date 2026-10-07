import type { RakazTripEvent, RakazTripSnapshot, TripEventWriter } from '@rakaz/contract';

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Local stand-in used until Firebase is wired.
 * Accepts the same payloads the Firebase writer will persist.
 */
export function createLocalTripEventWriter(): TripEventWriter {
  return {
    async writeEvents(events: RakazTripEvent[]): Promise<void> {
      await delay(900);
      if (__DEV__ && events.length > 0) {
        console.log(`[RakazLink/local] wrote ${events.length} trip event(s)`, events.map((e) => e.action).join(','));
      }
    },

    async upsertTrip(snapshot: Partial<RakazTripSnapshot> & Pick<RakazTripSnapshot, 'tripId'>): Promise<void> {
      await delay(120);
      if (__DEV__) {
        console.log(`[RakazLink/local] upsert trip ${snapshot.tripId} status=${snapshot.status ?? '?'}`);
      }
    },

    async ping(): Promise<boolean> {
      await delay(600);
      return true;
    },
  };
}
