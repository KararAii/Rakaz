import { RakazActionKind, type RakazNotificationKind, type RakazTripKind } from './events';

/**
 * Parent app TripStatus (numeric) — must match rakaz-parent-rn/types/models.ts TripStatus.
 */
export const ParentTripStatus = {
  notStarted: 0,
  preparing: 1,
  driverOnTheWay: 2,
  arrivedAtPickup: 3,
  studentPickedUp: 4,
  onTheWayToSchool: 5,
  arrivedAtSchool: 6,
  finished: 7,
} as const;

export type ParentTripStatusValue = (typeof ParentTripStatus)[keyof typeof ParentTripStatus];

export interface ParentStatusPatch {
  /** New status for the active trip kind, or null if the event does not change status. */
  status: ParentTripStatusValue | null;
  /** Optional notification to surface in the parent UI / FCM. */
  notification: RakazNotificationKind | null;
  /** Open the handover full-screen when afternoon drop-off completes. */
  handoverPending?: boolean;
  /** Switch parent activeKind to afternoon. */
  switchToAfternoon?: boolean;
}

/**
 * Precise driver ActionKind → parent TripStatus / notification mapping.
 * Cloud Functions and the parent client should both use this table.
 */
export function mapDriverActionToParent(
  action: RakazActionKind,
  tripKind: RakazTripKind,
): ParentStatusPatch {
  const morning = tripKind === 'morning';

  switch (action) {
    case RakazActionKind.START_TRIP:
      return {
        status: ParentTripStatus.driverOnTheWay,
        notification: morning ? 'tripStarted' : null,
      };

    case RakazActionKind.START_RETURN:
      return {
        status: ParentTripStatus.driverOnTheWay,
        notification: 'returnStarted',
        switchToAfternoon: true,
      };

    case RakazActionKind.ARRIVED_AT_STOP:
      return {
        status: ParentTripStatus.arrivedAtPickup,
        notification: null,
      };

    case RakazActionKind.PICKED_UP:
      return {
        status: ParentTripStatus.studentPickedUp,
        notification: 'pickedUp',
      };

    case RakazActionKind.DROPPED_OFF:
      // Afternoon home drop-off: parent treats arrivedAtSchool as «تم تسليم الطالب».
      return {
        status: ParentTripStatus.arrivedAtSchool,
        notification: 'delivered',
        handoverPending: true,
      };

    case RakazActionKind.ARRIVED_AT_SCHOOL:
      return {
        status: ParentTripStatus.arrivedAtSchool,
        notification: morning ? 'arrivedSchool' : null,
      };

    case RakazActionKind.END_TRIP:
      return {
        status: ParentTripStatus.finished,
        notification: null,
      };

    case RakazActionKind.MARKED_ABSENT:
      return {
        status: null,
        notification: 'admin',
      };

    case RakazActionKind.EMERGENCY:
      return {
        status: null,
        notification: 'delay',
      };

    case RakazActionKind.REORDER_STOPS:
      return {
        status: null,
        notification: null,
      };
    default:
      return {
        status: null,
        notification: null,
      };
  }
}

/**
 * After PICKED_UP on morning, the parent simulation advances to onTheWayToSchool.
 * Call this when applying student-scoped pickup if you want the same UX as the mock.
 */
export function statusAfterPickup(tripKind: RakazTripKind): ParentTripStatusValue {
  return tripKind === 'morning' ? ParentTripStatus.onTheWayToSchool : ParentTripStatus.onTheWayToSchool;
}
