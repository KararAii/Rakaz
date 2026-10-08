import { resolveRakazApiUrl } from '@rakaz/contract';
import Constants from 'expo-constants';

export function getRakazApiUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { rakazApiUrl?: string } | undefined)?.rakazApiUrl;
  const fromEnv = process.env.EXPO_PUBLIC_RAKAZ_API_URL;
  return resolveRakazApiUrl(fromEnv ?? fromExtra ?? null);
}
