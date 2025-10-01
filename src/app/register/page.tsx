'use client';

import { Suspense, type FormEvent, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { CheckCircle2, Mail } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const next = searchParams?.get('next') || '/';
  const { toast } = useToast();

  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    // 이미 로그인되어 있고 이메일 인증도 완료된 경우에만 리다이렉트
    if (!loading && user && auth.currentUser?.emailVerified) {
      router.replace(next);
    }
  }, [loading, user, next, router]);

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 회원가입
      await signUpWithEmail(email, password);

      // 인증 이메일 전송
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser, {
          url: `${window.location.origin}/login?next=${encodeURIComponent(next)}`,
          handleCodeInApp: false,
        });

        setRegisteredEmail(email);
        setShowSuccessMessage(true);

        toast({
          title: '회원가입 완료',
          description: '인증 이메일이 전송되었습니다. 이메일을 확인해주세요.',
        });

        // 로그아웃 (이메일 인증 전까지 로그인 불가)
        await signOut(auth);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      let errorMessage = '회원가입에 실패했습니다.';

      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 이메일 형식이 아닙니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 더 강력한 비밀번호를 사용해주세요.';
      }

      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: '회원가입 실패',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <RegisterSkeleton />;

  // 성공 메시지 화면
  if (showSuccessMessage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">이메일 인증 필요</CardTitle>
            <CardDescription>
              회원가입이 완료되었습니다!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                <strong>{registeredEmail}</strong>로 인증 이메일을 보내드렸습니다.
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>다음 단계:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>이메일 받은편지함을 확인하세요</li>
                <li>인증 링크를 클릭하세요</li>
                <li>로그인 페이지로 돌아와 로그인하세요</li>
              </ol>
            </div>

            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => router.push('/login')} 
                className="w-full"
              >
                로그인 페이지로 이동
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // 임시로 다시 로그인해서 재전송
                    await signUpWithEmail(email, password);
                    if (auth.currentUser) {
                      await sendEmailVerification(auth.currentUser);
                      toast({
                        title: '재전송 완료',
                        description: '인증 이메일이 다시 전송되었습니다.',
                      });
                      await signOut(auth);
                    }
                  } catch (error) {
                    toast({
                      variant: 'destructive',
                      title: '재전송 실패',
                      description: '잠시 후 다시 시도해주세요.',
                    });
                  }
                }}
                className="w-full"
              >
                인증 이메일 재전송
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 회원가입 폼
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{t('signUpTitle')}</CardTitle>
          <CardDescription>{t('signUpPrompt')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                최소 6자 이상
              </p>
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
                disabled={isSubmitting}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button 
              onClick={handleSignUp} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? '가입 처리 중...' : t('createAccount')}
            </Button>
          </div>
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