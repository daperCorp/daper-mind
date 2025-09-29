'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations, useT } from '@/lib/translations';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// import { getUserUsage } from '@/app/actions'; // 👈 서버액션: role/남은횟수 가져오기
import { getUserUsage } from '@/lib/firebase-client';
type Role = 'free' | 'paid';

export function ManageAccountSettings() {
  const { logout, user } = useAuth();
  const { language } = useLanguage();
  const t = useT();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [dailyLeft, setDailyLeft] = useState<number | null>(null);
  const [ideasLeft, setIdeasLeft] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user?.uid) {
        setRole(null);
        setDailyLeft(null);
        setIdeasLeft(null);
        return;
      }
      setLoading(true);
      const res = await getUserUsage(user.uid);
      if (!mounted) return;
      if (!res.error) {
        setRole(res.role ?? 'free');
        setDailyLeft(res.dailyLeft ?? null);
        setIdeasLeft(res.ideasLeft ?? null);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const PlanBadge = ({ role }: { role: Role | null }) => {
    if (!role) return null;
    const isPaid = role === 'paid';
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border
          ${isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-sky-50 text-sky-700 border-sky-200'}`}
      >
        {t('currentPlan')}: <b className="ml-1">{isPaid ? (t('paid') || 'Paid') : (t('free') || 'Free')}</b>
      </span>
    );
  };

  const QuotaPill = ({ label, value, max }: { label: string; value: number | null; max?: number }) => {
    if (value === null) {
      // 유료(무제한) 표기
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs border bg-emerald-50 text-emerald-700 border-emerald-200">
          {label}: ∞
        </span>
      );
    }
    const left = Math.max(0, value);
    const tone =
      left === 0
        ? 'bg-red-50 text-red-700 border-red-200'
        : left === 1
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-sky-50 text-sky-700 border-sky-200';
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs border ${tone}`}>
        {label}: {max !== undefined ? `${left}/${max}` : left}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('manageAccount')}</CardTitle>
            <CardDescription>{t('manageAccountDescription')}</CardDescription>
          </div>
          <PlanBadge role={role} />
        </div>

        {/* 사용량 영역 */}
        {loading ? (
          <div className="text-xs text-muted-foreground">{t('loadingUsage') || 'Loading usage…'}</div>
        ) : role ? (
          <div className="flex flex-wrap gap-2">
            {/* 무료 한도 기준 표시 (프리셋 텍스트 키가 없으면 기본 문구로 표시) */}
            <QuotaPill label={t('dailyLeft') || 'Daily left'} value={dailyLeft} max={2} />
            <QuotaPill label={t('ideasLeft') || 'Ideas left'} value={ideasLeft} max={5} />
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 플랜 CTA */}
        <div className="rounded-md border p-4">
          <h3 className="font-medium mb-1">{t('planDetails')}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t('planDescription')}</p>
          {role === 'free' ? (
            <div className="flex items-center gap-2">
              <Button onClick={() => router.push('/upgrade')}>
                {t('upgradePlan') || 'Upgrade plan'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/upgrade')}>
                {t('changePlan') || 'Change plan'}
              </Button>
            </div>
          )}
        </div>
        {/* 고객지원 */}
        <div className="rounded-md border p-4">
          <h3 className="font-medium">{t('contactSupport')}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t('contactSupportDescription')}</p>
          <Button variant="outline" onClick={() => router.push('/support')}>
            {t('contactSupport')}
          </Button>
        </div>

        {/* 로그아웃 */}
        <div className="rounded-md border p-4">
          <h3 className="font-medium">{t('signOut')}</h3>
          <p className="text-sm text-muted-foreground mb-3">{t('signOutDescription')}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">{t('signOut')}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('signOutConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('signOutConfirmDescription')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={logout}>{t('signOut')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
