import * as Location from 'expo-location';

import type { Coordinate } from '@/types/models';

/** Thin wrapper over expo-location; delivers GPS fixes while the app is in use. */
export class LocationTracker {
  private subscription: Location.LocationSubscription | null = null;
  private starting = false;

  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === Location.PermissionStatus.GRANTED;
    } catch {
      return false;
    }
  }

  async start(onUpdate: (coordinate: Coordinate) => void): Promise<void> {
    if (this.subscription != null || this.starting) return;
    this.starting = true;
    try {
      if (!(await this.hasPermission())) return;
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) onUpdate({ latitude: last.coords.latitude, longitude: last.coords.longitude });
      this.subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5_000, distanceInterval: 10 },
        (loc) => onUpdate({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
      );
    } catch {
      console.warn('Location: unable to start updates');
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
  }
}
