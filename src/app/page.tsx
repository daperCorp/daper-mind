
'use client';

import { useEffect, useState } from 'react';
import { Archive, BrainCircuit, Plus, Star } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { IdeaArchitect } from '@/components/idea-architect';
import { ArchivePage } from '@/components/archive-page';
import { FavoritesPage } from '@/components/favorites-page';
import { useAuth } from '@/context/auth-context';
import { UserProfile } from '@/components/user-profile';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('new');
  const { user, loading } = useAuth();
  const router = useRouter();
  const { language } = useLanguage();

  const t = (key: keyof typeof translations) => translations[key][language];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
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
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <BrainCircuit className="size-8 text-primary" />
            <h1 className="text-xl font-semibold">Daper</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('newIdea')} isActive={activeMenu === 'new'} onClick={() => setActiveMenu('new')}>
                <Plus />
                <span>{t('newIdea')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('archive')} isActive={activeMenu === 'archive'} onClick={() => setActiveMenu('archive')}>
                <Archive />
                <span>{t('archive')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip={t('favorites')} isActive={activeMenu === 'favorites'} onClick={() => setActiveMenu('favorites')}>
                <Star />
                <span>{t('favorites')}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className='flex flex-col h-screen'>
            <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
                <SidebarTrigger className="md:hidden" />
                <div className="flex-1">
                    <h1 className="text-lg font-semibold md:text-xl">{t('aiIdeaArchitect')}</h1>
                </div>
                <div className='flex items-center gap-4'>
                    <UserProfile />
                </div>
            </header>
            <main className="flex-1 overflow-auto p-4 md:p-6">
                {activeMenu === 'new' && <IdeaArchitect />}
                {activeMenu === 'archive' && <ArchivePage />}
                {activeMenu === 'favorites' && <FavoritesPage />}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
