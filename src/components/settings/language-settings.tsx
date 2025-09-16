
'use client';

import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '../ui/label';

export function LanguageSettings() {
  const { language, setLanguage } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('language')}</CardTitle>
        <CardDescription>{t('languageDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="language-select">{t('selectLanguage')}</Label>
            <Select value={language} onValueChange={(value) => setLanguage(value as 'English' | 'Korean')}>
            <SelectTrigger id="language-select" className="w-[280px]">
                <SelectValue placeholder={t('selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="English">{t('english')}</SelectItem>
                <SelectItem value="Korean">{t('korean')}</SelectItem>
            </SelectContent>
            </Select>
        </div>
      </CardContent>
    </Card>
  );
}
