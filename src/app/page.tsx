"use client";

import React from "react";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import IdeaHero from '@/components/idea-hero';
export default function DaperLanding() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Daper",
    url: "https://www.dapercorp.com",
    logo: "https://github.com/kyutae96/daper-website/blob/master/assets/daper-logo.png",
  };

  return (
    <>
      <Head>
        <title>Daper - 소프트웨어 솔루션의 시작</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <style>{`
          body { font-family: 'Inter', sans-serif; }
          .hero-dot { animation: pulse-dot 2s infinite; }
          @keyframes pulse-dot { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.2);opacity:1} }
          .fade-in { animation: fadeIn .8s ease-in; }
          @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          .card-hover { transition: all .3s ease; }
          .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,.1); }
        `}</style>
      </Head>

      <div className="bg-gray-50 min-h-screen flex flex-col">
        <Navbar />

        <main className="flex-grow flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-2xl text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-lg">
                  <div className="hero-dot h-4 w-4 rounded-full bg-blue-600" />
                </div>
                <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-yellow-400 opacity-70" />
                <div className="absolute -bottom-3 -left-3 h-8 w-8 rounded-full bg-green-400 opacity-50" />
              </div>
            </div>
            <h1 className="fade-in mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
              아이디어의 시작, <span className="text-blue-600">Daper</span>
            </h1>
            <p className="fade-in mx-auto mb-8 max-w-3xl text-xl text-gray-600 md:text-2xl">
              종이 위의 작은 점에서 시작되는 혁신적인 소프트웨어 솔루션
            </p>
            <p className="fade-in mx-auto mb-10 max-w-2xl text-lg text-gray-500">
              Dot + Paper = Daper
              <br />
              모든 위대한 아이디어는 종이 위의 한 점에서 시작됩니다
            </p>
           
            <main className="flex-grow flex items-center justify-center p-4 pt-20">
  <div className="w-full max-w-2xl text-center">
    {}
    {}
    <IdeaHero />
  </div>
</main>

          </div>
        </main>

        {/* Services */}
        <section id="services" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                우리의 서비스
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                작은 아이디어를 큰 성공으로 만드는 소프트웨어 솔루션을 제공합니다
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Card 1 */}
              <div className="card-hover rounded-xl bg-gray-50 p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100">
                  <svg
                    className="h-8 w-8 text-blue-600"
                    fill="none"
                     stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  아이디어 구현
                </h3>
                <p className="text-gray-600">
                  종이 위의 스케치부터 완성된 소프트웨어까지, 아이디어를 현실로
                  만들어드립니다.
                </p>
              </div>

              {/* Card 2 */}
              <div className="card-hover rounded-xl bg-gray-50 p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"aria-hidden>
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
</svg>
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  맞춤형 솔루션
                </h3>
                <p className="text-gray-600">
                  각 기업의 고유한 요구사항에 맞는 맞춤형 소프트웨어 솔루션을
                  개발합니다.
                </p>
              </div>

              {/* Card 3 */}
              <div className="card-hover rounded-xl bg-gray-50 p-8">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg bg-purple-100">
                  <svg
                    className="h-8 w-8 text-purple-600"
                    fill="none"
                     stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 text-xl font-semibold text-gray-900">
                  빠른 개발
                </h3>
                <p className="text-gray-600">
                  효율적인 개발 프로세스로 빠르고 안정적인 소프트웨어를
                  제공합니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
                  Daper 이야기
                </h2>
                <p className="mb-6 text-lg text-gray-600">
                  Daper는 'Dot'과 'Paper'의 합성어로, 모든 혁신적인 아이디어가 종이
                  위의 작은 점에서 시작된다는 철학을 담고 있습니다.
                </p>
                <p className="mb-6 text-lg text-gray-600">
                  우리는 고객의 작은 아이디어를 소중히 여기며, 그것을 현실적이고
                  실용적인 소프트웨어 솔루션으로 발전시키는 것을 사명으로 합니다.
                </p>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600">기술 지원</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="rounded-2xl bg-white p-8 shadow-lg">
                  <div className="mb-6 grid grid-cols-4 gap-4">
                    <div className="h-2 w-full rounded bg-blue-200" />
                    <div className="h-2 w-full rounded bg-blue-400" />
                    <div className="h-2 w-full rounded bg-blue-600" />
                    <div className="h-2 w-full rounded bg-blue-800" />
                  </div>
                  <div className="space-y-4">
                    {[
                      "아이디어 수집 및 분석",
                      "설계 및 프로토타입",
                      "개발 및 테스트",
                      "배포 및 유지보수",
                    ].map((t) => (
                      <div key={t} className="flex items-center space-x-3">
                        <div className="h-3 w-3 rounded-full bg-blue-600" />
                        <span className="text-gray-700">{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div>
              <h3 className="mb-6 text-2xl font-semibold text-gray-900">
                연락 정보
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                       stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">주소</h4>
                    <p className="text-gray-600">경기도 김포시 유현로 200, Daper</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                       stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">이메일</h4>
                    <p className="text-gray-600">info@dapercorp.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
                    <svg
                      className="h-6 w-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">운영시간</h4>
                    <p className="text-gray-600">
                      평일 09:00 - 18:00
                      <br />
                      주말 및 공휴일 휴무
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-12 text-white mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
              <div className="col-span-2">
                <div className="mb-4 flex items-center">
                  <img
                    src="assets/daper-logo-white.png"
                    alt="Daper 로고"
                    className="mr-3 h-10"
                  />
                  <span className="text-2xl font-bold text-gray-900">Daper</span>
                </div>
                <p className="mb-4 text-gray-400">
                  종이 위의 작은 점에서 시작되는 혁신적인 소프트웨어 솔루션
                </p>
                <p className="text-sm text-gray-500">
                  대표자 김규태
                </p>
                <p className="text-sm text-gray-500">
                  © 2025 Daper. All rights reserved.
                </p>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">서비스</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <p className="text-gray-400">프로그램 교육</p>
                  </li>
                  <li>
                    <p className="text-gray-400">모바일 앱</p>
                  </li>
                  <li>
                    <p className="text-gray-400">소프트웨어 프로그램</p>
                  </li>
                  <li>
                    <p className="text-gray-400">컨설팅</p>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="mb-4 font-semibold">회사</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>
                    <Link href="/privacy-policy" className="transition-colors hover:text-white">
                      개인정보처리방침
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://youtube.com/shorts/ewkhxr-xJz4?si=fPeclS4V4VRb7TVT"
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-white"
                    >
                      YouTube
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/dapercorp"
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-white"
                    >
                      Instagram
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}