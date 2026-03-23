import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

function sanitizeSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildStoragePath(pathSegments: string[], fileName: string) {
  const cleanSegments = pathSegments.map((segment) => sanitizeSegment(segment)).filter(Boolean);
  const cleanFileName = `${Date.now()}_${sanitizeSegment(fileName) || 'asset'}`;
  return `${cleanSegments.join('/')}/${cleanFileName}.jpg`;
}

export async function uploadMobileImage(
  localUri: string,
  options: {
    pathSegments: string[];
    fileName: string;
  }
): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, buildStoragePath(options.pathSegments, options.fileName));
  await uploadBytes(storageRef, blob, {
    contentType: 'image/jpeg',
  });
  return getDownloadURL(storageRef);
}
