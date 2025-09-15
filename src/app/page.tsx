
'use client';

import { useState } from 'react';
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

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('new');
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-32 ml-4" />
        </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
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
              <SidebarMenuButton tooltip="New Idea" isActive={activeMenu === 'new'} onClick={() => setActiveMenu('new')}>
                <Plus />
                <span>New Idea</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Archive" isActive={activeMenu === 'archive'} onClick={() => setActiveMenu('archive')}>
                <Archive />
                <span>Archive</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Favorites" isActive={activeMenu === 'favorites'} onClick={() => setActiveMenu('favorites')}>
                <Star />
                <span>Favorites</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-xl">AI Idea Architect</h1>
          </div>
          <UserProfile />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {activeMenu === 'new' && <IdeaArchitect />}
          {activeMenu === 'archive' && <ArchivePage />}
          {activeMenu === 'favorites' && <FavoritesPage />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
