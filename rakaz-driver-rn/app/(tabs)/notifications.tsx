import { Bell, CheckCheck, Route, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { EmptyNote } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz, card, withAlpha } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import { NotificationKind } from '@/types/models';
import { ArabicFormat } from '@/utils/arabicFormat';

const kindStyle: Record<NotificationKind, { icon: LucideIcon; tint: string }> = {
  [NotificationKind.INFO]: { icon: Bell, tint: Rakaz.Navy },
  [NotificationKind.ROUTE]: { icon: Route, tint: Rakaz.GoldDeep },
  [NotificationKind.URGENT]: { icon: TriangleAlert, tint: Rakaz.Red },
};

export default function NotificationsScreen() {
  const store = useDriverStore();
  const { state, derived } = store;
  const insets = useSafeAreaInsets();
  const sorted = useMemo(() => [...state.notifications].sort((a, b) => b.date - a.date), [state.notifications]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.flex}>
          <AppText variant="headlineSmall" color={Rakaz.White}>
            إشعارات الإدارة
          </AppText>
          <AppText variant="labelMedium" color={Rakaz.Gold}>
            {derived.unreadCount > 0 ? `${ArabicFormat.number(derived.unreadCount)} غير مقروءة` : 'لا توجد إشعارات جديدة'}
          </AppText>
        </View>
        {derived.unreadCount > 0 ? (
          <PressableScale onPress={store.markAllRead} accessibilityLabel="قراءة الكل" style={styles.readAll}>
            <CheckCheck color={Rakaz.Gold} size={16} />
            <AppText variant="labelSmall" color={Rakaz.White}>
              قراءة الكل
            </AppText>
          </PressableScale>
        ) : null}
      </View>
      <FlatList
        data={sorted}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyNote text="لا توجد إشعارات" />}
        renderItem={({ item: n }) => {
          const { icon: Icon, tint } = kindStyle[n.kind];
          return (
            <PressableScale haptic={false} onPress={() => store.markRead(n.id)} accessibilityLabel={n.title} style={[card(20), styles.row]}>
              <View style={[styles.icon, { backgroundColor: withAlpha(tint, 0.12) }]}>
                <Icon color={tint} size={22} />
              </View>
              <View style={[styles.flex, styles.body]}>
                <View style={styles.titleRow}>
                  <AppText variant="titleSmall" style={styles.flex}>
                    {n.title}
                  </AppText>
                  <AppText variant="labelSmall" color={Rakaz.InkSecondary}>
                    {ArabicFormat.relative(n.date)}
                  </AppText>
                  {!n.isRead ? <View style={styles.unread} /> : null}
                </View>
                <AppText variant="bodyMedium" color={Rakaz.InkSecondary}>
                  {n.body}
                </AppText>
              </View>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Rakaz.Canvas },
  flex: { flex: 1 },
  header: { backgroundColor: Rakaz.Navy, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center' },
  readAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: withAlpha(Rakaz.White, 0.1),
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unread: { width: 8, height: 8, borderRadius: 4, backgroundColor: Rakaz.Gold },
});
