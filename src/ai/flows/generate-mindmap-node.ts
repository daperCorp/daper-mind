'use server';

/**
 * @fileOverview A flow that generates new child nodes for a mind map based on a parent node.
 *
 * - generateMindMapNode - A function that takes a parent node's title and the overall idea context to generate new child nodes.
 * - GenerateMindMapNodeInput - The input type for the generateMindMapNode function.
 * - GenerateMindMapNodeOutput - The return type for the generateMindMapNode function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const L3NodeSchema = z.object({
  title: z.string().describe('The title of the level 3 mind map node.'),
});

const GenerateMindMapNodeInputSchema = z.object({
  ideaContext: z.string().describe('The original idea or summary for overall context.'),
  parentNodeTitle: z.string().describe('The title of the parent node to generate children for.'),
  existingChildrenTitles: z.array(z.string()).describe('A list of titles of existing child nodes to avoid duplicates.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated nodes.'),
});
export type GenerateMindMapNodeInput = z.infer<typeof GenerateMindMapNodeInputSchema>;


const GenerateMindMapNodeOutputSchema = z.object({
  newNodes: z.array(L3NodeSchema).describe('An array of newly generated child nodes.'),
});
export type GenerateMindMapNodeOutput = z.infer<typeof GenerateMindMapNodeOutputSchema>;

export async function generateMindMapNode(input: GenerateMindMapNodeInput): Promise<GenerateMindMapNodeOutput> {
  return generateMindMapNodeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMindMapNodePrompt',
  input: { schema: GenerateMindMapNodeInputSchema },
  output: { schema: GenerateMindMapNodeOutputSchema },
  prompt: `You are an expert in brainstorming and expanding on ideas within a mind map structure.

  The user is working on a mind map for the following core idea:
  "{{ideaContext}}"

  They want to add new sub-nodes to the parent node titled: "{{parentNodeTitle}}".

  The parent node already has the following sub-nodes:
  {{#if existingChildrenTitles}}
  {{#each existingChildrenTitles}}
  - {{this}}
  {{/each}}
  {{else}}
  (No existing sub-nodes)
  {{/if}}

  Based on the parent node and the overall idea context, generate a few new, distinct, and relevant sub-nodes.
  Do not repeat any of the existing sub-nodes. The new nodes must be in {{language}}.
  `,
});

const generateMindMapNodeFlow = ai.defineFlow(
  {
    name: 'generateMindMapNodeFlow',
    inputSchema: GenerateMindMapNodeInputSchema,
    outputSchema: GenerateMindMapNodeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
