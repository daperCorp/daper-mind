import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

const key = process.env.GOOGLE_GENAI_API_KEY;
if (!key) {
  throw new Error('GOOGLE_GENAI_API_KEY is missing for server runtime. Please ensure it is set in Firebase Secret Manager and linked in apphosting.yaml.');
}

genkit({
  plugins: [googleAI({ apiKey: key })],
  model: 'googleai/gemini-1.5-flash-latest',
});
