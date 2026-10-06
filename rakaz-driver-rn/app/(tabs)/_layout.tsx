import { Tabs } from 'expo-router';
import { Bell, Bus, LayoutDashboard, Users, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Rakaz } from '@/constants/theme';
import { useDriverStore } from '@/store/driverStore';
import { ArabicFormat } from '@/utils/arabicFormat';

function TabIcon({ icon: Icon, focused, color }: { icon: LucideIcon; focused: boolean; color: ColorValue }) {
  return (
    <View style={[styles.indicator, focused && styles.indicatorActive]}>
      <Icon color={typeof color === 'string' ? color : Rakaz.Navy} size={22} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  const { derived } = useDriverStore();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Rakaz.Navy,
        tabBarInactiveTintColor: Rakaz.InkSecondary,
        tabBarStyle: [styles.bar, { height: 64 + insets.bottom, paddingBottom: insets.bottom + 6 }],
        tabBarLabelStyle: styles.label,
        tabBarBadgeStyle: styles.badge,
        sceneStyle: { backgroundColor: Rakaz.Canvas },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'الرحلة', tabBarIcon: ({ focused, color }) => <TabIcon icon={Bus} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ focused, color }) => <TabIcon icon={LayoutDashboard} focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: 'الطلاب', tabBarIcon: ({ focused, color }) => <TabIcon icon={Users} focused={focused} color={color} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'الإشعارات',
          tabBarBadge: derived.unreadCount > 0 ? ArabicFormat.number(derived.unreadCount) : undefined,
          tabBarIcon: ({ focused, color }) => <TabIcon icon={Bell} focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: Rakaz.White, borderTopColor: Rakaz.Line, paddingTop: 6 },
  label: { fontFamily: Fonts.bold, fontSize: 11, marginTop: 2 },
  badge: { backgroundColor: Rakaz.Red, fontFamily: Fonts.bold, fontSize: 10 },
  indicator: { width: 56, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  indicatorActive: { backgroundColor: Rakaz.GoldSoft },
});
