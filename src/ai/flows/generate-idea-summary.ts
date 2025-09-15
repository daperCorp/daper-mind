
'use server';

/**
 * @fileOverview Generates a summary of a user's idea using Genkit.
 *
 * - generateIdeaSummary - A function that generates a summary of an idea.
 * - GenerateIdeaSummaryInput - The input type for the generateIdeaSummary function.
 * - GenerateIdeaSummaryOutput - The return type for the generateIdeaSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIdeaSummaryInputSchema = z.object({
  idea: z.string().describe('The idea to summarize.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated summary.'),
});
export type GenerateIdeaSummaryInput = z.infer<typeof GenerateIdeaSummaryInputSchema>;

const GenerateIdeaSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the idea.'),
});
export type GenerateIdeaSummaryOutput = z.infer<typeof GenerateIdeaSummaryOutputSchema>;

export async function generateIdeaSummary(input: GenerateIdeaSummaryInput): Promise<GenerateIdeaSummaryOutput> {
  return generateIdeaSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeaSummaryPrompt',
  input: {schema: GenerateIdeaSummaryInputSchema},
  output: {schema: GenerateIdeaSummaryOutputSchema},
  prompt: `Summarize the following idea in a concise manner. The summary must be in {{language}}. Return the result as a JSON object with UTF-8 encoding:\n\n{{{idea}}}`,
});

const generateIdeaSummaryFlow = ai.defineFlow(
  {
    name: 'generateIdeaSummaryFlow',
    inputSchema: GenerateIdeaSummaryInputSchema,
    outputSchema: GenerateIdeaSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
