import {
  type AdminNotification,
  type AppSnapshot,
  type DriverProfile,
  NotificationKind,
  type Route,
  RouteOptimizationMode,
  type School,
  type Student,
  emptyTripState,
} from '@/types/models';

/** Seed data mirroring what the admin backend assigns to this driver (Basra, Iraq). */
const profile: DriverProfile = {
  id: 'drv-17',
  name: 'علي حسين',
  phone: '07701234567',
  busNumber: 'R-204',
  plate: 'بصرة ٤٥٦٧٨ أ',
  adminPhone: '07809876543',
};

const school: School = {
  id: 'sch-1',
  name: 'مدرسة البصرة النموذجية',
  address: 'العشار · شارع الكويت',
  coordinate: { latitude: 30.5085, longitude: 47.81 },
  phone: '07801112233',
  startTime: '07:45',
};

const students: Student[] = [
  {
    id: 'st-1', name: 'زهراء أحمد', grade: 'الصف الرابع', area: 'حي الجزائر', street: 'شارع الكورنيش',
    home: { latitude: 30.537, longitude: 47.827 }, guardianName: 'أحمد كاظم', guardianPhone: '07701110001',
    notes: 'تنتظر عند البوابة الزرقاء',
  },
  {
    id: 'st-2', name: 'حسن علي', grade: 'الصف السادس', area: 'الطويسة', street: 'شارع الجمهورية',
    home: { latitude: 30.529, longitude: 47.8205 }, guardianName: 'علي جاسم', guardianPhone: '07701110002',
    notes: null,
  },
  {
    id: 'st-3', name: 'مريم سعد', grade: 'الصف الثالث', area: 'الجمهورية', street: 'شارع ١٤ تموز',
    home: { latitude: 30.522, longitude: 47.815 }, guardianName: 'سعد مهدي', guardianPhone: '07701110003',
    notes: 'حساسية من الفول السوداني',
  },
  {
    id: 'st-4', name: 'يوسف كريم', grade: 'الصف الخامس', area: 'البراضعية', street: 'شارع الوفود',
    home: { latitude: 30.516, longitude: 47.8195 }, guardianName: 'كريم عبد الله', guardianPhone: '07701110004',
    notes: null,
  },
  {
    id: 'st-5', name: 'نور الهدى', grade: 'الصف الثاني', area: 'المعقل', street: 'شارع الميناء',
    home: { latitude: 30.512, longitude: 47.814 }, guardianName: 'هدى ناصر', guardianPhone: '07701110005',
    notes: 'يستلمها الأخ الأكبر في العودة',
  },
];

function route(now: number): Route {
  const pickup = ['07:30', '07:35', '07:42', '07:50', '07:55'];
  const dropoff = ['13:40', '13:34', '13:28', '13:20', '13:12'];
  return {
    id: 'rt-204',
    code: 'R-204',
    name: 'من حي الجزائر إلى المدرسة',
    school,
    depot: { latitude: 30.542, longitude: 47.83 },
    students,
    stops: students.map((s, i) => ({ studentId: s.id, pickupTime: pickup[i] ?? '', dropoffTime: dropoff[i] ?? '' })),
    optimizationMode: RouteOptimizationMode.MANUAL,
    createdBy: 'إدارة النقل · البصرة',
    updatedAt: now,
  };
}

function notifications(now: number): AdminNotification[] {
  return [
    {
      id: 'n-1', title: 'تحديث المسار', body: 'تمت إضافة الطالبة نور الهدى إلى مسار R-204 اعتباراً من اليوم.',
      date: now - 1_800_000, kind: NotificationKind.ROUTE, isRead: false,
    },
    {
      id: 'n-2', title: 'تنبيه طريق', body: 'ازدحام على جسر التنومة، يُرجى استخدام شارع الكورنيش.',
      date: now - 5_400_000, kind: NotificationKind.URGENT, isRead: false,
    },
    {
      id: 'n-3', title: 'تذكير', body: 'فحص الحافلة الأسبوعي يوم الخميس الساعة ٢ ظهراً.',
      date: now - 86_400_000, kind: NotificationKind.INFO, isRead: true,
    },
  ];
}

export const SampleData = {
  profile,

  snapshot(): AppSnapshot {
    const now = Date.now();
    return {
      profile: null,
      route: route(now),
      trip: emptyTripState(),
      pending: [],
      notifications: notifications(now),
      lastSyncAt: now,
      simulateOffline: false,
      completedTripsTotal: 126,
    };
  },
};
