import { resolveRakazApiUrl } from '@rakaz/contract';

export function getRakazApiUrl(): string {
  return resolveRakazApiUrl(import.meta.env.VITE_RAKAZ_API_URL ?? null);
}
