'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AccountSettings } from '@/components/settings/account-settings';
import { PlanSettings } from '@/components/settings/plan-settings';
import { LanguageSettings } from '@/components/settings/language-settings';
import { ManageAccountSettings } from '@/components/settings/manage-account-settings';
import { PrivacyPolicy } from '@/components/settings/privacy-policy';
import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SettingsTab = 'account' | 'plan' | 'language' | 'manage' | 'privacy';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const { language } = useLanguage();
  const router = useRouter();
  const t = (key: keyof typeof translations) => translations[key][language];

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return <AccountSettings />;
      case 'plan':
        return <PlanSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'manage':
        return <ManageAccountSettings />;
      case 'privacy':
        return <PrivacyPolicy />;
      default:
        return <AccountSettings />;
    }
  };

  const menuItems = [
    { id: 'account', label: t('myAccount') },
    { id: 'plan', label: t('planDetails') },
    { id: 'language', label: t('language') },
    { id: 'privacy', label: t('privacyPolicy') },
    { id: 'manage', label: t('manageAccount') },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push('/')} // ✅ 홈으로 이동
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{t('settings')}</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <nav className="flex flex-col space-y-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'justify-start',
                  activeTab === item.id && 'bg-accent text-accent-foreground'
                )}
                onClick={() => setActiveTab(item.id as SettingsTab)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          <div className="min-h-[400px]">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}