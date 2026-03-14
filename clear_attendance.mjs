import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyD7mSfLP0sHEylUCK5c3AM_Ab7k1nFA7uY',
    authDomain: 'sunday-school-attendance-8e42b.firebaseapp.com',
    projectId: 'sunday-school-attendance-8e42b',
    storageBucket: 'sunday-school-attendance-8e42b.firebasestorage.app',
    messagingSenderId: '709717855581',
    appId: '1:709717855581:web:94036cfbe694a5a1c16cb4',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clearAttendance() {
    console.log('Fetching all attendance records...');
    const snap = await getDocs(collection(db, 'attendance'));
    console.log(`Found ${snap.size} attendance record(s). Deleting...`);

    const deletes = snap.docs.map((d) => deleteDoc(doc(db, 'attendance', d.id)));
    await Promise.all(deletes);

    console.log('✅ All attendance records deleted successfully!');
    process.exit(0);
}

clearAttendance().catch((err) => {
    console.error('Error:', err);
    process.exit(1);
});
