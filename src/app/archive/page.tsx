'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ArchivePage } from '@/components/archive-page';
import { Skeleton } from '@/components/ui/skeleton';

export default function ArchiveRoutePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      <ArchivePage />
    </main>
  );
}
