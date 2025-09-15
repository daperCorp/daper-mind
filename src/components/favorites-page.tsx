
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getFavoritedIdeas, toggleFavorite, type GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';

function FavoriteButton({ idea, onUnfavorite }: { idea: GeneratedIdea, onUnfavorite: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleFavorite(idea.id!, false);
      onUnfavorite(idea.id!);
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
      <Star className={'size-5 fill-primary text-primary'} />
    </Button>
  );
}


export function FavoritesPage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    async function fetchIdeas() {
      const { data, error } = await getFavoritedIdeas(user.uid);
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
  
  const handleUnfavorite = (id: string) => {
      setIdeas(prevIdeas => prevIdeas.filter(idea => idea.id !== id));
  }

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
    return <p className="text-muted-foreground">You have no favorites yet. Star an idea in the archive to see it here!</p>;
  }

  return (
    <div className="space-y-4">
        <h1 className="text-2xl font-bold">Favorite Ideas</h1>
        {ideas.map((idea) => (
            <Link href={`/idea/${idea.id}`} key={idea.id} className="block">
                <Card className="relative hover:shadow-md transition-shadow">
                    <FavoriteButton idea={idea} onUnfavorite={handleUnfavorite} />
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
