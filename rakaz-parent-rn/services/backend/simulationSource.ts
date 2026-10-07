import type { CanonicalTripId, RakazTripSnapshot, RakazUnsubscribe, TripLiveSource } from '@rakaz/contract';

/**
 * No-op live source used while PARENT_BACKEND_MODE === 'simulation'.
 * The existing familyStore setInterval remains the demo engine.
 */
export function createSimulationTripLiveSource(): TripLiveSource {
  return {
    watchTrip(
      _tripId: CanonicalTripId,
      _onChange: (snapshot: RakazTripSnapshot | null) => void,
    ): RakazUnsubscribe {
      return () => undefined;
    },
  };
}
