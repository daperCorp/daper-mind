
'use server';

import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { z } from 'zod';

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
});

export type GeneratedIdea = {
  title: string;
  summary: string;
  outline: string;
};

export async function generateIdea(prevState: any, formData: FormData): Promise<{ data: GeneratedIdea | null, error: string | null }> {
  const validatedFields = IdeaSchema.safeParse({
    idea: formData.get('idea'),
  });

  if (!validatedFields.success) {
    return {
      data: null,
      error: validatedFields.error.flatten().fieldErrors.idea?.[0] || 'Invalid input.',
    };
  }

  const ideaDescription = validatedFields.data.idea;

  try {
    const [titleResult, summaryResult, outlineResult] = await Promise.all([
      generateIdeaTitle({ ideaDescription }),
      generateIdeaSummary({ idea: ideaDescription }),
      generateIdeaOutline({ idea: ideaDescription }),
    ]);

    return {
      data: {
        title: titleResult.ideaTitle,
        summary: summaryResult.summary,
        outline: outlineResult.outline,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error generating idea:', error);
    return {
      data: null,
      error: 'Failed to generate idea. Please try again.',
    };
  }
}
