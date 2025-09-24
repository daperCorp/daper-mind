'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getUserUsage } from '@/app/actions';
import { FREE_USER_API_LIMIT, FREE_USER_IDEA_LIMIT } from '@/lib/constants';
export function AccountSettings() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'free' | 'paid' | null>(null);
  const [dailyLeft, setDailyLeft] = useState<number | null>(null);
  const [ideasLeft, setIdeasLeft] = useState<number | null>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return <User className="h-4 w-4" />;
    const names = name.split(' ');
    const initials = names.map((n) => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user?.uid) {
        setRole(null);
        setDailyLeft(null);
        setIdeasLeft(null);
        return;
      }
      setLoading(true);
      const res = await getUserUsage(user.uid);
      if (!mounted) return;
      setRole(res.role ?? 'free');
      setDailyLeft(typeof res.dailyLeft === 'number' ? res.dailyLeft : null);
      setIdeasLeft(typeof res.ideasLeft === 'number' ? res.ideasLeft : null);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [user?.uid]);

  if (!user) return null;

  // 계산값(무료 플랜일 때만 의미 있음)
  const dailyMax = FREE_USER_API_LIMIT;
  const ideasMax = FREE_USER_IDEA_LIMIT;
  const dailyUsed = role === 'free' && typeof dailyLeft === 'number' ? Math.max(0, dailyMax - dailyLeft) : 0;
  const ideasUsed = role === 'free' && typeof ideasLeft === 'number' ? Math.max(0, ideasMax - ideasLeft) : 0;
  const dailyPct = role === 'free' && typeof dailyLeft === 'number' ? ((dailyUsed / dailyMax) * 100) : 0;
  const ideasPct = role === 'free' && typeof ideasLeft === 'number' ? ((ideasUsed / ideasMax) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('myAccount')}</CardTitle>
        <CardDescription>{t('accountDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 프로필 */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
            <AvatarFallback className="text-2xl">{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="font-semibold text-lg">{user.displayName || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2">
              <Badge variant={role === 'paid' ? 'default' : 'secondary'}>
                {role === 'paid' ? (translations.paid?.[language] ?? 'Paid') : (translations.free?.[language] ?? 'Free')}
              </Badge>
              {loading ? (
                <span className="text-xs text-muted-foreground">Loading usage…</span>
              ) : role === 'free' ? (
                <>
                  <Badge variant="outline">
                    {(translations.dailyLeft?.[language] ?? 'Daily left')}: {dailyLeft}/{dailyMax}
                  </Badge>
                  <Badge variant="outline">
                    {(translations.ideasLeft?.[language] ?? 'Ideas left')}: {ideasLeft}/{ideasMax}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline">{(translations.dailyLeft?.[language] ?? 'Daily left')}: ∞</Badge>
                  <Badge variant="outline">{(translations.ideasLeft?.[language] ?? 'Ideas left')}: ∞</Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 사용량 바 */}
        {role === 'free' && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* 일일 생성 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{translations.dailyLeft?.[language] ?? 'Daily left'}</span>
                <span className="text-muted-foreground">
                  {dailyMax - dailyUsed}/{dailyMax}
                </span>
              </div>
              <Progress value={dailyPct} />
              <p className="text-xs text-muted-foreground">
                {dailyLeft === 0
                  ? (translations.dailyLimitReached?.[language] ?? 'Daily limit reached.')
                  : (translations.generationsToday?.[language] ?? 'Generations today:') + ` ${dailyUsed}`}
              </p>
            </div>

            {/* 아이디어 저장 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{translations.ideasLeft?.[language] ?? 'Ideas left'}</span>
                <span className="text-muted-foreground">
                  {ideasMax - ideasUsed}/{ideasMax}
                </span>
              </div>
              <Progress value={ideasPct} />
              <p className="text-xs text-muted-foreground">
                {(translations.savedIdeas?.[language] ?? 'Saved ideas:') + ` ${ideasUsed}`}
              </p>
            </div>
          </div>
        )}

        {/* 유료 플랜 안내(선택) */}
        {role === 'free' && (
          <p className="text-xs text-muted-foreground">
            {(translations.upgradeHint?.[language] ??
              'Upgrade to remove daily limits and save unlimited ideas.')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
