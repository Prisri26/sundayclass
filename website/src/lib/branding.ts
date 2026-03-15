import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

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

export async function getChurchBranding(churchId?: string | null): Promise<BrandingSettings | null> {
  if (!churchId) return null;

  const brandingRef = doc(db, `churches/${churchId}/settings/branding`);
  const snapshot = await getDoc(brandingRef);
  if (!snapshot.exists()) return null;

  return snapshot.data() as BrandingSettings;
}
