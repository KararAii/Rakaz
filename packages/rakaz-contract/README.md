# @rakaz/contract — حزمة ربط ركاز (Firebase)

عقود TypeScript مشتركة بين `rakaz-driver-rn` و`rakaz-parent-rn`. لا تعتمد على React Native ولا على
Firebase SDK — يركّب مطور Firebase التنفيذ فوق هذه الواجهات.

## ماذا تتضمن؟

| ملف | الغرض |
| --- | --- |
| `ids.ts` | معرّفات `STU-*` و`TRIP-*` وجسر بيانات الديمو `st-*` ↔ `STU-*` |
| `events.ts` | `RakazTripEvent` و`RakazTripSnapshot` والغياب والعنوان وتأكيد الاستلام |
| `mapping.ts` | تحويل `RakazActionKind` → حالة ولي الأمر `TripStatus` + نوع الإشعار |
| `firestorePaths.ts` | مسارات المجموعات والوثائق المقترحة |
| `repositories.ts` | واجهات: `TripEventWriter`, `TripLiveSource`, `ParentCommandApi`, `RakazAuthApi` |

## تدفق الربط

```
السائق ──writeEvents──► trip_events + trips
                              │
                     onSnapshot / FCM
                              ▼
                         ولي الأمر
                              │
              reportAbsence / updateAddress / handover
                              ▼
                         Firestore ◄── السائق يقرأ الغياب
```

## أول حدث للتحقق

1. السائق يكتب `PICKED_UP` لـ `STU-24031`.
2. Cloud Function أو العميل يحدّث `trips/{tripId}.status = 4`.
3. ولي الأمر يستمع ويظهر إشعار «تم استلام الطالب».

## ملاحظات للديمو الحالي

بيانات العيّنة في التطبيقين ليست نفس الأشخاص (`st-1` زهراء ≠ `STU-24031` لبان).
استخدم `DEMO_STUDENT_ID_BRIDGE` للاختبار فقط، وفي الإنتاج مصدر الطلاب هو Firestore فقط.
