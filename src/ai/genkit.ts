import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// 환경 변수를 먼저 읽기
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
console.log('=== GENKIT INIT DEBUG ===');
console.log('API Key at init:', !!apiKey);
console.log('API Key length:', apiKey?.length);
console.log('=========================');

if (!apiKey) {
  throw new Error('GOOGLE_GENAI_API_KEY is missing for server runtime');
}

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: apiKey, // 함수 대신 직접 전달
    }),
  ],
  model: 'googleai/gemini-1.5-flash-latest',
});