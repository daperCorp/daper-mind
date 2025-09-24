'use client';

import { useEffect, useState, useTransition, useMemo, useRef } from 'react';
import Link from 'next/link';
import { BrainCircuit, Star, Calendar, MoreHorizontal, Trash2, ArrowUpDown, LayoutGrid, Rows3 } from 'lucide-react';
import { getFavoritedIdeas, regenerateMindMap, toggleFavorite, deleteIdea, type GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useT } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatDate(d?: Date) {
  if (!d) return '';
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

function FavoriteButton({ idea, onUnfavorite, compact = false }: { 
  idea: GeneratedIdea; 
  onUnfavorite: (id: string) => void;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const t = useT();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleFavorite(idea.id!, false);
      onUnfavorite(idea.id!);
    });
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleFavoriteClick}
        disabled={isPending}
        className="h-8 px-2 text-muted-foreground hover:text-primary transition-colors"
        aria-label={t('removeFromFavorites')}
      >
        <Star className="h-4 w-4 fill-primary text-primary" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleFavoriteClick}
      disabled={isPending}
      className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
      aria-label={t('removeFromFavorites')}
    >
      <Star className="h-4 w-4 fill-primary text-primary" />
    </Button>
  );
}

function DeleteButton({
  ideaId,
  onDeleted,
  compact = false,
}: {
  ideaId: string;
  onDeleted: () => void;
  compact?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const t = useT();

  const handleDelete = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('mustBeLoggedIn'),
      });
      return;
    }

    setIsDeleting(true);
    
    startTransition(async () => {
      try {
        const { success, error } = await deleteIdea(ideaId, user.uid);
        
        if (success) {
          toast({ 
            title: t('deleted'), 
            description: t('ideaDeletedFromFavorites')
          });
          
          setTimeout(() => {
            onDeleted?.();
            setOpen(false);
            setIsDeleting(false);
          }, 100);
          
        } else {
          toast({ 
            variant: 'destructive', 
            title: t('error'), 
            description: error || t('failedToDeleteIdea')
          });
          setIsDeleting(false);
        }
      } catch (err) {
        console.error('Delete operation failed:', err);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('unexpectedError'),
        });
        setIsDeleting(false);
      }
    });
  };

  const DeleteTrigger = compact ? (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 text-muted-foreground hover:text-destructive transition-colors"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      disabled={isDeleting}
      aria-label={t('deleteIdea')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  ) : (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }}
      disabled={isDeleting}
      aria-label={t('deleteIdea')}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {DeleteTrigger}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteFavoriteIdea')}</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('deleteFavoriteConfirmation')}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending || isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isPending || isDeleting}
          >
            {isPending || isDeleting ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function IdeaCard({ 
  idea, 
  dense,
  onRegenerate, 
  onUnfavorite,
  onDeleted,
}: { 
  idea: GeneratedIdea; 
  dense: boolean;
  onRegenerate: (id: string, newMap: MindMapNode) => void; 
  onUnfavorite: (id: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const t = useT();

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const { success, newMindMap, error } = await regenerateMindMap(
        idea.id!, 
        idea.summary, 
        idea.language || 'English'
      );
      if (success && newMindMap) {
        onRegenerate(idea.id!, newMindMap);
        toast({
          title: t('success'),
          description: t('mindMapRegenerated'),
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('error'),
          description: error,
        });
      }
    });
  };

  return (
    <Card className="group relative h-full transition-all duration-200 border bg-card hover:shadow-lg hover:-translate-y-0.5">
      {/* ✅ 카드 전역 클릭 링크: 최상단으로 올림 */}
      <Link
       href={`/idea/${idea.id}`}        className="absolute inset-0 z-10"
       aria-label={idea.title || 'Open idea'}
      />
      
     {/* 액션 버튼들 - 호버 시 표시 */}
     <div className="absolute top-3 right-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
         <div className="flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 p-1">    
                   {/* 버튼들은 클릭 먹도록 auto */}
                   <div className="pointer-events-auto" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <FavoriteButton idea={idea} onUnfavorite={onUnfavorite} compact />
          </div>
          
          {/* 더보기 드롭다운 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* <DropdownMenuItem
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRegenerate(e as any); }}
                disabled={isPending}
                className="cursor-pointer"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                {isPending ? t('regenerating') : t('regenerateMindMap')}
              </DropdownMenuItem>
              <DropdownMenuSeparator /> */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();   // 메뉴 닫히는 기본 동작 방지
                  setConfirmOpen(true); // 다이얼로그 열기
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <DeleteButton 
                  ideaId={idea.id!} 
                  onDeleted={() => onDeleted(idea.id!)} 
                  compact 
                />
                <span className="ml-2">{t('deleteIdea')}</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 즐겨찾기 표시 배지 */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100/90 text-yellow-700 border border-yellow-200/60 px-2 py-1 text-xs font-medium backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" />
          <span>{t('favorite')}</span>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className={cn('relative z-0 pointer-events-none', dense ? 'p-4 pt-12' : 'p-5 pt-14')}>
        <div className={cn('space-y-3 pr-20')}> {/* 버튼 영역 확보 */}
          <CardHeader className="p-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={cn(
                    'tracking-tight leading-tight',
                    dense
                      ? 'text-base md:text-lg line-clamp-2'
                      : 'text-lg md:text-xl line-clamp-2',
                  )}
                  title={idea.title}
                >
                  {idea.title}
                </CardTitle>
              </div>
            </div>
            
            <CardDescription className="flex items-center gap-2 mt-2 text-xs md:text-sm">
              <Calendar className="h-3 w-3 opacity-70" />
              <span>{formatDate(idea.createdAt)}</span>
              {idea.language && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="text-muted-foreground/70">{idea.language}</span>
                </>
              )}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <p
              className={cn(
                'text-muted-foreground leading-relaxed',
                dense
                  ? 'text-sm line-clamp-2'
                  : 'text-[15px] line-clamp-3',
              )}
            >
              {idea.summary}
            </p>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

