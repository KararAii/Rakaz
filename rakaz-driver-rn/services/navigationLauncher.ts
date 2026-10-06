import { Linking, Platform } from 'react-native';

import type { Coordinate } from '@/types/models';
import { westernDigits } from '@/utils/arabicFormat';

export enum NavigationProvider {
  GOOGLE = 'GOOGLE',
  WAZE = 'WAZE',
  OTHER = 'OTHER',
}

export const NavigationProviderTitle: Record<NavigationProvider, string> = {
  [NavigationProvider.GOOGLE]: 'خرائط Google',
  [NavigationProvider.WAZE]: 'Waze',
  [NavigationProvider.OTHER]: 'تطبيق خرائط آخر',
};

export const navigationProviders: NavigationProvider[] = [
  NavigationProvider.GOOGLE,
  NavigationProvider.WAZE,
  NavigationProvider.OTHER,
];

async function launch(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}

function providerUrl(provider: NavigationProvider, lat: number, lng: number, label: string): string {
  switch (provider) {
    case NavigationProvider.GOOGLE:
      return Platform.OS === 'ios'
        ? `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
        : Platform.OS === 'android'
          ? `google.navigation:q=${lat},${lng}&mode=d`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    case NavigationProvider.WAZE:
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    case NavigationProvider.OTHER:
      return Platform.OS === 'ios'
        ? `maps://?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  }
}

/** Hands turn-by-turn navigation and calls to the driver's installed apps. */
export const NavigationLauncher = {
  async open(provider: NavigationProvider, target: Coordinate, label: string): Promise<void> {
    const { latitude: lat, longitude: lng } = target;
    if (!(await launch(providerUrl(provider, lat, lng, label)))) {
      await launch(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`);
    }
  },

  async dial(number: string): Promise<void> {
    await launch(`tel:${westernDigits(number).replace(/[^0-9]/g, '')}`);
  },
};
