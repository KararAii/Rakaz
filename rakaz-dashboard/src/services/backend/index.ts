import type { RakazAdminApi } from '@rakaz/contract';

import { DASHBOARD_BACKEND_MODE } from './config';
import { createFirebaseAdminApi } from './firebaseAdmin';
import { createLocalAdminApi } from './localAdmin';

export { DASHBOARD_BACKEND_MODE } from './config';

let api: RakazAdminApi | null = null;

export function getAdminApi(): RakazAdminApi {
  if (api) return api;
  api = DASHBOARD_BACKEND_MODE === 'firebase' ? createFirebaseAdminApi() : createLocalAdminApi();
  return api;
}

export function resetAdminApi(): void {
  api = null;
}
