
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithPopup, 
  signOut,
  type User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { upsertUser } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async (provider: GoogleAuthProvider) => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const { error } = await upsertUser(result.user);
      if (error) {
        throw new Error(error);
      }
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

  const signInWithGoogle = () => handleSignIn(new GoogleAuthProvider());

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        variant: 'destructive',
        title: 'Sign Out Failed',
        description: 'There was a problem signing out.',
      });
    }
  };

  const value = { user, loading, signInWithGoogle, logout };

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
