import {
  mapDriverActionToParent,
  statusAfterPickup,
  type ParentStatusPatch,
  type RakazTripEvent,
  type RakazTripSnapshot,
} from '@rakaz/contract';

import { TripKind, TripStatus, type Trip } from '@/types/models';

export interface ParentLivePatch {
  tripKind: TripKind;
  status: TripStatus | null;
  notification: ParentStatusPatch['notification'];
  handoverPending: boolean;
  switchToAfternoon: boolean;
  busLocation: { latitude: number; longitude: number } | null;
}

/** Convert a live Firestore trip snapshot into a store patch. */
export function patchFromTripSnapshot(snapshot: RakazTripSnapshot): ParentLivePatch {
  return {
    tripKind: snapshot.tripKind === 'afternoon' ? TripKind.afternoon : TripKind.morning,
    status: snapshot.status as TripStatus,
    notification: null,
    handoverPending: snapshot.handoverPending,
    switchToAfternoon: snapshot.tripKind === 'afternoon',
    busLocation: snapshot.busLocation,
  };
}

/**
 * Convert a single trip_events document into a store patch.
 * After pickup, advances to onTheWayToSchool to match the mock UX.
 */
export function patchFromTripEvent(event: RakazTripEvent): ParentLivePatch {
  const mapped = mapDriverActionToParent(event.action, event.tripKind);
  let status = mapped.status as TripStatus | null;
  if (event.action === 'PICKED_UP') {
    status = statusAfterPickup(event.tripKind) as TripStatus;
  }

  return {
    tripKind: event.tripKind === 'afternoon' ? TripKind.afternoon : TripKind.morning,
    status,
    notification: mapped.notification,
    handoverPending: mapped.handoverPending === true,
    switchToAfternoon: mapped.switchToAfternoon === true,
    busLocation: event.location,
  };
}

/** Apply a status onto a Trip model copy (pure helper for familyStore). */
export function withTripStatus(trip: Trip, status: TripStatus): Trip {
  return { ...trip, status };
}
