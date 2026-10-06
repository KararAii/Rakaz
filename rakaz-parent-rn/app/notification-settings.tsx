import { useLocalSearchParams } from 'expo-router';
import { BellRing } from 'lucide-react-native';
import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { DetailScreen } from '@/components/DetailScreen';
import { PressableScale } from '@/components/PressableScale';
import { NotificationKindIcon, notificationTint } from '@/constants/visuals';
import { card, Theme, withAlpha } from '@/constants/theme';
import { useFamily } from '@/store/familyStore';
import { allNotificationKinds, isNotificationOn, NotificationKind, NotificationKindTitle } from '@/types/models';

export default function NotificationSettingsScreen() {
  const store = useFamily();
  const { sheet } = useLocalSearchParams<{ sheet?: string }>();

  return (
    <DetailScreen title="إعدادات الإشعارات" inSheet={sheet === '1'} gap={8}>
      <AppText size="footnote" weight="semibold" color={Theme.muted} style={styles.px16}>
        الإشعارات الفورية (Push)
      </AppText>
      <View style={card(0, 16)}>
        {allNotificationKinds.map((kind, i) => {
          const Icon = NotificationKindIcon[kind];
          return (
            <View key={kind} style={[styles.row, i > 0 ? styles.rowBorder : null]}>
              <Icon size={18} color={notificationTint(kind)} />
              <AppText size="subheadline" weight="semibold" style={styles.flex}>
                {NotificationKindTitle[kind]}
              </AppText>
              <Switch
                value={isNotificationOn(store.state.preferences, kind)}
                onValueChange={(on) => store.setPreference(kind, on)}
                trackColor={{ true: Theme.gold, false: withAlpha(Theme.muted, 0.3) }}
                thumbColor={Theme.white}
                accessibilityLabel={NotificationKindTitle[kind]}
              />
            </View>
          );
        })}
      </View>
      <AppText size="caption" color={Theme.muted} style={styles.footer}>
        اختر الإشعارات التي ترغب باستلامها. إشعارات السلامة مثل الاستلام والتسليم موصى بإبقائها مفعّلة.
      </AppText>

      <PressableScale
        scale={0.99}
        accessibilityLabel="تجربة إشعار «السائق قريب»"
        onPress={() => store.push(NotificationKind.driverNear, `السائق على بُعد ٥ دقائق من المنزل. يُرجى تجهيز ${store.student.firstName}.`)}
        style={[card(0, 16), styles.row, styles.test]}
      >
        <BellRing size={18} color={Theme.navy} />
        <AppText size="subheadline" weight="semibold" color={Theme.navy}>
          تجربة إشعار «السائق قريب»
        </AppText>
      </PressableScale>
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  px16: { paddingHorizontal: 16 },
  footer: { paddingHorizontal: 16, marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52, paddingVertical: 6 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.line },
  flex: { flex: 1 },
  test: { alignSelf: 'stretch' },
});
