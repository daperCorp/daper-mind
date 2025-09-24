'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowUpDown, BrainCircuit, LayoutGrid, Rows3, Star, Trash2, Calendar, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

    setIsDeleting(true);
    
    startTransition(async () => {
      try {
        const { success, error } = await deleteIdea(ideaId, user.uid);
        
        if (success) {
          toast({ 
            title: t('deleted'), 
            description: t('ideaRemoved')
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
      {/* 카드 링크 - 버튼 영역 제외 */}
      <Link href={`/idea/${idea.id}`} className="absolute inset-0 z-0" />
      
      {/* 액션 버튼들 - 상대적으로 높은 z-index */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex items-center gap-1 rounded-md bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200/50 p-1">
          <FavoriteButton idea={idea} compact />
          
          {/* 더보기 드롭다운 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleRegenerate}
                disabled={isPending}
                className="cursor-pointer"
              >
                <BrainCircuit className="mr-2 h-4 w-4" />
                {isPending ? t('regenerating') : t('regenerateMindMap')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <DeleteButton ideaId={idea.id!} onDeleted={onDeleted} compact />
                <span className="ml-2">{t('deleteIdea')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 카드 내용 - 적절한 패딩으로 버튼과 겹침 방지 */}
      <div className={cn('relative z-0', dense ? 'p-4' : 'p-5')}>
        <div className={cn('space-y-3 pr-20')}> {/* 우측 여백으로 버튼 영역 확보 */}
          <CardHeader className="p-0">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0"> {/* min-w-0으로 텍스트 오버플로우 처리 */}
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

      {/* 하단 상태 표시 */}
      <div className="absolute bottom-3 left-5 right-20 z-0">
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

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    
    async function fetchIdeas() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
    
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await getArchivedIdeas(user.uid);
        
        if (data) {
          setIdeas(data);
        }
        if (error) {
          setError(error);
        }
      } catch (err) {
        console.error('Failed to fetch ideas:', err);
        setError(t('failedToLoadIdeas'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchIdeas();
  }, [user, t]);

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
    setDeletingIds(prev => new Set(prev).add(id));
    
    setTimeout(() => {
      setIdeas((prev) => prev.filter((i) => i.id !== id));
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