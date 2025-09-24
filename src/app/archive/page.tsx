'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ArchivePage } from '@/components/archive-page';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
export default function ArchiveRoutePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-32 ml-4" />
      </div>
    );
  }

  return (
    <main className="container max-w-5xl mx-auto p-4 pt-20">
      {/* 🔙 헤더 영역 */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
      </div>

      <ArchivePage />
    </main>
  );
}