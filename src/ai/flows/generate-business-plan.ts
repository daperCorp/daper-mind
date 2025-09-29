// ai/flows/generate-business-plan.ts
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBusinessPlanInputSchema = z.object({
  ideaId: z.string().describe('The ID of the idea.'),
  title: z.string().describe('The title of the idea.'),
  summary: z.string().describe('The summary of the idea.'),
  outline: z.string().describe('The detailed outline of the idea.'),
  aiSuggestions: z.any().optional().describe('AI suggestions if available.'),
  language: z.enum(['English', 'Korean']).describe('The language for the business plan.'),
});

export type GenerateBusinessPlanInput = z.infer<typeof GenerateBusinessPlanInputSchema>;

const BusinessPlanSectionSchema = z.object({
  id: z.string().describe('Section identifier (e.g., "executive-summary").'),
  title: z.string().describe('Section title.'),
  content: z.string().describe('Section content in markdown format.'),
});

const GenerateBusinessPlanOutputSchema = z.object({
  sections: z.array(BusinessPlanSectionSchema).describe('Array of business plan sections.'),
  metadata: z.object({
    targetMarket: z.string().describe('Primary target market.'),
    businessModel: z.string().describe('Business model type.'),
    fundingNeeded: z.string().describe('Estimated funding needed.'),
    timeToMarket: z.string().describe('Estimated time to market.'),
  }),
});

export type GenerateBusinessPlanOutput = z.infer<typeof GenerateBusinessPlanOutputSchema>;

export async function generateBusinessPlan(input: GenerateBusinessPlanInput): Promise<GenerateBusinessPlanOutput> {
  return generateBusinessPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessPlanPrompt',
  input: { schema: GenerateBusinessPlanInputSchema },
  output: { schema: GenerateBusinessPlanOutputSchema },
  prompt: `You are an expert business plan consultant with experience helping startups and entrepreneurs.

Create a comprehensive business plan in {{language}} for the following idea:

**Idea Details:**
Title: {{title}}
Summary: {{summary}}
Outline: {{outline}}
{{#if aiSuggestions}}AI Analysis: Available{{/if}}

**Generate the following sections:**

1. **executive-summary** (경영진 요약 / Executive Summary)
   - Business overview (2-3 paragraphs)
   - Core value proposition
   - Market opportunity (with numbers if possible)
   - Financial highlights (Year 1 & Year 3 targets)
   - Funding requirements

2. **problem-solution** (문제와 해결책 / Problem & Solution)
   - Problem statement (what pain points exist?)
   - Current alternatives and their limitations
   - Your solution and why it's better
   - Unique value proposition

3. **market-analysis** (시장 분석 / Market Analysis)
   - TAM, SAM, SOM breakdown with numbers
   - Market trends (3-5 key trends)
   - Target customer segments (detailed personas)
   - Competitive landscape (direct & indirect competitors)
   - Competitive advantages

4. **business-model** (비즈니스 모델 / Business Model)
   - Revenue streams (how you make money)
   - Pricing strategy with examples
   - Customer acquisition strategy
   - Sales & distribution channels
   - Key partnerships

5. **marketing-strategy** (마케팅 전략 / Marketing Strategy)
   - Target audience definition
   - Marketing channels (digital, content, partnerships, etc.)
   - Customer acquisition cost (CAC) estimates
   - Brand positioning
   - Go-to-market timeline

6. **operations-plan** (운영 계획 / Operations Plan)
   - Team structure (founding team + future hires)
   - Key operational processes
   - Technology stack (if applicable)
   - Suppliers/vendors
   - Location/facilities

7. **financial-projections** (재무 계획 / Financial Projections)
   - 3-year revenue projections (Year 1, 2, 3)
   - Cost structure breakdown
   - Key assumptions
   - Break-even analysis
   - Funding requirements and use of funds

8. **milestones-timeline** (마일스톤 / Milestones & Timeline)
   - Product development milestones
   - Market entry timeline
   - Key metrics and KPIs
   - 18-month roadmap

9. **risk-analysis** (위험 분석 / Risk Analysis)
   - Market risks and mitigation
   - Operational risks and mitigation
   - Financial risks and mitigation
   - Regulatory/legal considerations

10. **appendix** (부록 / Appendix)
    - Additional market research
    - Technical specifications (if applicable)
    - Team bios
    - References

**Guidelines:**
- Write in professional business language
- Include specific numbers, percentages, and data where possible
- Make realistic projections based on industry standards
- Each section should be 300-500 words
- Use markdown formatting for clarity
- Be specific and actionable
- Consider the AI suggestions if provided

**Metadata:**
Also provide:
- targetMarket: One sentence describing the primary market
- businessModel: One sentence describing the business model
- fundingNeeded: Estimated amount (e.g., "$500K seed round")
- timeToMarket: Estimated time (e.g., "6-9 months")

Return as JSON with proper UTF-8 encoding.
`,
});

const generateBusinessPlanFlow = ai.defineFlow(
  {
    name: 'generateBusinessPlanFlow',
    inputSchema: GenerateBusinessPlanInputSchema,
    outputSchema: GenerateBusinessPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);