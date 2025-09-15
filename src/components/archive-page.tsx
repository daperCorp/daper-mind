
'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { BrainCircuit, Star } from 'lucide-react';
import { getArchivedIdeas, regenerateMindMap, toggleFavorite, type GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { MindMapNode } from '@/ai/flows/generate-idea-mindmap';

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

function RegenerateMindMapButton({ idea, onRegenerate }: { idea: GeneratedIdea, onRegenerate: (id: string, newMap: MindMapNode) => void }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const { language } = useLanguage();
    const t = (key: keyof typeof translations) => translations[key][language];

    const handleRegenerate = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            const { success, newMindMap, error } = await regenerateMindMap(idea.id!, idea.summary, idea.language || 'English');
            if (success && newMindMap) {
                onRegenerate(idea.id!, newMindMap);
                toast({
                    title: t('success'),
                    description: t('mindMapRegenerated'),
                });
            } else {
                toast({
                    variant: "destructive",
                    title: t('error'),
                    description: error,
                });
            }
        });
    };

    return (
        <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isPending}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            {t('regenerateMindMap')}
        </Button>
    );
}


export function ArchivePage() {
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  useEffect(() => {
    if (!user?.uid) {
        setLoading(false);
        return;
    };
    async function fetchIdeas() {
      setLoading(true);
      const { data, error } = await getArchivedIdeas(user.uid);
      if (data) {
        const sortedData = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        setIdeas(sortedData);
      }
      if (error) {
        setError(error);
      }
      setLoading(false);
    }
    fetchIdeas();
  }, [user]);

  const handleMindMapRegenerated = (id: string, newMindMap: MindMapNode) => {
    setIdeas(prevIdeas => prevIdeas.map(idea => idea.id === id ? { ...idea, mindMap: newMindMap } : idea));
  };


  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    <div className="space-y-4">
        <h1 className="text-2xl font-bold">{t('ideaArchive')}</h1>
        {ideas.length === 0 ? (
            <p className="text-muted-foreground">{t('archiveEmpty')}</p>
        ) : (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {ideas.map((idea) => (
                    <Card key={idea.id} className="relative flex flex-col hover:shadow-md transition-shadow">
                        <FavoriteButton idea={idea} />
                        <Link href={`/idea/${idea.id}`} className="block flex-grow p-6">
                            <CardHeader className="p-0 mb-2">
                                <CardTitle className="line-clamp-2">{idea.title}</CardTitle>
                                <CardDescription>
                                    {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : ''}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <p className="text-muted-foreground line-clamp-3">{idea.summary}</p>
                            </CardContent>
                        </Link>
                        <CardFooter>
                            <RegenerateMindMapButton idea={idea} onRegenerate={handleMindMapRegenerated}/>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
    </div>
  );
}
