
'use client';

import { useEffect, useState } from 'react';
import { getArchivedIdeas, type GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ArchivePage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIdeas() {
      const { data, error } = await getArchivedIdeas();
      if (data) {
        setIdeas(data);
      }
      if (error) {
        setError(error);
      }
      setLoading(false);
    }
    fetchIdeas();
  }, []);

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
            <Card key={idea.id}>
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
        ))}
    </div>
  );
}
