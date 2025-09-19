
'use server';

import '@/ai'; // Import to register flows
import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { generateIdeaMindMap, type MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { generateMindMapNode } from '@/ai/flows/generate-mindmap-node';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, doc, getDoc, updateDoc, where, setDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
  language: z.enum(['English', 'Korean']),
});

export type GeneratedIdea = {
  id?: string;
  title: string;
  summary: string;
  outline: string;
  mindMap?: MindMapNode;
  favorited?: boolean;
  createdAt?: Date;
  userId?: string;
  language?: 'English' | 'Korean';
};

// Recursive function to find and update a node
const findAndModifyNode = (
    node: any,
    targetTitle: string,
    action: (node: any, parent?: any, index?: number) => boolean,
    parent?: any,
    index?: number
): boolean => {
    if (node.title === targetTitle) {
        return action(node, parent, index);
    }
    if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
            if (findAndModifyNode(node.children[i], targetTitle, action, node, i)) {
                return true;
            }
        }
    }
    return false;
};


export async function generateIdea(prevState: any, formData: FormData): Promise<{ data: GeneratedIdea | null, error: string | null }> {
  const validatedFields = IdeaSchema.safeParse({
    idea: formData.get('idea'),
    userId: formData.get('userId'),
    language: formData.get('language'),
  });

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    return {
      data: null,
      error: fieldErrors.idea?.[0] || fieldErrors.userId?.[0] || fieldErrors.language?.[0] || 'Invalid input.',
    };
  }

  const { idea: ideaDescription, userId, language } = validatedFields.data;

  try {
    console.log('Attempting to generate idea components...');
    const [titleResult, summaryResult, outlineResult] = await Promise.all([
      generateIdeaTitle({ ideaDescription, language }),
      generateIdeaSummary({ idea: ideaDescription, language }),
      generateIdeaOutline({ idea: ideaDescription, language }),
    ]);
    console.log('Title Result:', titleResult);
    console.log('Summary Result:', summaryResult);
    console.log('Outline Result:', outlineResult);

    const newIdea: Omit<GeneratedIdea, 'id' | 'createdAt'> = {
        title: titleResult.ideaTitle,
        summary: summaryResult.summary,
        outline: outlineResult.outline,
        favorited: false,
        userId: userId,
        language: language,
    };

    console.log('Attempting to add document to Firestore:', newIdea);
    const docRef = await addDoc(collection(db, "ideas"), {
      ...newIdea,
      createdAt: serverTimestamp(),
    });
    console.log('Document added with ID:', docRef.id);

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
        const q = query(ideasCollection, where("userId", "==", userId));
        const ideaSnapshot = await getDocs(q);
        const ideas = ideaSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                summary: data.summary,
                outline: data.outline,
                mindMap: data.mindMap,
                favorited: data.favorited,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                language: data.language || 'English',
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
        const q = query(ideasCollection, where("userId", "==", userId), where("favorited", "==", true));
        const ideaSnapshot = await getDocs(q);
        const ideas = ideaSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                summary: data.summary,
                outline: data.outline,
                mindMap: data.mindMap,
                favorited: data.favorited,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                language: data.language || 'English',
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
                mindMap: data.mindMap,
                favorited: data.favorited,
                createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
                userId: data.userId,
                language: data.language || 'English',
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

export async function regenerateMindMap(ideaId: string, ideaSummary: string, language: 'English' | 'Korean'): Promise<{ success: boolean, newMindMap: MindMapNode | null, error: string | null }> {
    try {
        if (!ideaId || !ideaSummary) {
            throw new Error('Idea ID and summary are required.');
        }

        const mindMapResult = await generateIdeaMindMap({ idea: ideaSummary, language });

        const docRef = doc(db, 'ideas', ideaId);
        await updateDoc(docRef, {
            mindMap: mindMapResult.mindMap,
        });

        revalidatePath(`/idea/${ideaId}`);
        revalidatePath(`/idea/${ideaId}/mindmap`);
        revalidatePath('/archive');

        return { success: true, newMindMap: mindMapResult.mindMap, error: null };
    } catch (error) {
        console.error('Error regenerating mind map:', error);
        return { success: false, newMindMap: null, error: 'Failed to regenerate mind map. Please try again.' };
    }
}

export type SerializableUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
};

export async function upsertUser(user: SerializableUser): Promise<{ error: string | null }> {
    try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
            ...user,
            lastLogin: serverTimestamp(),
        }, { merge: true });
        return { error: null };
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
        return { error: "Failed to save user data." };
    }
}

