'use client';

import { useEffect, useState, useTransition, use, useRef } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { 
  getIdeaById, 
  addManualMindMapNode, 
  editMindMapNode, 
  deleteMindMapNode,
  updateMindMap,
  addNodesToMindMap
} from '@/lib/firebase-client';
import { 
  expandMindMapNode, 
  regenerateMindMap,
  type GeneratedIdea 
} from '@/app/actions'; 
import { MindMapDisplay } from '@/components/mindmap-display';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, BrainCircuit, Download, LoaderCircle, AlertCircle, Maximize2, Minimize2, FileText, Image as ImageIcon, Search, Info, Undo2, Redo2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { MindMapNodeDialog } from '@/components/mindmap-node-dialog';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const mindMapToMarkdown = (node: MindMapNode, level = 0): string => {
  let markdown = `${'  '.repeat(level)}* ${node.title}\n`;
  if (node.children) {
    for (const child of node.children) {
      markdown += mindMapToMarkdown(child, level + 1);
    }
  }
  return markdown;
};

const countNodes = (node: MindMapNode): number => {
  let count = 1;
  if (node.children) {
    node.children.forEach(child => count += countNodes(child));
  }
  return count;
};

const getMaxDepth = (node: MindMapNode, currentDepth = 1): number => {
  if (!node.children || node.children.length === 0) return currentDepth;
  return Math.max(...node.children.map(child => getMaxDepth(child, currentDepth + 1)));
};

