'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowUpDown, BrainCircuit, LayoutGrid, Rows3, Star, Trash2 } from 'lucide-react';
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
import { translations } from '@/lib/translations';
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

function FavoriteButton({ idea }: { idea: GeneratedIdea }) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(!!idea.favorited);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleFavorite(idea.id!, !isFavorited);
      setIsFavorited(!isFavorited);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleFavoriteClick}
      disabled={isPending}
      className="absolute top-3 right-12 text-muted-foreground hover:text-primary"
      aria-label={isFavorited ? 'Unfavorite' : 'Favorite'}
    >
      <Star
        className={cn(
          'size-5 transition-colors',
          isFavorited && 'fill-primary text-primary',
        )}
      />
    </Button>
  );
}

function DeleteButton({
  ideaId,
  onDeleted,
}: {
  ideaId: string;
  onDeleted: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const handleDelete = () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to delete an idea.',
      });
      return;
    }
  
    startTransition(async () => {
      const { success, error } = await deleteIdea(ideaId, user.uid);
      if (success) {
        toast({ title: 'Deleted', description: 'Idea has been removed.' });
        onDeleted?.();   // 🔹 삭제 후 목록에서 제거하는 콜백
        setOpen(false);  // 🔹 다이얼로그 닫기
      } else {
        toast({ variant: 'destructive', title: 'Error', description: error });
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label="Delete Idea"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this idea?</AlertDialogTitle>
        </AlertDialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? 'Deleting...' : 'Delete'}
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
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

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
    <Link href={`/idea/${idea.id}`} className="h-full">
      <Card className="relative h-full transition-all duration-200 border bg-card hover:shadow-lg hover:-translate-y-0.5 group">
        <FavoriteButton idea={idea} />
        <DeleteButton ideaId={idea.id!} onDeleted={onDeleted} />

        <div className={cn('p-5', dense ? 'space-y-2' : 'space-y-3')}>
          <CardHeader className="p-0">
            <CardTitle
              className={cn(
                'tracking-tight',
                dense
                  ? 'text-base md:text-lg line-clamp-2'
                  : 'text-lg md:text-xl line-clamp-2',
              )}
              title={idea.title}
            >
              {idea.title}
            </CardTitle>
            <CardDescription className="mt-1 text-xs md:text-sm">
              {formatDate(idea.createdAt)}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <p
              className={cn(
                'text-muted-foreground',
                dense
                  ? 'text-sm line-clamp-2'
                  : 'text-[15px] leading-6 line-clamp-3',
              )}
            >
              {idea.summary}
            </p>
          </CardContent>

          <div className="pt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BrainCircuit className="h-4 w-4 opacity-70" />
              <span>{idea.language ?? 'English'}</span>
            </div>
            <Button
              onClick={handleRegenerate}
              size="sm"
              variant="outline"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              disabled={isPending}
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              {isPending ? '...' : 'Regenerate'}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
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
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

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
      const { data, error } = await getArchivedIdeas(user.uid);
      if (data) {
        setIdeas(data);
      }
      if (error) {
        setError(error);
      }
      setLoading(false);
    }
    
    fetchIdeas();
  }, [user]);

  const filteredSorted = useMemo(() => {
    const filtered = ideas.filter((i) => {
      if (!q.trim()) return true;
      const key = q.trim().toLowerCase();
      return (
        i.title?.toLowerCase().includes(key) ||
        i.summary?.toLowerCase().includes(key)
      );
    });
    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortKey === 'newest' ? bTime - aTime : aTime - bTime;
    });
  }, [ideas, q, sortKey]);

  const handleMindMapRegenerated = (id: string, newMindMap: MindMapNode) => {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, mindMap: newMindMap } : i)));
  };

  const handleIdeaDeleted = (id: string) => {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-5">
      {/* 헤더 & 툴바 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
          <p className="text-sm text-muted-foreground">
            {filteredSorted.length} {filteredSorted.length === 1 ? 'item' : 'items'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search ideas..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-[220px] md:w-[260px]"
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortKey((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortKey === 'newest' ? 'Newest' : 'Oldest'}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setDense((d) => !d)}
            title={dense ? 'Comfortable cards' : 'Compact cards'}
          >
            {dense ? <LayoutGrid className="h-4 w-4" /> : <Rows3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* 빈 상태 */}
      {filteredSorted.length === 0 ? (
        <div className="rounded-lg border p-10 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BrainCircuit className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t('archiveEmpty')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try generating a new idea from the home page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
