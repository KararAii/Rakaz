import { useLocalSearchParams, useRouter } from 'expo-router';
import { BellOff, CircleCheck, CircleEllipsis, SlidersHorizontal, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionSheet, type SheetAction } from '@/components/ActionSheet';
import { AppText } from '@/components/AppText';
import { DetailScreen, EmptyState } from '@/components/DetailScreen';
import { PressableScale } from '@/components/PressableScale';
import { IconBadge } from '@/components/Primitives';
import { HeaderTextButton } from '@/components/ScreenHeader';
import { Segmented } from '@/components/Segmented';
import { NotificationKindIcon, notificationTint } from '@/constants/visuals';
import { card, Theme, withAlpha } from '@/constants/theme';
import { useFamily } from '@/store/familyStore';
import {
  allNotificationCategories,
  type AppNotification,
  NotificationCategory,
  notificationCategory,
  NotificationCategoryTitle,
  NotificationKindTitle,
} from '@/types/models';
import { Fmt } from '@/utils/fmt';
import { Haptics } from '@/utils/haptics';

export default function NotificationsScreen() {
  const store = useFamily();
  const router = useRouter();
  const { sheet } = useLocalSearchParams<{ sheet?: string }>();
  const inSheet = sheet === '1';
  const [category, setCategory] = useState<NotificationCategory>(NotificationCategory.all);
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const all = store.state.notifications;
  const filtered = category === NotificationCategory.all ? all : all.filter((n) => notificationCategory(n.kind) === category);

  const openSettings = () => router.push({ pathname: '/notification-settings', params: inSheet ? { sheet: '1' } : {} });

  const menuButton = (
    <PressableScale accessibilityLabel="خيارات" onPress={() => setMenu(true)} style={styles.menuButton} hitSlop={8}>
      <CircleEllipsis size={24} color={Theme.gold} strokeWidth={2} />
    </PressableScale>
  );

  const rowActions: SheetAction[] = selected
    ? [
        ...(selected.isRead ? [] : [{ label: 'تعيين كمقروء', icon: CircleCheck, onPress: () => store.markRead(selected.id) }]),
        { label: 'حذف', icon: Trash2, destructive: true, onPress: () => store.deleteNotification(selected.id) },
      ]
    : [];

  return (
    <DetailScreen
      title="الإشعارات"
      inSheet={inSheet}
      leading={inSheet ? <HeaderTextButton title="إغلاق" onPress={() => router.back()} /> : undefined}
      trailing={menuButton}
      gap={12}
    >
      <Segmented options={allNotificationCategories.map((c) => ({ value: c, title: NotificationCategoryTitle[c] }))} value={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <EmptyState icon={BellOff} title="لا توجد إشعارات" />
      ) : (
        <View style={[card(0, 16), styles.list]}>
          {filtered.map((n, i) => {
            const tint = notificationTint(n.kind);
            return (
              <PressableScale
                key={n.id}
                scale={0.99}
                accessibilityLabel={NotificationKindTitle[n.kind]}
                onPress={() => {
                  Haptics.selection();
                  store.markRead(n.id);
                }}
                onLongPress={() => {
                  Haptics.tap();
                  setSelected(n);
                }}
                style={[styles.row, { backgroundColor: n.isRead ? Theme.card : withAlpha(Theme.goldSoft, 0.6) }, i > 0 ? styles.rowBorder : null]}
              >
                <IconBadge icon={NotificationKindIcon[n.kind]} tint={tint} soft={withAlpha(tint, 0.12)} size={42} />
                <View style={styles.flexGap4}>
                  <View style={styles.between}>
                    <AppText size="subheadline" weight="bold" style={styles.shrink}>
                      {NotificationKindTitle[n.kind]}
                    </AppText>
                    <AppText size="caption2" color={Theme.muted}>
                      {Fmt.relative(n.date)}
                    </AppText>
                  </View>
                  <AppText size="footnote" color={Theme.muted}>
                    {n.body}
                  </AppText>
                </View>
                {n.isRead ? null : <View style={styles.unread} />}
              </PressableScale>
            );
          })}
        </View>
      )}
      {filtered.length > 0 ? (
        <AppText size="caption2" color={Theme.muted} align="center">
          اضغط مطوّلاً على إشعار لحذفه
        </AppText>
      ) : null}

      <ActionSheet
        visible={menu}
        actions={[
          { label: 'تعيين الكل كمقروء', icon: CircleCheck, onPress: store.markAllRead },
          { label: 'إعدادات الإشعارات', icon: SlidersHorizontal, onPress: openSettings },
        ]}
        onClose={() => setMenu(false)}
      />
      <ActionSheet
        visible={selected != null}
        title={selected ? NotificationKindTitle[selected.kind] : undefined}
        actions={rowActions}
        onClose={() => setSelected(null)}
      />
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  menuButton: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  list: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Theme.line },
  flexGap4: { flex: 1, gap: 4 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  shrink: { flexShrink: 1 },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.gold, marginTop: 6 },
});
