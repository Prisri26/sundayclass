import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const options = {
    churchId: process.env.MIGRATION_CHURCH_ID ?? '',
    churchName: process.env.MIGRATION_CHURCH_NAME ?? '',
    churchSlug: process.env.MIGRATION_CHURCH_SLUG ?? '',
    timezone: process.env.MIGRATION_CHURCH_TIMEZONE ?? 'Asia/Kolkata',
    adminEmail: process.env.MIGRATION_ADMIN_EMAIL ?? '',
    adminPassword: process.env.MIGRATION_ADMIN_PASSWORD ?? '',
    members: [],
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--church-id' && next) {
      options.churchId = next;
      index += 1;
    } else if (arg === '--church-name' && next) {
      options.churchName = next;
      index += 1;
    } else if (arg === '--church-slug' && next) {
      options.churchSlug = next;
      index += 1;
    } else if (arg === '--timezone' && next) {
      options.timezone = next;
      index += 1;
    } else if (arg === '--admin-email' && next) {
      options.adminEmail = next;
      index += 1;
    } else if (arg === '--admin-password' && next) {
      options.adminPassword = next;
      index += 1;
    } else if (arg === '--member' && next) {
      options.members.push(next);
      index += 1;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function requireOption(name, value) {
  if (!value) {
    throw new Error(`Missing required option: ${name}`);
  }
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMember(rawMember) {
  const [userId, role = 'church_admin', email = ''] = rawMember.split(':');
  if (!userId) {
    throw new Error(`Invalid --member value "${rawMember}". Expected format uid:role[:email]`);
  }

  return {
    userId,
    role,
    email,
  };
}

function getFirebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  for (const [key, value] of Object.entries(config)) {
    if (!value) {
      throw new Error(`Missing Firebase config env: ${key}`);
    }
  }

  return config;
}

async function ensureSignedIn(auth, email, password) {
  requireOption('admin email', email);
  requireOption('admin password', password);
  await signInWithEmailAndPassword(auth, email, password);
}

async function readLegacyCollection(db, collectionName) {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map((legacyDoc) => ({
    id: legacyDoc.id,
    data: legacyDoc.data(),
  }));
}

async function run() {
  loadDotEnvFile(path.resolve(process.cwd(), '.env.local'));
  const options = parseArgs(process.argv.slice(2));

  requireOption('church id', options.churchId);
  requireOption('church name', options.churchName);

  const firebaseConfig = getFirebaseConfig();
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await ensureSignedIn(auth, options.adminEmail, options.adminPassword);

  const legacyStudents = await readLegacyCollection(db, 'students');
  const legacyAttendance = await readLegacyCollection(db, 'attendance');
  const legacySessions = await readLegacyCollection(db, 'class_sessions');
  const legacySpotlightDoc = await getDoc(doc(db, 'spotlight', 'current'));

  const now = Timestamp.now();
  const members = options.members.map(parseMember);
  const churchSlug = options.churchSlug || toSlug(options.churchName);

  const summary = {
    churchId: options.churchId,
    churchName: options.churchName,
    dryRun: options.dryRun,
    legacyStudents: legacyStudents.length,
    legacyAttendance: legacyAttendance.length,
    legacySessions: legacySessions.length,
    centers: 1,
    members: members.length,
    spotlightExists: legacySpotlightDoc.exists(),
  };

  console.log('Migration summary');
  console.table(summary);

  if (options.dryRun) {
    console.log('Dry run only. No data was written.');
    return;
  }

  const batch = writeBatch(db);

  batch.set(doc(db, 'churches', options.churchId), {
    name: options.churchName,
    slug: churchSlug,
    status: 'active',
    plan: 'starter',
    timezone: options.timezone,
    onboardingState: 'setup_completed',
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  batch.set(doc(db, 'churches', options.churchId, 'settings', 'general'), {
    timezone: options.timezone,
    attendanceDays: ['Sunday'],
    updatedAt: now,
  }, { merge: true });

  batch.set(doc(db, 'churches', options.churchId, 'settings', 'branding'), {
    churchDisplayName: options.churchName,
    primaryColor: '#4F46E5',
    secondaryColor: '#0F172A',
    accentColor: '#F59E0B',
    backgroundColor: '#F8FAFC',
    surfaceColor: '#FFFFFF',
    textColor: '#0F172A',
    updatedAt: now,
  }, { merge: true });

  batch.set(doc(db, 'churches', options.churchId, 'settings', 'features'), {
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
    updatedAt: now,
  }, { merge: true });

  batch.set(doc(db, 'churches', options.churchId, 'centers', 'church'), {
    name: 'Church Sunday Class',
    code: 'CHURCH',
    isChurchLevel: true,
    active: true,
    createdAt: now,
    updatedAt: now,
  }, { merge: true });

  members.forEach((member) => {
    batch.set(doc(db, 'churches', options.churchId, 'members', member.userId), {
      userId: member.userId,
      churchId: options.churchId,
      role: member.role,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    }, { merge: true });

    if (member.email) {
      batch.set(doc(db, 'users', member.userId), {
        email: member.email,
        updatedAt: now,
      }, { merge: true });
    }
  });

  legacyStudents.forEach((student) => {
    batch.set(doc(db, 'churches', options.churchId, 'students', student.id), {
      ...student.data,
      grade: student.data.grade ?? student.data.class ?? '',
      centerId: student.data.centerId ?? 'church',
      centerName: student.data.centerName ?? 'Church',
      churchId: options.churchId,
      updatedAt: student.data.updatedAt ?? now,
      createdAt: student.data.createdAt ?? now,
    }, { merge: true });
  });

  legacyAttendance.forEach((record) => {
    batch.set(doc(db, 'churches', options.churchId, 'attendanceRecords', record.id), {
      ...record.data,
      churchId: options.churchId,
      markedAt: record.data.markedAt ?? now,
    }, { merge: true });
  });

  legacySessions.forEach((session) => {
    batch.set(doc(db, 'churches', options.churchId, 'attendanceSessions', session.id), {
      ...session.data,
      churchId: options.churchId,
      updatedAt: session.data.updatedAt ?? now,
      createdAt: session.data.createdAt ?? now,
    }, { merge: true });
  });

  if (legacySpotlightDoc.exists()) {
    batch.set(doc(db, 'churches', options.churchId, 'spotlight', 'current'), {
      ...legacySpotlightDoc.data(),
      churchId: options.churchId,
      updatedAt: legacySpotlightDoc.data().updatedAt ?? now,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Migration complete for church "${options.churchName}" (${options.churchId}).`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
