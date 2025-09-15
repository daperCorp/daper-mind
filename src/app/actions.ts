
'use server';

import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
});

export type GeneratedIdea = {
  id?: string;
  title: string;
  summary: string;
  outline: string;
  favorited?: boolean;
  createdAt?: Date;
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

    const newIdea: Omit<GeneratedIdea, 'id' | 'createdAt'> = {
        title: titleResult.ideaTitle,
        summary: summaryResult.summary,
        outline: outlineResult.outline,
        favorited: false,
    };

    const docRef = await addDoc(collection(db, "ideas"), {
      ...newIdea,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/');

    return {
      data: {
        id: docRef.id,
        ...newIdea,
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

export async function getArchivedIdeas(): Promise<{ data: GeneratedIdea[] | null, error: string | null }> {
    try {
        const ideasCollection = collection(db, 'ideas');
        const q = query(ideasCollection, orderBy('createdAt', 'desc'));
        const ideaSnapshot = await getDocs(q);
        const ideas = ideaSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                summary: data.summary,
                outline: data.outline,
                favorited: data.favorited,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
            };
        });
        return { data: ideas, error: null };
    } catch (error) {
        console.error("Error fetching archived ideas:", error);
        return { data: null, error: "Failed to fetch archived ideas." };
    }
}
