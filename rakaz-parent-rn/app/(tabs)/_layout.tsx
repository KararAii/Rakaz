import { Tabs } from 'expo-router';

import { RakazTabBar } from '@/components/TabBar';
import { Theme } from '@/constants/theme';

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <RakazTabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Theme.canvas } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="trips" />
      <Tabs.Screen name="family" />
      <Tabs.Screen name="support" />
    </Tabs>
  );
}
