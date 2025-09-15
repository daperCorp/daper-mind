
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getArchivedIdeas, toggleFavorite, type GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

function FavoriteButton({ idea }: { idea: GeneratedIdea }) {
  const [isPending, startTransition] = useTransition();
  const [isFavorited, setIsFavorited] = useState(idea.favorited);

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
      className="absolute top-4 right-4 text-muted-foreground hover:text-primary"
    >
      <Star className={cn('size-5', isFavorited && 'fill-primary text-primary')} />
    </Button>
  );
}


export function ArchivePage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    async function fetchIdeas() {
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

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">{error}</p>;
  }

  if (ideas.length === 0) {
    return <p className="text-muted-foreground">Your archive is empty. Generate some ideas to get started!</p>;
  }

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold">Idea Archive</h1>
        {ideas.map((idea) => (
            <Link href={`/idea/${idea.id}`} key={idea.id} className="block">
                <Card className="relative hover:shadow-md transition-shadow">
                    <FavoriteButton idea={idea} />
                    <CardHeader>
                        <CardTitle>{idea.title}</CardTitle>
                        <CardDescription>
                            {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : ''}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground line-clamp-3">{idea.summary}</p>
                    </CardContent>
                </Card>
            </Link>
        ))}
    </div>
  );
}
