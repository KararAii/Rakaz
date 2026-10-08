# @rakaz/api — الباكند المحلي للربط

خادم Express مشترك يربط:
- `rakaz-dashboard`
- `rakaz-driver-rn`
- `rakaz-parent-rn`

بنفس عقود `@rakaz/contract` (قبل Firebase أو معه للتطوير).

## التشغيل

```bash
cd packages/rakaz-api
npm install
npm run dev
# http://127.0.0.1:8787/health
```

المنفذ: `RAKAZ_API_PORT` (افتراضي 8787).

## ماذا يوفّر؟

- CRUD طلاب / سائقين / مسارات
- فتح رحلات اليوم
- استقبال `trip_events` من السائق وتحديث `trips`
- غياب / عنوان / تأكيد استلام من ولي الأمر
- بث SSE للرحلات الحية (الداشبورد)
- حل `tripId` النشط للطالب

عند الانتقال لـ Firebase: انقل نفس المسارات إلى Firestore + Cloud Functions، واترك أوضاع `firebase` في التطبيقات.
