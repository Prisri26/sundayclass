import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    query,
    orderBy,
    Timestamp,
    onSnapshot,
    where,
    QuerySnapshot,
    DocumentData,
    getDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { getChurchMetadata, getCollectionPath, getSpotlightDocPath, MULTI_TENANT_ENABLED } from './platform';

const CLOUDINARY_CLOUD_NAME = 'dcgh5awyn';
const CLOUDINARY_UPLOAD_PRESET = 'sunday_school';

export async function uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error('Photo upload failed');
    const data = await res.json();
    return data.secure_url as string;
}

export interface Student {
    id: string;
    name: string;
    class?: string;
    grade?: string;
    centerId?: string;
    centerName?: string;
    phone: string;
    age?: number;
    dob?: string;
    photoUrl?: string;
    createdAt?: Timestamp;
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
    id: string;
    studentId: string;
    date: string;
    status: 'present' | 'absent';
    centerId?: string;
    markedAt?: Timestamp;
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

function getSessionDocId(date: string, centerId?: string): string {
    return `${date}_${centerId ?? 'church'}`;
}

// --- Students ---
export async function getStudents(churchId?: string): Promise<Student[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeStudent(d.data() as Omit<Student, 'id'>, d.id));
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before adding students.');
    await addDoc(collection(db, getCollectionPath('students', churchId)), {
        ...student,
        centerId: student.centerId ?? undefined,
        centerName: student.centerName ?? (student.centerId === 'church' ? 'Church' : ''),
        ...getChurchMetadata(churchId),
        createdAt: Timestamp.now()
    });
}

export async function getCenters(churchId?: string): Promise<Center[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('centers', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => normalizeCenter(d.data() as Omit<Center, 'id'>, d.id));
}

export async function addCenter(center: Omit<Center, 'id' | 'createdAt' | 'updatedAt'>, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before adding centers.');
    await addDoc(collection(db, getCollectionPath('centers', churchId)), {
        ...center,
        ...getChurchMetadata(churchId),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
}

export async function updateCenter(id: string, data: Partial<Omit<Center, 'id'>>, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before updating centers.');
    await updateDoc(doc(db, getCollectionPath('centers', churchId), id), {
        ...data,
        updatedAt: Timestamp.now(),
    });
}

export async function deleteCenter(id: string, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before deleting centers.');
    await deleteDoc(doc(db, getCollectionPath('centers', churchId), id));
}

export async function updateStudent(id: string, data: Partial<Omit<Student, 'id'>>, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before updating students.');
    await updateDoc(doc(db, getCollectionPath('students', churchId), id), data);
}

export async function deleteStudent(id: string, churchId?: string): Promise<void> {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before deleting students.');
    await deleteDoc(doc(db, getCollectionPath('students', churchId), id));
}

// --- Attendance ---
export async function getAttendance(churchId?: string): Promise<AttendanceRecord[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function getTodayAttendance(churchId?: string): Promise<AttendanceRecord[]> {
    if (!hasTenantScope(churchId)) return [];
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), where('date', '==', today));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
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

// Realtime listener for attendance
export function subscribeAttendance(cb: (records: AttendanceRecord[]) => void, churchId?: string) {
    if (!hasTenantScope(churchId)) {
        cb([]);
        return () => undefined;
    }
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), orderBy('date', 'desc'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) })));
    });
}

export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

export async function getStudentAttendance(studentId: string, churchId?: string): Promise<AttendanceRecord[]> {
    if (!hasTenantScope(churchId)) return [];
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

// ── Jesus Loves Spotlight ────────────────────────────────────────────────────

export interface SpotlightData {
    active: boolean;
    studentId?: string;
    studentName?: string;
    photoUrl?: string;
    updatedAt?: Timestamp;
}

export function subscribeSpotlight(cb: (data: SpotlightData | null) => void, churchId?: string) {
    if (!hasTenantScope(churchId)) {
        cb(null);
        return () => undefined;
    }
    return onSnapshot(doc(db, getSpotlightDocPath(churchId)), (snap) => {
        if (!snap.exists()) { cb(null); return; }
        cb(snap.data() as SpotlightData);
    });
}

export async function clearSpotlight(churchId?: string) {
    if (!hasTenantScope(churchId)) throw new Error('Active church is required before clearing spotlight.');
    await setDoc(doc(db, getSpotlightDocPath(churchId)), {
        ...getChurchMetadata(churchId),
        active: false,
        updatedAt: new Date()
    });
}
