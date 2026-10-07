import {
  type AppNotification,
  type Driver,
  type FAQItem,
  Gender,
  makeId,
  NotificationKind,
  type Payment,
  PaymentMethod,
  type School,
  type Student,
  type Subscription,
} from '@/types/models';

/** Demo data used until the Rakaz backend is connected. */

function date(daysFromNow: number, hour: number = 9, minute: number = 0): number {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d.getTime();
}

const school: School = {
  name: 'مدارس البصرة الأهلية',
  address: 'البصرة، العشار، شارع الكورنيش، قرب ساحة أم البروم',
  locationLabel: 'البوابة رقم ٣ — المدخل الرئيسي',
  latitude: 30.5156,
  longitude: 47.8125,
  startHour: 7,
  startMinute: 45,
  endHour: 13,
  endMinute: 15,
  phone: '+9647801112233',
};

const driver: Driver = {
  name: 'أحمد محمد',
  photoName: 'bus_driver_headshot',
  phone: '+9647712345678',
  rating: 4.9,
  yearsWithRakaz: 3,
  vehicle: {
    model: 'Toyota Coaster',
    type: 'حافلة صغيرة — ٢٢ مقعداً',
    plateNumber: 'بصرة ٤٣١ ر ك',
    color: 'أبيض',
    capacity: 22,
    photoName: 'photorealistic_three_quarter',
    busNumber: 'R-204',
  },
};

const students: Student[] = [
  {
    id: 'STU-24031',
    fullName: 'لبان أحمد محمد',
    firstName: 'لبان',
    photoName: 'schoolgirl_portrait',
    birthDate: date(-365 * 9 - 40),
    gender: Gender.female,
    grade: 'الصف الرابع',
    stage: 'المرحلة الابتدائية',
    schoolName: school.name,
    internalNumber: 'RKZ-24031',
    guardianName: 'أحمد محمد علي',
    guardianPhone: '+9647701234567',
    address: {
      governorate: 'البصرة',
      area: 'الجزائر',
      neighborhood: 'حي الجزائر',
      street: 'شارع الأمير، زقاق ١٤',
      landmark: 'مقابل جامع الرحمن',
      latitude: 30.5049,
      longitude: 47.7869,
      accessNotes: 'البوابة السوداء، الطابق الأرضي. يُرجى عدم استخدام المنبه.',
    },
    school,
    driver,
  },
  {
    id: 'STU-24032',
    fullName: 'راشد أحمد محمد',
    firstName: 'راشد',
    photoName: null,
    birthDate: date(-365 * 6 - 120),
    gender: Gender.male,
    grade: 'الصف الأول',
    stage: 'المرحلة الابتدائية',
    schoolName: school.name,
    internalNumber: 'RKZ-24032',
    guardianName: 'أحمد محمد علي',
    guardianPhone: '+9647701234567',
    address: {
      governorate: 'البصرة',
      area: 'الجزائر',
      neighborhood: 'حي الجزائر',
      street: 'شارع الأمير، زقاق ١٤',
      landmark: 'مقابل جامع الرحمن',
      latitude: 30.5049,
      longitude: 47.7869,
      accessNotes: 'نفس عنوان لبان.',
    },
    school,
    driver,
  },
];

function subscription(studentID: string): Subscription {
  if (studentID === 'STU-24032') {
    return { monthlyFee: 75_000, yearlyFee: null, paidAmount: 0, dueAmount: 75_000, dueDate: date(6), periodTitle: 'اشتراك الشهر الحالي' };
  }
  return { monthlyFee: 85_000, yearlyFee: 850_000, paidAmount: 50_000, dueAmount: 85_000, dueDate: date(9), periodTitle: 'اشتراك الشهر الحالي' };
}

