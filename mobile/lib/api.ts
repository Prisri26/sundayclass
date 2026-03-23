import {
    collection,
    getDoc,
    getDocs,
    addDoc,
    setDoc,
    doc,
    query,
    orderBy,
    Timestamp,
    onSnapshot,
    QuerySnapshot,
    DocumentData,
    where,
} from 'firebase/firestore';
import { db } from './firebase';
import { getChurchMetadata, getCollectionPath, getSpotlightDocPath, MULTI_TENANT_ENABLED } from './platform';
import { uploadMobileImage } from './storage';

export interface Student {
    id: string;
    name: string;
    class?: string;
    grade?: string;
    centerId?: string;
    centerName?: string;
    phone: string;
    age?: number; // legacy
    dob?: string; // Format: YYYY-MM-DD
    photoUrl?: string;
}

export interface Center {
    id: string;
    name: string;
    code: string;
    hostName?: string;
    hostPhone?: string;
    areaName?: string;
    address?: string;
    active: boolean;
    isChurchLevel?: boolean;
    createdAt?: Timestamp;
    updatedAt?: Timestamp;
}

export interface AttendanceRecord {
    studentId: string;
    date: string;
    status: 'present' | 'absent';
    centerId?: string;
}

function normalizeStudent(data: Omit<Student, 'id'>, id: string): Student {
    return {
        id,
        ...data,
        grade: data.grade ?? data.class,
        centerId: data.centerId,
        centerName: data.centerName ?? (data.centerId === 'church' ? 'Church' : undefined),
    };
}

export function getStudentCenterLabel(student: Student): string {
    return student.centerName ?? (student.centerId === 'church' ? 'Church' : 'Unassigned');
}

function normalizeCenter(data: Omit<Center, 'id'>, id: string): Center {
    return {
        id,
        ...data,
        active: data.active ?? true,
    };
}

function hasTenantScope(churchId?: string) {
    return !MULTI_TENANT_ENABLED || !!churchId?.trim();
}

// Fetch all students (one-time)
export async function getStudents(churchId?: string): Promise<Student[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeStudent(d.data() as Omit<Student, 'id'>, d.id));
}

// Realtime listener for students
export function subscribeStudents(cb: (students: Student[]) => void, churchId?: string) {
    if (!hasTenantScope(churchId)) {
        cb([]);
        return () => undefined;
    }
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => normalizeStudent(d.data() as Omit<Student, 'id'>, d.id)));
    });
}

// Add a new student
export async function addStudent(student: Omit<Student, 'id'>, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before adding students.');
    await addDoc(collection(db, getCollectionPath('students', churchId)), {
        ...student,
        centerId: student.centerId ?? undefined,
        centerName: student.centerName ?? (student.centerId === 'church' ? 'Church' : ''),
        ...getChurchMetadata(churchId),
        createdAt: Timestamp.now(),
    });
}

export async function getCenters(churchId?: string): Promise<Center[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('centers', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeCenter(d.data() as Omit<Center, 'id'>, d.id));
}

export function subscribeCenters(
    cb: (centers: Center[]) => void,
    churchId?: string,
    onError?: (error: Error) => void
) {
    if (!hasTenantScope(churchId)) {
        cb([]);
        return () => undefined;
    }
    const q = query(collection(db, getCollectionPath('centers', churchId)), orderBy('name'));
    return onSnapshot(
        q,
        (snap: QuerySnapshot<DocumentData>) => {
            cb(snap.docs.map((d) => normalizeCenter(d.data() as Omit<Center, 'id'>, d.id)));
        },
        (error) => onError?.(error as Error)
    );
}

// Save attendance for the day (upsert per studentId+date)
export async function saveAttendance(records: AttendanceRecord[], churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before saving attendance.');
    const promises = records.map((record) => {
        const docId = `${record.studentId}_${record.date}`;
        return setDoc(doc(db, getCollectionPath('attendanceRecords', churchId), docId), {
            ...record,
            ...getChurchMetadata(churchId),
            markedAt: Timestamp.now(),
        });
    });
    await Promise.all(promises);
}

// Fetch attendance for a specific date
export async function getAttendanceByDate(date: string, churchId?: string): Promise<AttendanceRecord[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as AttendanceRecord);
}

// Get session summary for a date
function getSessionDocId(date: string, centerId?: string): string {
    return `${date}_${centerId ?? 'church'}`;
}

export async function getSessionSummary(date: string, churchId?: string, centerId?: string): Promise<string> {
    if (!hasTenantScope(churchId)) return '';
    const sessionId = getSessionDocId(date, centerId);
    const sessionDoc = await getDoc(doc(db, getCollectionPath('attendanceSessions', churchId), sessionId));
    if (sessionDoc.exists()) {
        return sessionDoc.data().summary || '';
    }
    const q = query(collection(db, getCollectionPath('attendanceSessions', churchId)), where('date', '==', date));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return '';
    const matchingDoc = snapshot.docs.find((entry) => (entry.data().centerId ?? 'church') === (centerId ?? 'church'));
    return matchingDoc?.data().summary || '';
}

// Save session summary for a date
export async function saveSessionSummary(date: string, summary: string, churchId?: string, centerId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before saving a session summary.');
    await setDoc(doc(db, getCollectionPath('attendanceSessions', churchId), getSessionDocId(date, centerId)), {
        date,
        centerId,
        scope: centerId ? 'center' : 'church',
        summary,
        ...getChurchMetadata(churchId),
        updatedAt: Timestamp.now(),
    });
}

export const getClassSummary = getSessionSummary;
export const saveClassSummary = saveSessionSummary;

// Upload a student photo to Firebase Storage
export async function uploadStudentPhoto(localUri: string, studentName: string, churchId?: string): Promise<string> {
    const scopedChurchId = churchId?.trim();
    if (!scopedChurchId) throw new Error('Active church is required before uploading a photo.');
    return uploadMobileImage(localUri, {
        pathSegments: ['churches', scopedChurchId, 'students'],
        fileName: studentName || 'student-photo',
    });
}

// Get today's date as YYYY-MM-DD
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

// ── Jesus Loves Spotlight ────────────────────────────────────────────────────

export async function setSpotlight(studentId: string, studentName: string, photoUrl: string, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before updating spotlight.');
    await setDoc(doc(db, getSpotlightDocPath(churchId)), {
        studentId,
        studentName,
        photoUrl,
        ...getChurchMetadata(churchId),
        updatedAt: Timestamp.now(),
        active: true,
    });
}

export async function clearSpotlight(churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before clearing spotlight.');
    await setDoc(doc(db, getSpotlightDocPath(churchId)), {
        ...getChurchMetadata(churchId),
        active: false,
        updatedAt: Timestamp.now(),
    });
}