export default function MindMapPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [expandAll, setExpandAll] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [history, setHistory] = useState<MindMapNode[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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

  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);

  // 히스토리에 저장
  const saveToHistory = (newMindMap: MindMapNode) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newMindMap]);
    setHistoryIndex(newHistory.length);
  };

  // 실행 취소
  const handleUndo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setIdea(prev => prev ? { ...prev, mindMap: previousState } : null);
      setHistoryIndex(historyIndex - 1);
      toast({ title: '실행 취소', description: '이전 상태로 되돌렸습니다.' });
    }
  };

  // 다시 실행
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setIdea(prev => prev ? { ...prev, mindMap: nextState } : null);
      setHistoryIndex(historyIndex + 1);
      toast({ title: '다시 실행', description: '다음 상태로 이동했습니다.' });
    }
  };

  // 진행률 시뮬레이션
  useEffect(() => {
    if (!idea?.mindMap && !loading && !error) {
      const interval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 5;
        });
      }, 500);
      return () => clearInterval(interval);
    } else if (idea?.mindMap) {
      setGenerationProgress(100);
    }
  }, [idea?.mindMap, loading, error]);

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 's') {
          e.preventDefault();
          handleExportPdf();
        } else if (e.key === 'r') {
          e.preventDefault();
          setRegenerateConfirmOpen(true);
        } else if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndo();
        } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
          e.preventDefault();
          handleRedo();
        } else if (e.key === 'f') {
          e.preventDefault();
          document.getElementById('search-input')?.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [idea, historyIndex, history]);

  // 초기 히스토리 설정
  useEffect(() => {
    if (idea?.mindMap && history.length === 0) {
      setHistory([idea.mindMap]);
      setHistoryIndex(0);
    }
  }, [idea?.mindMap]);

  const fetchIdea = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await getIdeaById(params.id);
      
      if (fetchError || !data) {
        setError(fetchError || '아이디어를 찾을 수 없습니다.');
        notFound();
        return;
      }
      
      setIdea(data);
      
      if (!data.mindMap) {
        startTransition(async () => {
          try {
            const { success, newMindMap, error: regenerateError } = await regenerateMindMap(
              data.summary, 
              data.language || 'English'
            );
            
            if (success && newMindMap) {
              await updateMindMap(data.id!, newMindMap);
              
              setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
              saveToHistory(newMindMap);
              setLastSaved(new Date());
              toast({
                title: "성공",
                description: "마인드맵이 생성되었습니다.",
              });
            } else {
              throw new Error(regenerateError || "Failed to generate mind map");
            }
          } catch (error: any) {
            console.error("Mind map generation error:", error);
            setError(error.message || "마인드맵 생성에 실패했습니다.");
            toast({
              variant: "destructive",
              title: "오류",
              description: "마인드맵 생성에 실패했습니다. 다시 시도해주세요.",
            });
          }
        });
      }

    } catch (error: any) {
      console.error("Fetch idea error:", error);
      setError(error.message || "아이디어를 불러오는데 실패했습니다.");
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
          idea.summary,
          parentNodeTitle,
          existingChildrenTitles,
          idea.language || 'English'
        );
        
        if (success && newNodes) {
          const { success: saveSuccess, error: saveError } = await addNodesToMindMap(
            idea.id!,
            parentNodeTitle,
            newNodes
          );
  
          if (!saveSuccess) {
            throw new Error(saveError || 'Failed to save nodes');
          }
  
          toast({ 
            title: '성공', 
            description: `${newNodes.length}개의 새 노드가 추가되었습니다.` 
          });
          
          await fetchIdea(false);
          setLastSaved(new Date());
        } else {
          throw new Error(error || 'Failed to generate nodes');
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
          setLastSaved(new Date());
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
          setLastSaved(new Date());
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

  const handleRegenerateConfirm = async () => {
    if (!idea) return;
    
    setRegenerateConfirmOpen(false);
    
    startTransition(async () => {
      try {
        const { success, newMindMap, error } = await regenerateMindMap(
          idea.summary, 
          idea.language || 'English'
        );
        
        if (success && newMindMap) {
          setIdea(prev => prev ? { ...prev, mindMap: newMindMap } : null);
          await updateMindMap(idea.id!, newMindMap);
          saveToHistory(newMindMap);
          setLastSaved(new Date());
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
    if (!idea || !idea.mindMap) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '마인드맵이 없습니다.',
      });
      return;
    }
  
    setIsExporting(true);
    
    const exportToast = toast({ 
      title: 'PDF 생성 중...', 
      description: '잠시만 기다려주세요.',
      duration: Infinity,
    });
  
    let tempContainer: HTMLDivElement | null = null;
  
    try {
      // 동적 import - 하나씩 순차적으로
      const jsPDF = (await import('jspdf')).default;
      const showdown = (await import('showdown')).default;
      const html2canvas = (await import('html2canvas')).default;
  
      const markdown = mindMapToMarkdown(idea.mindMap);
      const converter = new showdown.Converter();
      const html = converter.makeHtml(markdown);
  
      // 임시 컨테이너 생성
      tempContainer = document.createElement('div');
      tempContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 700px;
        padding: 20px;
        box-sizing: border-box;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
      `;
      
      tempContainer.innerHTML = `
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans KR', sans-serif;
            line-height: 1.6; 
            background-color: white; 
            color: black; 
          }
          ul { 
            list-style-type: disc; 
            padding-left: 20px; 
            margin: 8px 0; 
          }
          li { 
            margin-bottom: 8px; 
            page-break-inside: avoid;
          }
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
            margin: 16px 0 12px 0; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 6px; 
          }
        </style>
        <h1>${idea.title}</h1>
        <h2>마인드맵</h2>
        ${html}
      `;
      
      document.body.appendChild(tempContainer);
  
      // DOM이 렌더링될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 100));
  
      // Canvas 생성
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.body.querySelector('div');
          if (clonedElement) {
            (clonedElement as HTMLElement).style.left = '0';
            (clonedElement as HTMLElement).style.position = 'relative';
          }
        }
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
      const fileName = `${idea.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_MindMap.pdf`;
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
        title: 'PDF 생성 실패', 
        description: error.message || 'PDF 생성에 실패했습니다. 다시 시도해주세요.' 
      });
    } finally {
      // 임시 컨테이너 정리
      if (tempContainer && document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      setIsExporting(false);
    }
  };
  
  const handleExportImage = async () => {
    if (!mindMapRef.current || !idea) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '마인드맵을 찾을 수 없습니다.',
      });
      return;
    }
  
    setIsExporting(true);
  
    const exportToast = toast({ 
      title: '이미지 생성 중...', 
      description: '잠시만 기다려주세요.',
      duration: Infinity,
    });
  
    try {
      const html2canvas = (await import('html2canvas')).default;
  
      // 약간의 딜레이 후 캡처
      await new Promise(resolve => setTimeout(resolve, 100));
  
      const canvas = await html2canvas(mindMapRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: mindMapRef.current.scrollWidth,
        windowHeight: mindMapRef.current.scrollHeight,
      });
  
      // Blob 생성 및 다운로드
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('이미지 생성에 실패했습니다.');
        }
  
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${idea.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_MindMap.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
  
        exportToast.dismiss();
        toast({ 
          title: '성공', 
          description: '마인드맵이 이미지로 저장되었습니다.' 
        });
      }, 'image/png', 1.0);
  
    } catch (error: any) {
      console.error("Image export error:", error);
      exportToast.dismiss();
      toast({ 
        variant: 'destructive', 
        title: '이미지 생성 실패', 
        description: error.message || '이미지 생성에 실패했습니다. 다시 시도해주세요.' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!idea || !idea.mindMap) return;

    const markdown = mindMapToMarkdown(idea.mindMap);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title.replace(/\s+/g, '_')}_MindMap.md`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ 
      title: '성공', 
      description: '마인드맵이 Markdown으로 저장되었습니다.' 
    });
  };

  // const handleExportImage = async () => {
  //   if (!mindMapRef.current) return;

  //   setIsExporting(true);

  //   try {
  //     const { default: html2canvas } = await import('html2canvas');

  //     const canvas = await html2canvas(mindMapRef.current, {
  //       scale: 2,
  //       backgroundColor: '#ffffff',
  //       useCORS: true,
  //     });

  //     canvas.toBlob((blob) => {
  //       if (blob) {
  //         const url = URL.createObjectURL(blob);
  //         const a = document.createElement('a');
  //         a.href = url;
  //         a.download = `${idea?.title.replace(/\s+/g, '_')}_MindMap.png`;
  //         a.click();
  //         URL.revokeObjectURL(url);

  //         toast({ 
  //           title: '성공', 
  //           description: '마인드맵이 이미지로 저장되었습니다.' 
  //         });
  //       }
  //     });
  //   } catch (error: any) {
  //     console.error("Image export error:", error);
  //     toast({ 
  //       variant: 'destructive', 
  //       title: '오류', 
  //       description: '이미지 생성에 실패했습니다.' 
  //     });
  //   } finally {
  //     setIsExporting(false);
  //   }
  // };

  if (error && !loading && !idea) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 p-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-semibold">오류가 발생했습니다</p>
        <p className="text-sm text-muted-foreground text-center max-w-md">{error}</p>
        <div className="flex gap-2">
          <Button onClick={() => fetchIdea()} variant="default">
            다시 시도
          </Button>
          <Button 
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }} 
            variant="outline"
          >
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

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

  const nodeCount = idea.mindMap ? countNodes(idea.mindMap) : 0;
  const maxDepth = idea.mindMap ? getMaxDepth(idea.mindMap) : 0;

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .mind-map-node { break-inside: avoid; }
          header { display: none !important; }
        }
      `}</style>

      <TooltipProvider>
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

        <AlertDialog 
          open={regenerateConfirmOpen} 
          onOpenChange={setRegenerateConfirmOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>마인드맵을 재생성하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                현재 마인드맵의 모든 내용이 삭제되고 새로운 마인드맵이 생성됩니다. 이 작업은 되돌릴 수 없습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleRegenerateConfirm} 
                disabled={isPending}
              >
                {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                재생성
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
          
          <header className="no-print flex flex-col gap-4 p-4 border-b bg-background">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        if (window.history.length > 1) {
                          router.back();
                        } else {
                          router.push(`/idea/${idea.id}`);
                        }
                      }}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>뒤로 가기</p>
                  </TooltipContent>
                </Tooltip>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">마인드맵</p>
                  <h1 className="text-lg font-semibold line-clamp-1">{idea.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {nodeCount} 노드
                  </Badge>
                  <Badge variant="outline">
                    깊이 {maxDepth}
                  </Badge>
                </div>
              </div>
              
              <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-2'>
                {/* 실행 취소/다시 실행 */}
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleUndo}
                        disabled={isPending || historyIndex <= 0}
                      >
                        <Undo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>실행 취소 (Ctrl+Z)</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleRedo}
                        disabled={isPending || historyIndex >= history.length - 1}
                      >
                        <Redo2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>다시 실행 (Ctrl+Y)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {idea.mindMap && (
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setExpandAll(true)}
                          disabled={isPending}
                        >
                          <Maximize2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">모두 펼치기</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>모든 노드 펼치기</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setExpandAll(false)}
                          disabled={isPending}
                        >
                          <Minimize2 className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">모두 접기</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>모든 노드 접기</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={isExporting || isPending}>
                      {isExporting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          내보내기
                        </>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleExportPdf}>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF로 저장
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportMarkdown}>
                      <FileText className="mr-2 h-4 w-4" />
                      Markdown으로 저장
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportImage}>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      이미지로 저장
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={() => setRegenerateConfirmOpen(true)} 
                      disabled={isPending || isExporting}
                    >
                      <BrainCircuit className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">재생성</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>마인드맵 재생성 (Ctrl+R)</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* 검색 바 & 정보 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="노드 검색... (Ctrl+F)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {lastSaved && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                        <Info className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(lastSaved, { addSuffix: true, locale: ko })} 저장됨
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{lastSaved.toLocaleString('ko-KR')}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-auto p-4 md:p-8">
            {idea.mindMap ? (
              <div ref={mindMapRef}>
                <MindMapDisplay
                  mindMap={idea.mindMap}
                  onExpandNode={handleExpandNode}
                  onAddNode={handleOpenDialog}
                  onEditNode={handleOpenDialog}
                  onDeleteNode={handleOpenDeleteDialog}
                  isProcessing={isPending}
                  expandAll={expandAll}
                  searchQuery={searchQuery}
                />
              </div>
            ) : (
              <div className="grid place-items-center h-[60vh]">
                <div className="text-center space-y-4 max-w-md">
                  <LoaderCircle className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <div>
                    <h3 className="font-semibold">마인드맵 생성 중</h3>
                    <p className="text-sm text-muted-foreground">
                      AI가 아이디어를 구조화하고 있습니다...
                    </p>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                  <p className="text-xs text-muted-foreground">
                    {generationProgress}% 완료
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </TooltipProvider>
    </>
  );
}