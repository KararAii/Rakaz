import {
  ParentTripStatus,
  buildTripId,
  todayISO,
  type RakazAdminDriver,
  type RakazAdminRoute,
  type RakazAdminSchool,
  type RakazAdminStudent,
  type RakazTripSnapshot,
} from '@rakaz/contract';

export const SEED_SCHOOL: RakazAdminSchool = {
  id: 'sch-basra-1',
  name: 'مدارس البصرة الأهلية',
  address: 'البصرة، العشار، شارع الكورنيش',
  coordinate: { latitude: 30.515, longitude: 47.78 },
};

export const SEED_STUDENTS: RakazAdminStudent[] = [
  {
    id: 'STU-24031',
    internalNumber: 'RKZ-24031',
    fullName: 'لبان أحمد محمد',
    firstName: 'لبان',
    grade: 'الصف الرابع',
    schoolId: SEED_SCHOOL.id,
    schoolName: SEED_SCHOOL.name,
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
    schoolId: SEED_SCHOOL.id,
    schoolName: SEED_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'سارة أحمد',
    guardianPhone: '07701231881',
    home: { latitude: 30.531, longitude: 47.798 },
    active: true,
  },
  {
    id: 'STU-24033',
    internalNumber: 'RKZ-24033',
    fullName: 'مريم سعد',
    firstName: 'مريم',
    grade: 'الصف الثالث',
    schoolId: SEED_SCHOOL.id,
    schoolName: SEED_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'سعد كاظم',
    guardianPhone: '07701112233',
    home: { latitude: 30.525, longitude: 47.788 },
    active: true,
  },
  {
    id: 'STU-24034',
    internalNumber: 'RKZ-24034',
    fullName: 'يوسف كريم',
    firstName: 'يوسف',
    grade: 'الصف الخامس',
    schoolId: SEED_SCHOOL.id,
    schoolName: SEED_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'كريم يوسف',
    guardianPhone: '07702223344',
    home: { latitude: 30.522, longitude: 47.781 },
    active: true,
  },
  {
    id: 'STU-24035',
    internalNumber: 'RKZ-24035',
    fullName: 'نور الهدى',
    firstName: 'نور',
    grade: 'الصف الثاني',
    schoolId: SEED_SCHOOL.id,
    schoolName: SEED_SCHOOL.name,
    routeId: 'R-204',
    guardianName: 'هدى ناصر',
    guardianPhone: '07703334455',
    home: { latitude: 30.518, longitude: 47.775 },
    active: true,
  },
];

export const SEED_DRIVER: RakazAdminDriver = {
  uid: 'drv-17',
  name: 'كريم حسّون',
  phone: '07705551234',
  vehicleLabel: 'باص 17',
  plateNumber: '14 أ ب 204',
  routeId: 'R-204',
  active: true,
};

export const SEED_ROUTE: RakazAdminRoute = {
  id: 'R-204',
  name: 'خط العشار — الكورنيش',
  schoolId: SEED_SCHOOL.id,
  driverUid: SEED_DRIVER.uid,
  active: true,
  stops: SEED_STUDENTS.map((s, i) => ({
    studentId: s.id,
    sequence: i + 1,
    pickupTime: `06:${40 + i * 5}`,
    dropoffTime: `13:${35 - i * 5}`,
  })),
};

export function seedTrips(): RakazTripSnapshot[] {
  const dateISO = todayISO();
  const morningId = buildTripId({ dateISO, routeId: 'R-204', tripKind: 'morning' });
  const afternoonId = buildTripId({ dateISO, routeId: 'R-204', tripKind: 'afternoon' });
  const base = {
    routeId: 'R-204',
    status: ParentTripStatus.notStarted,
    progress: 0,
    driverUid: SEED_DRIVER.uid,
    vehicleLabel: SEED_DRIVER.vehicleLabel,
    updatedAt: Date.now(),
    handoverPending: false,
    handoverConfirmedAt: null,
    busLocation: null as { latitude: number; longitude: number } | null,
  };
  return [
    { ...base, tripId: morningId, tripKind: 'morning' as const },
    { ...base, tripId: afternoonId, tripKind: 'afternoon' as const },
  ];
}
