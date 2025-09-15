
'use client';

import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{t('settings')}</h1>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('myAccount')}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>{user?.displayName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('planDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div>
              <p className="font-semibold">{t('currentPlan')}</p>
              <p>{t('free')}</p>
            </div>
            <Button onClick={() => { /* Navigate to upgrade page */ }}>{t('upgradePlan')}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('language')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(value) => setLanguage(value as 'English' | 'Korean')}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">{t('english')}</SelectItem>
                <SelectItem value="Korean">{t('korean')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('manageAccount')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col space-y-4">
            <Button variant="outline">{t('contactSupport')}</Button>
            <Button variant="destructive" onClick={logout}>{t('signOut')}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
