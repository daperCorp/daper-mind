
'use client';

import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
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
} from "@/components/ui/alert-dialog"


export function ManageAccountSettings() {
  const { logout } = useAuth();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('manageAccount')}</CardTitle>
        <CardDescription>{t('manageAccountDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-start space-y-4">
            <div className='w-full'>
                <h3 className='font-medium'>{t('contactSupport')}</h3>
                <p className='text-sm text-muted-foreground mb-2'>{t('contactSupportDescription')}</p>
                <Button variant="outline">{t('contactSupport')}</Button>
            </div>
             <div className='w-full'>
                <h3 className='font-medium'>{t('signOut')}</h3>
                <p className='text-sm text-muted-foreground mb-2'>{t('signOutDescription')}</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">{t('signOut')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('signOutConfirmTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('signOutConfirmDescription')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={logout}>{t('signOut')}</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
