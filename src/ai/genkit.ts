import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Explicitly initialize Genkit at the top-level
genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: 'googleai/gemini-1.5-flash-latest',
});
