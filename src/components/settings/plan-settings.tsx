
'use client';

import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';


export function PlanSettings() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('planDetails')}</CardTitle>
        <CardDescription>{t('planDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 border rounded-lg">
            <div>
                <p className="font-semibold">{t('currentPlan')}</p>
                <p className="text-muted-foreground">{t('free')}</p>
            </div>
            <Button onClick={() => router.push('/upgrade')}>{t('upgradePlan')}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
