import cors from 'cors';
import express from 'express';

import {
  RakazHttpPaths,
  todayISO,
  type RakazAbsenceReport,
  type RakazAddressUpdate,
  type RakazAdminDriver,
  type RakazAdminRoute,
  type RakazAdminStudent,
  type RakazHandoverResult,
  type RakazTripEvent,
  type RakazTripSnapshot,
} from '@rakaz/contract';

import { store } from './store.js';

const PORT = Number(process.env.RAKAZ_API_PORT ?? 8787);
const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get(RakazHttpPaths.health, (_req, res) => {
  res.json({ ok: true, service: 'rakaz-api', at: Date.now() });
});

app.get(RakazHttpPaths.overview, (_req, res) => {
  res.json(store.overview());
});

app.get(RakazHttpPaths.students, (_req, res) => {
  res.json(store.students);
});

app.put('/admin/students/:id', (req, res) => {
  const body = req.body as RakazAdminStudent;
  store.upsertStudent({ ...body, id: req.params.id ?? body.id });
  res.json({ ok: true });
});

app.post(RakazHttpPaths.students, (req, res) => {
  store.upsertStudent(req.body as RakazAdminStudent);
  res.status(201).json({ ok: true });
});

app.get(RakazHttpPaths.drivers, (_req, res) => {
  res.json(store.drivers);
});

app.post(RakazHttpPaths.drivers, (req, res) => {
  store.upsertDriver(req.body as RakazAdminDriver);
  res.status(201).json({ ok: true });
});

app.put('/admin/drivers/:uid', (req, res) => {
  const body = req.body as RakazAdminDriver;
  store.upsertDriver({ ...body, uid: req.params.uid ?? body.uid });
  res.json({ ok: true });
});

app.get(RakazHttpPaths.routes, (_req, res) => {
  res.json(store.routes);
});

app.post(RakazHttpPaths.routes, (req, res) => {
  store.upsertRoute(req.body as RakazAdminRoute);
  res.status(201).json({ ok: true });
});

app.put('/admin/routes/:id', (req, res) => {
  const body = req.body as RakazAdminRoute;
  store.upsertRoute({ ...body, id: req.params.id ?? body.id });
  res.json({ ok: true });
});

app.get(RakazHttpPaths.schools, (_req, res) => {
  res.json(store.schools);
});

app.get(RakazHttpPaths.absencesToday, (_req, res) => {
  res.json(store.absencesToday());
});

app.get(RakazHttpPaths.absences, (_req, res) => {
  res.json(store.absences);
});

app.get(RakazHttpPaths.trips, (_req, res) => {
  res.json(store.trips);
});

app.get('/trips/:id', (req, res) => {
  const trip = store.trips.find((t) => t.tripId === req.params.id);
  if (!trip) {
    res.status(404).json({ error: 'trip_not_found' });
    return;
  }
  res.json(trip);
});

app.get('/trips/:tripId/events', (req, res) => {
  res.json(store.events.filter((e) => e.tripId === req.params.tripId));
});

app.post(RakazHttpPaths.openDailyTrips, (req, res) => {
  const routeId = String(req.body?.routeId ?? 'R-204');
  const dateISO = String(req.body?.dateISO ?? todayISO());
  res.json(store.openDailyTrips(routeId, dateISO));
});

app.post(RakazHttpPaths.assignStudent, (req, res) => {
  store.assignStudent(String(req.body.studentId), String(req.body.routeId), Number(req.body.sequence ?? 1));
  res.json({ ok: true });
});

app.post(RakazHttpPaths.assignDriver, (req, res) => {
  store.assignDriver(String(req.body.driverUid), String(req.body.routeId));
  res.json({ ok: true });
});

app.post(RakazHttpPaths.broadcast, (req, res) => {
  store.broadcast({
    title: String(req.body.title ?? ''),
    body: String(req.body.body ?? ''),
    studentIds: req.body.studentIds,
    routeId: req.body.routeId,
  });
  res.json({ ok: true });
});

app.post(RakazHttpPaths.events, (req, res) => {
  const events = req.body?.events as RakazTripEvent[] | undefined;
  if (!Array.isArray(events)) {
    res.status(400).json({ error: 'events_array_required' });
    return;
  }
  store.writeEvents(events);
  res.json({ ok: true, count: events.length });
});

app.put('/trips/:id', (req, res) => {
  const partial = req.body as Partial<RakazTripSnapshot>;
  store.upsertTrip({ ...partial, tripId: req.params.id ?? partial.tripId! });
  res.json({ ok: true });
});

app.post(RakazHttpPaths.absence, (req, res) => {
  store.reportAbsence(req.body as RakazAbsenceReport);
  res.status(201).json({ ok: true });
});

app.put(RakazHttpPaths.address, (req, res) => {
  store.updateAddress(req.body as RakazAddressUpdate);
  res.json({ ok: true });
});

app.post(RakazHttpPaths.handover, (req, res) => {
  store.confirmHandover(req.body as RakazHandoverResult);
  res.json({ ok: true });
});

app.get(RakazHttpPaths.resolveTrip, (req, res) => {
  const studentId = String(req.query.studentId ?? '');
  const tripKind = (String(req.query.tripKind ?? 'morning') === 'afternoon' ? 'afternoon' : 'morning') as 'morning' | 'afternoon';
  const dateISO = req.query.dateISO ? String(req.query.dateISO) : todayISO();
  const tripId = store.resolveTripId(studentId, tripKind, dateISO);
  res.json({ tripId });
});

function sse(res: express.Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
}

app.get(RakazHttpPaths.streamTrips, (req, res) => {
  sse(res);
  const send = (payload: unknown): void => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };
  const off = store.onTrips(send);
  req.on('close', off);
});

app.get('/stream/trips/:id', (req, res) => {
  sse(res);
  const tripId = req.params.id!;
  const pushTrip = (): void => {
    const trip = store.trips.find((t) => t.tripId === tripId) ?? null;
    res.write(`data: ${JSON.stringify(trip)}\n\n`);
  };
  pushTrip();
  const offTrips = store.onTrips(() => pushTrip());
  const offEvents = store.onTripEvents(tripId, (event) => {
    res.write(`event: trip_event\ndata: ${JSON.stringify(event)}\n\n`);
  });
  req.on('close', () => {
    offTrips();
    offEvents();
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[rakaz-api] listening on http://127.0.0.1:${PORT}`);
  console.log(`[rakaz-api] health: http://127.0.0.1:${PORT}${RakazHttpPaths.health}`);
});
