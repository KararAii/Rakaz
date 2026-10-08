import type { ParentCommandApi, TripLiveSource } from '@rakaz/contract';

import { PARENT_BACKEND_MODE } from './config';
import { createFirebaseParentCommands, createFirebaseTripLiveSource } from './firebaseSource';
import { createHttpParentCommands, createHttpTripLiveSource } from './httpSource';
import { createLocalParentCommands } from './localCommands';
import { createSimulationTripLiveSource } from './simulationSource';

export { PARENT_BACKEND_MODE } from './config';
export { patchFromTripEvent, patchFromTripSnapshot, withTripStatus } from './applyEvent';
export type { ParentLivePatch } from './applyEvent';
export { resolveActiveTripId } from './httpSource';
export { getRakazApiUrl } from './apiUrl';

let live: TripLiveSource | null = null;
let commands: ParentCommandApi | null = null;

export function usesLiveBackend(): boolean {
  return PARENT_BACKEND_MODE === 'http' || PARENT_BACKEND_MODE === 'firebase';
}

export function getTripLiveSource(): TripLiveSource {
  if (live) return live;
  if (PARENT_BACKEND_MODE === 'firebase') live = createFirebaseTripLiveSource();
  else if (PARENT_BACKEND_MODE === 'http') live = createHttpTripLiveSource();
  else live = createSimulationTripLiveSource();
  return live;
}

export function getParentCommands(): ParentCommandApi {
  if (commands) return commands;
  if (PARENT_BACKEND_MODE === 'firebase') commands = createFirebaseParentCommands();
  else if (PARENT_BACKEND_MODE === 'http') commands = createHttpParentCommands();
  else commands = createLocalParentCommands();
  return commands;
}

export function resetParentBackend(): void {
  live = null;
  commands = null;
}
