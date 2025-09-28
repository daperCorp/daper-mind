'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MessageSquare,
  Users
} from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// AI 제안 관련 인터페이스
interface AISuggestion {
  id: string;
  type: 'enhancement' | 'market' | 'risk' | 'implementation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  reasoning: string;
  actionItems: string[];
  impact: number;
}

interface AIAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketPotential: number;
  feasibilityScore: number;
  suggestions: AISuggestion[];
}

// 모킹된 아이디어 데이터
const mockIdea = {
  id: '1',
  title: '원격 근무자를 위한 AI 생산성 도우미',
  summary: 'AI를 활용하여 원격 근무자의 일정 관리, 업무 우선순위 설정, 집중 시간 관리를 도와주는 서비스입니다. 사용자의 업무 패턴을 학습하여 최적의 일정을 제안하고, 방해 요소를 최소화하여 생산성을 극대화합니다.',
  outline: `1. 핵심 기능
   • 스마트 일정 관리
   • AI 기반 우선순위 설정
   • 집중 시간 최적화
   • 실시간 생산성 분석

2. 주요 특징
   • 개인화된 업무 패턴 학습
   • 다양한 캘린더 서비스 연동
   • 팀 협업 도구 통합
   • 생산성 리포트 제공

3. 기술 스택
   • AI/ML: TensorFlow, PyTorch
   • Backend: Node.js, PostgreSQL
   • Frontend: React, TypeScript
   • 연동: Google Calendar, Slack, Notion`,
  createdAt: '2024-01-15',
  favorited: false,
  mindMap: {
    title: 'AI 생산성 도우미',
    children: [
      {
        title: '스마트 일정 관리',
        children: [
          { title: '자동 일정 생성' },
          { title: '충돌 방지' },
          { title: '시간 추천' }
        ]
      },
      {
        title: '집중 시간 관리',
        children: [
          { title: '방해 차단' },
          { title: '포모도로 연동' },
          { title: '환경 최적화' }
        ]
      }
    ]
  }
};

