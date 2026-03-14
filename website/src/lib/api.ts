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
} from 'firebase/firestore';
import { db } from './firebase';
import { getChurchMetadata, getCollectionPath, getSpotlightDocPath } from './platform';

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
    class: string;
    phone: string;
    age?: number;
    dob?: string;
    photoUrl?: string;
    createdAt?: Timestamp;
}

export interface AttendanceRecord {
    id: string;
    studentId: string;
    date: string;
    status: 'present' | 'absent';
    markedAt?: Timestamp;
}

// --- Students ---
export async function getStudents(churchId?: string): Promise<Student[]> {
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>, churchId?: string): Promise<void> {
    await addDoc(collection(db, getCollectionPath('students', churchId)), {
        ...student,
        ...getChurchMetadata(churchId),
        createdAt: Timestamp.now()
    });
}

export async function updateStudent(id: string, data: Partial<Omit<Student, 'id'>>, churchId?: string): Promise<void> {
    await updateDoc(doc(db, getCollectionPath('students', churchId), id), data);
}

export async function deleteStudent(id: string, churchId?: string): Promise<void> {
    await deleteDoc(doc(db, getCollectionPath('students', churchId), id));
}

// --- Attendance ---
export async function getAttendance(churchId?: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function getTodayAttendance(churchId?: string): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), where('date', '==', today));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

// Realtime listener for students
export function subscribeStudents(cb: (students: Student[]) => void, churchId?: string) {
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    });
}

// Realtime listener for attendance
export function subscribeAttendance(cb: (records: AttendanceRecord[]) => void, churchId?: string) {
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), orderBy('date', 'desc'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) })));
    });
}

export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

export async function getStudentAttendance(studentId: string, churchId?: string): Promise<AttendanceRecord[]> {
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
    return onSnapshot(doc(db, getSpotlightDocPath(churchId)), (snap) => {
        if (!snap.exists()) { cb(null); return; }
        cb(snap.data() as SpotlightData);
    });
}

export async function clearSpotlight(churchId?: string) {
    await setDoc(doc(db, getSpotlightDocPath(churchId)), {
        ...getChurchMetadata(churchId),
        active: false,
        updatedAt: new Date()
    });
}
