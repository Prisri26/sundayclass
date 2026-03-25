import { updateProfile, User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { DEFAULT_PLAN_ID, getPlanDefinition, PlanId } from './plans';
import { Membership } from './tenant';

export type CreateChurchWorkspaceInput = {
  fullName: string;
  churchName: string;
  slug: string;
  selectedPlanId?: PlanId;
  contactEmail: string;
  contactPhone?: string;
  timezone: string;
  country?: string;
};

export async function saveSelectedPlan(userId: string, planId: PlanId) {
  await setDoc(
    doc(db, 'users', userId),
    {
      onboardingDraft: {
        selectedPlanId: planId,
        updatedAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getSelectedPlan(userId: string): Promise<PlanId | null> {
  const snapshot = await getDoc(doc(db, 'users', userId));
  const selectedPlanId = snapshot.data()?.onboardingDraft?.selectedPlanId;
  return selectedPlanId ? getPlanDefinition(selectedPlanId).id : null;
}

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
  const selectedPlan = getPlanDefinition(input.selectedPlanId || DEFAULT_PLAN_ID);
  const churchCode = await generateUniqueChurchCode();

  const churchRef = doc(db, 'churches', slug);
  const churchCodeRef = doc(db, 'churchCodes', churchCode);
  const memberRef = doc(db, `churches/${slug}/members`, user.uid);
  const userRef = doc(db, 'users', user.uid);
  const generalSettingsRef = doc(db, `churches/${slug}/settings`, 'general');
  const brandingSettingsRef = doc(db, `churches/${slug}/settings`, 'branding');
  const featureSettingsRef = doc(db, `churches/${slug}/settings`, 'features');
  const subscriptionSettingsRef = doc(db, `churches/${slug}/settings`, 'subscription');
  const churchCenterRef = doc(db, `churches/${slug}/centers`, 'church');

  await updateProfile(user, { displayName: input.fullName.trim() });

  try {
    await setDoc(churchRef, {
      name: input.churchName.trim(),
      slug,
      churchCode,
      status: 'active',
      plan: selectedPlan.id,
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
    await setDoc(subscriptionSettingsRef, {
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'trial',
      billingCycle: 'manual',
      isActive: true,
      trialEndsAt: null,
      limits: selectedPlan.limits,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Subscription setup failed: ${error?.message || 'permission denied'}`);
  }

  try {
    await setDoc(generalSettingsRef, {
      churchCode,
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
      announcements: selectedPlan.id !== 'starter',
      events: selectedPlan.id !== 'starter',
      followUps: selectedPlan.id === 'premium',
      spotlight: selectedPlan.id !== 'starter',
      parentPortal: false,
      customDomain: selectedPlan.id === 'premium',
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

  try {
    await setDoc(churchCodeRef, {
      churchId: slug,
      churchCode,
      churchDisplayName: input.churchName.trim(),
      shortName: input.churchName.trim(),
      logoUrl: '',
      primaryColor: '#4F46E5',
      secondaryColor: '#3730A3',
      accentColor: '#10B981',
      welcomeTitle: `Welcome to ${input.churchName.trim()}`,
      welcomeSubtitle: 'Manage centers, students, and attendance with confidence.',
      createdByUserId: user.uid,
      active: true,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error(`Church code setup failed: ${error?.message || 'permission denied'}`);
  }

  return { churchId: slug, churchCode };
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

  const churchSnapshot = await getDoc(doc(db, 'churches', churchId));
  const churchCode = String(churchSnapshot.data()?.churchCode || '').trim();
  if (!churchCode) return;

  await setDoc(doc(db, 'churchCodes', churchCode), {
    churchId,
    churchCode,
    churchDisplayName: input.churchDisplayName.trim(),
    shortName: input.shortName?.trim() || input.churchDisplayName.trim(),
    logoUrl: input.logoUrl || '',
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
    accentColor: input.accentColor,
    welcomeTitle: input.welcomeTitle?.trim() || `Welcome to ${input.churchDisplayName.trim()}`,
    welcomeSubtitle: input.welcomeSubtitle?.trim() || 'Manage centers, students, and attendance with confidence.',
    active: true,
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

export type OnboardingCenterOption = {
  id: string;
  name: string;
};

export type ProvisioningMemberRecord = {
  id: string;
  churchId: string;
  fullName: string;
  loginId: string;
  temporaryPassword?: string;
  role: Membership['role'];
  centerIds: string[];
  centerNames: string[];
  status: 'pending_provisioning';
};

export async function listOnboardingCenters(churchId: string): Promise<OnboardingCenterOption[]> {
  const snapshot = await getDocs(query(collection(db, `churches/${churchId}/centers`), orderBy('createdAt', 'asc')));
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    name: String(entry.data().name || 'Center'),
  }));
}

function normalizeLoginName(input: string) {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .replace(/\.{2,}/g, '.');

  return base || 'member';
}

function buildLoginId(baseName: string, churchId: string, suffix?: number) {
  const normalizedChurchId = normalizeChurchSlug(churchId);
  const normalizedName = normalizeLoginName(baseName);
  const localPart = suffix && suffix > 1 ? `${normalizedName}${suffix}` : normalizedName;
  return `${localPart}@${normalizedChurchId}.prayloom`;
}

function generateTemporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let index = 0; index < 12; index += 1) {
    password += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return password;
}

async function collectUsedLoginIds(churchId: string) {
  const used = new Set<string>();

  const memberSnapshot = await getDocs(collection(db, `churches/${churchId}/members`));
  memberSnapshot.forEach((entry) => {
    const data = entry.data();
    const candidate = String(data.loginId || data.email || '').trim().toLowerCase();
    if (candidate) used.add(candidate);
  });

  const provisioningSnapshot = await getDocs(collection(db, `churches/${churchId}/provisioningMembers`));
  provisioningSnapshot.forEach((entry) => {
    const candidate = String(entry.data().loginId || '').trim().toLowerCase();
    if (candidate) used.add(candidate);
  });

  return used;
}

function generateChurchCodeCandidate() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function generateUniqueChurchCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = generateChurchCodeCandidate();
    const snap = await getDoc(doc(db, 'churchCodes', candidate));
    if (!snap.exists()) {
      return candidate;
    }
  }

  throw new Error('Unable to allocate a unique church code right now. Please try again.');
}

export async function generateUniqueLoginId(churchId: string, fullName: string) {
  const usedLoginIds = await collectUsedLoginIds(churchId);
  let suffix = 1;
  let candidate = buildLoginId(fullName, churchId);

  while (usedLoginIds.has(candidate.toLowerCase())) {
    suffix += 1;
    candidate = buildLoginId(fullName, churchId, suffix);
  }

  return candidate;
}

export type SaveProvisioningMemberInput = {
  fullName: string;
  role: Membership['role'];
  centerIds: string[];
  centerNames: string[];
};

export async function saveProvisioningMembers(
  churchId: string,
  members: SaveProvisioningMemberInput[],
): Promise<ProvisioningMemberRecord[]> {
  const created: ProvisioningMemberRecord[] = [];
  for (const member of members) {
    const loginId = await generateUniqueLoginId(churchId, member.fullName);
    const temporaryPassword = generateTemporaryPassword();

    const payload = {
      churchId,
      fullName: member.fullName.trim(),
      loginId,
      temporaryPassword,
      role: member.role,
      centerIds: member.centerIds,
      centerNames: member.centerNames,
      status: 'pending_provisioning' as const,
      mustResetPassword: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(collection(db, `churches/${churchId}/provisioningMembers`), payload);
    created.push({
      id: ref.id,
      churchId,
      fullName: member.fullName.trim(),
      loginId,
      temporaryPassword,
      role: member.role,
      centerIds: member.centerIds,
      centerNames: member.centerNames,
      status: 'pending_provisioning',
    });
  }

  return created;
}
