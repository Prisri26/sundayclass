import {
    collection,
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

const CLOUDINARY_CLOUD_NAME = 'dcgh5awyn';
const CLOUDINARY_UPLOAD_PRESET = 'sunday_school';

export interface Student {
    id: string;
    name: string;
    class: string;
    phone: string;
    age?: number; // legacy
    dob?: string; // Format: YYYY-MM-DD
    photoUrl?: string;
}

export interface AttendanceRecord {
    studentId: string;
    date: string;
    status: 'present' | 'absent';
}

// Fetch all students (one-time)
export async function getStudents(): Promise<Student[]> {
    const q = query(collection(db, 'students'), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

// Realtime listener for students
export function subscribeStudents(cb: (students: Student[]) => void) {
    const q = query(collection(db, 'students'), orderBy('name'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    });
}

// Add a new student
export async function addStudent(student: Omit<Student, 'id'>): Promise<void> {
    await addDoc(collection(db, 'students'), {
        ...student,
        createdAt: Timestamp.now(),
    });
}

// Save attendance for the day (upsert per studentId+date)
export async function saveAttendance(records: AttendanceRecord[]): Promise<void> {
    const promises = records.map((record) => {
        const docId = `${record.studentId}_${record.date}`;
        return setDoc(doc(db, 'attendance', docId), {
            ...record,
            markedAt: Timestamp.now(),
        });
    });
    await Promise.all(promises);
}

// Fetch attendance for a specific date
export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
    const q = query(collection(db, 'attendance'), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as AttendanceRecord);
}

// Get Class Summary for a date
export async function getClassSummary(date: string): Promise<string> {
    const q = query(collection(db, 'class_sessions'), where('date', '==', date));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return '';
    return snapshot.docs[0].data().summary || '';
}

// Save Class Summary for a date
export async function saveClassSummary(date: string, summary: string): Promise<void> {
    await setDoc(doc(db, 'class_sessions', date), {
        date,
        summary,
        updatedAt: Timestamp.now(),
    });
}

// Upload a student photo to Cloudinary (free, no Firebase Storage upgrade needed)
export async function uploadStudentPhoto(localUri: string, _studentName: string): Promise<string> {
    const formData = new FormData();
    // React Native accepts { uri, type, name } object as FormData value
    formData.append('file', {
        uri: localUri,
        type: 'image/jpeg',
        name: `student_${Date.now()}.jpg`,
    } as any);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Cloudinary upload failed: ${err}`);
    }
    const data = await response.json();
    return data.secure_url as string;
}

// Get today's date as YYYY-MM-DD
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}
