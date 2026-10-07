import type { ParentCommandApi, TripLiveSource } from '@rakaz/contract';

import { PARENT_BACKEND_MODE } from './config';
import {
  createFirebaseParentCommands,
  createFirebaseTripLiveSource,
} from './firebaseSource';
import { createLocalParentCommands } from './localCommands';
import { createSimulationTripLiveSource } from './simulationSource';

export { PARENT_BACKEND_MODE } from './config';
export { patchFromTripEvent, patchFromTripSnapshot, withTripStatus } from './applyEvent';
export type { ParentLivePatch } from './applyEvent';

let live: TripLiveSource | null = null;
let commands: ParentCommandApi | null = null;

export function getTripLiveSource(): TripLiveSource {
  if (live) return live;
  live = PARENT_BACKEND_MODE === 'firebase' ? createFirebaseTripLiveSource() : createSimulationTripLiveSource();
  return live;
}

export function getParentCommands(): ParentCommandApi {
  if (commands) return commands;
  commands = PARENT_BACKEND_MODE === 'firebase' ? createFirebaseParentCommands() : createLocalParentCommands();
  return commands;
}

export function resetParentBackend(): void {
  live = null;
  commands = null;
}
