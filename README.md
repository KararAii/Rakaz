# ركاز (Rakaz)

منصة نقل مدرسي: تطبيق السائق، تطبيق ولي الأمر، لوحة الإدارة، وباكند الربط.

## محتويات المستودع

| المسار | الوصف |
| --- | --- |
| `rakaz-driver-rn/` | تطبيق السائق (Expo / React Native) |
| `rakaz-parent-rn/` | تطبيق ولي الأمر (Expo / React Native) |
| `rakaz-dashboard/` | لوحة الإدارة (Vite / React) |
| `packages/rakaz-api/` | باكند محلي للربط (`:8787`) |
| `packages/rakaz-contract/` | عقود TypeScript المشتركة |
| `legacy/ios-parent-swift/` | الأصل Swift لولي الأمر (مرجع فقط) |
| `LINKING.md` | دليل ربط Firebase / API |

## تشغيل سريع (الربط المحلي)

```bash
# 1) الباكند
cd packages/rakaz-api && npm install && npm run start

# 2) الداشبورد
cd rakaz-dashboard && npm install && npm run dev
# http://localhost:5173

# 3) التطبيقات
cd rakaz-driver-rn && npm install && npx expo start
cd rakaz-parent-rn && npm install && npx expo start
```

للأجهزة الحقيقية عيّن:
`EXPO_PUBLIC_RAKAZ_API_URL=http://<IP-الجهاز>:8787`

## الدخول التجريبي

| التطبيق | الهاتف | الرمز |
| --- | --- | --- |
| السائق | `07701234567` | `2040` |
| ولي الأمر | أي رقم عراقي يبدأ بـ `7` (10 أرقام) | `123456` |

## ملاحظات

- أوضاع الربط الافتراضية: `http` (انظر `*/services/backend/config.ts`).
- للانتقال إلى Firebase راجع `LINKING.md`.
- لا ترفع ملفات فيديو أو أرشيفات كبيرة إلى Git.
