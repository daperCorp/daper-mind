"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-1.5c-1.38 0-1.5.62-1.5 1.5V12h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z"/>
    </svg>
  );
}

export default function LoginPage() {
  const { signInWithGoogle, signInWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/';

  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 이미 로그인 상태면 원래 페이지로
  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    await signInWithEmail(email, password);
    router.replace(next);
  };

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
    router.replace(next);
  };

  if (loading) {
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
          <form onSubmit={handleEmailLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" autoComplete="email"
                required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password"
                required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full">{t('signIn')}</Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t('orContinueWith')}</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogleLogin}>
            <GoogleIcon />
            <span className="ml-2">{t('signInWithGoogle')}</span>
          </Button>
        </CardContent>
        <CardFooter>
          <div className="text-sm w-full text-center">
            {t('noAccount')}{' '}
            <Link href={`/register?next=${encodeURIComponent(next)}`} className="underline">
              {t('signUp')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
