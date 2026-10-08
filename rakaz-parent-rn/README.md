# ركاز ولي الأمر — React Native

نسخة React Native (Expo SDK 57 + TypeScript + expo-router) من تطبيق ولي الأمر، منقولة من تطبيق
SwiftUI في `legacy/ios-parent-swift` بنفس الشاشات والمنطق والسلوك. مبنية بنفس أسلوب `rakaz-driver-rn` تمهيداً لربط
التطبيقين بخادم مشترك.

## التشغيل

```bash
npm install
npx expo start          # Expo Go / development build
npx expo start --web    # الويب
npm run typecheck       # npx tsc --noEmit
```

الدخول التجريبي: أي رقم عراقي يبدأ بـ `7` (عشرة أرقام) والرمز `123456`.

### الخرائط

`react-native-maps` على أندرويد (Google) و iOS (Apple). على أندرويد يحتاج البناء الأصلي مفتاحاً:

```bash
GOOGLE_MAPS_API_KEY=xxxx npx expo run:android
```

على الويب تُعرض خريطة SVG بديلة (`components/map/RakazMap.web.tsx`) تدعم السحب والتحريك.

## البنية

| المسار | الأصل في Swift |
| --- | --- |
| `types/models.ts` | `Models/*.swift` |
| `data/mockData.ts` | `Services/MockData.swift` |
| `services/routeGeometry.ts` | `Services/RouteGeometry.swift` |
| `services/notificationService.ts` | `Services/NotificationService.swift` |
| `store/sessionStore.ts` | `ViewModels/SessionStore.swift` |
| `store/familyStore.ts` + `store/familyLogic.ts` | `ViewModels/FamilyStore.swift` |
| `utils/*` + `constants/theme.ts` | `Utilities/*.swift` |
| `app/(tabs)/*` | `Views/Main` + `Home` + `Trip` + `Account` + `Support` |
| `app/*` (بقية الشاشات) | `Views/Details`, `Absence`, `Finance`, `Notifications`, `Trip/Handover…` |
| `components/*` | `Views/Components/*` |

## القواعد

- TypeScript صارم دون `any`، والحالة عبر `@nkzw/create-context-hook`.
- الاتجاه من اليمين لليسار مفروض (`utils/rtl.ts`، و`components/RTLRoot.web.tsx` على الويب).
- لا يُستخدم `Alert` من React Native لأنه لا يعمل على الويب؛ تُستخدم `ActionSheet` و`showAlert`.

## التمهيد للربط مع تطبيق السائق

حالياً تعمل الرحلة بمحاكاة محلية (`familyStore` يتقدّم بالحالة كل ثانية). عند الربط تُستبدل المحاكاة
بالاشتراك في أحداث السائق من الخادم المشترك، وتُحوَّل كل حادثة إلى `TripStatus`:

| حدث السائق (`ActionKind`) | رحلة الذهاب (`morning`) | رحلة العودة (`afternoon`) |
| --- | --- | --- |
| `START_TRIP` | `driverOnTheWay` | — |
| `ARRIVED_AT_STOP` | `arrivedAtPickup` | — |
| `PICKED_UP` | `studentPickedUp` ثم `onTheWayToSchool` | — |
| `ARRIVED_AT_SCHOOL` | `arrivedAtSchool` | — |
| `START_RETURN` | — | `driverOnTheWay` ثم `arrivedAtPickup` |
| `PICKED_UP` (من المدرسة) | — | `studentPickedUp` ثم `onTheWayToSchool` |
| `DROPPED_OFF` | — | `arrivedAtSchool` (يفتح شاشة تأكيد الاستلام) |
| `END_TRIP` | `finished` | `finished` |
| `MARKED_ABSENT` | إشعار غياب للطالب | إشعار غياب للطالب |
| `EMERGENCY` | إشعار تأخر/طارئ (`NotificationKind.delay`) | نفس الشيء |

في رحلة العودة تُعاد الحالات نفسها بمعنى مختلف (انظر `tripStatusTitle`): `arrivedAtSchool` تعني
«تم تسليم الطالب» إلى المنزل.

### معرّفات الطلاب

- السائق يستخدم معرّفات محلية `st-1`… بينما ولي الأمر يستخدم `STU-24031` والرقم الداخلي `RKZ-24031`.
- عند الربط يجب أن يكون معرّف الطالب واحداً في الخادم، ويُفضّل اعتماد `STU-xxxxx`، وأن يحمل كل حدث من
  السائق `studentId` و`tripKind` و`timestamp` وموقع المركبة.

### الاتجاه المعاكس (من ولي الأمر إلى السائق)

- بلاغ الغياب (`reportAbsence`) يجب أن يصل إلى قائمة السائق ليُعلَّم الطالب غائباً.
- تحديث موقع المنزل (`updateAddress`) يجب أن يحدّث نقطة التوقف في مسار السائق.
- تأكيد الاستلام (`confirmHandover`) أو الإبلاغ عن مشكلة (`reportHandoverIssue`) يُرسل إلى الإدارة.

## الربط مع Firebase

انظر `/LINKING.md` والحزمة المشتركة `@rakaz/contract`.
لتفعيل الربط لاحقاً: `services/backend/config.ts` → `PARENT_BACKEND_MODE = "firebase"`.
الأوامر (غياب / عنوان / استلام) تمرّ أصلاً عبر `getParentCommands()`.
