import type { TripEventWriter } from '@rakaz/contract';

import { DRIVER_BACKEND_MODE } from './config';
import { createFirebaseTripEventWriter } from './firebaseWriter';
import { createHttpTripEventWriter, fetchTodayAbsences } from './httpWriter';
import { createLocalTripEventWriter } from './localWriter';

export { DRIVER_BACKEND_MODE, DEMO_ROUTE_ID } from './config';
export { pendingToTripEvents, snapshotFromEvents, inferTripKind } from './adaptPending';
export { activeTripId, tripKindFromState, tripKindFromLeg } from './tripContext';
export { fetchTodayAbsences } from './httpWriter';
export { getRakazApiUrl } from './apiUrl';

let writer: TripEventWriter | null = null;

/** Singleton writer selected by DRIVER_BACKEND_MODE. */
export function getTripEventWriter(): TripEventWriter {
  if (writer) return writer;
  if (DRIVER_BACKEND_MODE === 'firebase') writer = createFirebaseTripEventWriter();
  else if (DRIVER_BACKEND_MODE === 'http') writer = createHttpTripEventWriter();
  else writer = createLocalTripEventWriter();
  return writer;
}

/** Test helper — reset after switching mode in tests. */
export function resetTripEventWriter(): void {
  writer = null;
}

export async function pullParentAbsences(): Promise<Awaited<ReturnType<typeof fetchTodayAbsences>>> {
  if (DRIVER_BACKEND_MODE === 'local') return [];
  if (DRIVER_BACKEND_MODE === 'firebase') return [];
  try {
    return await fetchTodayAbsences();
  } catch (error) {
    console.warn('[RakazLink] pull absences failed', error);
    return [];
  }
}
