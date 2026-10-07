import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NotificationBanner } from '@/components/NotificationBanner';
import { RTLRoot } from '@/components/RTLRoot';
import { SplashView } from '@/components/SplashView';
import { Fonts, Theme } from '@/constants/theme';
import { useAppNav } from '@/hooks/useAppNav';
import { NotificationService } from '@/services/notificationService';
import { FamilyStoreProvider, useFamily } from '@/store/familyStore';
import { SessionStoreProvider, useSession } from '@/store/sessionStore';
import { NotificationKind } from '@/types/models';

import plexBold from '@/assets/fonts/IBMPlexSansArabic-Bold.ttf';
import plexMedium from '@/assets/fonts/IBMPlexSansArabic-Medium.ttf';
import plexRegular from '@/assets/fonts/IBMPlexSansArabic-Regular.ttf';
import plexSemiBold from '@/assets/fonts/IBMPlexSansArabic-SemiBold.ttf';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

type RouteParams = { params?: object };

function isSheet(route: RouteParams): boolean {
  const params = route.params;
  return params != null && 'sheet' in params && params.sheet === '1';
}

/** Main-shell behaviour from `MainTabView`: simulation, banner and the handover full-screen cover. */
function MainShell() {
  const store = useFamily();
  const nav = useAppNav();
  const router = useRouter();
  const { handoverPending, banner } = store.state;
  const { startSimulation } = store;
  const presented = useRef(false);

  useEffect(() => {
    startSimulation();
    void NotificationService.requestAuthorization();
  }, [startSimulation]);

  useEffect(() => {
    if (handoverPending && !presented.current) {
      presented.current = true;
      router.push('/handover');
    }
    if (!handoverPending) presented.current = false;
  }, [handoverPending, router]);

  if (banner == null) return null;
  return (
    <NotificationBanner
      notification={banner}
      onPress={() => {
        store.dismissBanner();
        store.markRead(banner.id);
        if (banner.kind === NotificationKind.delivered && store.state.handoverPending) return;
        nav.showNotifications();
      }}
    />
  );
}

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const session = useSession();
  const ready = fontsLoaded && session.hydrated;
  const signedIn = session.phase === 'main';
  const [splashGone, setSplashGone] = useState(false);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Theme.canvas } }}>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="student/[id]" />
          <Stack.Screen name="address/[id]" />
          <Stack.Screen name="school" />
          <Stack.Screen name="driver" />
          <Stack.Screen name="absences" />
          <Stack.Screen name="finance" />
          <Stack.Screen name="trip/[kind]" />
          <Stack.Screen name="notifications" options={({ route }) => ({ presentation: isSheet(route) ? 'modal' : 'card' })} />
          <Stack.Screen name="notification-settings" options={({ route }) => ({ presentation: isSheet(route) ? 'modal' : 'card' })} />
          <Stack.Screen name="report-absence" options={{ presentation: 'modal' }} />
          <Stack.Screen name="ticket/[kind]" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="payment/[id]"
            options={{ presentation: 'formSheet', sheetAllowedDetents: [0.6, 1], sheetGrabberVisible: true, contentStyle: { backgroundColor: Theme.canvas } }}
          />
          <Stack.Screen name="handover" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
        </Stack.Protected>
      </Stack>
      {signedIn ? <MainShell /> : null}
      {splashGone ? null : <SplashView onFinish={session.finishSplash} onGone={() => setSplashGone(true)} />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    [Fonts.regular]: plexRegular,
    [Fonts.medium]: plexMedium,
    [Fonts.semibold]: plexSemiBold,
    [Fonts.bold]: plexBold,
  });

  return (
    <RTLRoot>
      <SafeAreaProvider>
        <SessionStoreProvider>
          <FamilyStoreProvider>
            <RootNavigator fontsLoaded={fontsLoaded || fontError != null} />
          </FamilyStoreProvider>
        </SessionStoreProvider>
      </SafeAreaProvider>
    </RTLRoot>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Theme.canvas },
});
