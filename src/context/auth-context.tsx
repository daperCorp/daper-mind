'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUser, type SerializableUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const handleUserUpsert = async (user: User) => {
  console.log('🔄 handleUserUpsert 시작:', user.uid);
  
  try {
    const serializableUser: SerializableUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
    
    console.log('📤 upsertUser 호출 전:', serializableUser);
    
    const { error } = await upsertUser(serializableUser);
    
    console.log('📥 upsertUser 응답:', { error });
    
    if (error) {
      console.error('❌ upsertUser 에러:', error);
      throw new Error(error);
    }
    
    console.log('✅ handleUserUpsert 완료');
  } catch (err: any) {
    console.error('💥 handleUserUpsert 예외:', err);
    throw err;
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('🔐 Google 로그인 시작');
      setLoading(true);
      
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      console.log('✅ Firebase 인증 성공:', result.user.uid);
      
      await handleUserUpsert(result.user);
      console.log('✅ Google 로그인 완료');
      
    } catch (error: any) {
      console.error('❌ Google 로그인 에러:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.message || 'There was a problem signing in.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      console.log('📝 이메일 회원가입 시작');
      setLoading(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('✅ Firebase 계정 생성:', result.user.uid);
      
      const displayName = email.split('@')[0];
      await updateProfile(result.user, { displayName });
      console.log('✅ 프로필 업데이트 완료');

      await result.user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser) {
        await handleUserUpsert(updatedUser);
        console.log('✅ 이메일 회원가입 완료');
      } else {
        throw new Error("Could not get updated user information.");
      }

    } catch (error: any) {
      console.error('❌ 회원가입 에러:', error);
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: error.message || 'There was a problem creating your account.',
      });
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      console.log('🔐 이메일 로그인 시작');
      setLoading(true);
      
      const result = await signInWithEmailAndPassword(auth, email, pass);
      console.log('✅ Firebase 인증 성공:', result.user.uid);
      
      await handleUserUpsert(result.user);
      console.log('✅ 이메일 로그인 완료');
      
    } catch (error: any) {
      console.error('❌ 이메일 로그인 에러:', error);
      toast({
        variant: 'destructive',
        title: 'Sign In Failed',
        description: error.message || 'There was a problem signing in.',
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'There was a problem signing out.',
      });
    }
  };

  const value = { user, loading, signInWithGoogle, signUpWithEmail, signInWithEmail, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}