
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getIdeaById, GeneratedIdea } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutlineDisplay } from '@/components/outline-display';
import { Button } from '@/components/ui/button';
import { Download, Share2, LocateFixed } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];
  const router = useRouter();

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    async function fetchIdea() {
      const { data, error } = await getIdeaById(id);
      if (error || !data) {
        notFound();
      } else {
        setIdea(data);
      }
      setLoading(false);
    }
    fetchIdea();
  }, [params]);

  const handleShare = async () => {
    const shareData = {
      title: idea?.title,
      text: idea?.summary,
      url: window.location.href,
    };
    
    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({ title: 'Success', description: t('linkCopied') });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Error', description: t('linkCopyError') });
        }
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const handleExport = () => {
    if (!idea) return;

    const content = `Title: ${idea.title}\n\nSummary:\n${idea.summary}\n\nOutline:\n${idea.outline}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${idea.title.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Success', description: t('ideaExported') });
  };
  
  if (loading || !idea) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-64 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }


  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold text-primary">{idea.title}</h1>
            <p className="text-muted-foreground">
                {t('createdOn')} {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'N/A'}
            </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}><Share2 className="mr-2" /> {t('share')}</Button>
            <Button onClick={handleExport}><Download className="mr-2" /> {t('export')}</Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{idea.summary}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('mindMap')}</CardTitle>
           <Button asChild variant="outline">
              <Link href={`/idea/${idea.id}/mindmap`}>
                <LocateFixed className="mr-2 h-4 w-4" />
                View Full Mind Map
              </Link>
            </Button>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground">
            A brief preview of your mind map is available. Click the button above to view and interact with the full mind map.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('outline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <OutlineDisplay outline={idea.outline} />
        </CardContent>
      </Card>
    </div>
  );
}
