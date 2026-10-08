import { buildTripId, todayISO, type CanonicalTripId, type RakazTripKind } from '@rakaz/contract';

import { DEMO_ROUTE_ID } from './config';
import { TripLeg, TripPhase, type TripState } from '@/types/models';

/** Derive morning/afternoon from the live driver trip phase. */
export function tripKindFromState(trip: TripState): RakazTripKind {
  return trip.phase === TripPhase.RETURN_TRIP ? 'afternoon' : 'morning';
}

export function tripKindFromLeg(leg: TripLeg | null): RakazTripKind {
  return leg === TripLeg.AFTERNOON ? 'afternoon' : 'morning';
}

export function activeTripId(params: {
  routeId?: string;
  tripKind: RakazTripKind;
  dateISO?: string;
}): CanonicalTripId {
  return buildTripId({
    dateISO: params.dateISO ?? todayISO(),
    routeId: params.routeId ?? DEMO_ROUTE_ID,
    tripKind: params.tripKind,
  });
}
