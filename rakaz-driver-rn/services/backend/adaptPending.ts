import {
  mapDriverActionToParent,
  RakazActionKind,
  toCanonicalStudentId,
  type RakazTripEvent,
  type RakazTripKind,
  type RakazTripSnapshot,
} from '@rakaz/contract';

import type { PendingAction } from '@/types/models';

import { activeTripId } from './tripContext';
import { DEMO_ROUTE_ID } from './config';

function asRakazAction(kind: string): RakazActionKind {
  if ((Object.values(RakazActionKind) as string[]).includes(kind)) {
    return kind as RakazActionKind;
  }
  throw new Error(`[RakazLink] Unknown ActionKind: ${kind}`);
}

/** Infer trip kind from the action stream (START_RETURN flips the leg). */
export function inferTripKind(actions: PendingAction[], fallback: RakazTripKind = 'morning'): RakazTripKind {
  let kind = fallback;
  for (const action of actions) {
    if (action.kind === 'START_RETURN') kind = 'afternoon';
    if (action.kind === 'START_TRIP') kind = 'morning';
  }
  return kind;
}

/** Convert queued driver PendingAction rows into canonical RakazTripEvent payloads. */
export function pendingToTripEvents(
  actions: PendingAction[],
  opts: { routeId?: string; tripKind?: RakazTripKind; driverUid?: string | null } = {},
): RakazTripEvent[] {
  const routeId = opts.routeId ?? DEMO_ROUTE_ID;
  let tripKind = opts.tripKind ?? 'morning';

  return actions.map((action) => {
    if (action.kind === 'START_RETURN') tripKind = 'afternoon';
    if (action.kind === 'START_TRIP') tripKind = 'morning';

    return {
      id: action.id,
      tripId: activeTripId({ routeId, tripKind }),
      routeId,
      tripKind,
      action: asRakazAction(action.kind),
      studentId: toCanonicalStudentId(action.studentId),
      at: action.timestamp,
      location: action.location
        ? { latitude: action.location.latitude, longitude: action.location.longitude }
        : null,
      detail: action.detail,
      driverUid: opts.driverUid ?? null,
      schemaVersion: 1,
    };
  });
}

/** Build a trip snapshot patch from the last event in a flush batch. */
export function snapshotFromEvents(events: RakazTripEvent[]): RakazTripSnapshot | null {
  if (events.length === 0) return null;
  const last = events[events.length - 1]!;
  const patch = mapDriverActionToParent(last.action, last.tripKind);

  return {
    tripId: last.tripId,
    routeId: last.routeId,
    tripKind: last.tripKind,
    status: patch.status ?? 0,
    progress: 0,
    driverUid: last.driverUid,
    vehicleLabel: null,
    updatedAt: last.at,
    handoverPending: patch.handoverPending === true,
    handoverConfirmedAt: null,
    busLocation: last.location,
  };
}
