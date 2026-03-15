import { updateProfile, User } from 'firebase/auth';
import { addDoc, collection, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export type CreateChurchWorkspaceInput = {
  fullName: string;
  churchName: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  timezone: string;
  country?: string;
};

export function normalizeChurchSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function createChurchWorkspace(user: User, input: CreateChurchWorkspaceInput) {
  const slug = normalizeChurchSlug(input.slug || input.churchName);
  if (!slug) {
    throw new Error('Please enter a valid church name or slug.');
  }

  const churchRef = doc(db, 'churches', slug);
  const memberRef = doc(db, `churches/${slug}/members`, user.uid);
  const userRef = doc(db, 'users', user.uid);
  const generalSettingsRef = doc(db, `churches/${slug}/settings`, 'general');
  const brandingSettingsRef = doc(db, `churches/${slug}/settings`, 'branding');
  const featureSettingsRef = doc(db, `churches/${slug}/settings`, 'features');
  const churchCenterRef = doc(db, `churches/${slug}/centers`, 'church');

  await updateProfile(user, { displayName: input.fullName.trim() });

  try {
    await setDoc(churchRef, {
      name: input.churchName.trim(),
      slug,
      status: 'active',
      plan: 'starter',
      timezone: input.timezone,
      country: input.country?.trim() || '',
      contactEmail: input.contactEmail.trim(),
      contactPhone: input.contactPhone?.trim() || '',
      onboardingState: 'setup_started',
      createdByUserId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Church create failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(memberRef, {
      userId: user.uid,
      churchId: slug,
      role: 'church_admin',
      status: 'active',
      centerIds: ['church'],
      joinedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Member bootstrap failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(userRef, {
      email: user.email || input.contactEmail.trim(),
      displayName: input.fullName.trim(),
      defaultChurchId: slug,
      churchIds: [slug],
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  } catch (error: any) {
    throw new Error(`User profile setup failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(generalSettingsRef, {
      timezone: input.timezone,
      locale: 'en',
      attendanceDays: ['sunday'],
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`General settings failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(brandingSettingsRef, {
      churchDisplayName: input.churchName.trim(),
      shortName: input.churchName.trim(),
      primaryColor: '#4F46E5',
      secondaryColor: '#3730A3',
      accentColor: '#10B981',
      welcomeTitle: `Welcome to ${input.churchName.trim()}`,
      welcomeSubtitle: 'Manage centers, students, and attendance with confidence.',
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Branding setup failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(featureSettingsRef, {
      attendance: true,
      students: true,
      reports: true,
      centers: true,
      parents: false,
      announcements: false,
      events: false,
      followUps: false,
      spotlight: true,
      parentPortal: false,
      customDomain: false,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Feature settings failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(churchCenterRef, {
      name: 'Church',
      code: 'CHURCH',
      active: true,
      isChurchLevel: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Default center failed: ${error?.message || 'permission denied'}`);
  }

  return { churchId: slug };
}

export type BrandingSetupInput = {
  churchDisplayName: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
};

export async function saveBrandingSetup(churchId: string, input: BrandingSetupInput) {
  await setDoc(doc(db, `churches/${churchId}/settings`, 'branding'), {
    churchDisplayName: input.churchDisplayName.trim(),
    shortName: input.shortName?.trim() || input.churchDisplayName.trim(),
    logoUrl: input.logoUrl || '',
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    welcomeTitle: input.welcomeTitle?.trim() || `Welcome to ${input.churchDisplayName.trim()}`,
    welcomeSubtitle: input.welcomeSubtitle?.trim() || 'Manage centers, students, and attendance with confidence.',
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export type CenterSetupInput = {
  name: string;
  code: string;
  hostName?: string;
  hostPhone?: string;
  areaName?: string;
  address?: string;
};

export async function addOnboardingCenter(churchId: string, input: CenterSetupInput) {
  await addDoc(collection(db, `churches/${churchId}/centers`), {
    name: input.name.trim(),
    code: input.code.trim(),
    hostName: input.hostName?.trim() || '',
    hostPhone: input.hostPhone?.trim() || '',
    areaName: input.areaName?.trim() || '',
    address: input.address?.trim() || '',
    active: true,
    isChurchLevel: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setOnboardingState(churchId: string, state: 'setup_started' | 'setup_completed') {
  await updateDoc(doc(db, 'churches', churchId), {
    onboardingState: state,
    updatedAt: serverTimestamp(),
  });
}
