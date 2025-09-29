import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SerializableUser } from '@/app/actions';

export async function upsertUserClient(user: SerializableUser) {
  const userRef = doc(db, 'users', user.uid);
  
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email ?? null,
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    lastLogin: serverTimestamp(),
    role: 'free',
    ideaCount: 0,
    apiRequestCount: 0,
    lastApiRequestDate: null,
  }, { merge: true });
}