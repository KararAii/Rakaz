import { RakazHttpPaths, type RakazAbsenceReport, type RakazTripEvent, type RakazTripSnapshot, type TripEventWriter } from '@rakaz/contract';

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

export function createHttpTripEventWriter(): TripEventWriter {
  return {
    async writeEvents(events: RakazTripEvent[]): Promise<void> {
      await request(RakazHttpPaths.events, { method: 'POST', body: JSON.stringify({ events }) });
    },
    async upsertTrip(snapshot: Partial<RakazTripSnapshot> & Pick<RakazTripSnapshot, 'tripId'>): Promise<void> {
      await request(RakazHttpPaths.trip(snapshot.tripId), { method: 'PUT', body: JSON.stringify(snapshot) });
    },
    async ping(): Promise<boolean> {
      const res = await request(RakazHttpPaths.health);
      const json = (await res.json()) as { ok?: boolean };
      return json.ok === true;
    },
  };
}

export async function fetchTodayAbsences(): Promise<RakazAbsenceReport[]> {
  const res = await request(RakazHttpPaths.absencesToday);
  return (await res.json()) as RakazAbsenceReport[];
}
