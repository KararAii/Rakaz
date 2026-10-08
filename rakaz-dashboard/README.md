# ركاز — لوحة الإدارة

لوحة ويب عربية (Vite + React) لإدارة الطلاب والمسارات والرحلات والغياب.

## التشغيل مع الباكند المشترك

```bash
# طرفية 1 — API
cd packages/rakaz-api && npm install && npm run start

# طرفية 2 — الداشبورد
cd rakaz-dashboard && npm install && npm run dev
```

الوضع الافتراضي: `http` → `http://127.0.0.1:8787`  
غيّر عبر `VITE_RAKAZ_API_URL` أو `DASHBOARD_BACKEND_MODE` في `src/services/backend/config.ts`.

## الشاشات

- نظرة عامة + فتح رحلات اليوم + بث إشعار
- الطلاب (CRUD)
- السائقون (CRUD)
- المسارات
- الرحلات الحية (SSE)
- الغياب

## أوضاع الربط

| الوضع | المعنى |
| --- | --- |
| `http` | باكند `rakaz-api` (موصى به للربط) |
| `local` | بيانات داخل المتصفح فقط |
| `firebase` | نفّذ `firebaseAdmin.ts` ثم بدّل العلم |
