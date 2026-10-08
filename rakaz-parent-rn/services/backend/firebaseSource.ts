import type {
  CanonicalStudentId,
  CanonicalTripId,
  ParentCommandApi,
  ParentNotificationApi,
  RakazAbsenceReport,
  RakazAddressUpdate,
  RakazHandoverResult,
  RakazParentNotification,
  RakazTripSnapshot,
  RakazUnsubscribe,
  TripLiveSource,
} from '@rakaz/contract';
import { FirestorePaths, buildTripId, todayISO } from '@rakaz/contract';

/**
 * Firebase stubs for the linking specialist.
 * Wire `onSnapshot(doc(db, FirestorePaths.trip(tripId)), …)` here.
 */
export function createFirebaseTripLiveSource(): TripLiveSource {
  return {
    watchTrip(
      tripId: CanonicalTripId,
      _onChange: (snapshot: RakazTripSnapshot | null) => void,
    ): RakazUnsubscribe {
      void FirestorePaths.trip(tripId);
      throw new Error(
        '[RakazLink] FirebaseTripLiveSource.watchTrip not implemented. ' +
          'Use onSnapshot on FirestorePaths.trip(tripId) and map fields to RakazTripSnapshot.',
      );
    },
  };
}

export function createFirebaseParentCommands(): ParentCommandApi {
  return {
    async reportAbsence(report: RakazAbsenceReport): Promise<void> {
      void FirestorePaths.absence;
      void report;
      throw new Error('[RakazLink] reportAbsence: write to absences/{id}');
    },
    async updateAddress(update: RakazAddressUpdate): Promise<void> {
      void FirestorePaths.address;
      void update;
      throw new Error('[RakazLink] updateAddress: merge addresses/{studentId}');
    },
    async confirmHandover(result: RakazHandoverResult): Promise<void> {
      void FirestorePaths.handover;
      void result;
      throw new Error('[RakazLink] confirmHandover: set handovers/{tripId} + trips.handoverConfirmedAt');
    },
    async reportHandoverIssue(result: RakazHandoverResult): Promise<void> {
      void result;
      throw new Error('[RakazLink] reportHandoverIssue: flag handover issue for admin');
    },
  };
}

export function createFirebaseParentNotifications(): ParentNotificationApi {
  return {
    watch(_guardianUid, _onChange: (items: RakazParentNotification[]) => void): RakazUnsubscribe {
      throw new Error('[RakazLink] parent notification watch not implemented');
    },
    async markRead(): Promise<void> {
      throw new Error('[RakazLink] markRead not implemented');
    },
    async markAllRead(): Promise<void> {
      throw new Error('[RakazLink] markAllRead not implemented');
    },
  };
}

/** Helper the specialist can call once route assignment exists in Firestore. */
export function suggestTripId(studentId: CanonicalStudentId, tripKind: 'morning' | 'afternoon', routeId = 'R-204'): CanonicalTripId {
  void studentId;
  return buildTripId({ dateISO: todayISO(), routeId, tripKind });
}
