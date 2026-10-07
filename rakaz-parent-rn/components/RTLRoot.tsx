import type { ReactNode } from 'react';

/** Native builds are forced RTL through `I18nManager`; see `RTLRoot.web.tsx` for the web counterpart. */
export function RTLRoot({ children }: { children: ReactNode }) {
  return children;
}
