'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.38 0-1.5.62-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
    </svg>
  );
}

export default function LoginPage() {
  // initializing을 useAuth()에서 제공하는 게 베스트.
  const { signInWithGoogle, signInWithEmail, user, loading, initializing } = useAuth() as {
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    user: any | null;
    loading: boolean;        // 네트워크 로딩
    initializing?: boolean;  // Auth 초기화(첫 onAuthStateChanged 전까지 true)
  };

  // initializing 없으면 loading으로 폴백
  const authInitializing = typeof initializing === 'boolean' ? initializing : loading;

  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  // ✅ 초기화가 끝났고(user 확정) 로그인된 경우에만 홈으로
  useEffect(() => {
    if (!authInitializing && user) {
      router.replace('/');
    }
  }, [authInitializing, user, router]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    try {
      await signInWithEmail(email, password);
      // 성공 시 onAuthStateChanged -> user 세팅 -> 위 effect가 이동 처리
    } catch (e: any) {
      setErr(e?.message || 'Sign in failed');
    }
  };

  if (authInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('login')}</CardTitle>
          <CardDescription>{t('loginPrompt')}</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4">
          <form onSubmit={handleEmailLogin} className="grid gap-4" noValidate>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                name="email"                 // ✅ name 추가
                type="email"
                placeholder="m@example.com"
                required
                autoComplete="email"        // ✅ 자동완성 힌트
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"             // ✅ name 추가
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {err && <p className="text-destructive text-sm">{err}</p>}

            <Button type="submit" className="w-full" disabled={loading} name="action" value="login">
              {t('signIn')}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
            </div>
          </div>

          <Button
            variant="outline"
            type="button"           // ✅ submit 방지
            onClick={signInWithGoogle}
            name="provider"
            value="google"
            disabled={loading}
          >
            <GoogleIcon />
            <span className="ml-2">{t('signInWithGoogle')}</span>
          </Button>
        </CardContent>

        <CardFooter>
          <div className="text-sm w-full text-center">
            {t('noAccount')}{' '}
            <Link href="/register" className="underline" prefetch={false}>
              {t('signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
