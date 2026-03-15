import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { resolveChurchId } from './platform';
import { Colors } from '../constants/theme';

export type BrandingSettings = {
  churchDisplayName?: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
};

export type BrandPalette = {
  primary: string;
  primaryDark: string;
  accent: string;
  primarySoft: string;
  accentSoft: string;
};

function withAlpha(hexColor: string, alpha: string) {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) return hexColor;
  return `#${normalized}${alpha}`;
}

export function getBrandPalette(branding?: BrandingSettings | null): BrandPalette {
  const primary = branding?.primaryColor || Colors.primary;
  const primaryDark = branding?.secondaryColor || Colors.primaryDark;
  const accent = branding?.accentColor || Colors.accent;

  return {
    primary,
    primaryDark,
    accent,
    primarySoft: withAlpha(primary, '22'),
    accentSoft: withAlpha(accent, '22'),
  };
}

export async function getChurchBranding(churchId?: string | null): Promise<BrandingSettings | null> {
  const resolvedChurchId = resolveChurchId(churchId);
  if (!resolvedChurchId) return null;

  const brandingRef = doc(db, `churches/${resolvedChurchId}/settings/branding`);
  const snapshot = await getDoc(brandingRef);
  if (!snapshot.exists()) return null;

  return snapshot.data() as BrandingSettings;
}
