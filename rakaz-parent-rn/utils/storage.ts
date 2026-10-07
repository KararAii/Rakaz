import AsyncStorage from '@react-native-async-storage/async-storage';

/** Tiny JSON-in-AsyncStorage persistence for lightweight user data (Swift `Storage`). */
export const Storage = {
  async load<T>(key: string, isValid: (value: unknown) => value is T): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw == null) return null;
      const parsed: unknown = JSON.parse(raw);
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  save(key: string, value: unknown): void {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
  },

  remove(key: string): void {
    AsyncStorage.removeItem(key).catch(() => undefined);
  },
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
