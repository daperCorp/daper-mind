'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Sparkles, Zap, Crown, ArrowRight, Star, Infinity, Clock, Brain, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useT } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserUsage } from '@/lib/firebase-client';

export default function UpgradePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useT();
  const [usage, setUsage] = useState<{
    role: 'free' | 'paid';
    dailyLeft: number | null;
    ideasLeft: number | null;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }

    if (user?.uid) {
      getUserUsage(user.uid).then(result => {
        setUsage(result);
        setUsageLoading(false);
      });
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    );
  }

  // 이미 유료 사용자인 경우
  if (usage?.role === 'paid') {
    return (
      <div className="container mx-auto max-w-4xl p-4 pt-20">
        {/* Back Button */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('back')}
          </Button>
        </div>
        
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full mb-6">
            <Crown className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">{t('alreadyPremium')}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t('alreadyPremiumDescription')}
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/')}>
              <Sparkles className="w-4 h-4 mr-2" />
              {t('generateIdeas')}
            </Button>
            <Button variant="outline" onClick={() => router.push('/archive')}>
              {t('viewArchive')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: <Infinity className="w-5 h-5" />,
      title: "Unlimited Idea Generation",
      description: "Create as many ideas as you want, whenever inspiration strikes"
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "No Daily Limits",
      description: "Generate ideas 24/7 without waiting for resets"
    },
    {
      icon: <Brain className="w-5 h-5" />,
      title: "Advanced AI Features",
      description: "Access to enhanced mind mapping and detailed outlines"
    },
    {
      icon: <Star className="w-5 h-5" />,
      title: "Priority Support",
      description: "Get help faster with dedicated customer support"
    }
  ];

  return (
    <div className="container mx-auto max-w-6xl p-4 pt-16 pb-20">
      {/* Back Button */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('back')}
        </Button>
      </div>

      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="w-3 h-3 mr-1" />
          {t('unlockCreativePotential')}
        </Badge>
        
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {t('upgradeToPremium')}
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('upgradeToPremiumDescription')}
        </p>

        {/* Current Usage Display */}
        {!usageLoading && usage && (
          <div className="inline-flex items-center gap-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-8">
            <div className="text-sm">
              <span className="text-amber-800 font-medium">{t('currentUsage')}: </span>
              <span className="text-amber-700">
                {t('daily')}: {usage.dailyLeft}/2 • {t('total')}: {usage.ideasLeft}/5
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="relative border-2">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{t('freePlan')}</CardTitle>
                <div className="text-3xl font-bold mt-2">$0</div>
                <p className="text-sm text-muted-foreground">{t('foreverFree')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{t('twoIdeasPerDay')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{t('fiveTotalSavedIdeas')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{t('basicIdeaOutlines')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-sm">{t('archiveAndFavorites')}</span>
              </li>
            </ul>
            <Button variant="outline" className="w-full" disabled>
              {t('currentPlan')}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className="relative border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <Crown className="w-3 h-3 mr-1" />
              {t('recommended')}
            </Badge>
          </div>
          
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{t('premiumPlan')}</CardTitle>
                <div className="text-3xl font-bold mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  $9.99
                </div>
                <p className="text-sm text-muted-foreground">{t('perMonth')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('unlimitedIdeasPerDay')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('unlimitedSavedIdeas')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('advancedMindMapping')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('priorityAiProcessing')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('exportSharingFeatures')}</span>
              </li>
              <li className="flex items-center gap-3">
                <Check className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">{t('prioritySupport')}</span>
              </li>
            </ul>
            <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
              <Zap className="w-4 h-4 mr-2" />
              {t('upgradeNow')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">{t('whyUpgrade')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Infinity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{t('unlimitedIdeaGeneration')}</h3>
              <p className="text-sm text-muted-foreground">{t('unlimitedIdeaGenerationDesc')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{t('noDailyLimits')}</h3>
              <p className="text-sm text-muted-foreground">{t('noDailyLimitsDesc')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{t('advancedAiFeatures')}</h3>
              <p className="text-sm text-muted-foreground">{t('advancedAiFeaturesDesc')}</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                <Star className="w-5 h-5" />
              </div>
              <h3 className="font-semibold mb-2">{t('prioritySupport')}</h3>
              <p className="text-sm text-muted-foreground">{t('prioritySupportDesc')}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">{t('frequentlyAskedQuestions')}</h2>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('canICancelAnytime')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('canICancelAnytimeAnswer')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('whatHappensIfIDowngrade')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('whatHappensIfIDowngradeAnswer')}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">{t('isThereAFreeTrial')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('isThereAFreeTrialAnswer')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
        <h2 className="text-2xl font-bold mb-4">{t('readyToUnlockCreativity')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('joinThousandsOfCreators')}
        </p>
        <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
          <Crown className="w-4 h-4 mr-2" />
          {t('startPremiumJourney')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}