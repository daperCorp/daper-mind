
'use server';

/**
 * @fileOverview A flow that generates a mind map from a user's idea input.
 *
 * - generateIdeaMindMap - A function that takes an idea and returns a mind map.
 * - GenerateIdeaMindMapInput - The input type for the generateIdeaMindMap function.
 * - GenerateIdeaMindMapOutput - The return type for the generateIdeaMindMap function.
 * - MindMapNode - The type for a single node in the mind map.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIdeaMindMapInputSchema = z.object({
  idea: z.string().describe('The idea to generate a mind map for.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated mind map.'),
});
export type GenerateIdeaMindMapInput = z.infer<typeof GenerateIdeaMindMapInputSchema>;

const L4NodeSchema = z.object({
  title: z.string().describe('The title of the level 4 mind map node.'),
});

const L3NodeSchema = z.object({
  title: z.string().describe('The title of the level 3 mind map node.'),
  children: z.array(L4NodeSchema).optional().describe('An array of level 4 child nodes.'),
});

const L2NodeSchema = z.object({
  title: z.string().describe('The title of the level 2 mind map node.'),
  children: z.array(L3NodeSchema).optional().describe('An array of level 3 child nodes.'),
});

const L1NodeSchema = z.object({
  title: z.string().describe('The title of the central idea (level 1 node).'),
  children: z.array(L2NodeSchema).optional().describe('An array of level 2 child nodes.'),
});

export type MindMapNode = z.infer<typeof L1NodeSchema>;

const GenerateIdeaMindMapOutputSchema = z.object({
  mindMap: L1NodeSchema.describe('The generated mind map for the idea, with exactly four hierarchical levels.'),
});
export type GenerateIdeaMindMapOutput = z.infer<typeof GenerateIdeaMindMapOutputSchema>;

export async function generateIdeaMindMap(input: GenerateIdeaMindMapInput): Promise<GenerateIdeaMindMapOutput> {
  return generateIdeaMindMapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeaMindMapPrompt',
  input: { schema: GenerateIdeaMindMapInputSchema },
  output: { schema: GenerateIdeaMindMapOutputSchema },
  prompt: `You are an expert in creating structured mind maps from ideas.

  Generate a mind map for the following idea. The mind map must be in {{language}}.
  The mind map must have exactly four hierarchical levels:
  1. A single root node representing the central idea.
  2. Main branches (level 2) extending from the root.
  3. Sub-branches (level 3) extending from the level 2 branches.
  4. Deeper sub-branches (level 4) extending from the level 3 branches. Do not create a level 5.
  Return the result as a JSON object with UTF-8 encoding.

  Idea: {{idea}}
  `,
});

const generateIdeaMindMapFlow = ai.defineFlow(
  {
    name: 'generateIdeaMindMapFlow',
    inputSchema: GenerateIdeaMindMapInputSchema,
    outputSchema: GenerateIdeaMindMapOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
