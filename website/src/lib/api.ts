import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    Timestamp,
    onSnapshot,
    where,
    QuerySnapshot,
    DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';

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
export async function getStudents(): Promise<Student[]> {
    const q = query(collection(db, 'students'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

export async function addStudent(student: Omit<Student, 'id' | 'createdAt'>): Promise<void> {
    await addDoc(collection(db, 'students'), { ...student, createdAt: Timestamp.now() });
}

export async function updateStudent(id: string, data: Partial<Omit<Student, 'id'>>): Promise<void> {
    await updateDoc(doc(db, 'students', id), data);
}

export async function deleteStudent(id: string): Promise<void> {
    await deleteDoc(doc(db, 'students', id));
}

// --- Attendance ---
export async function getAttendance(): Promise<AttendanceRecord[]> {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, 'attendance'), where('date', '==', today));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}

// Realtime listener for students
export function subscribeStudents(cb: (students: Student[]) => void) {
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    });
}

// Realtime listener for attendance
export function subscribeAttendance(cb: (records: AttendanceRecord[]) => void) {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) })));
    });
}

export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}

export async function getStudentAttendance(studentId: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, 'attendance'), where('studentId', '==', studentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AttendanceRecord, 'id'>) }));
}
