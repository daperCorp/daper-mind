import React from 'react';

interface OutlineDisplayProps {
  outline: string;
}

export function OutlineDisplay({ outline }: OutlineDisplayProps) {
  // 마크다운 텍스트를 파싱하여 구조화된 JSX로 변환
  const parseOutline = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // 빈 줄 처리
      if (!trimmedLine) {
        elements.push(<div key={`space-${index}`} className="h-3" />);
        return;
      }

      // H1 (# )
      if (trimmedLine.startsWith('# ')) {
        const text = trimmedLine.substring(2);
        elements.push(
          <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4 pb-2 border-b-2 border-blue-200">
            {text}
          </h1>
        );
        return;
      }

      // H2 (## )
      if (trimmedLine.startsWith('## ')) {
        const text = trimmedLine.substring(3);
        elements.push(
          <h2 key={index} className="text-xl font-bold text-gray-800 mt-5 mb-3 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
            {text}
          </h2>
        );
        return;
      }

      // H3 (### )
      if (trimmedLine.startsWith('### ')) {
        const text = trimmedLine.substring(4);
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-700 mt-4 mb-2 flex items-center gap-2">
            <div className="w-1 h-5 bg-purple-400 rounded-full"></div>
            {text}
          </h3>
        );
        return;
      }

      // H4 (#### )
      if (trimmedLine.startsWith('#### ')) {
        const text = trimmedLine.substring(5);
        elements.push(
          <h4 key={index} className="text-base font-semibold text-gray-600 mt-3 mb-2 flex items-center gap-2">
            <div className="w-0.5 h-4 bg-indigo-300 rounded-full"></div>
            {text}
          </h4>
        );
        return;
      }

      // 번호 있는 리스트 (1. , 2. 등)
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
      if (numberedMatch) {
        const [, number, text] = numberedMatch;
        elements.push(
          <div key={index} className="flex items-start gap-3 ml-4 mb-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
              {number}
            </div>
            <p className="flex-1 text-gray-700 leading-relaxed pt-0.5">{parseInlineMarkdown(text)}</p>
          </div>
        );
        return;
      }

      // 불릿 리스트 (- 또는 * )
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
        const text = trimmedLine.substring(2);
        const indentLevel = line.search(/\S/);
        const marginLeft = Math.floor(indentLevel / 2) * 4;
        
        elements.push(
          <div key={index} className="flex items-start gap-2 mb-2" style={{ marginLeft: `${marginLeft}px` }}>
            <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></div>
            <p className="flex-1 text-gray-700 leading-relaxed">{parseInlineMarkdown(text)}</p>
          </div>
        );
        return;
      }

      // 인용구 (> )
      if (trimmedLine.startsWith('> ')) {
        const text = trimmedLine.substring(2);
        elements.push(
          <blockquote key={index} className="border-l-4 border-blue-400 pl-4 py-2 my-3 bg-blue-50/50 rounded-r">
            <p className="text-gray-700 italic">{parseInlineMarkdown(text)}</p>
          </blockquote>
        );
        return;
      }

      // 코드 블록 (```)
      if (trimmedLine.startsWith('```')) {
        elements.push(
          <div key={index} className="bg-gray-100 rounded-lg p-4 my-3 font-mono text-sm text-gray-800 border border-gray-200">
            {trimmedLine.substring(3)}
          </div>
        );
        return;
      }

      // 일반 텍스트
      elements.push(
        <p key={index} className="text-gray-700 leading-relaxed mb-2">
          {parseInlineMarkdown(trimmedLine)}
        </p>
      );
    });

    return elements;
  };

  // 인라인 마크다운 파싱 (볼드, 이탤릭 등)
  const parseInlineMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    let remaining = text;

    // **볼드** 처리
    const segments = remaining.split(/(\*\*.*?\*\*)/g);
    
    segments.forEach((segment, idx) => {
      if (!segment) return;
      
      // 볼드 패턴 확인
      const boldMatch = segment.match(/^\*\*(.*?)\*\*$/);
      if (boldMatch) {
        parts.push(
          <strong key={`bold-${idx}-${key++}`} className="font-bold text-gray-900">
            {boldMatch[1]}
          </strong>
        );
      } else {
        // 이탤릭 처리 (*텍스트*)
        const italicSegments = segment.split(/(\*.*?\*)/g);
        
        italicSegments.forEach((italicSeg, italicIdx) => {
          if (!italicSeg) return;
          
          const italicMatch = italicSeg.match(/^\*(.*?)\*$/);
          if (italicMatch && !italicSeg.includes('**')) {
            parts.push(
              <em key={`italic-${idx}-${italicIdx}-${key++}`} className="italic text-gray-800">
                {italicMatch[1]}
              </em>
            );
          } else if (italicSeg) {
            parts.push(italicSeg);
          }
        });
      }
    });

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="outline-display space-y-1">
      {parseOutline(outline)}
    </div>
  );
}