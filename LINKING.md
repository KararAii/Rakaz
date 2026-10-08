# دليل تسليم الربط — ركاز × Firebase / API محلي

يربط هذا الدليل: `rakaz-driver-rn` + `rakaz-parent-rn` + `rakaz-dashboard` عبر `@rakaz/contract`
وباكند محلي جاهز `packages/rakaz-api` (بديل تطويري لـ Firebase).

## الحالة الحالية

| الطبقة | الحالة |
| --- | --- |
| عقود `@rakaz/contract` | مكتملة (+ Admin + HTTP paths) |
| باكند محلي `rakaz-api` | **جاهز للتشغيل** على `:8787` |
| السائق | وضع افتراضي `http` — يكتب الأحداث ويجلب الغياب |
| ولي الأمر | وضع افتراضي `http` — يستمع للرحلة ويتوقف عن المحاكاة |
| الداشبورد | وضع افتراضي `http` — CRUD + بث + رحلات حية |
| Firebase stubs | موجودة للتبديل لاحقاً |

## تشغيل الربط المحلي (ثلاثي)

```bash
# 1) الباكند
cd packages/rakaz-api && npm install && npm run dev

# 2) الداشبورد
cd rakaz-dashboard && npm install && npm run dev

# 3) التطبيقات (Expo) مع نفس الـ API
# EXPO_PUBLIC_RAKAZ_API_URL=http://127.0.0.1:8787
```

على جهاز حقيقي استبدل العنوان بـ IP الجهاز المضيف.

## الأوضاع

| العميل | الملف | القيم |
| --- | --- | --- |
| سائق | `rakaz-driver-rn/services/backend/config.ts` | `local` \| `http` \| `firebase` |
| ولي أمر | `rakaz-parent-rn/services/backend/config.ts` | `simulation` \| `http` \| `firebase` |
| داشبورد | `rakaz-dashboard/src/services/backend/config.ts` | `local` \| `http` \| `firebase` |

## تدفق البيانات

```
لوحة الإدارة ──CRUD / openDailyTrips──► rakaz-api
                                            ▲
السائق ──trip_events + upsertTrip───────────┤
                                            │
ولي الأمر ──absence / address / handover────┤
                                            │
                ◄── trips stream / poll ────┘
```

## اختبار القبول

1. شغّل `rakaz-api` والداشبورد.
2. من النظرة العامة: **فتح رحلات اليوم**.
3. من تطبيق السائق: ابدأ رحلة وسجّل `PICKED_UP` لـ `st-1` (= `STU-24031`).
4. ولي الأمر يرى تحديث الحالة دون المحاكاة.
5. ولي الأمر يبلّغ غياباً → يظهر في الداشبورد → عند مزامنة السائق يُعلَّم الطالب غائباً.

## الانتقال إلى Firebase

1. نفّذ stubs في `firebaseWriter.ts` / `firebaseSource.ts` / `firebaseAdmin.ts`.
2. بدّل الأوضاع الثلاثة إلى `firebase`.
3. أبقِ نفس الحقول والمسارات من `FirestorePaths` و`RakazTripEvent`.

## typecheck

```bash
cd packages/rakaz-contract && npx tsc --noEmit
cd ../rakaz-api && npm run typecheck
cd ../../rakaz-dashboard && npm run typecheck
cd ../rakaz-driver-rn && npm run typecheck
cd ../rakaz-parent-rn && npm run typecheck
```
