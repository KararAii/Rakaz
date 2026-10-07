# دليل تسليم الربط — ركاز × Firebase

هذا المستند موجّه لمطور Firebase الذي سيربط `rakaz-driver-rn` و`rakaz-parent-rn`.

## الحالة الحالية

| الطبقة | الحالة |
| --- | --- |
| واجهات التطبيقين | مكتملة (سلوك محلي / ديمو) |
| حزمة العقود `@rakaz/contract` | جاهزة |
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
```

## خطوات التنفيذ المقترحة

### 1) تثبيت Firebase في التطبيقين
```bash
cd rakaz-driver-rn && npx expo install firebase
cd ../rakaz-parent-rn && npx expo install firebase
```
(أو `@react-native-firebase/*` مع Development Build.)

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

### 6) توحيد المعرفات
استخدم دائماً `STU-*` في Firestore.
جسر الديمو `st-*` ↔ `STU-*` موجود في `DEMO_STUDENT_ID_BRIDGE` للاختبار فقط.

## اختبار القبول الأدنى

1. سائق يسجّل `PICKED_UP` للطالب `STU-24031`
2. تظهر وثيقة في `trip_events` و`trips`
3. ولي الأمر يرى الحالة «تم استلام الطالب» بدون المحاكاة المحلية
4. ولي الأمر يبلّغ غياباً → وثيقة في `absences`
5. سائق يرى الغياب في رحلته (قراءة `absences` حيث `day == اليوم`)

## تشغيل typecheck

```bash
cd packages/rakaz-contract && npx tsc --noEmit
cd ../../rakaz-driver-rn && npm run typecheck
cd ../rakaz-parent-rn && npm run typecheck
```
