# ركاز — لوحة الإدارة (جاهزة للربط)

لوحة ويب عربية (Vite + React) تدير مصدر الحقيقة الذي تستهلكه تطبيقات السائق وولي الأمر عبر Firebase.

> ملاحظة: مستودع `https://github.com/KararAii/dashboar-RAKAZ.git` لم يكن متاحاً من بيئة الوكيل (404).
> أُنشئت هذه اللوحة داخل `KararAii/Rakaz` بنفس عقود `@rakaz/contract`. يمكن لاحقاً نقلها أو مزامنتها مع مستودع الداشبورد المنفصل بعد منح الصلاحيات.

## التشغيل

```bash
cd rakaz-dashboard
npm install
npm run dev          # http://localhost:5173
npm run typecheck
```

## وضع الربط

| الوضع | الملف | المعنى |
| --- | --- | --- |
| `local` (افتراضي) | `src/services/backend/config.ts` | بيانات ديمو بنفس `STU-24031` / `R-204` |
| `firebase` | نفّذ `firebaseAdmin.ts` ثم بدّل العلم | قراءة/كتابة Firestore الحقيقية |

## دور اللوحة في الربط

```
لوحة الإدارة ──upsert──► students / routes / drivers / trips (فتح اليوم)
                              ▲
السائق ──trip_events──┘      │
                              ▼
                         ولي الأمر (onSnapshot)
                              │
                         absences / addresses / handovers
                              ▼
                         لوحة الإدارة تراقب
```

الواجهة الإدارية: `RakazAdminApi` في `@rakaz/contract` (`src/admin.ts`).

## الشاشات

- نظرة عامة + زر فتح رحلات اليوم
- الطلاب (معرّفات `STU-*`)
- المسارات والمحطات
- الرحلات الحية
- الغياب

## لمطور Firebase

1. ثبّت `firebase` في هذه الحزمة.
2. نفّذ `src/services/backend/firebaseAdmin.ts` باستخدام `FirestorePaths`.
3. عيّن `DASHBOARD_BACKEND_MODE = 'firebase'`.
4. أضف Auth للمشرفين (بريد/كلمة مرور أو Custom Claims `role=admin`).
5. Security Rules: الكتابة الإدارية للمستخدمين ذوي صلاحية admin فقط.
