'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { generateIdea, type GeneratedIdea, getUserUsage } from '@/app/actions'; // 👈 추가
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { OutlineDisplay } from '@/components/outline-display';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useT } from '@/lib/translations';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';

function SubmitButton({ isPending }: { isPending: boolean }) {
  const t = useT();
  return (
    <Button
      type="submit"
      disabled={isPending}
      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-4"
      aria-label={isPending ? t('generating') : t('generateIdea')}
    >
      {isPending ? <LoaderCircle className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      <span className="sr-only">{isPending ? t('generating') : t('generateIdea')}</span>
    </Button>
  );
}


export default function IdeaHero() {
  const [state, formAction] = useActionState(generateIdea, {
    data: null as GeneratedIdea | null,
    error: null as string | null,
  });
  const [result, setResult] = useState<GeneratedIdea | null>(null);
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const requestIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = useT();
  const router = useRouter();

  // 👇 사용량 표시용 상태
  const [usageLoading, setUsageLoading] = useState(false);
  const [role, setRole] = useState<'free' | 'paid' | null>(null);
  const [dailyLeft, setDailyLeft] = useState<number | null>(null);
  const [ideasLeft, setIdeasLeft] = useState<number | null>(null);

  // 로그인 상태 변화 시 사용량 불러오기
  useEffect(() => {
    let mounted = true;
    async function loadUsage() {
      if (!user?.uid) {
        setRole(null);
        setDailyLeft(null);
        setIdeasLeft(null);
        return;
      }
      setUsageLoading(true);
      const res = await getUserUsage(user.uid);
      if (!mounted) return;
      if (res.error) {
        console.error(res.error);
      }
      setRole(res.role);
      setDailyLeft(res.dailyLeft);
      setIdeasLeft(res.ideasLeft);
      setUsageLoading(false);
    }
    loadUsage();
    return () => { mounted = false; };
  }, [user]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (!user) {
      e.preventDefault(); // block the action
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    }
    // if user exists, do nothing — the form will invoke `action={formAction}`
  };

  // 생성 결과 처리 + 로컬 사용량 감소(무료일 때)
  useEffect(() => {
    if (pending && (state.error || state.data)) setPending(false);

    if (state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
    if (state.data) {
      setResult(state.data);
      setIdea('');
      formRef.current?.reset();
      setOpen(true);

      // 무료 유저면 로컬 카운터 감소 (최소 0 유지)
      if (role === 'free') {
        setDailyLeft((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
        setIdeasLeft((prev) => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
      }
    }
  }, [state, toast, pending, role]);

  
  // 인디케이터 UI
  const QuotaBadge = ({ label, value, max }: { label: string; value: number | null; max?: number }) => {
    if (value === null) {
      // 무제한
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-xs">
          {label}: ∞
        </span>
      );
    }
    const left = Math.max(0, value);
    const text = max !== undefined ? `${left}/${max}` : `${left}`;
    // 색상 단계
    const mood =
      left === 0 ? 'bg-red-50 text-red-700 border-red-200' :
      left === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' :
      'bg-sky-50 text-sky-700 border-sky-200';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full ${mood} px-2.5 py-1 text-xs border`}>
        {label}: {text}
      </span>
    );
  };

  return (
    <>
      <div className="mx-auto max-w-4xl">
        {/* 인디케이터 영역 */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {usageLoading ? (
              <span className="text-xs text-muted-foreground">Loading usage…</span>
            ) : role ? (
              <>
                <QuotaBadge label={t('dailyLeft')} value={dailyLeft} max={2} />
                <QuotaBadge label={t('ideasLeft')} value={ideasLeft} max={5} />
                <span className="text-xs text-muted-foreground">
                  {t('plan')}: <b>{role === 'paid' ? t('paid') : t('free')}</b>
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">{t('quotaSignInPrompt')}</span>
            )}
          </div>
        </div>
  
        {/* 입력 폼 */}
        <div className="mb-6">
          <form ref={formRef} action={formAction} onSubmit={handleSubmit} className="relative" aria-busy={pending}>
            <input
              id="idea"
              name="idea"
              type="text"
              placeholder={t('describeYourIdea')}
              autoComplete="off"
              required
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={pending}
              className="w-full px-6 py-4 pr-16 border border-gray-300 rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          <input type="hidden" name="userId" value={user?.uid ?? ''} />
            <input type="hidden" name="language" value={language} />
            <input type="hidden" name="requestId" value={requestIdRef.current ?? ''} />
            <SubmitButton isPending={pending} />
          </form>
        </div>
      </div>
  
      {/* 로딩 오버레이 */}
      {pending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm">
          <LoaderCircle className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg font-medium text-gray-700">{t('generating')}</p>
        </div>
      )}

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

          <div className="max-h-[65vh] overflow-y-auto space-y-6 pr-1">
            {result?.outline && (
              <div className="rounded-md border p-4">
                <h3 className="mb-2 text-lg font-semibold">{t('ideaOutline')}</h3>
                <OutlineDisplay outline={result.outline} />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-3">
            <DialogClose asChild>
              <Button variant="secondary">{t('close') ?? '닫기'}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
