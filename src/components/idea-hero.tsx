'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle, Sparkles, Lightbulb } from 'lucide-react';

import { generateIdea, type GeneratedIdea } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MindMapDisplay } from '@/components/mindmap-display';
import { OutlineDisplay } from '@/components/outline-display';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useT } from '@/lib/translations';
// ✅ shadcn/ui Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { language } = useLanguage();
  const t = useT();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-4"
      aria-label={pending ? t('generating') : t('generateIdea')}
    >
      {pending ? <LoaderCircle className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      <span className="sr-only">{pending ? t('generating') : t('generateIdea')}</span>
    </Button>
  );
}

/**
 * 랜딩 히어로 입력 + 서버 액션(generateIdea)
 * 결과는 다이얼로그로 표시
 */
export default function IdeaHero() {
  const [state, formAction] = useActionState(generateIdea, {
    data: null as GeneratedIdea | null,
    error: null as string | null,
  });
  const [result, setResult] = useState<GeneratedIdea | null>(null);
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  // const t = (key: keyof typeof translations) => translate(key, language);
  const t = useT();

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
    if (state.data) {
      setResult(state.data);
      setIdea('');
      formRef.current?.reset();
      setOpen(true); // ✅ 결과를 다이얼로그로 오픈
    }
  }, [state, toast]);

  return (
    <>
      {/* 입력 카드 */}
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="text-primary" />
              <span>{t('describeYourIdea')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} action={formAction} className="relative">
              {/* 오토필 경고 방지: id/name 지정 */}
              <input
                id="idea"
                name="idea"
                type="text"
                placeholder={
                  // t('ideaPlaceholder') ??
                  'e.g., A mobile app that uses AI to create personalized travel itineraries...'
                }
                autoComplete="off"
                required
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                className="w-full px-6 py-4 pr-16 border border-gray-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
              {/* hidden fields */}
              <input type="hidden" name="userId" value={user?.uid ?? ''} />
              <input type="hidden" name="language" value={language} />
              {/* 제출 버튼 (우측 둥근) */}
              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>

      {/* 결과 다이얼로그 */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl lg:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {result?.title ?? t('generatedIdea') ?? 'Generated Idea'}
            </DialogTitle>
            {result?.summary && (
              <DialogDescription className="text-base">
                {result.summary}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* 내용 스크롤 영역 */}
          <div className="max-h-[65vh] overflow-y-auto space-y-6 pr-1">
            {/* Mind Map */}
            {/* {result?.mindMap && (
              <div className="rounded-md border p-4">
                <h3 className="mb-2 text-lg font-semibold">{t('mindMap')}</h3>
                <MindMapDisplay mindMap={result.mindMap} />
              </div>
            )} */}

            {/* Outline */}
            {result?.outline && (
              <div className="rounded-md border p-4">
                <h3 className="mb-2 text-lg font-semibold">{t('ideaOutline')}</h3>
                <OutlineDisplay outline={result.outline} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            {/* 필요 시: 보관함 저장 / 즐겨찾기 등의 버튼 추가 가능 */}
            <DialogClose asChild>
              <Button variant="secondary">{t('close') ?? '닫기'}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
