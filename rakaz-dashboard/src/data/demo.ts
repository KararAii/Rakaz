import {
  ParentTripStatus,
  type RakazAbsenceReport,
  type RakazAdminDriver,
  type RakazAdminOverview,
  type RakazAdminRoute,
  type RakazAdminSchool,
  type RakazAdminStudent,
  type RakazTripSnapshot,
  buildTripId,
  todayISO,
} from '@rakaz/contract';

export const DEMO_SCHOOL: RakazAdminSchool = {
  id: 'sch-basra-1',
  name: 'مدارس البصرة الأهلية',
  address: 'البصرة، العشار، شارع الكورنيش',
  coordinate: { latitude: 30.515, longitude: 47.78 },
};

export const DEMO_STUDENTS: RakazAdminStudent[] = [
  {
    id: 'STU-24031',
    internalNumber: 'RKZ-24031',
    fullName: 'لبان أحمد محمد',
    firstName: 'لبان',
    grade: 'الصف الرابع',
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'أحمد محمد علي',
    guardianPhone: '07701234567',
    home: { latitude: 30.528, longitude: 47.792 },
    active: true,
  },
  {
    id: 'STU-24032',
    internalNumber: 'RKZ-24032',
    fullName: 'راشد أحمد محمد',
    firstName: 'راشد',
    grade: 'الصف الثاني',
    schoolId: DEMO_SCHOOL.id,
    schoolName: DEMO_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'سارة أحمد',
    guardianPhone: '07701231881',
    home: { latitude: 30.531, longitude: 47.798 },
    active: true,
  },
];

export const DEMO_DRIVER: RakazAdminDriver = {
  uid: 'drv-17',
  name: 'كريم حسّون',
  phone: '07705551234',
  vehicleLabel: 'باص 17',
  plateNumber: '14 أ ب 204',
  routeId: 'R-204',
  active: true,
};

export const DEMO_ROUTE: RakazAdminRoute = {
  id: 'R-204',
  name: 'خط العشار — الكورنيش',
  schoolId: DEMO_SCHOOL.id,
  driverUid: DEMO_DRIVER.uid,
  active: true,
  stops: [
    { studentId: 'STU-24031', sequence: 1, pickupTime: '06:45', dropoffTime: '13:40' },
    { studentId: 'STU-24032', sequence: 2, pickupTime: '06:55', dropoffTime: '13:30' },
  ],
};

export function demoOverview(): RakazAdminOverview {
  return {
    activeTrips: 1,
    studentsOnBoard: 1,
    absencesToday: 0,
    openHandovers: 0,
    offlineDrivers: 0,
    updatedAt: Date.now(),
  };
}

export function demoLiveTrips(): RakazTripSnapshot[] {
  const tripId = buildTripId({ dateISO: todayISO(), routeId: 'R-204', tripKind: 'morning' });
  return [
    {
      tripId,
      routeId: 'R-204',
      tripKind: 'morning',
      status: ParentTripStatus.onTheWayToSchool,
      progress: 0.42,
      driverUid: DEMO_DRIVER.uid,
      vehicleLabel: DEMO_DRIVER.vehicleLabel,
      updatedAt: Date.now(),
      handoverPending: false,
      handoverConfirmedAt: null,
      busLocation: { latitude: 30.52, longitude: 47.785 },
    },
  ];
}

export function demoAbsences(): RakazAbsenceReport[] {
  return [];
}
