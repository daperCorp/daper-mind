// app/idea/[id]/business-plan/page.tsx
'use client';

import { useEffect, useState, use } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  generateBusinessPlan,
  saveBusinessPlan,
} from '@/app/actions';
import { 
    getIdeaById, 
    getUserData 
  } from '@/lib/firebase-client'; // 클라이언트 함수
  
  import { 
    exportBusinessPlan 
  } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  FileText,
  Download,
  Sparkles,
  Loader2,
  Crown,
  Zap,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Calendar,
  Lock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function BusinessPlanPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<any>(null);
  const [businessPlan, setBusinessPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userRole, setUserRole] = useState<'free' | 'paid'>('free');
  const [activeSection, setActiveSection] = useState<string>('overview');

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const id = params.id;
    if (!id) return;

    async function fetchData() {
      const { data, error } = await getIdeaById(id);
      if (error || !data) {
        notFound();
      } else {
        setIdea(data);

        // 사용자 role 확인
        if (data.userId) {
          const { data: userData } = await getUserData(data.userId);
          if (userData) {
            setUserRole(userData.role || 'free');

            // 저장된 사업계획서가 있으면 불러오기
            if (userData.role === 'paid' && data.businessPlan) {
              setBusinessPlan(data.businessPlan);
            }
          }
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [params]);

  const handleGenerate = async () => {
    if (!idea) return;

    if (userRole !== 'paid') {
      toast({
        title: '유료 기능',
        description: '사업계획서 생성은 Pro 플랜에서 이용 가능합니다.',
        variant: 'destructive',
      });
      router.push('/pricing');
      return;
    }

    setGenerating(true);

    try {
      const result = await generateBusinessPlan({
        ideaId: idea.id!,
        title: idea.title,
        summary: idea.summary,
        outline: idea.outline,
        aiSuggestions: idea.aiSuggestions,
        language: (idea.language || 'Korean') as 'English' | 'Korean',
      });

      setBusinessPlan(result);

      // DB에 저장
      await saveBusinessPlan(idea.id!, result);

      toast({
        title: '사업계획서 생성 완료!',
        description: '전문적인 사업계획서가 생성되었습니다.',
      });
    } catch (error: any) {
      console.error('사업계획서 생성 실패:', error);
      toast({
        variant: 'destructive',
        title: '생성 실패',
        description: error.message || '사업계획서를 생성하는 중 오류가 발생했습니다.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: 'markdown' | 'text') => {
    if (!idea?.id) return;

    try {
      const { content, error } = await exportBusinessPlan(idea.id, format);

      if (error || !content) {
        throw new Error(error || 'Export failed');
      }

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${idea.title}-사업계획서.${format === 'markdown' ? 'md' : 'txt'}`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: '내보내기 완료',
        description: '사업계획서가 다운로드되었습니다.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '내보내기 실패',
        description: '파일을 내보내는 중 오류가 발생했습니다.',
      });
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!idea) return null;

  // Free 사용자 Paywall
  if (userRole === 'free') {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/idea/${idea.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              아이디어로 돌아가기
            </Link>
          </Button>
        </div>

        <Card className="border-2 border-purple-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full">
                <FileText className="h-8 w-8 text-white" />
              </div>

              <div>
                <h1 className="text-3xl font-bold mb-2">전문 사업계획서</h1>
                <p className="text-muted-foreground">
                  투자 유치와 사업 실행을 위한 완벽한 사업계획서를 AI가 작성해드립니다
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">10개 핵심 섹션</h3>
                      <p className="text-sm text-muted-foreground">
                        경영진 요약, 시장 분석, 재무 계획 등
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">3년 재무 전망</h3>
                      <p className="text-sm text-muted-foreground">
                        매출, 비용, 투자 계획 포함
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">투자 유치 준비</h3>
                      <p className="text-sm text-muted-foreground">
                        VC/엔젤 투자자용 포맷
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold">실행 로드맵</h3>
                      <p className="text-sm text-muted-foreground">
                        18개월 마일스톤 포함
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Crown className="h-6 w-6 text-purple-600" />
                  <h3 className="text-xl font-bold">Pro 플랜으로 업그레이드</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  전문가 수준의 사업계획서와 모든 프리미엄 기능을 이용하세요
                </p>
                <Button
                  onClick={() => router.push('/pricing')}
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  지금 업그레이드
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paid 사용자 - 사업계획서 생성 전
  if (!businessPlan) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/idea/${idea.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              아이디어로 돌아가기
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              사업계획서 생성
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              AI가 당신의 아이디어를 바탕으로 투자자 수준의 전문 사업계획서를 작성해드립니다.
              약 3-5분이 소요됩니다.
            </p>

            <div className="grid gap-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">10개 핵심 섹션</h3>
                  <p className="text-sm text-muted-foreground">
                    경영진 요약, 문제/해결책, 시장 분석, 비즈니스 모델, 마케팅 전략, 운영 계획,
                    재무 계획, 마일스톤, 위험 분석, 부록
                  </p>
                </div>
              </div>

                              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Sparkles className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold">AI 분석 활용</h3>
                  <p className="text-sm text-muted-foreground">
                    이미 생성된 AI 개선 제안을 바탕으로 더 정확하고 구체적인 계획서를 작성합니다
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="lg"
              className="w-full"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  사업계획서 생성 중... (3-5분 소요)
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  사업계획서 생성하기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Paid 사용자 - 사업계획서 생성 완료
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" asChild className="mb-4">
            <Link href={`/idea/${idea.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              아이디어로 돌아가기
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{idea.title}</h1>
          <p className="text-muted-foreground">사업계획서</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('markdown')}>
            <Download className="h-4 w-4 mr-2" />
            Markdown
          </Button>
          <Button variant="outline" onClick={() => handleExport('text')}>
            <Download className="h-4 w-4 mr-2" />
            Text
          </Button>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            재생성
          </Button>
        </div>
      </div>

      {/* 메타데이터 카드 */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">타겟 시장</p>
              <p className="font-semibold">{businessPlan.metadata.targetMarket}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">비즈니스 모델</p>
              <p className="font-semibold">{businessPlan.metadata.businessModel}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">필요 자금</p>
              <p className="font-semibold">{businessPlan.metadata.fundingNeeded}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">시장 출시</p>
              <p className="font-semibold">{businessPlan.metadata.timeToMarket}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 사이드바 - 섹션 목록 */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">목차</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                <Button
                  variant={activeSection === 'overview' ? 'secondary' : 'ghost'}
                  className="w-full justify-start text-sm"
                  onClick={() => setActiveSection('overview')}
                >
                  전체 보기
                </Button>
                {businessPlan.sections.map((section: any, index: number) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start text-sm"
                    onClick={() => setActiveSection(section.id)}
                  >
                    {index + 1}. {section.title.split('(')[0].trim()}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-3">
          {activeSection === 'overview' ? (
            // 전체 보기
            <div className="space-y-6">
              {businessPlan.sections.map((section: any, index: number) => (
                <Card key={section.id}>
                  <CardHeader>
                    <CardTitle>
                      {index + 1}. {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {section.content}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // 개별 섹션 보기
            <Card>
              <CardHeader>
                <CardTitle>
                  {businessPlan.sections.findIndex((s: any) => s.id === activeSection) + 1}.{' '}
                  {businessPlan.sections.find((s: any) => s.id === activeSection)?.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {businessPlan.sections.find((s: any) => s.id === activeSection)?.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}