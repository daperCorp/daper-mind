'use server';

/**
 * @fileOverview A flow that generates an outline from a user's idea input.
 *
 * - generateIdeaOutline - A function that takes an idea as input and returns an outline.
 * - GenerateIdeaOutlineInput - The input type for the generateIdeaOutline function.
 * - GenerateIdeaOutlineOutput - The return type for the generateIdeaOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIdeaOutlineInputSchema = z.object({
  idea: z.string().describe('The idea to generate an outline for.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated outline.'),
});
export type GenerateIdeaOutlineInput = z.infer<typeof GenerateIdeaOutlineInputSchema>;

const GenerateIdeaOutlineOutputSchema = z.object({
  outline: z.string().describe('The generated outline for the idea.'),
});
export type GenerateIdeaOutlineOutput = z.infer<typeof GenerateIdeaOutlineOutputSchema>;

export async function generateIdeaOutline(input: GenerateIdeaOutlineInput): Promise<GenerateIdeaOutlineOutput> {
  return generateIdeaOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeaOutlinePrompt',
  input: {schema: GenerateIdeaOutlineInputSchema},
  output: {schema: GenerateIdeaOutlineOutputSchema},
  prompt: `You are an expert in generating outlines for ideas.

  Generate an outline for the following idea. The outline must be in {{language}}.

  {{idea}}
  `,
});

const generateIdeaOutlineFlow = ai.defineFlow(
  {
    name: 'generateIdeaOutlineFlow',
    inputSchema: GenerateIdeaOutlineInputSchema,
    outputSchema: GenerateIdeaOutlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
