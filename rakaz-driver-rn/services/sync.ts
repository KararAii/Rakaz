import type { PendingAction } from '@/types/models';

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Sends queued driver events to the backend. Simulated until the admin backend is connected. */
export const SyncService = {
  async send(actions: PendingAction[]): Promise<number> {
    await delay(900);
    return actions.length;
  },

  async ping(): Promise<boolean> {
    await delay(600);
    return true;
  },
};
