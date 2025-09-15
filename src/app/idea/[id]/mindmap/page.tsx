
'use client';

import { useEffect, useState, useTransition, use, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { getIdeaById, GeneratedIdea, expandMindMapNode, regenerateMindMap } from '@/app/actions';
import { MindMapDisplay } from '@/components/mindmap-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Download, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


export default function MindMapPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const mindMapRef = useRef<HTMLDivElement>(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleExportPdf = async () => {
    if (!mindMapRef.current || !idea) return;

    setIsExporting(true);
    toast({ title: 'Exporting...', description: 'Please wait while we generate your PDF.' });

    try {
        const canvas = await html2canvas(mindMapRef.current, {
            scale: 2, // Increase resolution for better quality
            useCORS: true,
            backgroundColor: null, // Use transparent background
        });

        const imgData = canvas.toDataURL('image/png');

        // Calculate PDF dimensions to maintain aspect ratio
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${idea.title.replace(/\s+/g, '_')}_MindMap.pdf`);

        toast({ title: 'Success', description: 'Your mind map has been exported as a PDF.' });
    } catch (error) {
        console.error("Error exporting PDF:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to export mind map.' });
    } finally {
        setIsExporting(false);
    }
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
      <header className="flex items-center justify-between p-4 border-b bg-background gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <p className="text-sm text-muted-foreground">Mind Map for</p>
                <h1 className="text-lg font-semibold">{idea.title}</h1>
            </div>
        </div>
        <div className='flex items-center gap-2'>
            <Button onClick={handleExportPdf} disabled={isExporting}>
                {isExporting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export as PDF
            </Button>
            <Button onClick={handleRegenerate} disabled={isPending || isExporting}>
                <BrainCircuit className="mr-2 h-4 w-4" />
                Regenerate Mind Map
            </Button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-8">
        <MindMapDisplay
          ref={mindMapRef}
          mindMap={idea.mindMap}
          onExpandNode={handleExpandNode}
          isExpanding={isPending}
        />
      </main>
    </div>
  );
}
