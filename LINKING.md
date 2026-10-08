# دليل تسليم الربط — ركاز × Firebase

هذا المستند موجّه لمطور Firebase الذي سيربط `rakaz-driver-rn` و`rakaz-parent-rn` و`rakaz-dashboard`.

> مستودع `dashboar-RAKAZ` الخارجي لم يكن متاحاً (404). اللوحة مُجهَّزة داخل هذا المستودع في `rakaz-dashboard/`.

## الحالة الحالية

| الطبقة | الحالة |
| --- | --- |
| واجهات التطبيقين | مكتملة (سلوك محلي / ديمو) |
| لوحة الإدارة `rakaz-dashboard` | جاهزة للربط (وضع local افتراضي) |
| حزمة العقود `@rakaz/contract` | جاهزة (+ `RakazAdminApi`) |
| طابور أحداث السائق | جاهز ويُحوَّل إلى `RakazTripEvent` |
| استماع ولي الأمر | واجهة جاهزة؛ الوضع الافتراضي محاكاة |
| Firebase SDK | **غير مثبت** — يركّبه المختص |
| Auth / FCM / Rules | **غير منفّذة** |

الوضع الافتراضي آمن للتجربة على Expo Go:
- السائق: `DRIVER_BACKEND_MODE = 'local'`
- ولي الأمر: `PARENT_BACKEND_MODE = 'simulation'`

## الملفات الأساسية

```
packages/rakaz-contract/          ← مصدر الحقيقة للعقود
  src/events.ts                   RakazTripEvent / RakazTripSnapshot
  src/mapping.ts                  ActionKind → TripStatus
  src/firestorePaths.ts           مسارات Firestore
  src/repositories.ts             الواجهات

rakaz-driver-rn/services/backend/ ← كاتب الأحداث
  config.ts                       بدّل إلى 'firebase'
  firebaseWriter.ts               نفّذ الكتابة هنا
  adaptPending.ts                 PendingAction → RakazTripEvent

rakaz-parent-rn/services/backend/ ← مصدر البث الحي
  config.ts                       بدّل إلى 'firebase'
  firebaseSource.ts               نفّذ onSnapshot هنا
  applyEvent.ts                   حوّل الحدث إلى باتش للـ store

rakaz-dashboard/                  ← لوحة الإدارة
  src/services/backend/config.ts  بدّل إلى 'firebase'
  src/services/backend/firebaseAdmin.ts
```

## خطوات التنفيذ المقترحة

### 1) تثبيت Firebase في الأطراف الثلاثة
```bash
cd rakaz-driver-rn && npx expo install firebase
cd ../rakaz-parent-rn && npx expo install firebase
cd ../rakaz-dashboard && npm install firebase
```
(أو `@react-native-firebase/*` مع Development Build للتطبيقين.)

### 2) تنفيذ الكاتب (السائق)
في `rakaz-driver-rn/services/backend/firebaseWriter.ts`:
- `writeEvents`: `setDoc(trip_events/{id}, event, { merge: true })`
- `upsertTrip`: `setDoc(trips/{tripId}, snapshot, { merge: true })`
- ثم عيّن `DRIVER_BACKEND_MODE = 'firebase'`

السائق يمرّر بالفعل عبر `SyncService.send` ← لا حاجة لتعديل الشاشات.

### 3) تنفيذ المستمع (ولي الأمر)
في `rakaz-parent-rn/services/backend/firebaseSource.ts`:
- `watchTrip`: `onSnapshot(trips/{tripId})`
- استخدم `patchFromTripSnapshot` / `patchFromTripEvent` من `applyEvent.ts`
- أوقف `startSimulation()` في `_layout` عندما يكون الوضع `firebase`
- عيّن `PARENT_BACKEND_MODE = 'firebase'`

### 4) الأوامر العكسية
`familyStore` يستدعي أصلاً:
- `reportAbsence`
- `updateAddress`
- `confirmHandover` / `reportHandoverIssue`

نفّذ الأجسام في `firebaseSource.ts` → `createFirebaseParentCommands`.

### 5) Cloud Function (موصى بها)
على `trip_events` create:
1. حدّث `trips/{tripId}` باستخدام `mapDriverActionToParent`
2. أرسل FCM لأولياء الأمور المرتبطين بـ `studentId`

### 6) لوحة الإدارة
في `rakaz-dashboard/src/services/backend/firebaseAdmin.ts` نفّذ `RakazAdminApi`:
- كتابة `students` / `routes` / `drivers` / `schools`
- `openDailyTrips` ينشئ وثائق `trips` لليوم
- `watchLiveTrips` يستمع لمجموعة `trips`
- ثم عيّن `DASHBOARD_BACKEND_MODE = 'firebase'`

### 7) توحيد المعرفات
استخدم دائماً `STU-*` في Firestore.
جسر الديمو `st-*` ↔ `STU-*` موجود في `DEMO_STUDENT_ID_BRIDGE` للاختبار فقط.
لوحة الإدارة هي مصدر الحقيقة لهذه المعرفات.

## اختبار القبول الأدنى

1. من اللوحة: افتح رحلات اليوم للمسار `R-204`
2. سائق يسجّل `PICKED_UP` للطالب `STU-24031`
3. تظهر وثيقة في `trip_events` و`trips` وتتحدث اللوحة مباشرة
4. ولي الأمر يرى الحالة «تم استلام الطالب» بدون المحاكاة المحلية
5. ولي الأمر يبلّغ غياباً → وثيقة في `absences` تظهر في اللوحة والسائق

## تشغيل typecheck

```bash
cd packages/rakaz-contract && npx tsc --noEmit
cd ../../rakaz-driver-rn && npm run typecheck
cd ../rakaz-parent-rn && npm run typecheck
cd ../rakaz-dashboard && npm run typecheck
```
