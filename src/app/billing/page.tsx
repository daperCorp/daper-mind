'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { getUserData } from '@/lib/firebase-client';
import { useT } from '@/lib/translations';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Download, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BillingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useT();
  
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'free' | 'paid'>('free');
  const [billingInfo, setBillingInfo] = useState({
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    amount: 29.99,
    currency: 'USD',
    status: 'active' as 'active' | 'cancelled' | 'past_due',
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    (async () => {
      const { data } = await getUserData(user.uid);
      if (data?.role) {
        setRole(data.role);
      }
      setLoading(false);
    })();
  }, [user, router]);

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (role === 'free') {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/settings')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{t('noBillingInfo')}</CardTitle>
            <CardDescription>
              {t('upgradeToPro')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                무료 플랜을 사용 중입니다. Pro 플랜으로 업그레이드하면 무제한 아이디어 생성과 프리미엄 기능을 이용할 수 있습니다.
              </AlertDescription>
            </Alert>
            <div className="mt-6 flex gap-3">
              <Button onClick={() => router.push('/pricing')}>
                {t('viewPricing')}
              </Button>
              <Button variant="outline" onClick={() => router.push('/upgrade')}>
                {t('upgradePlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => router.push('/settings')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back')}
          </Button>
          <h1 className="text-3xl font-bold">결제 관리</h1>
          <p className="text-muted-foreground">구독 및 결제 정보를 관리하세요</p>
        </div>
        <Badge className="bg-emerald-500 text-white">
          Pro Plan
        </Badge>
      </div>

      {/* 구독 상태 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>구독 상태</CardTitle>
              <CardDescription>현재 구독 플랜 정보</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {billingInfo.status === 'active' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  활성
                </Badge>
              )}
              {billingInfo.status === 'cancelled' && (
                <Badge variant="outline" className="border-amber-200 text-amber-700">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  취소됨
                </Badge>
              )}
              {billingInfo.status === 'past_due' && (
                <Badge variant="destructive">
                  <XCircle className="mr-1 h-3 w-3" />
                  결제 실패
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">월 요금</p>
                <p className="text-2xl font-bold">
                  ${billingInfo.amount}
                  <span className="text-sm font-normal text-muted-foreground">/월</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">다음 결제일</p>
                <p className="text-lg font-semibold">
                  {billingInfo.nextBillingDate.toLocaleDateString('ko-KR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">결제 수단</p>
                <p className="text-lg font-semibold">•••• 4242</p>
              </div>
            </div>
          </div>

          {billingInfo.status === 'past_due' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                결제가 실패했습니다. 결제 수단을 확인하고 업데이트해주세요.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 결제 수단 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 수단</CardTitle>
          <CardDescription>등록된 결제 정보</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="font-medium">Visa •••• 4242</p>
                <p className="text-sm text-muted-foreground">만료일: 12/2025</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              변경
            </Button>
          </div>
          
          <Button variant="ghost" className="w-full">
            + 새 결제 수단 추가
          </Button>
        </CardContent>
      </Card>

      {/* 결제 내역 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>결제 내역</CardTitle>
              <CardDescription>최근 결제 기록</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              전체 다운로드
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: '2025-09-01', amount: 29.99, status: 'paid' },
              { date: '2025-08-01', amount: 29.99, status: 'paid' },
              { date: '2025-07-01', amount: 29.99, status: 'paid' },
            ].map((invoice, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Pro Plan</p>
                    <p className="text-sm text-muted-foreground">{invoice.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">${invoice.amount}</p>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 구독 관리 */}
      <Card>
        <CardHeader>
          <CardTitle>구독 관리</CardTitle>
          <CardDescription>구독을 변경하거나 취소할 수 있습니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/pricing')}>
              플랜 변경
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              구독 취소
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            구독을 취소하면 다음 결제일까지 Pro 기능을 계속 이용할 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}