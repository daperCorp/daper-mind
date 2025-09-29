'use server';

/**
 * @fileOverview A flow that generates a detailed outline from a user's idea input.
 *
 * - generateIdeaOutline - A function that takes an idea as input and returns a comprehensive outline.
 * - GenerateIdeaOutlineInput - The input type for the generateIdeaOutline function.
 * - GenerateIdeaOutlineOutput - The return type for the generateIdeaOutline function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateIdeaOutlineInputSchema = z.object({
  idea: z.string().describe('The idea to generate an outline for.'),
  language: z.enum(['English', 'Korean']).describe('The language for the generated outline.'),
});
export type GenerateIdeaOutlineInput = z.infer<typeof GenerateIdeaOutlineInputSchema>;

const GenerateIdeaOutlineOutputSchema = z.object({
  outline: z.string().describe('The generated detailed outline for the idea in markdown format.'),
});
export type GenerateIdeaOutlineOutput = z.infer<typeof GenerateIdeaOutlineOutputSchema>;

export async function generateIdeaOutline(input: GenerateIdeaOutlineInput): Promise<GenerateIdeaOutlineOutput> {
  return generateIdeaOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateIdeaOutlinePrompt',
  input: { schema: GenerateIdeaOutlineInputSchema },
  output: { schema: GenerateIdeaOutlineOutputSchema },
  prompt: `You are an expert business analyst and idea development specialist.

Generate a comprehensive, detailed outline for the following idea. The outline must be in {{language}}.

**Idea:**
{{idea}}

**Instructions:**
Create a structured outline with the following sections. Each section should contain 3-5 detailed bullet points with specific examples, numbers, or concrete details where applicable.

**Required Structure:**

1. **Core Concept** (핵심 개념)
   - What the idea is and what problem it solves
   - Target users/customers
   - Unique value proposition
   - Key differentiators from existing solutions

2. **Key Features** (주요 기능)
   - 5-7 specific features or capabilities
   - How each feature benefits users
   - Technical or implementation approach (if applicable)
   - Priority level (Must-have vs Nice-to-have)

3. **Target Market** (타겟 시장)
   - Primary target audience (demographics, psychographics)
   - Secondary markets or expansion opportunities
   - Market size estimates (if applicable)
   - Customer pain points this solves

4. **Business Model** (비즈니스 모델)
   - Revenue streams (how it makes money)
   - Pricing strategy or model
   - Cost structure considerations
   - Scalability potential

5. **Go-to-Market Strategy** (시장 진입 전략)
   - Customer acquisition channels
   - Marketing and promotion approach
   - Partnerships or collaborations
   - Launch timeline and phases

6. **Technology/Implementation** (기술/구현)
   - Key technologies or platforms needed
   - Development approach or methodology
   - Resource requirements (team, tools, infrastructure)
   - Technical challenges and solutions

7. **Competitive Advantage** (경쟁 우위)
   - What makes this idea unique
   - Barriers to entry for competitors
   - Sustainable competitive advantages
   - Moats or defensibility

8. **Success Metrics** (성공 지표)
   - Key performance indicators (KPIs)
   - Short-term milestones (3-6 months)
   - Long-term goals (1-3 years)
   - How to measure product-market fit

9. **Risks and Mitigation** (리스크 및 대응)
   - Potential obstacles or challenges
   - Risk mitigation strategies
   - Plan B scenarios
   - Critical assumptions to validate

10. **Next Steps** (다음 단계)
    - Immediate actions to take
    - MVP (Minimum Viable Product) definition
    - Validation experiments to run
    - Resource needs for next phase

**Formatting Guidelines:**
- Use markdown formatting with clear hierarchy (##, ###, -, •)
- Each main section should have a header with both English and Korean if language is Korean
- Each bullet point should be specific and actionable, not generic
- Include numbers, percentages, or concrete examples where possible
- Make it substantial - aim for 800-1200 words total
- Use sub-bullets for additional detail where helpful

Return the result as a JSON object with UTF-8 encoding. The outline field should contain the complete markdown-formatted outline.
`,
});

const generateIdeaOutlineFlow = ai.defineFlow(
  {
    name: 'generateIdeaOutlineFlow',
    inputSchema: GenerateIdeaOutlineInputSchema,
    outputSchema: GenerateIdeaOutlineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);