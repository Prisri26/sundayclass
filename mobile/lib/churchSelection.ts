import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const STORAGE_KEY = 'prayloom:selectedChurch';

export type SelectedChurchPreview = {
  churchId: string;
  churchCode: string;
  churchDisplayName: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
};

function normalizeChurchCode(input: string) {
  return input.replace(/[^0-9]/g, '').slice(0, 6);
}

export async function getChurchPreviewByCode(input: string): Promise<SelectedChurchPreview | null> {
  const churchCode = normalizeChurchCode(input);
  if (churchCode.length !== 6) {
    return null;
  }

  const snapshot = await getDoc(doc(db, 'churchCodes', churchCode));
  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Omit<SelectedChurchPreview, 'churchCode'> & { active?: boolean };
  if (data.active === false || !data.churchId) {
    return null;
  }

  return {
    churchCode,
    churchId: data.churchId,
    churchDisplayName: data.churchDisplayName || 'Church Workspace',
    shortName: data.shortName || data.churchDisplayName || 'Church',
    logoUrl: data.logoUrl || '',
    primaryColor: data.primaryColor || '',
    secondaryColor: data.secondaryColor || '',
    accentColor: data.accentColor || '',
    welcomeTitle: data.welcomeTitle || '',
    welcomeSubtitle: data.welcomeSubtitle || '',
  };
}

export async function saveSelectedChurch(preview: SelectedChurchPreview) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preview));
}

export async function loadSelectedChurch(): Promise<SelectedChurchPreview | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SelectedChurchPreview;
    if (!parsed?.churchId || !parsed?.churchCode) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearSelectedChurch() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function formatChurchCode(input: string) {
  return normalizeChurchCode(input);
}