// 모킹된 AI 분석 데이터
const mockAnalysis: AIAnalysis = {
  strengths: [
    "명확한 문제 정의와 타겟 사용자층 (원격 근무자)",
    "AI 기술을 활용한 차별화된 접근 방식",
    "확장 가능한 SaaS 비즈니스 모델",
    "다양한 서비스와의 연동 가능성"
  ],
  weaknesses: [
    "높은 초기 AI 모델 개발 비용",
    "사용자 데이터 수집 및 학습 시간 필요",
    "개인정보 보호 및 보안 이슈",
    "기존 생산성 도구들과의 차별화 필요"
  ],
  opportunities: [
    "원격 근무 확산으로 시장 수요 급증",
    "AI 기술 발전으로 구현 비용 감소",
    "기업용 B2B 시장 확장 가능",
    "글로벌 시장 진출 기회"
  ],
  threats: [
    "구글, 마이크로소프트 등 대기업의 유사 서비스",
    "개인정보 보호 규제 강화",
    "경기 침체로 인한 기업 IT 투자 감소",
    "오픈소스 대안의 등장"
  ],
  marketPotential: 8.2,
  feasibilityScore: 7.5,
  suggestions: [
    {
      id: '1',
      type: 'enhancement',
      title: '사용자 온보딩 프로세스 강화',
      description: '신규 사용자가 쉽게 시작할 수 있도록 단계별 가이드와 AI 학습을 위한 초기 데이터 수집 프로세스 개선',
      priority: 'high',
      category: 'UX/UI 개선',
      reasoning: '복잡한 AI 기능으로 인한 진입 장벽을 낮추고, 빠른 가치 체험을 통해 사용자 정착률을 높일 수 있습니다.',
      actionItems: [
        '인터랙티브 튜토리얼 설계 (7일 온보딩 프로그램)',
        'AI 학습을 위한 초기 설정 마법사 구현',
        '즉시 체험 가능한 데모 기능 제공',
        '개인화 설정 단계별 가이드 구축'
      ],
      impact: 9
    },
    {
      id: '2',
      type: 'market',
      title: 'B2B 엔터프라이즈 시장 진입',
      description: '개인 사용자뿐만 아니라 기업 고객을 위한 팀 관리 기능과 관리자 대시보드가 포함된 엔터프라이즈 버전 개발',
      priority: 'medium',
      category: '비즈니스 확장',
      reasoning: 'B2B 시장은 더 높은 ARPU와 안정적인 수익원을 제공하며, 기업의 생산성 향상 니즈가 급증하고 있습니다.',
      actionItems: [
        '팀 생산성 분석 대시보드 개발',
        '관리자용 인사이트 리포팅 기능',
        '기업용 보안 및 컴플라이언스 기능',
        'SSO 및 LDAP 연동 지원',
        '대량 사용자 관리 시스템'
      ],
      impact: 8
    },
    {
      id: '3',
      type: 'risk',
      title: '데이터 프라이버시 및 보안 강화',
      description: '사용자 데이터 보호를 위한 엔드투엔드 암호화, 로컬 처리 옵션, GDPR 컴플라이언스 구현',
      priority: 'high',
      category: '보안 & 컴플라이언스',
      reasoning: '개인 업무 데이터를 다루는 서비스의 특성상 보안은 필수이며, 규제 대응은 글로벌 확장의 전제 조건입니다.',
      actionItems: [
        '클라이언트 사이드 데이터 암호화 구현',
        'GDPR, CCPA 컴플라이언스 인증',
        '정기 보안 감사 및 펜테스트 실시',
        '데이터 최소화 및 익명화 정책 수립',
        '투명한 데이터 사용 정책 공개'
      ],
      impact: 7
    },
    {
      id: '4',
      type: 'implementation',
      title: 'MVP 단계별 개발 전략',
      description: '핵심 기능에 집중한 MVP 출시 후 사용자 피드백을 바탕으로 점진적 기능 확장',
      priority: 'high',
      category: '개발 전략',
      reasoning: '시장 검증을 빠르게 받고 사용자 피드백을 통해 제품을 개선하는 것이 성공 확률을 높입니다.',
      actionItems: [
        'Phase 1: 기본 일정 관리 + 간단한 AI 추천',
        'Phase 2: 생산성 분석 및 리포팅',
        'Phase 3: 고급 AI 기능 및 팀 협업',
        'Phase 4: 엔터프라이즈 기능 및 API',
        '각 단계별 사용자 피드백 수집 시스템'
      ],
      impact: 8
    },
    {
      id: '5',
      type: 'market',
      title: '파트너십 및 연동 전략',
      description: '주요 생산성 도구들과의 깊은 연동을 통한 생태계 구축 및 유통 채널 확보',
      priority: 'medium',
      category: '파트너십',
      reasoning: '기존 도구들과의 연동은 사용자 전환 비용을 낮추고, 파트너사를 통한 마케팅 효과를 얻을 수 있습니다.',
      actionItems: [
        'Slack, Microsoft Teams 깊은 연동',
        'Notion, Obsidian 등 노트 앱 연동',
        'Zoom, Google Meet 캘린더 연동',
        '파트너사 앱스토어 등록',
        'API 에코시스템 구축'
      ],
      impact: 6
    }
  ]
};

