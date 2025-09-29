// file: src/lib/firebase-client.ts
'use client';

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import type { SerializableUser } from '@/app/actions';
import { FREE_USER_API_LIMIT, FREE_USER_IDEA_LIMIT } from '@/lib/constants';

export async function upsertUserClient(user: SerializableUser) {
  if (!user?.uid) throw new Error('uid required');

  const userRef = doc(db, 'users', user.uid);
  await setDoc(
    userRef,
    {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      lastLogin: serverTimestamp(),
      // 기본값(merge로 기존 데이터 보존)
      role: 'free',
      ideaCount: 0,
      apiRequestCount: 0,
      lastApiRequestDate: null,
    },
    { merge: true }
  );
}

/** users/{uid} 문서 읽기 (클라이언트) */
export async function getUserDataClient(uid: string) {
  if (!uid) throw new Error('uid required');

  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;

  const data = snap.data() as {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
    role?: 'free' | 'paid';
    ideaCount?: number;
    apiRequestCount?: number;
    lastApiRequestDate?: Timestamp | null;
  };

  return {
    ...data,
    lastApiRequestDate: data.lastApiRequestDate
      ? (data.lastApiRequestDate as Timestamp).toDate()
      : null,
  };
}

/** 사용량 계산 (클라이언트 전용) */
export async function getUserUsageClient(uid: string): Promise<{
  role: 'free' | 'paid';
  dailyLeft: number | null;  // null = 무제한
  ideasLeft: number | null;  // null = 무제한
  error?: string | null;
}> {
  try {
    if (!uid) {
      return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: 'uid missing' };
    }

    const user = await getUserDataClient(uid);
    if (!user) {
      return {
        role: 'free',
        dailyLeft: 0,
        ideasLeft: 0,
        error: 'User not found',
      };
    }

    const role = user.role ?? 'free';
    if (role === 'paid') {
      return { role, dailyLeft: null, ideasLeft: null, error: null };
    }

    const now = new Date();
    const last = (user.lastApiRequestDate as Date | null) ?? null;
    let usedToday = user.apiRequestCount ?? 0;

    if (last) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now.getTime() - last.getTime() > oneDayMs) {
        usedToday = 0; // 하루 경과 시 리셋
      }
    }

    const dailyLeft = Math.max(0, FREE_USER_API_LIMIT - usedToday);
    const totalIdeasUsed = user.ideaCount ?? 0;
    const ideasLeft = Math.max(0, FREE_USER_IDEA_LIMIT - totalIdeasUsed);

    return { role, dailyLeft, ideasLeft, error: null };
  } catch (e: any) {
    console.error('[getUserUsageClient] error:', e);
    return {
      role: 'free',
      dailyLeft: 0,
      ideasLeft: 0,
      error: e?.message ?? 'Failed to fetch usage',
    };
  }
}
