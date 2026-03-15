import { useEffect, useState } from 'react';
import { getChurchBranding, BrandingSettings } from '../lib/branding';

export function useChurchBranding(churchId?: string | null) {
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    getChurchBranding(churchId)
      .then((value) => {
        if (active) setBranding(value);
      })
      .catch(() => {
        if (active) setBranding(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [churchId]);

  return { branding, loading };
}
