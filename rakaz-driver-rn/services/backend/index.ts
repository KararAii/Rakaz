import type { TripEventWriter } from '@rakaz/contract';

import { DRIVER_BACKEND_MODE } from './config';
import { createFirebaseTripEventWriter } from './firebaseWriter';
import { createLocalTripEventWriter } from './localWriter';

export { DRIVER_BACKEND_MODE, DEMO_ROUTE_ID } from './config';
export { pendingToTripEvents, snapshotFromEvents, inferTripKind } from './adaptPending';
export { activeTripId, tripKindFromState, tripKindFromLeg } from './tripContext';

let writer: TripEventWriter | null = null;

/** Singleton writer selected by DRIVER_BACKEND_MODE. */
export function getTripEventWriter(): TripEventWriter {
  if (writer) return writer;
  writer = DRIVER_BACKEND_MODE === 'firebase' ? createFirebaseTripEventWriter() : createLocalTripEventWriter();
  return writer;
}

/** Test helper — reset after switching mode in tests. */
export function resetTripEventWriter(): void {
  writer = null;
}
