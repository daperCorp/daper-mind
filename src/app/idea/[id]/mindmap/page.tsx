
'use client';

import { useEffect, useState, useTransition, use, useRef } from 'react';
import { notFound } from 'next/navigation';
import { getIdeaById, GeneratedIdea, expandMindMapNode, regenerateMindMap, addManualMindMapNode, editMindMapNode, deleteMindMapNode } from '@/app/actions';
import { MindMapDisplay } from '@/components/mindmap-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Download, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import Link from 'next/link';
import { MindMapNodeDialog } from '@/components/mindmap-node-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const mindMapToMarkdown = (node: MindMapNode, level = 0): string => {
    let markdown = `${'  '.repeat(level)}* ${node.title}\n`;
    if (node.children) {
        for (const child of node.children) {
            markdown += mindMapToMarkdown(child, level + 1);
        }
    }
    return markdown;
};


export default function MindMapPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const mindMapRef = useRef<HTMLDivElement>(null);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    nodePath: string;
    defaultValue?: string;
  }>({ isOpen: false, mode: 'add', nodePath: '' });
  
  const [deleteDialogState, setDeleteDialogState] = useState<{
    isOpen: boolean;
    nodePath: string;
  }>({isOpen: false, nodePath: ''});


  const fetchIdea = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const { data, error } = await getIdeaById(params.id);
    if (error || !data) {
      notFound();
    } else {
      setIdea(data);
      // If mindMap doesn't exist, generate it automatically
      if (!data.mindMap) {
        startTransition(async () => {
          const { success, newMindMap, error: regenerateError } = await regenerateMindMap(data.id!, data.summary, data.language || 'English');
          if (success && newMindMap) {
            setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
            toast({
                title: "Success",
                description: "Mind map has been generated.",
            });
          } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: regenerateError || "Failed to generate mind map automatically.",
            });
          }
        });
      }
    }
    if (showLoading) setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      fetchIdea();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
  
  const handleOpenDialog = (mode: 'add' | 'edit', nodePath: string, defaultValue = '') => {
    setDialogState({ isOpen: true, mode, nodePath, defaultValue });
  };

  const handleOpenDeleteDialog = (nodePath: string) => {
    setDeleteDialogState({ isOpen: true, nodePath });
  };

  const handleExpandNode = async (nodePath: string, existingChildren: { title: string }[]) => {
    if (!idea) return;
    const parentNodeTitle = nodePath.split('>').pop()!;
    const existingChildrenTitles = existingChildren.map(c => c.title);

    startTransition(async () => {
      const { success, newNodes, error } = await expandMindMapNode(
        idea.id!,
        idea.summary,
        parentNodeTitle,
        existingChildrenTitles,
        idea.language || 'English'
      );
      if (success) {
        toast({ title: 'Success', description: `${newNodes?.length || 0} new node(s) added.` });
        await fetchIdea(false); // Refetch without full loading state
      } else {
        toast({ variant: 'destructive', title: 'Error', description: error });
      }
    });
  };

  const handleDialogSubmit = async (title: string) => {
    if (!idea) return;
    const { mode, nodePath } = dialogState;

    startTransition(async () => {
        let result: { success: boolean, error?: string | undefined };
        if (mode === 'add') {
            const parentNodeTitle = nodePath.split('>').pop()!;
            result = await addManualMindMapNode(idea.id!, parentNodeTitle, title);
        } else {
            result = await editMindMapNode(idea.id!, nodePath, title);
        }

        if (result.success) {
            toast({ title: 'Success', description: `Node has been ${mode === 'add' ? 'added' : 'updated'}.` });
            await fetchIdea(false);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  };

  const handleDeleteNode = async () => {
    if (!idea) return;
    const { nodePath } = deleteDialogState;
    startTransition(async () => {
      const result = await deleteMindMapNode(idea.id!, nodePath);
      if (result.success) {
        toast({ title: 'Success', description: 'Node has been deleted.' });
        await fetchIdea(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
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
    if (!idea) return;

    setIsExporting(true);
    toast({ title: 'Exporting...', description: 'Please wait while we generate your PDF.' });

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: showdown } = await import('showdown');
        const { default: html2canvas } = await import('html2canvas');

        const markdown = idea?.mindMap
        ? mindMapToMarkdown(idea.mindMap)
        : '# No mind map available';
        const converter = new showdown.Converter();
        const html = converter.makeHtml(markdown);

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '700px'; 
        tempContainer.style.padding = '20px'; // Add padding
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.fontFamily = `'Malgun Gothic', 'sans-serif'`;
        tempContainer.innerHTML = `
            <style>
                body { font-family: 'Malgun Gothic', 'Helvetica', 'Arial', sans-serif; line-height: 1.6; background-color: white; color: black; }
                ul { list-style-type: disc; padding-left: 20px; margin: 0; }
                li { margin-bottom: 8px; }
                h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; border-bottom: 2px solid #eee; padding-bottom: 8px; }
                h2 { font-size: 20px; font-weight: bold; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
            </style>
            <h1>${idea.title}</h1>
            <h2>Mind Map</h2>
            ${html}
        `;
        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
            scale: 2, 
            backgroundColor: '#ffffff',
            useCORS: true,
        });
        
        document.body.removeChild(tempContainer);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pdfWidth - (margin * 2);
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const contentHeight = contentWidth / ratio;
        
        let heightLeft = contentHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));

        while (heightLeft > 0) {
            position = heightLeft - contentHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
            heightLeft -= (pdfHeight - (margin * 2));
        }

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
    <>
      <MindMapNodeDialog
        isOpen={dialogState.isOpen}
        onClose={() => setDialogState(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleDialogSubmit}
        mode={dialogState.mode}
        defaultValue={dialogState.defaultValue}
        isPending={isPending}
      />
      <AlertDialog open={deleteDialogState.isOpen} onOpenChange={(isOpen) => setDeleteDialogState(prev => ({...prev, isOpen}))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the node and all of its children.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNode} disabled={isPending}>
              {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-screen bg-muted/40">
        <header className="flex flex-wrap items-center justify-between p-4 border-b bg-background gap-4">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                  <Link href={`/idea/${idea.id}`}>
                      <ArrowLeft className="h-4 w-4" />
                  </Link>
              </Button>
              <div>
                  <p className="text-sm text-muted-foreground">Mind Map for</p>
                  <h1 className="text-lg font-semibold">{idea.title}</h1>
              </div>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
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
            onAddNode={handleOpenDialog}
            onEditNode={handleOpenDialog}
            onDeleteNode={handleOpenDeleteDialog}
            isProcessing={isPending}
          />
        </main>
      </div>
    </>
  );
}
