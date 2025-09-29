'use client';

import { useEffect, useState, useTransition, use, useRef } from 'react';
import { notFound } from 'next/navigation';
import { 
  getIdeaById, 
  addManualMindMapNode, 
  editMindMapNode, 
  deleteMindMapNode 
} from '@/lib/firebase-client'; // 클라이언트 함수
import { 
  expandMindMapNode, 
  regenerateMindMap,
  type GeneratedIdea 
} from '@/app/actions'; 
import { MindMapDisplay } from '@/components/mindmap-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BrainCircuit, Download, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import Link from 'next/link';
import { MindMapNodeDialog } from '@/components/mindmap-node-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

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
  }>({ isOpen: false, nodePath: '' });

  const fetchIdea = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const { data, error } = await getIdeaById(params.id);
      
      if (error || !data) {
        notFound();
      }
      
      setIdea(data);
      
      // 마인드맵이 없으면 자동 생성
      if (!data.mindMap) {
        startTransition(async () => {
          try {
            const { success, newMindMap, error: regenerateError } = await regenerateMindMap(
              data.id!, 
              data.summary, 
              data.language || 'English'
            );
            
            if (success && newMindMap) {
              setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
              toast({
                title: "성공",
                description: "마인드맵이 생성되었습니다.",
              });
            } else {
              throw new Error(regenerateError || "Failed to generate mind map");
            }
          } catch (error: any) {
            console.error("Mind map generation error:", error);
            toast({
              variant: "destructive",
              title: "오류",
              description: "마인드맵 생성에 실패했습니다. 다시 시도해주세요.",
            });
          }
        });
      }
    } catch (error) {
      console.error("Fetch idea error:", error);
      toast({
        variant: "destructive",
        title: "오류",
        description: "아이디어를 불러오는데 실패했습니다.",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchIdea();
    }
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
      try {
        const { success, newNodes, error } = await expandMindMapNode(
          idea.id!,
          idea.summary,
          parentNodeTitle,
          existingChildrenTitles,
          idea.language || 'English'
        );
        
        if (success) {
          toast({ 
            title: '성공', 
            description: `${newNodes?.length || 0}개의 새 노드가 추가되었습니다.` 
          });
          await fetchIdea(false);
        } else {
          throw new Error(error);
        }
      } catch (error: any) {
        console.error("Expand node error:", error);
        toast({ 
          variant: 'destructive', 
          title: '오류', 
          description: error.message || '노드 확장에 실패했습니다.' 
        });
      }
    });
  };

  const handleDialogSubmit = async (title: string) => {
    if (!idea) return;
    const { mode, nodePath } = dialogState;

    startTransition(async () => {
      try {
        let result: { success: boolean, error?: string };
        
        if (mode === 'add') {
          const parentNodeTitle = nodePath.split('>').pop()!;
          result = await addManualMindMapNode(idea.id!, parentNodeTitle, title);
        } else {
          result = await editMindMapNode(idea.id!, nodePath, title);
        }

        if (result.success) {
          toast({ 
            title: '성공', 
            description: `노드가 ${mode === 'add' ? '추가' : '수정'}되었습니다.` 
          });
          await fetchIdea(false);
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error("Dialog submit error:", error);
        toast({ 
          variant: 'destructive', 
          title: '오류', 
          description: error.message || '작업에 실패했습니다.' 
        });
      }
    });
  };

  const handleDeleteNode = async () => {
    if (!idea) return;
    const { nodePath } = deleteDialogState;
    
    startTransition(async () => {
      try {
        const result = await deleteMindMapNode(idea.id!, nodePath);
        
        if (result.success) {
          toast({ title: '성공', description: '노드가 삭제되었습니다.' });
          setDeleteDialogState({ isOpen: false, nodePath: '' });
          await fetchIdea(false);
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        console.error("Delete node error:", error);
        toast({ 
          variant: 'destructive', 
          title: '오류', 
          description: error.message || '노드 삭제에 실패했습니다.' 
        });
      }
    });
  };

  const handleRegenerate = async () => {
    if (!idea) return;
    
    startTransition(async () => {
      try {
        const { success, newMindMap, error } = await regenerateMindMap(
          idea.id!, 
          idea.summary, 
          idea.language || 'English'
        );
        
        if (success && newMindMap) {
          setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
          toast({
            title: "성공",
            description: "마인드맵이 재생성되었습니다.",
          });
        } else {
          throw new Error(error || '마인드맵 재생성에 실패했습니다.');
        }
      } catch (error: any) {
        console.error("Regenerate error:", error);
        toast({
          variant: "destructive",
          title: "오류",
          description: error.message || "마인드맵 재생성에 실패했습니다.",
        });
      }
    });
  };

  const handleExportPdf = async () => {
    if (!idea) return;

    setIsExporting(true);
    
    const exportToast = toast({ 
      title: 'PDF 생성 중...', 
      description: '잠시만 기다려주세요.',
      duration: Infinity,
    });

    let tempContainer: HTMLDivElement | null = null;

    try {
      // 동적 import
      const [
        { default: jsPDF },
        { default: showdown },
        { default: html2canvas }
      ] = await Promise.all([
        import('jspdf'),
        import('showdown'),
        import('html2canvas')
      ]);

      // 마크다운 생성
      const markdown = idea.mindMap
        ? mindMapToMarkdown(idea.mindMap)
        : '# 마인드맵이 없습니다';
      
      const converter = new showdown.Converter();
      const html = converter.makeHtml(markdown);

      // 임시 컨테이너 생성
      tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '700px';
      tempContainer.style.padding = '20px';
      tempContainer.style.boxSizing = 'border-box';
      tempContainer.style.fontFamily = `'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
      tempContainer.innerHTML = `
        <style>
          body { 
            font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Helvetica', 'Arial', sans-serif; 
            line-height: 1.6; 
            background-color: white; 
            color: black; 
          }
          ul { list-style-type: disc; padding-left: 20px; margin: 0; }
          li { margin-bottom: 8px; }
          h1 { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 16px; 
            border-bottom: 2px solid #eee; 
            padding-bottom: 8px; 
          }
          h2 { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 12px; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 6px; 
          }
        </style>
        <h1>${idea.title}</h1>
        <h2>마인드맵</h2>
        ${html}
      `;
      
      document.body.appendChild(tempContainer);

      // Canvas 생성
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      // PDF 생성
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

      // 첫 페이지
      pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
      heightLeft -= (pdfHeight - (margin * 2));

      // 추가 페이지
      while (heightLeft > 0) {
        position = heightLeft - contentHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position + margin, contentWidth, contentHeight);
        heightLeft -= (pdfHeight - (margin * 2));
      }

      // 파일 저장
      const fileName = `${idea.title.replace(/\s+/g, '_')}_MindMap.pdf`;
      pdf.save(fileName);
      
      exportToast.dismiss();
      toast({ 
        title: '성공', 
        description: '마인드맵이 PDF로 저장되었습니다.' 
      });

    } catch (error: any) {
      console.error("PDF export error:", error);
      exportToast.dismiss();
      toast({ 
        variant: 'destructive', 
        title: '오류', 
        description: 'PDF 생성에 실패했습니다. 다시 시도해주세요.' 
      });
    } finally {
      // 임시 컨테이너 정리
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
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
      
      <AlertDialog 
        open={deleteDialogState.isOpen} 
        onOpenChange={(isOpen) => setDeleteDialogState(prev => ({...prev, isOpen}))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 노드와 모든 하위 노드가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteNode} 
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col h-screen bg-muted/40">
        {isPending && (
          <div className="absolute inset-0 z-20 bg-background/50 backdrop-blur-[1px] flex items-center justify-center">
            <div className="flex items-center gap-3 rounded-md border bg-background px-4 py-2 shadow-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">처리 중...</span>
            </div>
          </div>
        )}
        
        <header className="flex flex-wrap items-center justify-between p-4 border-b bg-background gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href={`/idea/${idea.id}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <p className="text-sm text-muted-foreground">마인드맵</p>
              <h1 className="text-lg font-semibold">{idea.title}</h1>
            </div>
          </div>
          
          <div className='flex flex-wrap items-center gap-2'>
            <Button onClick={handleExportPdf} disabled={isExporting || isPending}>
              {isExporting ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  PDF 저장
                </>
              )}
            </Button>
            
            <Button onClick={handleRegenerate} disabled={isPending || isExporting}>
              {isPending ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  재생성 중...
                </>
              ) : (
                <>
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  마인드맵 재생성
                </>
              )}
            </Button>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {idea.mindMap ? (
            <MindMapDisplay
              ref={mindMapRef}
              mindMap={idea.mindMap}
              onExpandNode={handleExpandNode}
              onAddNode={handleOpenDialog}
              onEditNode={handleOpenDialog}
              onDeleteNode={handleOpenDeleteDialog}
              isProcessing={isPending}
            />
          ) : (
            <div className="grid place-items-center h-[60vh]">
              <div className="text-center space-y-4">
                <LoaderCircle className="h-12 w-12 animate-spin mx-auto text-primary" />
                <div>
                  <h3 className="font-semibold">마인드맵 생성 중</h3>
                  <p className="text-sm text-muted-foreground">
                    AI가 아이디어를 구조화하고 있습니다...
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}