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
import { getChurchMetadata, getCollectionPath, getSpotlightDocPath } from './platform';

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
export async function getStudents(churchId?: string): Promise<Student[]> {
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) }));
}

// Realtime listener for students
export function subscribeStudents(cb: (students: Student[]) => void, churchId?: string) {
    const q = query(collection(db, getCollectionPath('students', churchId)), orderBy('name'));
    return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
        cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Student, 'id'>) })));
    });
}

// Add a new student
export async function addStudent(student: Omit<Student, 'id'>, churchId?: string): Promise<void> {
    await addDoc(collection(db, getCollectionPath('students', churchId)), {
        ...student,
        ...getChurchMetadata(churchId),
        createdAt: Timestamp.now(),
    });
}

// Save attendance for the day (upsert per studentId+date)
export async function saveAttendance(records: AttendanceRecord[], churchId?: string): Promise<void> {
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
    const q = query(collection(db, getCollectionPath('attendanceRecords', churchId)), where('date', '==', date));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as AttendanceRecord);
}

// Get Class Summary for a date
export async function getClassSummary(date: string, churchId?: string): Promise<string> {
    const q = query(collection(db, getCollectionPath('attendanceSessions', churchId)), where('date', '==', date));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return '';
    return snapshot.docs[0].data().summary || '';
}

// Save Class Summary for a date
export async function saveClassSummary(date: string, summary: string, churchId?: string): Promise<void> {
    await setDoc(doc(db, getCollectionPath('attendanceSessions', churchId), date), {
        date,
        summary,
        ...getChurchMetadata(churchId),
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

// ── Jesus Loves Spotlight ────────────────────────────────────────────────────

export async function setSpotlight(studentId: string, studentName: string, photoUrl: string, churchId?: string): Promise<void> {
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
    await setDoc(doc(db, getSpotlightDocPath(churchId)), {
        ...getChurchMetadata(churchId),
        active: false,
        updatedAt: Timestamp.now(),
    });
}
