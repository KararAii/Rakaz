import { useEffect, useState } from 'react';

import type { RakazAdminApi } from '@rakaz/contract';

import { getAdminApi } from '@/services/backend';

export function useAdminApi(): RakazAdminApi {
  return getAdminApi();
}

export function useAsyncData<T>(loader: () => Promise<T>, deps: unknown[] = []): {
  data: T | null;
  error: string | null;
  reload: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void loader()
      .then((value) => {
        if (!cancelled) {
          setData(value);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return {
    data,
    error,
    reload: () => setTick((n) => n + 1),
  };
}
