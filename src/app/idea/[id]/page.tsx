'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  getIdeaById, 
  GeneratedIdea, 
  toggleFavorite, 
  updateIdeaContent,
  generateAISuggestions,
  saveAISuggestions,
  getUserData
} from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OutlineDisplay } from '@/components/outline-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Share2, 
  LocateFixed, 
  ArrowLeft, 
  Star, 
  Edit3, 
  Save, 
  X, 
  Download, 
  FileText,
  Wand2,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Sparkles,
  Lock,
  Crown,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';


export default function IdeaDetailPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<GeneratedIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isEditing, setIsEditing] = useState({ title: false, summary: false });
  const [editValues, setEditValues] = useState({ title: '', summary: '' });
  const [showMindMapPreview, setShowMindMapPreview] = useState(false);
  
  // AI 제안 관련 상태
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'paid'>('free');
  
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
        setIsFavorited(data.favorited || false);
        setEditValues({ 
          title: data.title || '', 
          summary: data.summary || '' 
        });
        
        // 사용자 role 가져오기
        if (data.userId) {
          const { data: userData } = await getUserData(data.userId);
          if (userData) {
            setUserRole(userData.role || 'free');
            
            // 저장된 AI 분석이 있고 유료 사용자면 불러오기
            if (userData.role === 'paid' && data.aiSuggestions) {
              setAiAnalysis(data.aiSuggestions);
            }
          }
        }
      }
      setLoading(false);
    }
    fetchIdea();
  }, [params]);

  // AI 분석 자동 시작 (유료 사용자만, 저장된 분석 없을 때)
  useEffect(() => {
    if (idea && !aiAnalysis && !isAnalyzing && userRole === 'paid') {
      handleGenerateAISuggestions();
    }
  }, [idea, userRole]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Success', description: t('linkCopied') });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: t('linkCopyError') });
    }
  };

  const handleToggleFavorite = async () => {
    if (!idea?.id) return;
    
    try {
      await toggleFavorite(idea.id, !isFavorited);
      setIsFavorited(!isFavorited);
      toast({
        title: isFavorited ? t('removedFromFavorites') : t('addedToFavorites'),
        description: isFavorited ? t('ideaRemovedFromFavorites') : t('ideaAddedToFavorites')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToUpdateFavorite')
      });
    }
  };

  const handleEdit = (field: 'title' | 'summary') => {
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = async (field: 'title' | 'summary') => {
    if (!idea?.id) return;

    try {
      await updateIdeaContent(idea.id, {
        [field]: editValues[field]
      });
      
      setIdea(prev => prev ? { ...prev, [field]: editValues[field] } : null);
      setIsEditing(prev => ({ ...prev, [field]: false }));
      
      toast({
        title: t('saved'),
        description: t('ideaUpdated')
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('error'),
        description: t('failedToSaveChanges')
      });
    }
  };

  const handleCancel = (field: 'title' | 'summary') => {
    setEditValues(prev => ({ 
      ...prev, 
      [field]: idea?.[field] || '' 
    }));
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleExport = (format: 'txt' | 'md') => {
    if (!idea) return;

    let content = '';
    if (format === 'md') {
      content = `# ${idea.title}\n\n## Summary\n${idea.summary}\n\n## Outline\n${idea.outline}`;
    } else {
      content = `${idea.title}\n\n${idea.summary}\n\n${idea.outline}`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${idea.title}.${format}`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: t('exported'),
      description: t('ideaExported')
    });
  };

  // AI 분석 생성
  const handleGenerateAISuggestions = async () => {
    if (!idea) return;
    
    if (userRole !== 'paid') {
      toast({
        title: '유료 기능',
        description: '전문 AI 분석은 Pro 플랜에서 이용 가능합니다.',
        variant: 'destructive'
      });
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const result = await generateAISuggestions({
        ideaId: idea.id!,
        title: idea.title,
        summary: idea.summary,
        outline: idea.outline,
        language: (idea.language || language === 'Korean' ? 'Korean' : 'English') as 'English' | 'Korean'
      });
      
      setAiAnalysis(result);
      
      // DB에 저장
      await saveAISuggestions(idea.id!, result);
      
      toast({
        title: 'AI 분석 완료',
        description: 'AI가 아이디어를 성공적으로 분석했습니다.'
      });
    } catch (error: any) {
      console.error('AI 분석 생성 실패:', error);
      toast({
        variant: 'destructive',
        title: t('error'),
        description: error.message || 'AI 분석을 생성하는 중 오류가 발생했습니다.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 마인드맵 미리보기 컴포넌트
  const MindMapPreview = ({ mindMap }: { mindMap: any }) => {
    if (!mindMap) return <p className="text-muted-foreground">No mind map available</p>;

    const renderNode = (node: any, level = 0) => (
      <div key={node.title} className={cn("ml-4", level === 0 && "ml-0")}>
        <div className={cn(
          "flex items-center gap-2 p-2 rounded border-l-2",
          level === 0 && "border-l-blue-500 bg-blue-50",
          level === 1 && "border-l-green-500 bg-green-50",
          level >= 2 && "border-l-gray-400 bg-gray-50"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full",
            level === 0 && "bg-blue-500",
            level === 1 && "bg-green-500", 
            level >= 2 && "bg-gray-400"
          )} />
          <span className={cn(
            "text-sm",
            level === 0 && "font-semibold text-blue-900",
            level === 1 && "font-medium text-green-800",
            level >= 2 && "text-gray-700"
          )}>
            {node.title}
          </span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="mt-1 space-y-1">
            {node.children.map((child: any) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );

    return (
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {renderNode(mindMap)}
      </div>
    );
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
      <div className="flex items-start justify-between gap-4">
        <div className='flex items-center gap-4 flex-1 min-w-0'>
          <Button variant="outline" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            {isEditing.title ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValues.title}
                  onChange={(e) => setEditValues(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold"
                  autoFocus
                />
                <Button size="sm" onClick={() => handleSave('title')}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancel('title')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-3xl font-bold text-primary truncate">{idea.title}</h1>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleEdit('title')}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <p className="text-muted-foreground">
              {t('createdOn')} {idea.createdAt ? new Date(idea.createdAt).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-shrink-0 gap-2">
          <Button 
            variant="outline" 
            onClick={handleToggleFavorite}
            className={cn(isFavorited && "text-yellow-600")}
          >
            <Star className={cn("mr-2 h-4 w-4", isFavorited && "fill-current")} />
            {isFavorited ? t('favorited') : t('favorite')}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                {t('export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as TXT
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('md')}>
                <FileText className="mr-2 h-4 w-4" />
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            {t('share')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('summary')}</CardTitle>
            {!isEditing.summary && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('summary')}>
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing.summary ? (
            <div className="space-y-3">
              <Textarea
                value={editValues.summary}
                onChange={(e) => setEditValues(prev => ({ ...prev, summary: e.target.value }))}
                className="min-h-24"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleSave('summary')}>
                  <Save className="mr-2 h-4 w-4" />
                  {t('save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleCancel('summary')}>
                  <X className="mr-2 h-4 w-4" />
                  {t('cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">{idea.summary}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('mindMap')}</CardTitle>
          <div className="flex gap-2">
            {idea.mindMap && (
              <Button 
                variant="ghost" 
                onClick={() => setShowMindMapPreview(true)}
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={`/idea/${idea.id}/mindmap`}>
                <LocateFixed className="mr-2 h-4 w-4" />
                View Full Mind Map
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {idea.mindMap ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                A mind map visualization is available for this idea. Preview it below or view the full interactive version.
              </p>
              <div className="border rounded-lg p-4 bg-gray-50 max-h-48 overflow-hidden">
                <MindMapPreview mindMap={idea.mindMap} />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              No mind map available for this idea yet.
            </p>
          )}
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

      {/* AI 개선 제안 섹션 - 여기만 추가! */}
      {userRole === 'free' ? (
        // Free 사용자용 미리보기
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white z-10 pointer-events-none" />
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI 전문 분석 (미리보기)
              </CardTitle>
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <Crown className="h-3 w-3 mr-1" />
                PRO
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 opacity-60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">시장 잠재력</p>
                  <p className="text-2xl font-bold text-blue-600">?/10</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">실현 가능성</p>
                  <p className="text-2xl font-bold text-green-600">?/10</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 opacity-40 blur-sm">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-full"></div>
                </div>
              ))}
            </div>

            <div className="relative z-20 text-center space-y-4 pt-4">
              <div className="bg-white border-2 border-purple-200 rounded-lg p-6 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold">Pro 플랜 혜택</h3>
                </div>
                
                <ul className="space-y-2 text-sm text-left max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>전문가 수준의 SWOT 분석</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>5개의 구체적인 개선 제안</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>단계별 실행 방안</span>
                  </li>
                </ul>

                <Button 
                  onClick={() => router.push('/upgrade')}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  size="lg"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Pro로 업그레이드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isAnalyzing ? (
        // 분석 중
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              AI 개선 제안
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Sparkles className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">AI가 아이디어를 분석하고 있습니다</h3>
              <p className="text-muted-foreground">잠시만 기다려주세요...</p>
            </div>
          </CardContent>
        </Card>
      ) : aiAnalysis ? (
        // 전체 분석 결과 (Paid 사용자)
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI 분석 결과
                </CardTitle>
                <Button onClick={handleGenerateAISuggestions} variant="outline" size="sm" disabled={isAnalyzing}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  다시 분석
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">시장 잠재력</p>
                    <p className="text-2xl font-bold text-blue-600">{aiAnalysis.marketPotential}/10</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">실현 가능성</p>
                    <p className="text-2xl font-bold text-green-600">{aiAnalysis.feasibilityScore}/10</p>
                  </div>
                </div>
              </div>

              {/* SWOT 간단 표시 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-green-200 rounded p-3 bg-green-50">
                  <h4 className="font-semibold text-green-900 text-sm mb-2">강점</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.strengths?.slice(0, 2).map((s: string, i: number) => (
                      <li key={i} className="text-xs text-green-800">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="border border-red-200 rounded p-3 bg-red-50">
                  <h4 className="font-semibold text-red-900 text-sm mb-2">약점</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.weaknesses?.slice(0, 2).map((w: string, i: number) => (
                      <li key={i} className="text-xs text-red-800">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 제안 목록 */}
          {aiAnalysis.suggestions?.map((suggestion: any, index: number) => (
            <Card key={suggestion.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">제안 #{index + 1}</div>
                    <h3 className="font-semibold">{suggestion.title}</h3>
                  </div>
                  <Badge variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}>
                    {suggestion.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{suggestion.description}</p>
                <div className="bg-blue-50 p-3 rounded text-sm">
                  <strong>AI 분석:</strong> {suggestion.reasoning}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">실행 방안:</h4>
                  <ul className="space-y-1">
                    {suggestion.actionItems?.map((item: string, i: number) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-blue-600">{i + 1}.</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

// 기존 idea/[id]/page.tsx의 AI 개선 제안 섹션 바로 다음에 추가

{/* 사업계획서 섹션 - AI 개선 제안 다음에 추가 */}
{userRole === 'paid' && (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <FileText className="h-5 w-5" />
        사업계획서
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground">
        전문가 수준의 사업계획서를 AI가 자동으로 작성해드립니다. 
        투자 유치와 사업 실행을 위한 완벽한 문서를 만들어보세요.
      </p>

      {idea.businessPlan ? (
        // 이미 생성된 사업계획서가 있을 때
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-900">사업계획서 생성 완료</h4>
                <p className="text-sm text-green-800">
                  {idea.businessPlanGeneratedAt && 
                    `생성일: ${new Date(idea.businessPlanGeneratedAt).toLocaleDateString()}`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-muted-foreground">타겟 시장</p>
              <p className="font-semibold">{idea.businessPlan.metadata.targetMarket}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-muted-foreground">필요 자금</p>
              <p className="font-semibold">{idea.businessPlan.metadata.fundingNeeded}</p>
            </div>
          </div>

          <Button asChild className="w-full">
            <Link href={`/idea/${idea.id}/business-plan`}>
              <FileText className="mr-2 h-4 w-4" />
              사업계획서 보기
            </Link>
          </Button>
        </div>
      ) : (
        // 아직 생성되지 않았을 때
        <div className="space-y-4">
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>10개 핵심 섹션 (경영진 요약, 시장 분석, 재무 계획 등)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>3년 재무 전망 및 투자 계획</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <span>18개월 실행 로드맵</span>
            </div>
          </div>

          <Button asChild className="w-full" variant="default">
            <Link href={`/idea/${idea.id}/business-plan`}>
              <Sparkles className="mr-2 h-4 w-4" />
              사업계획서 생성하기
            </Link>
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
)}

{/* Free 사용자용 사업계획서 미리보기 */}
{userRole === 'free' && (
  <Card className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white z-10 pointer-events-none" />
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          사업계획서
        </CardTitle>
        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <Crown className="h-3 w-3 mr-1" />
          PRO
        </Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground opacity-60">
        전문가 수준의 사업계획서를 AI가 작성해드립니다.
      </p>

      <div className="space-y-2 opacity-40 blur-sm">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      <div className="relative z-20 text-center pt-4">
        <Button 
          onClick={() => router.push('/pricing')}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <Crown className="mr-2 h-4 w-4" />
          Pro로 업그레이드
        </Button>
      </div>
    </CardContent>
  </Card>
)}



      {/* 마인드맵 미리보기 다이얼로그 */}
      <Dialog open={showMindMapPreview} onOpenChange={setShowMindMapPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Mind Map Preview</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96">
            <MindMapPreview mindMap={idea.mindMap} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}