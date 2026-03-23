import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

function sanitizeSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
}

function buildStoragePath(pathSegments: string[], fileName: string) {
  const cleanSegments = pathSegments.map((segment) => sanitizeSegment(segment)).filter(Boolean);
  const cleanFileName = `${Date.now()}_${sanitizeSegment(fileName.replace(/\.[^.]+$/, '')) || 'asset'}`;
  return `${cleanSegments.join('/')}/${cleanFileName}`;
}

export async function uploadWebImage(
  file: File,
  options: {
    pathSegments: string[];
    fileName: string;
  }
): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storageRef = ref(storage, `${buildStoragePath(options.pathSegments, options.fileName)}.${extension}`);
  await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });
  return getDownloadURL(storageRef);
}
