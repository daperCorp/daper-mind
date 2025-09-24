'use client';

import { Suspense, type FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

function RegisterSkeleton() {
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

function RegisterPageInner() {
  const { signUpWithEmail, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ Suspense 안에서만 사용
  const next = searchParams?.get('next') || '/';

  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, next, router]);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    setError('');
    await signUpWithEmail(email, password);
    router.replace(next);
  };

  if (loading) return <RegisterSkeleton />;
  if (user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('signUpTitle')}</CardTitle>
          <CardDescription>{t('signUpPrompt')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
              <Input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full">{t('createAccount')}</Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-sm w-full text-center">
            {t('alreadyHaveAccount')}{' '}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="underline">
              {t('signIn')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterPageInner />
    </Suspense>
  );
}
