'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { generateIdea, type GeneratedIdea } from '@/app/actions';
import {  saveGeneratedIdea, 
  incrementUserApiUsage,
   getUserUsage } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { OutlineDisplay } from '@/components/outline-display';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { useT } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// 🔹 requestId 생성 함수
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

function LoadingSteps() {
  const [currentStep, setCurrentStep] = useState(0);
  const t = useT();
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 3);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { key: 'analyzing', label: t('analyzing') },
    { key: 'structuring', label: t('structuring') },
    { key: 'finalizing', label: t('finalizing') },
  ];

  const getStepColor = (index: number) => {
    if (index === currentStep) {
      if (index === 0) return { dot: 'bg-blue-600', text: 'text-blue-600', line: 'bg-blue-400' };
      if (index === 1) return { dot: 'bg-purple-600', text: 'text-purple-600', line: 'bg-purple-400' };
      return { dot: 'bg-green-600', text: 'text-green-600', line: 'bg-green-400' };
    }
    if (index < currentStep) {
      if (index === 0) return { dot: 'bg-blue-400', text: 'text-blue-500', line: 'bg-blue-400' };
      if (index === 1) return { dot: 'bg-purple-400', text: 'text-purple-500', line: 'bg-purple-400' };
      return { dot: 'bg-green-400', text: 'text-green-500', line: 'bg-green-400' };
    }
    return { dot: 'bg-gray-300', text: 'text-gray-400', line: 'bg-gray-300' };
  };

  return (
    <div className="flex items-center justify-center space-x-2 sm:space-x-4 text-xs">
      {steps.map((step, index) => {
        const colors = getStepColor(index);
        const isActive = index === currentStep;
        
        return (
          <div key={step.key} className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <div 
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300",
                  colors.dot,
                  isActive && "animate-pulse scale-125"
                )}
              />
              <span 
                className={cn(
                  "transition-colors duration-300",
                  colors.text,
                  isActive && "font-medium"
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={cn(
                  "w-4 sm:w-8 h-px transition-colors duration-300",
                  colors.line
                )}
              />
            )}
          </div>
        );
      })}
    </div>
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
  const requestIdRef = useRef<string>(generateRequestId());
  const requestIdInputRef = useRef<HTMLInputElement>(null);
  const lastProcessedRequestRef = useRef<string | null>(null);
  const lastShownIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = useT();
  const router = useRouter();

  const [usageLoading, setUsageLoading] = useState(false);
  const [role, setRole] = useState<'free' | 'paid' | null>(null);
  const [dailyLeft, setDailyLeft] = useState<number | null>(null);
  const [ideasLeft, setIdeasLeft] = useState<number | null>(null);

  const uid = user?.uid ?? null;
  const loadingUsageRef = useRef(false);

  useEffect(() => {
    if (!uid) {
      setRole(null);
      setDailyLeft(null);
      setIdeasLeft(null);
      return;
    }
    if (loadingUsageRef.current) return;

    loadingUsageRef.current = true;
    let alive = true;

    (async () => {
      setUsageLoading(true);
      const res = await getUserUsage(uid);
      if (!alive) return;
      if (res.error) console.error(res.error);
      setRole(res.role);
      setDailyLeft(res.dailyLeft);
      setIdeasLeft(res.ideasLeft);
      setUsageLoading(false);
      loadingUsageRef.current = false;
    })();

    return () => { alive = false; };
  }, [uid]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // 기본 동작 방지
    
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    
    requestIdRef.current = generateRequestId();
    if (requestIdInputRef.current) {
      requestIdInputRef.current.value = requestIdRef.current;
    }
  
    setPending(true);
    
    // FormData를 직접 생성하여 formAction 호출
    const formData = new FormData(e.currentTarget);
    formAction(formData);
  };

  // Enter 키 처리 (줄바꿈 방지)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  useEffect(() => {
    if (pending && (state.error || state.data)) {
      setPending(false);
    }

    if (state.error) {
      console.error('Generation error:', state.error);
      toast({ 
        variant: 'destructive', 
        title: t('error'), 
        description: state.error 
      });
      lastShownIdRef.current = null;
      requestIdRef.current = generateRequestId();
      return;
    }

    const processResult = async () => {
      if (!state.data || state.data.id || !user?.uid) return;
      
      if (isSavingRef.current) {
        console.log('⏭️ 이미 저장 중, 스킵');
        return;
      }
      
      const currentRequestId = requestIdRef.current;
      if (lastProcessedRequestRef.current === currentRequestId) {
        console.log('⏭️ 이미 처리된 요청, 스킵:', currentRequestId);
        return;
      }

      try {
        isSavingRef.current = true;
        lastProcessedRequestRef.current = currentRequestId;
        
        console.log('💾 Firestore에 저장 시작...', currentRequestId);

        if (role === 'free') {
          await incrementUserApiUsage(user.uid);
        }

        const { id: savedId, error: saveError } = await saveGeneratedIdea(
          user.uid,
          {
            title: state.data.title,
            summary: state.data.summary,
            outline: state.data.outline,
            language: state.data.language || 'English',
          },
          currentRequestId
        );

        if (saveError || !savedId) {
          throw new Error(saveError || 'Failed to save');
        }

        console.log('✅ 저장 완료:', savedId);

        if (lastShownIdRef.current !== savedId) {
          lastShownIdRef.current = savedId;
          setResult({ ...state.data, id: savedId });
          setIdea('');
          formRef.current?.reset();
          setOpen(true);
          requestIdRef.current = generateRequestId();

          if (role === 'free') {
            setDailyLeft(prev => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
            setIdeasLeft(prev => (typeof prev === 'number' ? Math.max(0, prev - 1) : prev));
          }
        }
      } catch (error: any) {
        console.error('❌ 저장 실패:', error);
        lastProcessedRequestRef.current = null;
        toast({
          variant: 'destructive',
          title: t('error'),
          description: 'Failed to save generated idea. Please try again.',
        });
      } finally {
        isSavingRef.current = false;
      }
    };

    processResult();
  }, [state.data, state.error, pending]);

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setResult(null);
    }
  };

  const QuotaBadge = ({ label, value, max }: { label: string; value: number | null; max?: number }) => {
    if (value === null) {
      return (
        <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-sm">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="whitespace-nowrap">{label}: <span className="font-semibold">∞</span></span>
        </div>
      );
    }
    
    const left = Math.max(0, value);
    const text = max !== undefined ? `${left}/${max}` : `${left}`;
    const percentage = max ? (left / max) * 100 : 100;
    
    const getStyles = () => {
      if (left === 0) {
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          text: 'text-red-700',
          border: 'border-red-200/60',
          dot: 'bg-red-500',
          progress: 'bg-red-200',
          progressBar: 'bg-red-500'
        };
      } else if (left === 1) {
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          text: 'text-amber-700',
          border: 'border-amber-200/60',
          dot: 'bg-amber-500',
          progress: 'bg-amber-200',
          progressBar: 'bg-amber-500'
        };
      } else {
        return {
          bg: 'bg-gradient-to-r from-sky-50 to-blue-50',
          text: 'text-sky-700',
          border: 'border-sky-200/60',
          dot: 'bg-sky-500',
          progress: 'bg-sky-200',
          progressBar: 'bg-sky-500'
        };
      }
    };
    
    const styles = getStyles();
    
    return (
      <div className={`inline-flex items-center gap-1.5 sm:gap-2.5 rounded-lg ${styles.bg} ${styles.text} border ${styles.border} px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-200`}>
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${styles.dot} ${left > 0 ? 'animate-pulse' : ''}`}></div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="whitespace-nowrap">{label}: <span className="font-semibold">{text}</span></span>
          {max && (
            <div className="hidden sm:flex items-center gap-1.5">
              <div className={`w-8 h-1.5 rounded-full ${styles.progress} overflow-hidden`}>
                <div 
                  className={`h-full ${styles.progressBar} rounded-full transition-all duration-300 ease-out`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 sm:px-0">
        {/* 인디케이터 영역 - 모바일 최적화 */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {usageLoading ? (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-gray-50 border border-gray-200/60 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-gray-600 animate-pulse">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gray-400"></div>
                <span>{t('loadingUsage')}</span>
              </div>
            ) : role ? (
              <>
                <QuotaBadge label={t('dailyLeft')} value={dailyLeft} max={2} />
                <QuotaBadge label={t('ideasLeft')} value={ideasLeft} max={5} />
                
                <div className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-sm transition-all duration-200 ${
                  role === 'paid' 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 border border-purple-200/60' 
                    : 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-700 border border-slate-200/60'
                }`}>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${role === 'paid' ? 'bg-purple-500' : 'bg-slate-400'}`}></div>
                  <span className="whitespace-nowrap">
                    {t('plan')}: <span className="font-semibold">{role === 'paid' ? t('paid') : t('free')}</span>
                  </span>
                </div>
              </>
            ) : (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-700 border border-indigo-200/60 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium shadow-sm">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="whitespace-nowrap">{t('signInToTrackUsage')}</span>
              </div>
            )}
          </div>
          
          {role === 'free' && (dailyLeft === 0 || (ideasLeft !== null && ideasLeft === 0)) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{t('needMore')}</span>
              <button 
                onClick={() => router.push('/upgrade')}
                className="text-indigo-600 hover:text-indigo-800 font-medium underline decoration-dotted underline-offset-2 transition-colors"
              >
                {t('upgrade')}
              </button>
            </div>
          )}
        </div>
  
       {/* 입력 폼 - 버튼 분리 */}
<div className="mb-6 sm:mb-8">
  <div className="relative group">
    <form ref={formRef} onSubmit={handleSubmit} className="relative">
      <div className="space-y-3">
        <Textarea
          id="idea"
          name="idea"
          placeholder={t('describeYourIdea')}
          required
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={pending || (role === 'free' && (dailyLeft === 0 || (ideasLeft !== null && ideasLeft === 0)))}
          className={cn(
            "w-full px-4 sm:px-6 py-4 sm:py-5 border rounded-2xl shadow-lg text-base sm:text-lg transition-all duration-200 resize-none min-h-[80px] sm:min-h-[100px]",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "group-hover:shadow-xl",
            pending ? "bg-gray-50 cursor-not-allowed" : "bg-white",
            (role === 'free' && (dailyLeft === 0 || (ideasLeft !== null && ideasLeft === 0))) 
              ? "border-red-200 bg-red-50/30" 
              : "border-gray-300"
          )}
          rows={3}
        />
        
        <input type="hidden" name="userId" value={user?.uid ?? ''} />
        <input type="hidden" name="language" value={language} />
        <input type="hidden" name="requestId" ref={requestIdInputRef} defaultValue={requestIdRef.current} />
        
        <Button
          type="submit"
          disabled={pending || !idea.trim() || (role === 'free' && (dailyLeft === 0 || (ideasLeft !== null && ideasLeft === 0)))}
          className={cn(
            "w-full rounded-xl h-12 sm:h-14 text-base sm:text-lg font-semibold",
            "transition-all duration-200 shadow-lg hover:shadow-xl",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          )}
        >
          {pending ? (
            <div className="flex items-center gap-2">
              <LoaderCircle className="animate-spin w-5 h-5" />
              <span>{t('generating')}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>{t('generateIdea')}</span>
            </div>
          )}
        </Button>
      </div>
    </form>
    
    {role === 'free' && (dailyLeft === 0 || (ideasLeft !== null && ideasLeft === 0)) && (
      <div className="mt-3 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200">
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-red-800">
              {dailyLeft === 0 && ideasLeft !== null && ideasLeft === 0
                ? t('reachedDailyAndTotalLimits')
                : dailyLeft === 0 
                ? t('reachedDailyLimit')
                : t('reachedTotalLimit')}
            </p>
            <p className="text-xs sm:text-sm text-red-600 mt-1">
              {dailyLeft === 0 && (ideasLeft !== null && ideasLeft > 0)
                ? t('comeBackTomorrow')
                : t('upgradeForUnlimited')}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 border-red-300 text-red-700 hover:bg-red-100 text-xs sm:text-sm h-8"
              onClick={() => router.push('/upgrade')}
            >
              {t('upgradeNow')}
            </Button>
          </div>
        </div>
      </div>
    )}
    
    <div className="mt-3 sm:mt-4 text-center">
      <p className="text-xs sm:text-sm text-muted-foreground">
        {user ? (
          <>
            {t('tryExamples')} 
            <span className="hidden sm:inline"> · Enter키로 생성, Shift+Enter로 줄바꿈</span>
          </>
        ) : (
          <>
            {t('signInPrompt')} <button 
              onClick={() => router.push('/login')}
              className="text-blue-600 hover:text-blue-800 underline decoration-dotted underline-offset-2"
            >
              {t('signIn')}
            </button> {t('signInToStart')}
          </>
        )}
      </p>
    </div>
  </div>
</div>
      </div>
  
      {/* 로딩 오버레이 - 단계별 애니메이션 추가 */}
{pending && (
  <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-md px-4">
    <div className="absolute inset-0 z-0 opacity-5 bg-gradient-to-br from-blue-50 to-purple-50"></div>

    <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 mb-4 sm:mb-6">
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-30 animate-spin"></div>
      <div className="absolute inset-4 rounded-full bg-white flex items-center justify-center">
        <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
      </div>
    </div>

    <div className="relative z-10 text-center space-y-3 sm:space-y-4 max-w-md">
      <div>
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">
          {t('generatingYourIdea')}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          {t('aiCraftingDetails')}
        </p>
      </div>

      <LoadingSteps />
    </div>
  </div>
)}

      {/* 결과 다이얼로그 - 기존 코드 유지 */}
      <Dialog open={open} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-[95vw] h-[95vh] sm:h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="flex-shrink-0 space-y-3 p-4 sm:p-6 pb-4 border-b">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight line-clamp-2">
                  {result?.title ?? t('generatedIdea')}
                </DialogTitle>
                {result?.summary && (
                  <DialogDescription className="text-sm sm:text-base md:text-lg text-muted-foreground mt-2 line-clamp-3">
                    {result.summary}
                  </DialogDescription>
                )}
              </div>
              
              <div className="flex items-center gap-2 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('generated')}</span>
              </div>
            </div>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md border border-gray-200/60 z-50 transition-all duration-200 hover:shadow-lg"
                onClick={() => handleDialogClose(false)}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="sr-only">{t('close')}</span>
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain">
            <div className="space-y-4 sm:space-y-6 pb-4">
              {result?.outline && (
                <div className="rounded-lg border bg-gradient-to-br from-slate-50 to-gray-50 p-4 sm:p-6">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h3 className="text-base sm:text-lg font-semibold">{t('ideaOutline')}</h3>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <OutlineDisplay outline={result.outline} />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-lg border bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <span>{t('language')}</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{result?.language || 'English'}</p>
                </div>
                
                <div className="rounded-lg border bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>{t('createdOn')}</span>
                  </div>
                  <p className="font-medium text-sm sm:text-base">{t('justNow')}</p>
                </div>
                
                <div className="rounded-lg border bg-white p-3 sm:p-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{t('status')}</span>
                  </div>
                  <p className="font-medium text-green-600 text-sm sm:text-base">{t('savedToArchive')}</p>
                </div>
              </div>

              <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-semibold text-blue-900 mb-2 sm:mb-3">{t('whatsNext')}</h4>
                <div className="space-y-2 text-xs sm:text-sm text-blue-700">
                  <p className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span>{t('exploreFullDetails')}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span>{t('addToFavorites')}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"></div>
                    <span>{t('generateMoreIdeas')}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t p-4 sm:p-6 pt-3 sm:pt-4 gap-2 sm:gap-3 bg-white">
            <div className="flex flex-col gap-2 sm:gap-3 w-full">
              <div className="flex gap-2 w-full">
                <Button
                  onClick={() => {
                    handleDialogClose(false);
                    router.push(`/idea/${result?.id}`);
                  }}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                  disabled={!result?.id}
                >
                  {t('viewDetails')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    handleDialogClose(false);
                    router.push('/archive');
                  }}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                >
                  {t('goToArchive')}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => {
                  handleDialogClose(false);
                  setTimeout(() => {
                    const input = document.getElementById('idea') as HTMLTextAreaElement;
                    input?.focus();
                  }, 100);
                }}
                className="w-full h-9 sm:h-10 text-xs sm:text-sm"
              >
                {t('generateAnother')}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}