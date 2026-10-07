import type { PendingAction } from '@/types/models';

import { getTripEventWriter, pendingToTripEvents, snapshotFromEvents } from '@/services/backend';

/**
 * Sends queued driver events to the backend.
 * Uses `@rakaz/contract` payloads via services/backend (local stub or Firebase).
 */
export const SyncService = {
  async send(actions: PendingAction[]): Promise<number> {
    const writer = getTripEventWriter();
    const events = pendingToTripEvents(actions);
    await writer.writeEvents(events);
    const snapshot = snapshotFromEvents(events);
    if (snapshot) {
      await writer.upsertTrip(snapshot);
    }
    return actions.length;
  },

  async ping(): Promise<boolean> {
    return getTripEventWriter().ping();
  },
};
