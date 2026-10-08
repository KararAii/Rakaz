import {
  RakazHttpPaths,
  type CanonicalTripId,
  type ParentCommandApi,
  type RakazAbsenceReport,
  type RakazAddressUpdate,
  type RakazHandoverResult,
  type RakazTripSnapshot,
  type RakazUnsubscribe,
  type TripLiveSource,
} from '@rakaz/contract';

import { getRakazApiUrl } from './apiUrl';

async function request(path: string, init?: RequestInit): Promise<Response> {
  const url = `${getRakazApiUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`[RakazAPI] ${response.status} ${path}: ${text}`);
  }
  return response;
}

/** Polling live source — works on native and web without EventSource. */
export function createHttpTripLiveSource(pollMs = 2000): TripLiveSource {
  return {
    watchTrip(tripId: CanonicalTripId, onChange, onError?): RakazUnsubscribe {
      let stopped = false;
      const tick = async (): Promise<void> => {
        try {
          const res = await request(RakazHttpPaths.trip(tripId));
          const snap = (await res.json()) as RakazTripSnapshot;
          if (!stopped) onChange(snap);
        } catch (error) {
          if (!stopped) onError?.(error);
        }
      };
      void tick();
      const id = setInterval(() => void tick(), pollMs);
      return () => {
        stopped = true;
        clearInterval(id);
      };
    },
  };
}

export function createHttpParentCommands(): ParentCommandApi {
  return {
    async reportAbsence(report: RakazAbsenceReport): Promise<void> {
      await request(RakazHttpPaths.absence, { method: 'POST', body: JSON.stringify(report) });
    },
    async updateAddress(update: RakazAddressUpdate): Promise<void> {
      await request(RakazHttpPaths.address, { method: 'PUT', body: JSON.stringify(update) });
    },
    async confirmHandover(result: RakazHandoverResult): Promise<void> {
      await request(RakazHttpPaths.handover, { method: 'POST', body: JSON.stringify(result) });
    },
    async reportHandoverIssue(result: RakazHandoverResult): Promise<void> {
      await request(RakazHttpPaths.handover, {
        method: 'POST',
        body: JSON.stringify({ ...result, confirmed: false, issueReported: true }),
      });
    },
  };
}

export async function resolveActiveTripId(studentId: string, tripKind: 'morning' | 'afternoon'): Promise<string | null> {
  const res = await request(`${RakazHttpPaths.resolveTrip}?studentId=${encodeURIComponent(studentId)}&tripKind=${tripKind}`);
  const json = (await res.json()) as { tripId: string | null };
  return json.tripId;
}
