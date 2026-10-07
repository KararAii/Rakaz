import type { Tabs } from 'expo-router';
import { Clock, House, type LucideIcon, MessageCircle, Users } from 'lucide-react-native';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { shadow, Theme, withAlpha } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export type AppTab = 'index' | 'trips' | 'family' | 'support';

export const TAB_ORDER: AppTab[] = ['index', 'trips', 'family', 'support'];

const TABS: Record<AppTab, { title: string; icon: LucideIcon }> = {
  index: { title: 'الرئيسية', icon: House },
  trips: { title: 'الرحلات', icon: Clock },
  family: { title: 'العائلة', icon: Users },
  support: { title: 'المساعدة', icon: MessageCircle },
};

function isAppTab(name: string): name is AppTab {
  return name in TABS;
}

/** Bottom navigation matching the design: white rounded bar, gold active item. */
export function RakazTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          if (!isAppTab(route.name)) return null;
          const tab = TABS[route.name];
          const selected = state.index === index;
          const tint = selected ? Theme.gold : Theme.muted;
          const Icon = tab.icon;
          return (
            <PressableScale
              key={route.key}
              scale={0.92}
              accessibilityLabel={tab.title}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (selected || event.defaultPrevented) return;
                Haptics.selection();
                navigation.navigate(route.name);
              }}
              style={styles.item}
            >
              <Icon
                size={21}
                color={tint}
                strokeWidth={selected ? 2.3 : 1.7}
                fill={selected ? withAlpha(Theme.gold, 0.18) : 'transparent'}
              />
              <AppText size="caption2" weight={selected ? 'bold' : 'medium'} color={tint} align="center">
                {tab.title}
              </AppText>
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Theme.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 10,
    paddingTop: 8,
    boxShadow: shadow(-4, 16, 0.08),
  },
  row: { flexDirection: 'row', width: '100%', maxWidth: 640, alignSelf: 'center' },
  item: { flex: 1, height: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
});
