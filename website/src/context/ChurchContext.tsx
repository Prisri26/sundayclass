'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { DEFAULT_CHURCH_ID, MULTI_TENANT_ENABLED } from '../lib/platform';
import { useAuth } from './AuthContext';
import { ChurchSummary, Membership, getDirectChurchAccess } from '../lib/tenant';
import { BrandingSettings, getChurchBranding } from '../lib/branding';

type ChurchContextValue = {
  activeChurchId: string | null;
  activeChurch: ChurchSummary | null;
  activeMembership: Membership | null;
  branding: BrandingSettings | null;
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
  branding: null,
  availableChurches: [],
  memberships: [],
  loading: MULTI_TENANT_ENABLED,
  multiTenantEnabled: MULTI_TENANT_ENABLED,
  setActiveChurchId: () => undefined,
});

export function ChurchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [activeChurchId, setActiveChurchId] = useState<string | null>(DEFAULT_CHURCH_ID || null);
  const [availableChurches, setAvailableChurches] = useState<ChurchSummary[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(MULTI_TENANT_ENABLED);

  useEffect(() => {
    const skipSubscription =
      pathname === '/login'
      || pathname === '/signup'
      || pathname.startsWith('/onboarding');

    if (!MULTI_TENANT_ENABLED) {
      setLoading(false);
      return;
    }

    if (skipSubscription) {
      setLoading(false);
      return;
    }

    if (!user) {
      console.log('[ChurchContext] No authenticated user');
      setAvailableChurches([]);
      setMemberships([]);
      setBranding(null);
      setActiveChurchId(null);
      setLoading(false);
      return;
    }

    console.log('[ChurchContext] Resolving church access', {
      uid: user.uid,
      email: user.email,
      defaultChurchId: DEFAULT_CHURCH_ID || null,
      pathname,
    });

    setLoading(true);
    getDirectChurchAccess(user.uid, DEFAULT_CHURCH_ID || undefined)
      .then((access) => {
        console.log('[ChurchContext] Membership access result', access);
        const nextChurches = access.map((entry) => entry.church);
        const nextMemberships = access.map((entry) => entry.membership);
        setAvailableChurches(nextChurches);
        setMemberships(nextMemberships);
        setActiveChurchId((current) => {
          const nextActiveChurchId = current && nextChurches.some((church) => church.id === current)
            ? current
            : nextChurches[0]?.id ?? null;
          console.log('[ChurchContext] Active church selected', {
            previous: current ?? null,
            next: nextActiveChurchId,
            churches: nextChurches.map((church) => ({ id: church.id, name: church.name })),
          });
          if (current && nextChurches.some((church) => church.id === current)) {
            return current;
          }
          return nextChurches[0]?.id ?? null;
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error('[ChurchContext] Failed to resolve church access', error);
        setAvailableChurches([]);
        setMemberships([]);
        setBranding(null);
        setActiveChurchId(null);
        setLoading(false);
      });
  }, [pathname, user]);

  useEffect(() => {
    let active = true;

    if (!activeChurchId) {
      setBranding(null);
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--primary', '#4F46E5');
        root.style.setProperty('--primary-dark', '#3730A3');
        root.style.setProperty('--accent', '#10B981');
      }
      return;
    }

    getChurchBranding(activeChurchId)
      .then((value) => {
        if (!active) return;
        setBranding(value);
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.style.setProperty('--primary', value?.primaryColor || '#4F46E5');
          root.style.setProperty('--primary-dark', value?.secondaryColor || '#3730A3');
          root.style.setProperty('--accent', value?.accentColor || '#10B981');
        }
      })
      .catch(() => {
        if (!active) return;
        setBranding(null);
      });

    return () => {
      active = false;
    };
  }, [activeChurchId]);

  const activeChurch = availableChurches.find((church) => church.id === activeChurchId) ?? null;
  const activeMembership = memberships.find((membership) => membership.churchId === activeChurchId) ?? null;

  const value = useMemo(
    () => ({
      activeChurchId,
      activeChurch,
      activeMembership,
      branding,
      availableChurches,
      memberships,
      loading,
      multiTenantEnabled: MULTI_TENANT_ENABLED,
      setActiveChurchId,
    }),
    [activeChurch, activeChurchId, activeMembership, branding, availableChurches, loading, memberships]
  );

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>;
}

export function useChurch() {
  return useContext(ChurchContext);
}
