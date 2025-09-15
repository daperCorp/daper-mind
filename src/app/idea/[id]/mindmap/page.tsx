
'use client';

import { useEffect, useState, useTransition } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getIdeaById, GeneratedIdea, expandMindMapNode, regenerateMindMap } from '@/app/actions';
import { MindMapDisplay } from '@/components/mindmap-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MindMapNode } from '@/ai/flows/generate-idea-mindmap';

export default function MindMapPage({ params }: { params: { id: string } }) {
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const fetchIdea = async () => {
    const { data, error } = await getIdeaById(params.id);
    if (error || !data) {
      notFound();
    } else {
      setIdea(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      fetchIdea();
    }
  }, [params.id]);

  const handleExpandNode = async (parentNodeTitle: string, existingChildren: { title: string }[]) => {
    if (!idea) return;
    const existingChildrenTitles = existingChildren.map(c => c.title);

    startTransition(async () => {
      const { success, newNodes, error } = await expandMindMapNode(
        idea.id!,
        idea.summary,
        parentNodeTitle,
        existingChildrenTitles,
        idea.language || 'English'
      );
      if (success && newNodes) {
        toast({ title: 'Success', description: `${newNodes.length} new node(s) added.` });
        await fetchIdea(); // Refetch to get the updated mind map
      } else {
        toast({ variant: 'destructive', title: 'Error', description: error });
      }
    });
  };

  const handleRegenerate = async () => {
    if (!idea) return;
    startTransition(async () => {
        const { success, newMindMap, error } = await regenerateMindMap(idea.id!, idea.summary, idea.language || 'English');
        if (success && newMindMap) {
            setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
            toast({
                title: "Success",
                description: "Mind map has been regenerated.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: error,
            });
        }
    });
  };

  if (loading || !idea) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="w-full h-[60vh]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/40">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <p className="text-sm text-muted-foreground">Mind Map for</p>
                <h1 className="text-lg font-semibold">{idea.title}</h1>
            </div>
        </div>
        <Button onClick={handleRegenerate} disabled={isPending}>
            <BrainCircuit className="mr-2 h-4 w-4" />
            Regenerate Mind Map
        </Button>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <MindMapDisplay 
          mindMap={idea.mindMap}
          onExpandNode={handleExpandNode}
          isExpanding={isPending}
        />
      </main>
    </div>
  );
}
