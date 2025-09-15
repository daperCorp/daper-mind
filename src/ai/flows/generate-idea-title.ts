'use server';

/**
 * @fileOverview A flow that suggests a title for an idea based on user input.
 *
 * - generateIdeaTitle - A function that suggests a title for an idea.
 * - GenerateIdeaTitleInput - The input type for the generateIdeaTitle function.
 * - GenerateIdeaTitleOutput - The return type for the generateIdeaTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateIdeaTitleInputSchema = z.object({
  ideaDescription: z
    .string()
    .describe('The description of the idea for which a title is needed.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated title.'),
});
export type GenerateIdeaTitleInput = z.infer<typeof GenerateIdeaTitleInputSchema>;

const GenerateIdeaTitleOutputSchema = z.object({
  ideaTitle: z.string().describe('The suggested title for the idea.'),
});
export type GenerateIdeaTitleOutput = z.infer<typeof GenerateIdeaTitleOutputSchema>;

export async function generateIdeaTitle(input: GenerateIdeaTitleInput): Promise<GenerateIdeaTitleOutput> {
  return generateIdeaTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeaTitlePrompt',
  input: {schema: GenerateIdeaTitleInputSchema},
  output: {schema: GenerateIdeaTitleOutputSchema},
  prompt: `You are an expert in generating creative and concise titles for ideas.

  Based on the following idea description, suggest a title that captures the essence of the idea.
  The title must be in {{language}}.

  Idea Description: {{{ideaDescription}}}

  Title:`,
});

const generateIdeaTitleFlow = ai.defineFlow(
  {
    name: 'generateIdeaTitleFlow',
    inputSchema: GenerateIdeaTitleInputSchema,
    outputSchema: GenerateIdeaTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
