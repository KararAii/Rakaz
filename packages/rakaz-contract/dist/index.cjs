"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DEFAULT_RAKAZ_API_URL: () => DEFAULT_RAKAZ_API_URL,
  DEMO_STUDENT_ID_BRIDGE: () => DEMO_STUDENT_ID_BRIDGE,
  FirestorePaths: () => FirestorePaths,
  ParentTripStatus: () => ParentTripStatus,
  RakazActionKind: () => RakazActionKind,
  RakazHttpPaths: () => RakazHttpPaths,
  SUGGESTED_INDEXES: () => SUGGESTED_INDEXES,
  buildTripId: () => buildTripId,
  mapDriverActionToParent: () => mapDriverActionToParent,
  resolveRakazApiUrl: () => resolveRakazApiUrl,
  statusAfterPickup: () => statusAfterPickup,
  toCanonicalStudentId: () => toCanonicalStudentId,
  toDriverLocalStudentId: () => toDriverLocalStudentId,
  todayISO: () => todayISO
});
module.exports = __toCommonJS(index_exports);

// src/ids.ts
var DEMO_STUDENT_ID_BRIDGE = [
  {
    driverLocalId: "st-1",
    canonicalId: "STU-24031",
    parentLocalId: "STU-24031",
    note: "Demo only \u2014 names differ between apps until admin data is unified"
  },
  {
    driverLocalId: "st-2",
    canonicalId: "STU-24032",
    parentLocalId: "STU-24032",
    note: "Demo only"
  },
  {
    driverLocalId: "st-3",
    canonicalId: "STU-24033",
    parentLocalId: "STU-24033",
    note: "Demo bridge for driver sample st-3"
  },
  {
    driverLocalId: "st-4",
    canonicalId: "STU-24034",
    parentLocalId: "STU-24034",
    note: "Demo bridge for driver sample st-4"
  },
  {
    driverLocalId: "st-5",
    canonicalId: "STU-24035",
    parentLocalId: "STU-24035",
    note: "Demo bridge for driver sample st-5"
  }
];
var driverToCanonical = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.driverLocalId, row.canonicalId]));
var parentToCanonical = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.parentLocalId, row.canonicalId]));
var canonicalToDriver = new Map(DEMO_STUDENT_ID_BRIDGE.map((row) => [row.canonicalId, row.driverLocalId]));
function toCanonicalStudentId(localId) {
  if (!localId) return null;
  if (localId.startsWith("STU-")) return localId;
  return driverToCanonical.get(localId) ?? parentToCanonical.get(localId) ?? localId;
}
function toDriverLocalStudentId(canonicalId) {
  return canonicalToDriver.get(canonicalId) ?? canonicalId;
}
function buildTripId(params) {
  const kind = params.tripKind === "morning" ? "MORNING" : "AFTERNOON";
  return `TRIP-${params.dateISO}-${params.routeId}-${kind}`;
}
function todayISO(now = /* @__PURE__ */ new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// src/events.ts
var RakazActionKind = /* @__PURE__ */ ((RakazActionKind2) => {
  RakazActionKind2["START_TRIP"] = "START_TRIP";
  RakazActionKind2["ARRIVED_AT_STOP"] = "ARRIVED_AT_STOP";
  RakazActionKind2["PICKED_UP"] = "PICKED_UP";
  RakazActionKind2["MARKED_ABSENT"] = "MARKED_ABSENT";
  RakazActionKind2["ARRIVED_AT_SCHOOL"] = "ARRIVED_AT_SCHOOL";
  RakazActionKind2["START_RETURN"] = "START_RETURN";
  RakazActionKind2["DROPPED_OFF"] = "DROPPED_OFF";
  RakazActionKind2["END_TRIP"] = "END_TRIP";
  RakazActionKind2["EMERGENCY"] = "EMERGENCY";
  RakazActionKind2["REORDER_STOPS"] = "REORDER_STOPS";
  return RakazActionKind2;
})(RakazActionKind || {});

// src/mapping.ts
var ParentTripStatus = {
  notStarted: 0,
  preparing: 1,
  driverOnTheWay: 2,
  arrivedAtPickup: 3,
  studentPickedUp: 4,
  onTheWayToSchool: 5,
  arrivedAtSchool: 6,
  finished: 7
};
function mapDriverActionToParent(action, tripKind) {
  const morning = tripKind === "morning";
  switch (action) {
    case "START_TRIP" /* START_TRIP */:
      return {
        status: ParentTripStatus.driverOnTheWay,
        notification: morning ? "tripStarted" : null
      };
    case "START_RETURN" /* START_RETURN */:
      return {
        status: ParentTripStatus.driverOnTheWay,
        notification: "returnStarted",
        switchToAfternoon: true
      };
    case "ARRIVED_AT_STOP" /* ARRIVED_AT_STOP */:
      return {
        status: ParentTripStatus.arrivedAtPickup,
        notification: null
      };
    case "PICKED_UP" /* PICKED_UP */:
      return {
        status: ParentTripStatus.studentPickedUp,
        notification: "pickedUp"
      };
    case "DROPPED_OFF" /* DROPPED_OFF */:
      return {
        status: ParentTripStatus.arrivedAtSchool,
        notification: "delivered",
        handoverPending: true
      };
    case "ARRIVED_AT_SCHOOL" /* ARRIVED_AT_SCHOOL */:
      return {
        status: ParentTripStatus.arrivedAtSchool,
        notification: morning ? "arrivedSchool" : null
      };
    case "END_TRIP" /* END_TRIP */:
      return {
        status: ParentTripStatus.finished,
        notification: null
      };
    case "MARKED_ABSENT" /* MARKED_ABSENT */:
      return {
        status: null,
        notification: "admin"
      };
    case "EMERGENCY" /* EMERGENCY */:
      return {
        status: null,
        notification: "delay"
      };
    case "REORDER_STOPS" /* REORDER_STOPS */:
      return {
        status: null,
        notification: null
      };
    default:
      return {
        status: null,
        notification: null
      };
  }
}
function statusAfterPickup(tripKind) {
  return tripKind === "morning" ? ParentTripStatus.onTheWayToSchool : ParentTripStatus.onTheWayToSchool;
}

// src/firestorePaths.ts
var FirestorePaths = {
  users: () => "users",
  user: (uid) => `users/${uid}`,
  students: () => "students",
  student: (studentId) => `students/${studentId}`,
  drivers: () => "drivers",
  driver: (uid) => `drivers/${uid}`,
  guardians: () => "guardians",
  guardian: (uid) => `guardians/${uid}`,
  guardianStudents: (uid) => `guardians/${uid}/students`,
  routes: () => "routes",
  route: (routeId) => `routes/${routeId}`,
  trips: () => "trips",
  trip: (tripId) => `trips/${tripId}`,
  tripEvents: () => "trip_events",
  tripEvent: (eventId) => `trip_events/${eventId}`,
  absences: () => "absences",
  absence: (id) => `absences/${id}`,
  addresses: () => "addresses",
  address: (studentId) => `addresses/${studentId}`,
  handovers: () => "handovers",
  handover: (tripId) => `handovers/${tripId}`,
  parentNotifications: (guardianUid) => `guardians/${guardianUid}/notifications`,
  parentNotification: (guardianUid, id) => `guardians/${guardianUid}/notifications/${id}`,
  schools: () => "schools",
  school: (schoolId) => `schools/${schoolId}`,
  adminMeta: () => "admin_meta/overview"
};
var SUGGESTED_INDEXES = [
  "trip_events: tripId ASC, at ASC",
  "trip_events: studentId ASC, at DESC",
  "trips: routeId ASC, tripKind ASC, updatedAt DESC",
  "absences: studentId ASC, day DESC"
];

// src/http.ts
var DEFAULT_RAKAZ_API_URL = "http://127.0.0.1:8787";
var RakazHttpPaths = {
  health: "/health",
  overview: "/admin/overview",
  students: "/admin/students",
  student: (id) => `/admin/students/${encodeURIComponent(id)}`,
  drivers: "/admin/drivers",
  driver: (uid) => `/admin/drivers/${encodeURIComponent(uid)}`,
  routes: "/admin/routes",
  route: (id) => `/admin/routes/${encodeURIComponent(id)}`,
  schools: "/admin/schools",
  absences: "/admin/absences",
  absencesToday: "/admin/absences/today",
  trips: "/admin/trips",
  trip: (id) => `/trips/${encodeURIComponent(id)}`,
  tripEvents: (tripId) => `/trips/${encodeURIComponent(tripId)}/events`,
  openDailyTrips: "/admin/trips/open-daily",
  assignStudent: "/admin/assign/student",
  assignDriver: "/admin/assign/driver",
  broadcast: "/admin/broadcast",
  events: "/events",
  absence: "/absences",
  address: "/addresses",
  handover: "/handovers",
  streamTrips: "/stream/trips",
  streamTrip: (id) => `/stream/trips/${encodeURIComponent(id)}`,
  resolveTrip: "/trips/resolve"
};
function resolveRakazApiUrl(explicit) {
  if (explicit && explicit.length > 0) return explicit.replace(/\/$/, "");
  return DEFAULT_RAKAZ_API_URL;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_RAKAZ_API_URL,
  DEMO_STUDENT_ID_BRIDGE,
  FirestorePaths,
  ParentTripStatus,
  RakazActionKind,
  RakazHttpPaths,
  SUGGESTED_INDEXES,
  buildTripId,
  mapDriverActionToParent,
  resolveRakazApiUrl,
  statusAfterPickup,
  toCanonicalStudentId,
  toDriverLocalStudentId,
  todayISO
});
