import type {
  RakazAbsenceReport,
  RakazAddressUpdate,
  RakazHandoverResult,
  RakazParentNotification,
  RakazTripEvent,
  RakazTripSnapshot,
} from './events';
import type { CanonicalStudentId, CanonicalTripId, FirebaseUid } from './ids';

/** Unsubscribe handle returned by live listeners. */
export type RakazUnsubscribe = () => void;

/**
 * Driver → backend write API.
 * Implement with Firestore batch writes + offline queue (driver already has PendingAction queue).
 */
export interface TripEventWriter {
  /** Persist one or more events idempotently (doc id = event.id). */
  writeEvents(events: RakazTripEvent[]): Promise<void>;
  /** Upsert the live trip snapshot after applying events. */
  upsertTrip(snapshot: Partial<RakazTripSnapshot> & Pick<RakazTripSnapshot, 'tripId'>): Promise<void>;
  /** Connectivity probe. */
  ping(): Promise<boolean>;
}

/**
 * Parent ← backend live read API.
 * Prefer listening to `trips/{tripId}`; fall back to trip_events if needed.
 */
export interface TripLiveSource {
  /** Subscribe to the active trip for a student (morning or afternoon). */
  watchTrip(
    tripId: CanonicalTripId,
    onChange: (snapshot: RakazTripSnapshot | null) => void,
    onError?: (error: unknown) => void,
  ): RakazUnsubscribe;

  /** Optional: subscribe to new events for richer ETA / map updates. */
  watchEvents?(
    tripId: CanonicalTripId,
    onEvent: (event: RakazTripEvent) => void,
    onError?: (error: unknown) => void,
  ): RakazUnsubscribe;
}

/** Parent → backend commands. */
export interface ParentCommandApi {
  reportAbsence(report: RakazAbsenceReport): Promise<void>;
  updateAddress(update: RakazAddressUpdate): Promise<void>;
  confirmHandover(result: RakazHandoverResult): Promise<void>;
  reportHandoverIssue(result: RakazHandoverResult): Promise<void>;
}

/** Auth surface shared by both apps. */
export interface RakazAuthApi {
  signInWithPhone(phoneE164: string): Promise<{ verificationId: string }>;
  confirmCode(verificationId: string, code: string): Promise<{ uid: FirebaseUid }>;
  signOut(): Promise<void>;
  currentUid(): FirebaseUid | null;
}

/** Parent notification inbox (Firestore + optional FCM). */
export interface ParentNotificationApi {
  watch(
    guardianUid: FirebaseUid,
    onChange: (items: RakazParentNotification[]) => void,
  ): RakazUnsubscribe;
  markRead(guardianUid: FirebaseUid, id: string): Promise<void>;
  markAllRead(guardianUid: FirebaseUid): Promise<void>;
}

/** Bundle handed to each app at bootstrap. */
export interface RakazBackend {
  auth: RakazAuthApi;
  tripWriter: TripEventWriter;
  tripLive: TripLiveSource;
  parentCommands: ParentCommandApi;
  parentNotifications: ParentNotificationApi;
  /** Resolve which trip doc the parent should watch today. */
  resolveActiveTripId(params: {
    studentId: CanonicalStudentId;
    tripKind: 'morning' | 'afternoon';
    dateISO?: string;
  }): Promise<CanonicalTripId | null>;
}
