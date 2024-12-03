import { getFirestore, collection,  getDocs, updateDoc, doc } from 'firebase/firestore';
import {app} from '@/firebaseConfig'
const db = getFirestore(app);


export type Student = {
  name: string;
  rollNumber: string;
  email: string;
  attendance?: { date: string; status: "Present" | "Absent" }[];
};

export type Class = {
  id: string;
  name: string;
  students: Student[] | [];
  dailyAttendance: {
    [date: string]: { [rollNumber: string]: "Present" | "Absent" };
  };
};

export const syncClassesToFirestore = async (classes: Class[]): Promise<void> => {
  try {
    for (const item of classes) {
      const docRef = doc(db, 'classes', item.id);
      await updateDoc(docRef, item);
    }
  } catch (e) {
    console.error('Error syncing to Firestore', e);
  }
};

export const fetchClassesFromFirestore = async (): Promise<Class[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'classes'));
    return querySnapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Class));
  } catch (e) {
    console.error('Error fetching from Firestore', e);
    return [];
  }
};
