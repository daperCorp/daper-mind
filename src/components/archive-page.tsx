'use client';

import { useEffect, useMemo, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpDown, BrainCircuit, LayoutGrid, Rows3, Star, Trash2, Calendar } from 'lucide-react';
import {
  getArchivedIdeas,
  regenerateMindMap,
  toggleFavorite,
  deleteIdea,
  type GeneratedIdea,
} from '@/app/actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useT } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { Input } from '@/components/ui/input';
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

function FavoriteButton({ idea, compact = false }: { idea: GeneratedIdea; compact?: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(!!idea.favorited);
  const t = useT();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleFavorite(idea.id!, !isFavorited);
      setIsFavorited(!isFavorited);
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
        aria-label={isFavorited ? t('unfavorite') : t('favorite')}
      >
        <Star
          className={cn(
            'h-4 w-4 transition-colors',
            isFavorited && 'fill-primary text-primary',
          )}
        />
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
      aria-label={isFavorited ? t('unfavorite') : t('favorite')}
    >
      <Star
        className={cn(
          'h-4 w-4 transition-colors',
          isFavorited && 'fill-primary text-primary',
        )}
      />
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

    console.log('🗑️ 삭제 시작:', { ideaId, userId: user.uid });
    setIsDeleting(true);
    
    startTransition(async () => {
      try {
        const { success, error } = await deleteIdea(ideaId, user.uid);
        
        console.log('🗑️ 삭제 결과:', { success, error });
        
        if (success) {
          toast({ 
            title: t('deleted'), 
            description: t('ideaRemoved')
          });
          
          // 즉시 콜백 호출하여 UI에서 제거
          onDeleted();
          setOpen(false);
          setIsDeleting(false);
          
        } else {
          console.error('❌ 삭제 실패:', error);
          toast({ 
            variant: 'destructive', 
            title: t('error'), 
            description: error || t('failedToDeleteIdea')
          });
          setIsDeleting(false);
        }
      } catch (err) {
        console.error('💥 삭제 예외:', err);
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('unexpectedError'),
        });
        setIsDeleting(false);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size={compact ? "sm" : "icon"}
        className={cn(
          "text-muted-foreground hover:text-destructive transition-colors",
          compact ? "h-8 px-2" : "h-8 w-8"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        disabled={isDeleting || isPending}
        aria-label={t('deleteIdea')}
      >
        <Trash2 className="h-4 w-4" />
        {compact && <span className="ml-1 hidden sm:inline">{t('delete')}</span>}
      </Button>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteThisIdea')}</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          {t('deleteConfirmation')}
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending || isDeleting}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isPending || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
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
  onDeleted,
}: {
  idea: GeneratedIdea;
  dense: boolean;
  onRegenerate: (id: string, newMap: MindMapNode) => void;
  onDeleted: () => void;
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
        idea.language || 'English',
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
      {/* 카드 전역 클릭 링크 */}
      <Link
        href={`/idea/${idea.id}`}
        className="absolute inset-0 z-10"
        aria-label={idea.title || 'Open idea'}
      />

      {/* 액션 버튼들 - DropdownMenu 제거하고 직접 배치 */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1 rounded-md bg-white/95 backdrop-blur-sm shadow-md border border-gray-200/50 p-1">
          {/* 즐겨찾기 버튼 */}
          <div
            className="pointer-events-auto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <FavoriteButton idea={idea} compact />
          </div>

          {/* 삭제 버튼 - DropdownMenu 없이 직접 */}
          <div
            className="pointer-events-auto"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <DeleteButton ideaId={idea.id!} onDeleted={onDeleted} compact />
          </div>
        </div>
      </div>

      {/* 카드 내용 */}
      <div className={cn('relative z-0 pointer-events-none', dense ? 'p-4' : 'p-5')}>
        <div className={cn('space-y-3 pr-20')}>
          <CardHeader className="p-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <CardTitle
                  className={cn(
                    'tracking-tight leading-tight',
                    dense ? 'text-base md:text-lg line-clamp-2' : 'text-lg md:text-xl line-clamp-2',
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
            <p className={cn('text-muted-foreground leading-relaxed', dense ? 'text-sm line-clamp-2' : 'text-[15px] line-clamp-3')}>
              {idea.summary}
            </p>
          </CardContent>
        </div>
      </div>

      <div className="absolute bottom-3 left-5 right-20 z-0 pointer-events-none">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {idea.favorited && (
              <div className="flex items-center gap-1 text-yellow-600">
                <Star className="h-3 w-3 fill-current" />
                <span className="text-xs">{t('favorited')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

type SortKey = 'newest' | 'oldest';

export function ArchivePage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('newest');
  const [dense, setDense] = useState(false);
  const [q, setQ] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const t = useT();
  
  // 의존성에 쓸 "원시값"만 뽑기
  const uid = user?.uid ?? null;

  // 중복 호출 가드
  const isFetchingRef = useRef(false);

  useEffect(() => {
    // 로그인 안되어 있으면 즉시 종료
    if (!uid) {
      setLoading(false);
      return;
    }

    // 이미 실행 중이면 중복 실행 막기
    if (isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        console.log('Archive: Calling getArchivedIdeas...');
        const { data, error } = await getArchivedIdeas(uid);
        console.log('Archive: Received response:', { dataCount: data?.length || 0, error });

        if (data) setIdeas(data);
        if (error) setError(error);
      } catch (e) {
        console.error('Archive: Failed to fetch ideas:', e);
        setError(t('failedToLoadIdeas'));
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    })();
  }, [uid]); // uid만 의존성

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
    
    const sorted = filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortKey === 'newest' ? bTime - aTime : aTime - bTime;
    });
    
    return sorted;
  }, [ideas, q, sortKey, deletingIds]);

  const handleMindMapRegenerated = (id: string, newMindMap: MindMapNode) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, mindMap: newMindMap } : i)));
  };

  const handleIdeaDeleted = (id: string) => {
    console.log('🗑️ 아이디어 삭제 처리:', id);
    
    // 애니메이션을 위해 deletingIds에 추가
    setDeletingIds(prev => new Set(prev).add(id));
    
    // 즉시 ideas 배열에서 제거
    setIdeas((prev) => {
      const filtered = prev.filter((i) => i.id !== id);
      console.log('🗑️ 아이디어 목록 업데이트:', { 
        이전개수: prev.length, 
        삭제후개수: filtered.length 
      });
      return filtered;
    });
    
    // 300ms 후 deletingIds에서도 제거 (애니메이션 완료 후)
    setTimeout(() => {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        console.log('🗑️ deletingIds에서 제거 완료:', id);
        return next;
      });
    }, 300);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
            <p className="text-sm text-muted-foreground">{t('loading')}...</p>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        
        {/* 로딩 상태를 더 명확하게 표시 */}
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
                <BrainCircuit className="h-6 w-6 text-blue-600 animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {t('loading')} {t('ideaArchive')}
              </h3>
              <p className="text-sm text-gray-600">
                {t('fetchingYourIdeas') || 'Fetching your ideas...'}
              </p>
            </div>
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
        <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <BrainCircuit className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">{t('errorLoadingIdeas')}</h3>
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
        <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
        <div className="rounded-lg border p-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BrainCircuit className="h-6 w-6 text-muted-foreground" />
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
          <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredSorted.length} {filteredSorted.length === 1 ? t('item') : t('items')}
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
              placeholder={t('searchIdeas')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[220px] md:w-[280px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortKey((s) => (s === 'newest' ? 'oldest' : 'newest'))}
            className="shrink-0"
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortKey === 'newest' ? t('newest') : t('oldest')}
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
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <BrainCircuit className="h-8 w-8 text-muted-foreground" />
          </div>
          {ideas.length === 0 ? (
            <>
              <h3 className="text-xl font-semibold mb-3">{t('archiveEmpty')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('startCreating')}
              </p>
              <Link href="/">
                <Button>{t('generateFirstIdea')}</Button>
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold mb-3">{t('noMatchingIdeas')}</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('adjustSearchTerms')}
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
              onDeleted={() => handleIdeaDeleted(idea.id!)}
            />
          ))}
        </div>
      )}
    </div>
  );
}