type SortKey = 'newest' | 'oldest' | 'title';

export function FavoritesPage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [dense, setDense] = useState(false);
  const [q, setQ] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const t = useT();
  const { toast } = useToast();
  
  // ✅ 의존성에 쓸 원시값만
  const uid = user?.uid ?? null;

  // ✅ 중복 호출 가드 + 레이스 방지 토큰
  const isFetchingRef = useRef(false);
  const fetchTokenRef = useRef(0);

  useEffect(() => {
    if (!uid) {                // 로그인 안 됨 → 종료
      setLoading(false);
      return;
    }

    if (isFetchingRef.current) // 진행 중이면 중복 실행 차단
      return;

    isFetchingRef.current = true;
    const myToken = ++fetchTokenRef.current; // 최신 요청 토큰
    setLoading(true);
    setError(null);

    (async () => {
      try {
        console.log('Favorites: Calling getFavoritedIdeas...');
        const { data, error } = await getFavoritedIdeas(uid);

        // ✅ uid 변경 등으로 구 응답이면 버림(레이스 보호)
        if (fetchTokenRef.current !== myToken) return;

        console.log('Favorites: Received response:', { dataCount: data?.length || 0, error });
        if (data) setIdeas(data);
        if (error) setError(error);
      } catch (e) {
        console.error('Favorites: Failed to fetch favorite ideas:', e);
        // ❗ t는 의존성에 넣지 않음. 여기서만 읽기
        setError(t('failedToLoadFavorites'));
      } finally {
        if (fetchTokenRef.current === myToken) {
          setLoading(false);
          isFetchingRef.current = false;
        }
      }
    })();
  }, [uid]); // ✅ 오직 uid만

  const filteredSorted = useMemo(() => {
    const filtered = ideas.filter((i) => {
      if (deletingIds.has(i.id!)) return false;
      
      if (!q.trim()) return true;
      const key = q.trim().toLowerCase();
      return (
        i.title?.toLowerCase().includes(key) ||
        i.summary?.toLowerCase().includes(key)
      );
    });

    return filtered.sort((a, b) => {
      if (sortKey === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortKey === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [ideas, q, sortKey, deletingIds]);

  const handleUnfavorite = (id: string) => {
    setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== id));
    toast({
      title: t('removedFromFavorites'),
      description: t('ideaRemovedFromFavorites'),
    });
  };

  const handleMindMapRegenerated = (id: string, newMindMap: MindMapNode) => {
    setIdeas(prevIdeas => prevIdeas.map(idea => 
      idea.id === id ? { ...idea, mindMap: newMindMap } : idea
    ));
  };

  const handleIdeaDeleted = (id: string) => {
    setDeletingIds(prev => new Set(prev).add(id));
    
    setTimeout(() => {
      setIdeas(prev => prev.filter(i => i.id !== id));
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('favoriteIdeas')}</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Star className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">{t('errorLoadingFavorites')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
          >
            {t('tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('favoriteIdeas')}</h1>
        <div className="rounded-lg border p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('authenticationRequired')}</h3>
          <p className="text-muted-foreground">{t('pleaseLogin')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 & 툴바 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('favoriteIdeas')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredSorted.length} {filteredSorted.length === 1 ? t('favorite') : t('favorites2')}
            {deletingIds.size > 0 && (
              <span className="ml-2 text-xs text-orange-600 font-medium">
                ({deletingIds.size} {t('deleting')}...)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Input
              placeholder={t('searchFavorites')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[220px] md:w-[280px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextSort: SortKey = 
                sortKey === 'newest' ? 'oldest' : 
                sortKey === 'oldest' ? 'title' : 'newest';
              setSortKey(nextSort);
            }}
            className="shrink-0"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortKey === 'newest' ? t('newest') : 
             sortKey === 'oldest' ? t('oldest') : t('titleSort')}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDense((d) => !d)}
            title={dense ? t('comfortableCards') : t('compactCards')}
            className="shrink-0"
          >
            {dense ? <LayoutGrid className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 빈 상태 */}
      {filteredSorted.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-50">
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          {ideas.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-3">{t('favoritesEmpty')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('starIdeasToSee')}
              </p>
              <Link href="/archive">
                <Button variant="outline">{t('browseYourIdeas')}</Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-3">{t('noMatchingFavorites')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('adjustSearchTermsBrowse')}
              </p>
              {q.trim() && (
                <Button 
                  variant="outline"
                  onClick={() => setQ('')}
                >
                  {t('clearSearch')}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className={cn(
          "grid gap-4",
          dense ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3"
        )}>
          {filteredSorted.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              dense={dense}
              onRegenerate={handleMindMapRegenerated}
              onUnfavorite={handleUnfavorite}
              onDeleted={handleIdeaDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}