import type { RakazTripEvent, RakazTripSnapshot, TripEventWriter } from '@rakaz/contract';
import { FirestorePaths } from '@rakaz/contract';

/**
 * Firebase implementation stub for the linking specialist.
 *
 * Replace the body with:
 *   - `firebase/app` + `firebase/firestore` (or `@react-native-firebase/firestore`)
 *   - batch.set(trip_events/{event.id}, event, { merge: true })
 *   - set(trips/{tripId}, snapshot fields, { merge: true })
 *
 * Paths are defined in `@rakaz/contract` → `FirestorePaths`.
 */
export function createFirebaseTripEventWriter(): TripEventWriter {
  return {
    async writeEvents(events: RakazTripEvent[]): Promise<void> {
      void FirestorePaths.tripEvent;
      void events;
      throw new Error(
        '[RakazLink] FirebaseTripEventWriter not implemented. ' +
          'Write each RakazTripEvent to FirestorePaths.tripEvent(event.id) with merge:true.',
      );
    },

    async upsertTrip(snapshot: Partial<RakazTripSnapshot> & Pick<RakazTripSnapshot, 'tripId'>): Promise<void> {
      void FirestorePaths.trip;
      void snapshot;
      throw new Error(
        '[RakazLink] FirebaseTripEventWriter.upsertTrip not implemented. ' +
          'Merge into FirestorePaths.trip(snapshot.tripId).',
      );
    },

    async ping(): Promise<boolean> {
      throw new Error('[RakazLink] Firebase ping not implemented.');
    },
  };
}
