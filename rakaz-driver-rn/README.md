# ركاز السائق — React Native

نسخة React Native (Expo + TypeScript + expo-router) من تطبيق السائق، منقولة من تطبيق أندرويد
(`android-rakaz-driver-android`) مع مقارنة بنسخة iOS.

## التشغيل

```bash
npm install
npx expo start          # Expo Go / development build
npm run typecheck       # npx tsc --noEmit
```

الدخول التجريبي: الهاتف `07701234567` والرمز `2040` (أو زر «تعبئة بيانات تجريبية»).

### خرائط Google على أندرويد

`react-native-maps` يحتاج مفتاح Google Maps على أندرويد في البناءات الأصلية:

```bash
GOOGLE_MAPS_API_KEY=xxxx npx expo run:android
```

يُمرَّر المفتاح عبر `app.config.ts`. على iOS تُستخدم Apple Maps دون مفتاح. على الويب تُعرض خريطة
SVG منمّقة (نفس خريطة أندرويد الأصلية) لأن `react-native-maps` لا يدعم الويب.

## البنية

| المسار | الأصل في أندرويد |
| --- | --- |
| `types/models.ts` | `data/Models.kt` |
| `data/sampleData.ts` | `data/SampleData.kt` |
| `utils/arabicFormat.ts` | `data/ArabicFormat.kt` |
| `services/*` | `data/Services.kt` |
| `store/driverState.ts` + `store/driverStore.ts` | `data/DriverState.kt` + `ui/DriverViewModel.kt` |
| `store/uiStore.ts` | حالة الأوراق في `ui/navigation/AppNavigation.kt` |
| `app/*` | `ui/screens/*` + `AppNavigation.kt` |
| `components/*` | `ui/components/*` + `ui/screens/Sheets.kt` |

## القواعد

- **Offline-first**: كل إجراء يُحفظ في AsyncStorage (`snapshot_v1`) ويُضاف إلى قائمة الانتظار مع الوقت
  والموقع، ثم يُزامن تلقائياً عند عودة الاتصال (NetInfo).
- **رحلة العودة** بترتيب عكسي وتشمل فقط من استُلم صباحاً.
- **الموقع**: GPS إن كان ضمن 60 كم من المدرسة، وإلا موقع المحطة مع `isEstimatedLocation = true`
  ويظهر «(تقديري)» في سجل الطالب.
- **RTL إجباري** عبر `I18nManager.forceRTL(true)` وإضافة `expo-localization` (`forcesRTL`).
