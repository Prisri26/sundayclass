import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { DEFAULT_CHURCH_ID, MULTI_TENANT_ENABLED, getBootstrapChurchId } from '../lib/platform';
import { auth } from '../lib/firebase';
import { ChurchSummary, Membership, getUserChurchAccess, syncUserChurchAccessProfile } from '../lib/tenant';

type ChurchContextValue = {
  activeChurchId: string | null;
  activeChurch: ChurchSummary | null;
  activeMembership: Membership | null;
  availableChurches: ChurchSummary[];
  memberships: Membership[];
  loading: boolean;
  multiTenantEnabled: boolean;
  setActiveChurchId: (churchId: string | null) => void;
};

const ChurchContext = createContext<ChurchContextValue>({
  activeChurchId: DEFAULT_CHURCH_ID || null,
  activeChurch: null,
  activeMembership: null,
  availableChurches: [],
  memberships: [],
  loading: MULTI_TENANT_ENABLED,
  multiTenantEnabled: MULTI_TENANT_ENABLED,
  setActiveChurchId: () => undefined,
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const [activeChurchId, setActiveChurchId] = useState<string | null>(DEFAULT_CHURCH_ID || null);
  const [availableChurches, setAvailableChurches] = useState<ChurchSummary[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState<boolean>(MULTI_TENANT_ENABLED);

  useEffect(() => {
    if (!MULTI_TENANT_ENABLED) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAvailableChurches([]);
        setMemberships([]);
        setActiveChurchId(getBootstrapChurchId());
        setLoading(false);
        return;
      }

      setLoading(true);
      getUserChurchAccess(user.uid)
        .then(async (access) => {
          if (access.length > 0) {
            await syncUserChurchAccessProfile(user.uid, access, {
              email: user.email,
              displayName: user.displayName,
            });
            const nextChurches = access.map((entry) => entry.church);
            const nextMemberships = access.map((entry) => entry.membership);
            setAvailableChurches(nextChurches);
            setMemberships(nextMemberships);
            setActiveChurchId((current) => {
              if (current && nextChurches.some((church) => church.id === current)) {
                return current;
              }
              return nextChurches[0]?.id ?? getBootstrapChurchId();
            });
            setLoading(false);
            return;
          }

          const bootstrapChurchId = getBootstrapChurchId();
          if (bootstrapChurchId) {
            setAvailableChurches([
              {
                id: bootstrapChurchId,
                name: 'Church Workspace',
                slug: bootstrapChurchId,
                status: 'active',
              },
            ]);
            setActiveChurchId(bootstrapChurchId);
          } else {
            setAvailableChurches([]);
            setActiveChurchId(null);
          }
          setMemberships([]);
          setLoading(false);
        })
        .catch(() => {
          const bootstrapChurchId = getBootstrapChurchId();
          if (bootstrapChurchId) {
            setAvailableChurches([
              {
                id: bootstrapChurchId,
                name: 'Church Workspace',
                slug: bootstrapChurchId,
                status: 'active',
              },
            ]);
            setActiveChurchId(bootstrapChurchId);
          } else {
            setAvailableChurches([]);
            setActiveChurchId(null);
          }
          setMemberships([]);
          setLoading(false);
        });
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const activeChurch = availableChurches.find((church) => church.id === activeChurchId) ?? null;
  const activeMembership = memberships.find((membership) => membership.churchId === activeChurchId) ?? null;

  const value = useMemo(
    () => ({
      activeChurchId,
      activeChurch,
      activeMembership,
      availableChurches,
      memberships,
      loading,
      multiTenantEnabled: MULTI_TENANT_ENABLED,
      setActiveChurchId,
    }),
    [activeChurch, activeChurchId, activeMembership, availableChurches, loading, memberships]
  );

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>;
}

export function useChurch() {
  return useContext(ChurchContext);
}
