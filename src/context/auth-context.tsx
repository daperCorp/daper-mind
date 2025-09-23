
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
    const serializableUser: SerializableUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
    };
    const { error } = await upsertUser(serializableUser);
    if (error) {
        throw new Error(error);
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
      setLoading(true);
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      await handleUserUpsert(result.user);
    } catch (error: any) {
      console.error("Authentication error:", error);
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
        setLoading(true);
        const result = await createUserWithEmailAndPassword(auth, email, pass);
        
        const displayName = email.split('@')[0];
        await updateProfile(result.user, { displayName });

        // We need to reload the user to get the updated profile
        await result.user.reload();
        const updatedUser = auth.currentUser;

        if (updatedUser) {
            await handleUserUpsert(updatedUser);
        } else {
            throw new Error("Could not get updated user information.");
        }

    } catch (error: any) {
        console.error("Sign up error:", error);
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
          setLoading(true);
          const result = await signInWithEmailAndPassword(auth, email, pass);
          await handleUserUpsert(result.user);
      } catch (error: any) {
          console.error("Sign in error:", error);
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

    