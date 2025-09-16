
'use client';

import { useLanguage } from '@/context/language-context';
import { translations } from '@/lib/translations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PrivacyPolicy() {
  const { language } = useLanguage();
  const t = (key: keyof typeof translations) => translations[key][language];

  const privacyContent = {
    English: {
      title: 'Privacy Policy',
      description: 'Your privacy is important to us. It is our policy to respect your privacy regarding any information we may collect from you across our website.',
      sections: [
        {
          title: 'Information We Collect',
          content: 'We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.'
        },
        {
          title: 'How We Use Your Information',
          content: 'We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.'
        },
        {
          title: 'Security',
          content: 'The security of your personal information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.'
        },
        {
            title: 'Contact Us',
            content: "If you have any questions about this Privacy Policy, please contact us."
        }
      ]
    },
    Korean: {
      title: '개인정보 처리방침',
      description: '귀하의 개인정보는 우리에게 중요합니다. 당사 웹사이트 전반에서 귀하로부터 수집할 수 있는 모든 정보와 관련하여 귀하의 개인정보를 존중하는 것이 당사의 정책입니다.',
      sections: [
        {
          title: '수집하는 정보',
          content: '당사는 귀하에게 서비스를 제공하기 위해 진정으로 필요한 경우에만 개인 정보를 요청합니다. 당사는 귀하의 인지와 동의 하에 공정하고 합법적인 수단으로 정보를 수집합니다. 또한 당사는 정보를 수집하는 이유와 사용 방법을 알려드립니다.'
        },
        {
          title: '정보 사용 방법',
          content: '당사는 귀하가 요청한 서비스를 제공하는 데 필요한 기간 동안만 수집된 정보를 보유합니다. 당사가 저장하는 데이터는 손실 및 도난은 물론 무단 접근, 공개, 복사, 사용 또는 수정을 방지하기 위해 상업적으로 허용되는 수단 내에서 보호합니다.'
        },
        {
          title: '보안',
          content: '귀하의 개인 정보 보안은 우리에게 중요하지만 인터넷을 통한 전송 방법이나 전자 저장 방법이 100% 안전하지는 않다는 점을 기억하십시오. 당사는 귀하의 개인 정보를 보호하기 위해 상업적으로 허용되는 수단을 사용하기 위해 노력하지만 절대적인 보안을 보장할 수는 없습니다.'
        },
        {
            title: '문의하기',
            content: '본 개인정보 처리방침에 대해 질문이 있는 경우 당사에 문의하십시오.'
        }
      ]
    }
  };

  const content = privacyContent[language];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {content.sections.map((section, index) => (
            <div key={index} className="space-y-2">
                <h3 className="font-semibold text-lg">{section.title}</h3>
                <p className="text-muted-foreground text-sm">{section.content}</p>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
