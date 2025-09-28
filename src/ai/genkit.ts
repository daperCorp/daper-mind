import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// 여러 환경 변수명 시도
const apiKey = process.env.GOOGLE_GENAI_API_KEY || 
               process.env.GOOGLE_AI_API_KEY || 
               process.env.API_KEY ||
               process.env.GENAI_API_KEY;

console.log('=== GENKIT INIT DEBUG ===');
console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('API')));
console.log('GOOGLE_GENAI_API_KEY:', !!process.env.GOOGLE_GENAI_API_KEY);
console.log('GOOGLE_AI_API_KEY:', !!process.env.GOOGLE_AI_API_KEY);
console.log('API_KEY:', !!process.env.API_KEY);
console.log('Selected API Key at init:', !!apiKey);
console.log('API Key length:', apiKey?.length);
console.log('=========================');

if (!apiKey) {
  throw new Error('GOOGLE_GENAI_API_KEY is missing for server runtime. Please ensure it is set in Firebase Secret Manager and linked in apphosting.yaml.');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey,
    }),
  ],
  model: 'gemini-2.5-flash',
});