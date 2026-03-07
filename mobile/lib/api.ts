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
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export interface Student {
    id: string;
    name: string;
    class: string;
    phone: string;
    age: number;
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

// Upload a student photo to Firebase Storage, return the download URL
export async function uploadStudentPhoto(localUri: string, studentName: string): Promise<string> {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const filename = `students/${studentName.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
}

// Get today's date as YYYY-MM-DD
export function getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
}
