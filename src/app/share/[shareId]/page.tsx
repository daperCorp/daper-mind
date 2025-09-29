// app/share/[shareId]/page.tsx

'use client';

import { useEffect, useState, use } from 'react';
import { notFound } from 'next/navigation';
import { getIdeaByShareLink } from '@/app/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, AlertCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SharedIdeaPage({
  params: paramsPromise,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const params = use(paramsPromise);
  const [idea, setIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shareId = params.shareId;
    if (!shareId) return;

    async function fetchSharedIdea() {
      const { data, error } = await getIdeaByShareLink(shareId);

      if (error || !data) {
        notFound();
      } else {
        setIdea(data);
      }
      setLoading(false);
    }

    fetchSharedIdea();
  }, [params]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!idea) return null;

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
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          읽기 전용
        </Badge>
      </div>

      {/* 제목 */}
      <div>
        <h1 className="text-3xl font-bold text-primary">{idea.title}</h1>
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
          <p className="text-muted-foreground leading-relaxed">{idea.summary}</p>
        </CardContent>
      </Card>

      {/* 아웃라인 */}
      <Card>
        <CardHeader>
          <CardTitle>상세 계획</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
            {idea.outline}
          </pre>
        </CardContent>
      </Card>

      {/* 마인드맵 (있는 경우) */}
      {idea.mindMap && (
        <Card>
          <CardHeader>
            <CardTitle>마인드맵</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">
              {idea.mindMap}
            </pre>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}