export default function IdeaDetailPageWithAI() {
  const [idea, setIdea] = useState(mockIdea);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isEditing, setIsEditing] = useState({ title: false, summary: false });
  const [editValues, setEditValues] = useState({ title: '', summary: '' });
  const [showMindMapPreview, setShowMindMapPreview] = useState(false);
  
  // AI 제안 관련 상태
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<{ [key: string]: 'positive' | 'negative' | null }>({});
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    setIsFavorited(idea.favorited || false);
    setEditValues({ 
      title: idea.title || '', 
      summary: idea.summary || '' 
    });
  }, [idea]);

  // AI 분석 생성
  const generateAISuggestions = async () => {
    setIsAnalyzing(true);
    // 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 3000));
    setAiAnalysis(mockAnalysis);
    setIsAnalyzing(false);
    setActiveTab('ai-suggestions'); // 분석 완료 후 AI 탭으로 이동
  };

  // 기존 함수들 (간소화)
  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('링크가 복사되었습니다!');
  };

  const handleToggleFavorite = async () => {
    setIsFavorited(!isFavorited);
  };

  const handleEdit = (field: 'title' | 'summary') => {
    setIsEditing(prev => ({ ...prev, [field]: true }));
  };

  const handleSave = async (field: 'title' | 'summary') => {
    setIdea(prev => ({ ...prev, [field]: editValues[field] }));
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleCancel = (field: 'title' | 'summary') => {
    setEditValues(prev => ({ ...prev, [field]: idea[field] || '' }));
    setIsEditing(prev => ({ ...prev, [field]: false }));
  };

  const handleExport = (format: 'txt' | 'md') => {
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
  };

  const handleAIFeedback = (suggestionId: string, type: 'positive' | 'negative') => {
    setFeedback(prev => ({
      ...prev,
      [suggestionId]: prev[suggestionId] === type ? null : type
    }));
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'enhancement': return <Lightbulb className="h-4 w-4" />;
      case 'market': return <Target className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'implementation': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // 마인드맵 미리보기 컴포넌트
  const MindMapPreview = ({ mindMap }: { mindMap: any }) => {
    if (!mindMap) return <p className="text-muted-foreground">마인드맵이 없습니다.</p>;

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

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {/* 헤더 섹션 */}
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
              생성일: {new Date(idea.createdAt).toLocaleDateString()}
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
            {isFavorited ? '즐겨찾기됨' : '즐겨찾기'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                내보내기
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('txt')}>
                <FileText className="mr-2 h-4 w-4" />
                텍스트 파일
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('md')}>
                <FileText className="mr-2 h-4 w-4" />
                마크다운
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            공유
          </Button>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="overview" className="flex items-center gap-2 py-3">
                <FileText className="h-4 w-4" />
                개요
              </TabsTrigger>
              <TabsTrigger value="mindmap" className="flex items-center gap-2 py-3">
                <LocateFixed className="h-4 w-4" />
                마인드맵
              </TabsTrigger>
              <TabsTrigger value="ai-suggestions" className="flex items-center gap-2 py-3">
                <Wand2 className="h-4 w-4" />
                AI 제안
                {aiAnalysis && <Badge variant="secondary" className="ml-1 text-xs">NEW</Badge>}
              </TabsTrigger>
              <TabsTrigger value="collaborate" className="flex items-center gap-2 py-3">
                <Users className="h-4 w-4" />
                협업
              </TabsTrigger>
            </TabsList>
            
            {/* 개요 탭 */}
            <TabsContent value="overview" className="space-y-6 p-6">
              {/* 요약 섹션 */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>요약</CardTitle>
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
                          저장
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCancel('summary')}>
                          <X className="mr-2 h-4 w-4" />
                          취소
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">{idea.summary}</p>
                  )}
                </CardContent>
              </Card>

              {/* 아웃라인 섹션 */}
              <Card>
                <CardHeader>
                  <CardTitle>상세 계획</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                    {idea.outline}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 마인드맵 탭 */}
            <TabsContent value="mindmap" className="space-y-6 p-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>마인드맵</CardTitle>
                  <Button asChild variant="outline">
                    <Link href={`/idea/${idea.id}/mindmap`}>
                      <LocateFixed className="mr-2 h-4 w-4" />
                      전체화면으로 보기
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  {idea.mindMap ? (
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        아이디어의 구조를 시각적으로 표현한 마인드맵입니다.
                      </p>
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <MindMapPreview mindMap={idea.mindMap} />
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      아직 마인드맵이 생성되지 않았습니다.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI 제안 탭 */}
            <TabsContent value="ai-suggestions" className="space-y-6 p-6">
              {!aiAnalysis ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wand2 className="h-5 w-5" />
                      AI 개선 제안
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      AI가 당신의 아이디어를 분석하여 개선 방안을 제안해드립니다.
                    </p>
                    
                    <div className="space-y-3">
                      <Textarea
                        placeholder="특별히 분석하고 싶은 부분이나 질문이 있다면 입력해주세요 (선택사항)"
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-20"
                      />
                      
                      <Button 
                        onClick={generateAISuggestions} 
                        disabled={isAnalyzing}
                        className="w-full"
                        size="lg"
                      >
                        {isAnalyzing ? (
                          <>
                            <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                            AI가 분석 중입니다...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            AI 분석 시작하기
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* AI 분석 개요 */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Wand2 className="h-5 w-5" />
                          AI 분석 결과
                        </CardTitle>
                        <Button onClick={generateAISuggestions} variant="outline" size="sm">
                          <RotateCcw className="mr-2 h-4 w-4" />
                          다시 분석
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">시장 잠재력</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {aiAnalysis.marketPotential}/10
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">실현 가능성</p>
                            <p className="text-2xl font-bold text-green-600">
                              {aiAnalysis.feasibilityScore}/10
                            </p>
                          </div>
                        </div>
                      </div>

                      <Tabs defaultValue="suggestions" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="suggestions">개선 제안</TabsTrigger>
                          <TabsTrigger value="swot">SWOT 분석</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="suggestions" className="space-y-4 mt-4">
                          {aiAnalysis.suggestions.map((suggestion) => (
                            <Card key={suggestion.id} className="relative">
                              <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    {getSuggestionIcon(suggestion.type)}
                                    <h3 className="font-semibold">{suggestion.title}</h3>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getPriorityColor(suggestion.priority)}>
                                      {suggestion.priority}
                                    </Badge>
                                    <Badge variant="outline">
                                      영향도: {suggestion.impact}/10
                                    </Badge>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="w-fit">
                                  {suggestion.category}
                                </Badge>
                              </CardHeader>
                              
                              <CardContent className="space-y-4">
                                <p className="text-muted-foreground">
                                  {suggestion.description}
                                </p>
                                
                                <div className="bg-blue-50 p-3 rounded-lg">
                                  <p className="text-sm">
                                    <strong>AI 분석:</strong> {suggestion.reasoning}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">실행 방안:</h4>
                                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                    {suggestion.actionItems.map((item, index) => (
                                      <li key={index}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div className="flex items-center gap-2 pt-2 border-t">
                                  <span className="text-sm text-muted-foreground">이 제안이 도움이 되었나요?</span>
                                  <Button
                                    size="sm"
                                    variant={feedback[suggestion.id] === 'positive' ? 'default' : 'outline'}
                                    onClick={() => handleAIFeedback(suggestion.id, 'positive')}
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={feedback[suggestion.id] === 'negative' ? 'default' : 'outline'}
                                    onClick={() => handleAIFeedback(suggestion.id, 'negative')}
                                  >
                                    <ThumbsDown className="h-3 w-3" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </TabsContent>
                        
                        <TabsContent value="swot" className="mt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-green-600 flex items-center gap-2">
                                  <CheckCircle2 className="h-4 w-4" />
                                  강점 (Strengths)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {aiAnalysis.strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-green-500 mt-1">•</span>
                                      <span className="text-sm">{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-red-600 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  약점 (Weaknesses)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {aiAnalysis.weaknesses.map((weakness, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-red-500 mt-1">•</span>
                                      <span className="text-sm">{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-blue-600 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4" />
                                  기회 (Opportunities)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {aiAnalysis.opportunities.map((opportunity, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      <span className="text-sm">{opportunity}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-orange-600 flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4" />
                                  위협 (Threats)
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ul className="space-y-2">
                                  {aiAnalysis.threats.map((threat, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-orange-500 mt-1">•</span>
                                      <span className="text-sm">{threat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* 협업 탭 */}
            <TabsContent value="collaborate" className="space-y-6 p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    협업 기능
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      협업 기능이 곧 출시될 예정입니다!
                    </p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• 팀원과 아이디어 공유</p>
                      <p>• 실시간 댓글 및 피드백</p>
                      <p>• 버전 히스토리 관리</p>
                      <p>• 협업자 권한 설정</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 마인드맵 미리보기 다이얼로그 */}
      <Dialog open={showMindMapPreview} onOpenChange={setShowMindMapPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>마인드맵 미리보기</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96">
            <MindMapPreview mindMap={idea.mindMap} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}