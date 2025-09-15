
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Lightbulb, LoaderCircle, Sparkles } from 'lucide-react';
import { generateIdea, type GeneratedIdea } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OutlineDisplay } from './outline-display';
import { MindMapDisplay } from './mindmap-display';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';

function SubmitButton() {
  const { pending } = useFormStatus();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <Sparkles className="mr-2" />
      )}
      <span>{pending ? t('generating') : t('generateIdea')}</span>
    </Button>
  );
}

export function IdeaArchitect() {
  const [state, formAction] = useActionState(generateIdea, { data: null, error: null });
  const [result, setResult] = useState<GeneratedIdea | null>(null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

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
      formRef.current?.reset();
    }
  }, [state, toast]);


  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="text-primary" />
            <span>{t('describeYourIdea')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form ref={formRef} action={formAction} className="space-y-4">
            <Textarea
              name="idea"
              placeholder="e.g., A mobile app that uses AI to create personalized travel itineraries based on user preferences and budget..."
              className="min-h-[120px] resize-y"
              required
            />
            <input type="hidden" name="userId" value={user?.uid} />
            <input type="hidden" name="language" value={language} />
            <div className="flex justify-end">
              <SubmitButton />
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in-50 duration-500">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">{result.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{result.summary}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('mindMap')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MindMapDisplay mindMap={result.mindMap} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('ideaOutline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <OutlineDisplay outline={result.outline} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
