
'use server';

import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query, doc, getDoc, updateDoc, where, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import type { User } from 'firebase/auth';

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
});

export type GeneratedIdea = {
  id?: string;
  title: string;
  summary: string;
  outline: string;
  favorited?: boolean;
  createdAt?: Date;
  userId?: string;
};

export async function generateIdea(prevState: any, formData: FormData): Promise<{ data: GeneratedIdea | null, error: string | null }> {
  const validatedFields = IdeaSchema.safeParse({
    idea: formData.get('idea'),
    userId: formData.get('userId'),
  });

  if (!validatedFields.success) {
    return {
      data: null,
      error: validatedFields.error.flatten().fieldErrors.idea?.[0] || validatedFields.error.flatten().fieldErrors.userId?.[0] || 'Invalid input.',
    };
  }

  const { idea: ideaDescription, userId } = validatedFields.data;

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
        userId: userId,
    };

    const docRef = await addDoc(collection(db, "ideas"), {
      ...newIdea,
      createdAt: serverTimestamp(),
    });

    revalidatePath('/');
    revalidatePath('/archive');


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

export async function getArchivedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null, error: string | null }> {
    try {
        const ideasCollection = collection(db, 'ideas');
        const q = query(ideasCollection, where("userId", "==", userId), orderBy('createdAt', 'desc'));
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


export async function getFavoritedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null, error: string | null }> {
    try {
        const ideasCollection = collection(db, 'ideas');
        const q = query(ideasCollection, where("userId", "==", userId), where("favorited", "==", true), orderBy('createdAt', 'desc'));
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
        console.error("Error fetching favorited ideas:", error);
        return { data: null, error: "Failed to fetch favorited ideas." };
    }
}

export async function getIdeaById(id: string): Promise<{ data: GeneratedIdea | null, error: string | null }> {
    try {
        const docRef = doc(db, 'ideas', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const idea: GeneratedIdea = {
                id: docSnap.id,
                title: data.title,
                summary: data.summary,
                outline: data.outline,
                favorited: data.favorited,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                userId: data.userId,
            };
            return { data: idea, error: null };
        } else {
            return { data: null, error: "Idea not found." };
        }
    } catch (error) {
        console.error("Error fetching idea:", error);
        return { data: null, error: "Failed to fetch idea." };
    }
}

export async function toggleFavorite(id: string, isFavorited: boolean) {
    try {
        const docRef = doc(db, 'ideas', id);
        await updateDoc(docRef, {
            favorited: isFavorited
        });
        revalidatePath('/archive');
        revalidatePath('/favorites');
        revalidatePath(`/idea/${id}`);
    } catch (error) {
        console.error("Error updating favorite status:", error);
        return { error: "Failed to update favorite status." };
    }
}

export async function upsertUser(user: User): Promise<{ error: string | null }> {
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
        }, { merge: true });
        return { error: null };
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
        return { error: "Failed to save user data." };
    }
}