export async function expandMindMapNode(
    ideaId: string,
    ideaContext: string,
    parentNodeTitle: string,
    existingChildrenTitles: string[],
    language: 'English' | 'Korean'
): Promise<{ success: boolean, newNodes?: { title: string }[], error?: string }> {
    try {
        const { newNodes } = await generateMindMapNode({
            ideaContext,
            parentNodeTitle,
            existingChildrenTitles,
            language,
        });

        if (newNodes && newNodes.length > 0) {
            const ideaRef = doc(db, 'ideas', ideaId);
            const ideaSnap = await getDoc(ideaRef);
            if (!ideaSnap.exists()) {
                throw new Error('Idea not found');
            }

            const ideaData = ideaSnap.data();
            const mindMap = ideaData.mindMap as MindMapNode;

            // Recursive function to find the parent node and add new children
            const findAndAdd = (node: any): boolean => {
                if (node.title === parentNodeTitle) {
                    if (!node.children) node.children = [];
                    node.children.push(...newNodes);
                    return true;
                }
                if (node.children) {
                    for (const child of node.children) {
                        if (findAndAdd(child)) return true;
                    }
                }
                return false;
            };

            if (findAndAdd(mindMap)) {
                await updateDoc(ideaRef, { mindMap });
                revalidatePath(`/idea/${ideaId}/mindmap`);
            } else {
                // This case should ideally not happen if the UI is in sync
                throw new Error('Parent node not found in mind map');
            }
        }

        return { success: true, newNodes };

    } catch (error) {
        console.error('Error expanding mind map node:', error);
        return { success: false, error: 'Failed to generate new nodes.' };
    }
}

export async function addManualMindMapNode(ideaId: string, parentNodeTitle: string, newNodeTitle: string): Promise<{ success: boolean, error?: string }> {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        const ideaSnap = await getDoc(ideaRef);
        if (!ideaSnap.exists()) {
            throw new Error('Idea not found');
        }
        const ideaData = ideaSnap.data();
        const mindMap = ideaData.mindMap as MindMapNode;

        const success = findAndModifyNode(mindMap, parentNodeTitle, (node) => {
            if (!node.children) node.children = [];
            node.children.push({ title: newNodeTitle, children: [] });
            return true;
        });

        if (success) {
            await updateDoc(ideaRef, { mindMap });
            revalidatePath(`/idea/${ideaId}/mindmap`);
            return { success: true };
        } else {
            throw new Error('Parent node not found');
        }
    } catch (error: any) {
        console.error('Error adding manual mind map node:', error);
        return { success: false, error: error.message || 'Failed to add node.' };
    }
}

export async function editMindMapNode(ideaId: string, nodePath: string, newNodeTitle: string): Promise<{ success: boolean, error?: string }> {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        const ideaSnap = await getDoc(ideaRef);
        if (!ideaSnap.exists()) {
            throw new Error('Idea not found');
        }
        const ideaData = ideaSnap.data();
        const mindMap = ideaData.mindMap as MindMapNode;

        const pathSegments = nodePath.split('>');
        let currentNode: any = mindMap;
        
        for (let i = 0; i < pathSegments.length; i++) {
             if (i === 0) {
                if (currentNode.title !== pathSegments[i]) {
                    throw new Error("Root node doesn't match path");
                }
            } else {
                 const childIndex = currentNode.children?.findIndex((c: any) => c.title === pathSegments[i]);
                if (childIndex === -1 || !currentNode.children) {
                    throw new Error(`Node not found at path segment: ${pathSegments[i]}`);
                }
                currentNode = currentNode.children[childIndex];
            }
        }

        currentNode.title = newNodeTitle;
        
        await updateDoc(ideaRef, { mindMap });
        revalidatePath(`/idea/${ideaId}/mindmap`);
        return { success: true };

    } catch (error: any) {
        console.error('Error editing mind map node:', error);
        return { success: false, error: error.message || 'Failed to edit node.' };
    }
}


export async function deleteMindMapNode(ideaId: string, nodePath: string): Promise<{ success: boolean, error?: string }> {
    try {
        const ideaRef = doc(db, 'ideas', ideaId);
        const ideaSnap = await getDoc(ideaRef);
        if (!ideaSnap.exists()) {
            throw new Error('Idea not found');
        }
        const ideaData = ideaSnap.data();
        const mindMap = ideaData.mindMap as MindMapNode;

        const pathSegments = nodePath.split('>');
        
        // Cannot delete the root node
        if (pathSegments.length === 1) {
            throw new Error("Cannot delete the root node.");
        }

        let parentNode: any = null;
        let currentNode: any = mindMap;

        for (let i = 0; i < pathSegments.length; i++) {
            if (i === 0) {
                 if (currentNode.title !== pathSegments[i]) {
                    throw new Error("Root node doesn't match path");
                }
            } else {
                parentNode = currentNode;
                const childIndex = currentNode.children?.findIndex((c: any) => c.title === pathSegments[i]);
                if (childIndex === -1 || !currentNode.children) {
                     throw new Error(`Node not found at path segment: ${pathSegments[i]}`);
                }
                currentNode = currentNode.children[childIndex];
            }
        }
        
        const nodeToDeleteTitle = pathSegments[pathSegments.length - 1];
        const childIndex = parentNode.children.findIndex((c: any) => c.title === nodeToDeleteTitle);
        
        if (childIndex > -1) {
            parentNode.children.splice(childIndex, 1);
        } else {
            throw new Error("Node to delete not found in parent's children.");
        }

        await updateDoc(ideaRef, { mindMap });
        revalidatePath(`/idea/${ideaId}/mindmap`);
        return { success: true };

    } catch (error: any) {
        console.error('Error deleting mind map node:', error);
        return { success: false, error: error.message || 'Failed to delete node.' };
    }
}

    