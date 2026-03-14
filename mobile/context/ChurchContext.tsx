import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { DEFAULT_CHURCH_ID, MULTI_TENANT_ENABLED } from '../lib/platform';

type ChurchContextValue = {
  activeChurchId: string | null;
  multiTenantEnabled: boolean;
  setActiveChurchId: (churchId: string | null) => void;
};

const ChurchContext = createContext<ChurchContextValue>({
  activeChurchId: DEFAULT_CHURCH_ID || null,
  multiTenantEnabled: MULTI_TENANT_ENABLED,
  setActiveChurchId: () => undefined,
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [activeChurchId, setActiveChurchId] = useState<string | null>(DEFAULT_CHURCH_ID || null);

  const value = useMemo(
    () => ({
      activeChurchId,
      multiTenantEnabled: MULTI_TENANT_ENABLED,
      setActiveChurchId,
    }),
    [activeChurchId]
  );

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>;
}

export function useChurch() {
  return useContext(ChurchContext);
}
