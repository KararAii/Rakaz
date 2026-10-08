import type { RakazAdminApi } from '@rakaz/contract';

import { DASHBOARD_BACKEND_MODE } from './config';
import { createFirebaseAdminApi } from './firebaseAdmin';
import { createHttpAdminApi } from './httpAdmin';
import { createLocalAdminApi } from './localAdmin';

export { DASHBOARD_BACKEND_MODE } from './config';
export { getRakazApiUrl } from './apiUrl';

let api: RakazAdminApi | null = null;

export function getAdminApi(): RakazAdminApi {
  if (api) return api;
  if (DASHBOARD_BACKEND_MODE === 'firebase') api = createFirebaseAdminApi();
  else if (DASHBOARD_BACKEND_MODE === 'http') api = createHttpAdminApi();
  else api = createLocalAdminApi();
  return api;
}

export function resetAdminApi(): void {
  api = null;
}
