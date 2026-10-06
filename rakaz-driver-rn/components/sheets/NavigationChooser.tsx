import { Map, Navigation } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz } from '@/constants/theme';
import { NavigationProvider, NavigationProviderTitle, navigationProviders } from '@/services/navigationLauncher';
import type { NavTarget } from '@/store/uiStore';

export interface NavigationChooserProps {
  target: NavTarget | null;
  onDismiss: () => void;
  onPick: (provider: NavigationProvider) => void;
}

export function NavigationChooser({ target, onDismiss, onPick }: NavigationChooserProps) {
  return (
    <BottomSheet visible={target != null} onDismiss={onDismiss}>
      {target ? (
        <>
          <View>
            <AppText variant="labelMedium" color={Rakaz.Gold}>
              الملاحة إلى
            </AppText>
            <AppText variant="titleLarge">{target.title}</AppText>
          </View>
          <View style={styles.list}>
            {navigationProviders.map((p) => {
              const Icon = p === NavigationProvider.WAZE ? Navigation : Map;
              return (
                <PressableScale key={p} onPress={() => onPick(p)} accessibilityLabel={NavigationProviderTitle[p]} style={styles.option}>
                  <Icon color={Rakaz.Navy} size={22} />
                  <AppText variant="titleSmall">{NavigationProviderTitle[p]}</AppText>
                </PressableScale>
              );
            })}
          </View>
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  option: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Rakaz.Canvas,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
