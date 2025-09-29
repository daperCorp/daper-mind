'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { getIdeaByShareLink } from '@/lib/firebase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, AlertCircle, Share2, ChevronRight, ChevronDown, Sparkles, FileText, TrendingUp } from 'lucide-react';
import { OutlineDisplay } from '@/components/outline-display';

// 마인드맵 노드 컴포넌트
function MindMapNode({ node, level = 0 }: { node: any; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  if (!node) return null;

  const hasChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
  const bgColor = level === 0 ? 'bg-blue-100 border-blue-300' : level === 1 ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200';

  return (
    <div className={`${level > 0 ? 'ml-6' : ''} my-2`}>
      <div
        className={`flex items-start gap-2 p-3 rounded-lg border-2 ${bgColor} transition-all hover:shadow-sm`}
      >
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-0.5 hover:bg-white/50 rounded p-0.5 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-5" />}
        
        <div className="flex-1">
          <div className="font-medium text-sm">
            {node.label || node.name || node.title || '노드'}
          </div>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {node.description}
            </p>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1 border-l-2 border-gray-300 pl-2">
          {node.children.map((child: any, idx: number) => (
            <MindMapNode key={idx} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// 마인드맵 렌더러
function MindMapRenderer({ data }: { data: any }) {
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    try {
      if (typeof data === 'string') {
        setParsedData(JSON.parse(data));
      } else if (typeof data === 'object') {
        setParsedData(data);
      }
    } catch (err) {
      console.error('마인드맵 파싱 오류:', err);
      setParseError(true);
    }
  }, [data]);

  if (parseError) {
    return (
      <div className="text-sm text-muted-foreground p-4 bg-gray-50 rounded-lg">
        <p className="mb-2 font-medium">원본 데이터:</p>
        <pre className="whitespace-pre-wrap text-xs">
          {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }

  if (!parsedData) {
    return <div className="text-sm text-muted-foreground">마인드맵 로딩 중...</div>;
  }

  const rootNode = parsedData.root || parsedData;

  return (
    <div className="space-y-2">
      {Array.isArray(rootNode) ? (
        rootNode.map((node, idx) => (
          <MindMapNode key={idx} node={node} level={0} />
        ))
      ) : (
        <MindMapNode node={rootNode} level={0} />
      )}
    </div>
  );
}

export default function SharedIdeaPage({
  params: paramsPromise,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const shareId = params.shareId;
    if (!shareId) return;

    async function fetchSharedIdea() {
      try {
        const { data, error } = await getIdeaByShareLink(shareId);

        if (error || !data) {
          setError(error || 'Share link not found');
          notFound();
        } else {
          setIdea(data);
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setError(err.message || 'Failed to load shared idea');
      } finally {
        setLoading(false);
      }
    }

    fetchSharedIdea();
  }, [params.shareId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="mx-auto max-w-4xl p-4 md:p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900">오류</h3>
                <p className="text-sm text-red-800">
                  {error || '공유 링크를 찾을 수 없습니다.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 프리미엄 콘텐츠 확인
  const hasAiAnalysis = idea.aiAnalysis && idea.aiAnalysis.trim();
  const hasBusinessPlan = idea.businessPlan && idea.businessPlan.trim();
  const hasPremiumContent = hasAiAnalysis || hasBusinessPlan;

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
      {/* 읽기 전용 배너 */}
      <div className="flex items-center gap-3 p-4 rounded-lg border-2 bg-blue-50 border-blue-200">
        <div className="flex-shrink-0">
          <Eye className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold">공유된 아이디어</h3>
          <p className="text-sm text-muted-foreground">
            이 아이디어는 읽기 전용으로 공유되었습니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            읽기 전용
          </Badge>
          {hasPremiumContent && (
            <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              <Sparkles className="h-3 w-3 mr-1" />
              프리미엄
            </Badge>
          )}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          {String(idea.title || '제목 없음')}
        </h1>
        <p className="text-muted-foreground mt-2 flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          공유된 아이디어
        </p>
      </div>

      {/* 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>요약</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {String(idea.summary || '요약 없음')}
          </p>
        </CardContent>
      </Card>

      {/* 아웃라인 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <OutlineDisplay outline={String(idea.outline || '상세 계획 없음')} />
        </CardContent>
      </Card>

      {/* AI 전문 분석 (프리미엄) */}
      {hasAiAnalysis && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span>AI 전문 분석</span>
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                프리미엄
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutlineDisplay outline={idea.aiAnalysis} />
          </CardContent>
        </Card>
      )}

      {/* 사업계획서 (프리미엄) */}
      {hasBusinessPlan && (
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span>사업계획서</span>
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                프리미엄
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutlineDisplay outline={idea.businessPlan} />
          </CardContent>
        </Card>
      )}

      {/* 마인드맵 */}
      {idea.mindMap && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>마인드맵</span>
              <Badge variant="outline" className="text-xs">
                인터랙티브
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MindMapRenderer data={idea.mindMap} />
          </CardContent>
        </Card>
      )}

      {/* 읽기 전용 안내 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">읽기 전용 링크</h3>
              <p className="text-sm text-blue-800">
                이 아이디어는 보기만 가능합니다. 원본 아이디어를 수정하려면 소유자 계정으로 로그인하세요.
              </p>
              {hasPremiumContent && (
                <p className="text-sm text-purple-700 mt-2 font-medium">
                  ✨ 이 아이디어에는 프리미엄 콘텐츠가 포함되어 있습니다.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}