function payments(studentID: string): Payment[] {
  if (studentID === 'STU-24032') {
    return [
      { id: 'TX-100392', amount: 75_000, date: date(-33), method: PaymentMethod.cash, recordedBy: 'سارة الجبوري', note: 'اشتراك الشهر الماضي' },
      { id: 'TX-100211', amount: 75_000, date: date(-63), method: PaymentMethod.zainCash, recordedBy: 'علي حسين', note: '' },
    ];
  }
  return [
    { id: 'TX-100458', amount: 50_000, date: date(-4), method: PaymentMethod.zainCash, recordedBy: 'سارة الجبوري', note: 'دفعة جزئية — يُستكمل الباقي قبل الاستحقاق' },
    { id: 'TX-100391', amount: 85_000, date: date(-33), method: PaymentMethod.cash, recordedBy: 'علي حسين', note: 'تم الدفع في مكتب الشركة' },
    { id: 'TX-100210', amount: 85_000, date: date(-63), method: PaymentMethod.card, recordedBy: 'سارة الجبوري', note: '' },
    { id: 'TX-100087', amount: 85_000, date: date(-94), method: PaymentMethod.bankTransfer, recordedBy: 'مصطفى كاظم', note: 'تحويل عبر مصرف الرافدين' },
  ];
}

function notifications(): AppNotification[] {
  const now = Date.now();
  return [
    { id: makeId(), kind: NotificationKind.tripReminder, body: 'رحلة الصباح تبدأ الساعة ٠٦:٤٥ صباحاً. يُرجى تجهيز لبان.', date: now - 60_000 * 25, isRead: false },
    { id: makeId(), kind: NotificationKind.payment, body: 'تم تسجيل دفعة بقيمة ٥٠٬٠٠٠ د.ع. المتبقي ٣٥٬٠٠٠ د.ع.', date: date(-4, 11, 20), isRead: false },
    { id: makeId(), kind: NotificationKind.admin, body: 'عطلة رسمية يوم الخميس القادم، لا توجد رحلات.', date: date(-1, 18, 5), isRead: true },
    { id: makeId(), kind: NotificationKind.delivered, body: 'تم تسليم لبان إلى المنزل بأمان الساعة ٠١:٤٢ مساءً.', date: date(-1, 13, 42), isRead: true },
    { id: makeId(), kind: NotificationKind.delay, body: 'تأخر بسيط في رحلة العودة بسبب الازدحام (~١٠ دقائق).', date: date(-1, 13, 20), isRead: true },
    { id: makeId(), kind: NotificationKind.arrivedSchool, body: 'وصلت لبان إلى المدرسة الساعة ٠٧:٣٨ صباحاً.', date: date(-1, 7, 38), isRead: true },
  ];
}

const faqs: FAQItem[] = [
  { id: 1, question: 'متى يصلني إشعار اقتراب السائق؟', answer: 'يصلك إشعار تلقائي عندما تكون المركبة على بُعد ٥ دقائق تقريباً من نقطة الاستلام، إضافة إلى إشعارات بدء الرحلة والاستلام والوصول.' },
  { id: 2, question: 'كيف أُبلغ عن غياب ابني؟', answer: 'من الرئيسية اضغط «إبلاغ غياب»، اختر اليوم والسبب (اختياري) وأضف ملاحظة. يصل البلاغ فوراً إلى الإدارة والسائق.' },
  { id: 3, question: 'هل يمكنني تعديل موقع الاستلام؟', answer: 'نعم، من ملف الطالب ← العنوان، حرّك الدبوس على الخريطة إلى الموقع الصحيح واحفظ. سيتم اعتماد التعديل بعد مراجعة الإدارة.' },
  { id: 4, question: 'ما طرق الدفع المتاحة؟', answer: 'الدفع نقداً في مكتب الشركة، زين كاش، البطاقة المصرفية، أو التحويل المصرفي. تُسجَّل كل دفعة في سجل الدفعات مع اسم الموظف.' },
  { id: 5, question: 'لماذا لا أرى رقم هاتف السائق كاملاً؟', answer: 'حرصاً على الخصوصية نُخفي البيانات الحساسة، ويمكنك الاتصال بالسائق مباشرة عبر زر الاتصال أثناء الرحلة.' },
  { id: 6, question: 'ماذا يحدث إذا تأخرت المركبة؟', answer: 'يصلك إشعار تأخر مع الوقت المتوقع الجديد، ويمكنك متابعة موقع المركبة لحظياً من شاشة متابعة الرحلة.' },
];

export const MockData = { date, school, driver, students, subscription, payments, notifications, faqs };
