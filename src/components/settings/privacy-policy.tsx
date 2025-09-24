'use client';

import { useLanguage } from '@/context/language-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Section = { title: string; content: string };
type PPByLang = {
  English: { title: string; description: string; sections: Section[] };
  Korean: { title: string; description: string; sections: Section[] };
};

export function PrivacyPolicy() {
  const { language } = useLanguage(); // 'English' | 'Korean'

  const privacyContent: PPByLang = {
    Korean: {
      title: '개인정보처리방침',
      description:
        'DAPER은(는) 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 관련 고충을 신속하고 원활하게 처리하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다. 본 방침은 2025년 9월 23일부터 적용됩니다.',
      sections: [
        { title: '적용일', content: '이 개인정보처리방침은 2025년 9월 23일부터 적용됩니다.' },
        {
          title: '처리 목적 개요 (1~5)',
          content: `
1) 홈페이지 회원가입 및 관리: 회원 가입의사 확인, 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지, 각종 고지·통지 목적.

2) 민원사무 처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보 목적.

3) 재화 또는 서비스 제공: 서비스 제공, 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 요금결제·정산 목적.

4) 마케팅 및 광고 활용: 신규 서비스(제품) 개발, 이벤트/광고성 정보 제공, 서비스 유효성 확인, 접속빈도 파악, 통계 목적.

5) 개인영상정보: 범죄 예방 및 수사 목적.`,
        },
        {
          title: '제2조(개인정보의 처리 및 보유 기간)',
          content: `
① DAPER은 법령 또는 동의받은 기간 내에서 개인정보를 처리·보유합니다.
② 예: <회원가입 및 관리> 개인정보는 동의일부터 영구 보관됩니다.
- 보유근거: 회원관리
- 관련법령: 신용정보의 수집·처리 및 이용 기록 3년
- 예외사유: 해당 시 별도 고지`,
        },
        {
          title: '제3조(처리하는 개인정보의 항목)',
          content: `
- 필수항목: 이메일, 휴대전화번호, 주소, 비밀번호, 로그인ID, 이름, 회사명/전화번호, 직업, 서비스 이용 기록, 접속 로그, 쿠키
- 선택항목: 해당 시 별도 고지`,
        },
        {
          title: '제4조(개인정보의 제3자 제공)',
          content: `
① DAPER은 원칙적으로 정보주체 동의 또는 법령 근거가 있는 경우에만 개인정보를 제3자 제공.
② 예시:
- 제공받는 자: DAPER
- 이용목적: 이메일, 전화번호, 로그인ID, 생년월일, 이름 확인
- 보유기간: 3년`,
        },
        {
          title: '제5조(개인정보처리의 위탁)',
          content: `
① 원활한 업무처리를 위하여 개인정보 처리 위탁 가능.
- 위탁자: 추후 공지
- 위탁내용/기간: 추후 공지
② 계약 시 개인정보 보호법 제26조 준수.
③ 변경 시 지체없이 공개.`,
        },
        {
          title: '제6조(개인정보의 파기)',
          content: `
① 보유기간 경과 또는 처리 목적 달성 시 지체없이 파기.
② 다른 법령에 따라 보존 필요한 경우 별도 보관.
③ 파기방법: 전자파일은 복구 불가능 방법, 종이는 분쇄/소각.`,
        },
        {
          title: '제7조(정보주체 권리)',
          content: `
① 열람·정정·삭제·처리정지 요구 가능.
② 서면, 이메일, 팩스로 가능.
③ 대리인은 위임장 제출.
④ 법령상 제한 있음.
⑤ 삭제 불가 항목 존재.`,
        },
        {
          title: '제8조(안전성 확보조치)',
          content: `
1) 직원 최소화 및 교육
2) 보안프로그램 설치, 점검
3) 비밀번호 암호화, 전송구간 암호화
4) 잠금장치 보관`,
        },
        {
          title: '제9조(쿠키)',
          content: `
① 맞춤형 서비스 제공을 위해 쿠키 사용.
② 목적: 접속빈도, 보안, 인기검색어 분석.
③ 거부: 브라우저 개인정보 설정.
④ 거부 시 맞춤형 서비스 제한.`,
        },
        {
          title: '제10조(행태정보)',
          content: 'DAPER은 온라인 맞춤형 광고 등을 위한 행태정보를 수집·이용하지 않습니다.',
        },
        {
          title: '제11조(추가 제공 판단기준)',
          content: `
- 수집 목적과의 관련성
- 처리 관행상 예측 가능성
- 정보주체 이익 침해 여부
- 가명처리·암호화 등 안전성`,
        },
        {
          title: '제12조(가명정보 처리)',
          content: `목적, 기간, 제공 여부, 안전조치 등을 직접 기재.`,
        },
        {
          title: '제13조(개인정보 보호책임자)',
          content: `
- 책임자: 김규태 / 대표
- 연락처: info@dapercorp.com`,
        },
        {
          title: '제14조(국내대리인)',
          content: `개인정보 보호법 제39조의11에 따른 국내대리인 지정 가능.`,
        },
        {
          title: '제15조(열람청구 부서)',
          content: `개인정보 열람청구는 지정된 부서에 가능.`,
        },
        {
          title: '제16조(구제방법)',
          content: `
- 개인정보분쟁조정위원회 1833-6972
- 개인정보침해신고센터 118
- 대검찰청 1301
- 경찰청 182`,
        },
        {
          title: '제17조(영상정보처리기기)',
          content: `설치 근거, 대수, 위치, 보관기간 등 고지.`,
        },
        {
          title: '제18조(변경)',
          content: `
① 본 방침은 2025년 9월 23일부터 적용.
② 이전 버전 별도 확인 가능.`,
        },
       
      ],
    },
    English: {
      title: 'Privacy Policy',
      description:
        'In accordance with Article 30 of the Personal Information Protection Act, DAPER establishes and discloses this Privacy Policy to protect personal information and handle related complaints promptly and smoothly. This policy is effective as of June 1, 2022.',
      sections: [
        { title: 'Effective Date', content: 'This Privacy Policy is effective from September 23, 2025.' },
        {
          title: 'Overview of Processing Purposes (1–5)',
          content: `
1) Membership registration and management: verifying intent, identification/authentication, maintaining membership, preventing misuse, providing notices.

2) Handling civil complaints: confirming identity, verifying issues, contacting for fact-finding, communicating results.

3) Provision of goods/services: providing services, content, customized services, authentication, billing.

4) Marketing/advertising: new services, events, tailored advertising, validity check, usage statistics.

5) Video information: crime prevention and investigation.`,
        },
        {
          title: 'Article 2 (Retention Period)',
          content: `
① DAPER retains and processes personal data within statutory periods or agreed durations.
② Example: Membership data retained permanently.
- Basis: Member management
- Law: Records of credit info collection/use (3 years)`,
        },
        {
          title: 'Article 3 (Items Processed)',
          content: `
- Required: Email, phone, address, password, login ID, name, company info, service usage records, logs, cookies
- Optional: As notified`,
        },
        {
          title: 'Article 4 (Third-Party Provision)',
          content: `
① DAPER provides data only within purpose or with consent/legal basis.
② Example:
- Recipient: DAPER
- Purpose: Verify email, phone, login ID, DOB, name
- Period: 3 years`,
        },
        {
          title: 'Article 5 (Outsourcing)',
          content: `
① DAPER may outsource for smooth operations.
② Contracts follow Article 26 (data protection obligations).
③ Changes disclosed without delay.`,
        },
        {
          title: 'Article 6 (Destruction of Personal Data)',
          content: `
① Data destroyed when no longer needed.
② If required by law, stored separately.
③ Method: Irreversible deletion or shredding.`,
        },
        {
          title: 'Article 7 (Rights of Data Subjects)',
          content: `
① Right to access, correct, delete, suspend.
② Requests via writing, email, fax.
③ Agents may act with power of attorney.
④ Restrictions under law apply.`,
        },
        {
          title: 'Article 8 (Security Measures)',
          content: `
1) Minimized staff, training
2) Security programs, inspections
3) Encryption of sensitive info
4) Locked storage`,
        },
        {
          title: 'Article 9 (Cookies)',
          content: `
① Cookies used for personalized services.
② Purpose: frequency, security, search analytics.
③ Refusal: browser settings.
④ Refusal may limit service.`,
        },
        { title: 'Article 10 (Behavioral Data)', content: 'DAPER does not use behavioral data for ads.' },
        {
          title: 'Article 11 (Additional Use Criteria)',
          content: `
- Relation to original purpose
- Predictability
- No undue infringement
- Security measures`,
        },
        { title: 'Article 12 (Pseudonymized Data)', content: 'Details may be specified (purpose, retention, etc.).' },
        {
          title: 'Article 13 (Data Protection Officer)',
          content: `
- Officer: Kyutae Kim / CEO
- Contact: info@dapercorp.com`,
        },
        { title: 'Article 14 (Domestic Representative)', content: 'May designate a local representative.' },
        { title: 'Article 15 (Access Requests)', content: 'Requests may be submitted to the designated department.' },
        {
          title: 'Article 16 (Remedies)',
          content: `
- Dispute Mediation Committee: 1833-6972
- Personal Info Report Center: 118
- Prosecutors’ Office: 1301
- Police: 182`,
        },
        {
          title: 'Article 17 (CCTV)',
          content: 'Installation purpose, number, retention, etc. must be disclosed.',
        },
        {
          title: 'Article 18 (Changes)',
          content: `
① Effective from September 23, 2025
② Previous versions available separately`,
        },
       
      ],
    },
  };

  const content = privacyContent[language] ?? privacyContent.Korean;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {content.sections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="font-semibold text-lg">{section.title}</h3>
            <pre className="whitespace-pre-wrap text-muted-foreground text-sm">
              {section.content}
            </pre>
          </div>
        ))}

      </CardContent>
    </Card>
  );
}
