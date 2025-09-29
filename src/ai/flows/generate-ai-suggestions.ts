'use server';

/**
 * @fileOverview AI flow for generating improvement suggestions for ideas.
 * 
 * - generateAISuggestions - A function that analyzes an idea and returns improvement suggestions
 * - GenerateAISuggestionsInput - The input type for the generateAISuggestions function
 * - GenerateAISuggestionsOutput - The return type for the generateAISuggestions function
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateAISuggestionsInputSchema = z.object({
  ideaId: z.string().describe('The ID of the idea to analyze.'),
  title: z.string().describe('The title of the idea.'),
  summary: z.string().describe('The summary of the idea.'),
  outline: z.string().describe('The detailed outline of the idea.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated suggestions.'),
});

export type GenerateAISuggestionsInput = z.infer<typeof GenerateAISuggestionsInputSchema>;

const AISuggestionSchema = z.object({
  id: z.string().describe('Unique identifier for the suggestion.'),
  type: z.enum(['enhancement', 'market', 'risk', 'implementation']).describe('The category type of the suggestion.'),
  title: z.string().describe('The title of the suggestion.'),
  description: z.string().describe('A detailed description of the suggestion.'),
  priority: z.enum(['high', 'medium', 'low']).describe('The priority level of the suggestion.'),
  category: z.string().describe('The specific category label (e.g., "UX/UI", "Marketing", "Security").'),
  reasoning: z.string().describe('The AI reasoning and analysis behind this suggestion.'),
  actionItems: z.array(z.string()).describe('Concrete action items to implement this suggestion.'),
  impact: z.number().min(1).max(10).describe('The impact score from 1-10.'),
});

const GenerateAISuggestionsOutputSchema = z.object({
  strengths: z.array(z.string()).describe('Array of strengths identified in the idea.'),
  weaknesses: z.array(z.string()).describe('Array of weaknesses identified in the idea.'),
  opportunities: z.array(z.string()).describe('Array of opportunities for the idea.'),
  threats: z.array(z.string()).describe('Array of threats facing the idea.'),
  marketPotential: z.number().min(0).max(10).describe('Market potential score from 0-10.'),
  feasibilityScore: z.number().min(0).max(10).describe('Feasibility score from 0-10.'),
  suggestions: z.array(AISuggestionSchema).describe('Array of 5 concrete improvement suggestions.'),
});

export type GenerateAISuggestionsOutput = z.infer<typeof GenerateAISuggestionsOutputSchema>;

export async function generateAISuggestions(input: GenerateAISuggestionsInput): Promise<GenerateAISuggestionsOutput> {
  return generateAISuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAISuggestionsPrompt',
  input: { schema: GenerateAISuggestionsInputSchema },
  output: { schema: GenerateAISuggestionsOutputSchema },
  prompt: `You are an expert business strategist and startup advisor specializing in idea validation and improvement.

Analyze the following idea and provide comprehensive feedback in {{language}}.

**Idea Details:**
Title: {{title}}
Summary: {{summary}}
Outline: {{outline}}

**Your Task:**
1. Conduct a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
   - Provide 3-4 points for each category
   - Be specific and actionable

2. Evaluate the idea on two dimensions:
   - Market Potential (0-10): Consider market size, demand, competition, and growth trends
   - Feasibility Score (0-10): Consider technical complexity, resources needed, timeline, and barriers

3. Generate exactly 5 concrete improvement suggestions:
   - Mix of types: at least 1 enhancement, 1 market strategy, 1 risk mitigation, 1 implementation advice
   - Each suggestion must have:
     * A clear, actionable title
     * Detailed description (2-3 sentences)
     * Priority level (high/medium/low)
     * Specific category label
     * AI reasoning with data or examples (2-3 sentences)
     * 3-5 concrete action items
     * Impact score (1-10)

**Guidelines:**
- Be honest and constructive in your analysis
- Provide specific, actionable advice rather than generic suggestions
- Consider real-world market trends and competitor analysis
- Support your reasoning with data, statistics, or examples when possible
- Focus on practical next steps the user can implement

Return the result as a JSON object with UTF-8 encoding.
`,
});

const generateAISuggestionsFlow = ai.defineFlow(
  {
    name: 'generateAISuggestionsFlow',
    inputSchema: GenerateAISuggestionsInputSchema,
    outputSchema: GenerateAISuggestionsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);