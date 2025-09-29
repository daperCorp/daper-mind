// src/types/user.ts
export type UserRole = 'free' | 'paid';

export interface SerializableUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  ideaCount?: number;
  apiRequestCount?: number;
  lastApiRequestDate?: Date | null; // 클라에서 Timestamp → Date로 변환해서 씀
}
