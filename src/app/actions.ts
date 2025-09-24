'use server';

import '@/ai'; // Import to register flows
import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { generateIdeaMindMap, type MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { generateMindMapNode } from '@/ai/flows/generate-mindmap-node';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  doc,
  getDoc,
  updateDoc,
  where,
  setDoc,
  deleteDoc,
  Timestamp,       
  runTransaction,
  increment,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { FREE_USER_API_LIMIT, FREE_USER_IDEA_LIMIT } from '@/lib/constants';

/* =========================
 * Schemas & Types
 * =======================*/

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
  language: z.enum(['English', 'Korean']),
  requestId: z.string().min(1, { message: 'Request ID is required.' }), // ✅ 추가
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

export type SerializableUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: 'free' | 'paid';
  ideaCount?: number;
  apiRequestCount?: number;
  lastApiRequestDate?: Date | null; // converted to Date in getUserData()
};



/* =========================
 * Helpers
 * =======================*/

// Recursively find & modify a node by title
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

/* =========================
 * Users
 * =======================*/

export async function getUserData(userId: string): Promise<{ data: SerializableUser | null; error: string | null }> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { data: null, error: 'User not found.' };
    }
    const raw = userSnap.data() as SerializableUser & { lastApiRequestDate?: Timestamp | null };

    return {
      data: {
        ...raw,
        lastApiRequestDate: raw.lastApiRequestDate ? (raw.lastApiRequestDate as unknown as Timestamp).toDate() : null,
      },
      error: null,
    };
  } catch (err) {
    console.error('Error fetching user data:', err);
    return { data: null, error: 'Failed to fetch user data.' };
  }
}

export async function upsertUser(user: SerializableUser): Promise<{ error: string | null }> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    const base = {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      lastLogin: serverTimestamp(),
    };

    if (!snap.exists()) {
      // New user -> set default role & counters
      await setDoc(
        userRef,
        {
          ...base,
          role: 'free',
          ideaCount: 0,
          apiRequestCount: 0,
          lastApiRequestDate: null,
        },
        { merge: true }
      );
    } else {
      // Existing user -> ensure defaults exist
      const data = snap.data() as Partial<SerializableUser>;
      await setDoc(
        userRef,
        {
          ...base,
          role: data.role ?? 'free',
          ideaCount: data.ideaCount ?? 0,
          apiRequestCount: data.apiRequestCount ?? 0,
          lastApiRequestDate: data.lastApiRequestDate ?? null,
        },
        { merge: true }
      );
    }

    return { error: null };
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
    return { error: 'Failed to save user data.' };
  }
}

/* =========================
 * Ideas: Create with limits
 * =======================*/

export async function generateIdea(
  prevState: any,
  formData: FormData
): Promise<{ data: GeneratedIdea | null; error: string | null }> {
  const validated = IdeaSchema.safeParse({
    idea: formData.get('idea'),
    userId: formData.get('userId'),
    language: formData.get('language'),
    requestId: formData.get('requestId'),
  });

  if (!validated.success) {
    const f = validated.error.flatten().fieldErrors;
    return { data: null, error: f.idea?.[0] || f.userId?.[0] || f.language?.[0] || f.requestId?.[0] || 'Invalid input.' };
  }
  const { idea: ideaDescription, userId, language, requestId } = validated.data;
  const lockRef = doc(db, 'locks', requestId);
  const locked = await runTransaction(db, async (tx) => {
    const snap = await tx.get(lockRef);
    if (snap.exists()) {
      return false; // 이미 처리중/처리됨
    }
    tx.set(lockRef, { userId, createdAt: serverTimestamp(), status: 'processing' });
    return true;
  });
  if (!locked) {
    return { data: null, error: 'Duplicate submission detected. Please wait.' };
  }

  
  try {
    // 1) Load user + enforce limits
    const { data: userData, error: userError } = await getUserData(userId);
    if (userError || !userData) {
      return { data: null, error: userError || 'User data not found.' };
    }

    if ((userData.role ?? 'free') === 'free') {
      // total idea limit
      if ((userData.ideaCount ?? 0) >= FREE_USER_IDEA_LIMIT) {
        return {
          data: null,
          error: 'Free users are limited to 5 saved ideas. Please upgrade to create more.',
        };
      }

      // daily request limit (client side에서 0으로 보여줄 수도 있으니 서버에서도 확실히 체크)
      const now = new Date();
      const last = userData.lastApiRequestDate;
      let currentCount = userData.apiRequestCount ?? 0;

      if (last) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - last.getTime() > oneDayMs) {
          currentCount = 0;
        }
      }

      if (currentCount >= FREE_USER_API_LIMIT) {
        return {
          data: null,
          error: 'Free users are limited to 2 idea generations per day. Please upgrade to generate more.',
        };
      }

      // atomic bump inside transaction
      const userRef = doc(db, 'users', userId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(userRef);
        if (!snap.exists()) throw new Error('User not found.');
        const curr = snap.data() as {
          apiRequestCount?: number;
          lastApiRequestDate?: Timestamp | null;
        };

        let count = curr.apiRequestCount ?? 0;
        const lastTs = curr.lastApiRequestDate instanceof Timestamp ? curr.lastApiRequestDate.toDate() : null;

        if (lastTs) {
          const oneDayMs = 24 * 60 * 60 * 1000;
          if (now.getTime() - lastTs.getTime() > oneDayMs) {
            count = 0;
          }
        }

        if (count >= FREE_USER_API_LIMIT) {
          throw new Error('Free users are limited to 2 idea generations per day. Please upgrade to generate more.');
        }

        tx.update(userRef, {
          apiRequestCount: count + 1,
          lastApiRequestDate: serverTimestamp(),
        });
      });
    }

    // 2) Generate
    const [titleResult, summaryResult, outlineResult] = await Promise.all([
      generateIdeaTitle({ ideaDescription, language }),
      generateIdeaSummary({ idea: ideaDescription, language }),
      generateIdeaOutline({ idea: ideaDescription, language }),
    ]);

    const newIdea = {
      title: titleResult.ideaTitle,
      summary: summaryResult.summary,
      outline: outlineResult.outline,
      favorited: false,
      userId,
      language,
    };

    // 3) Save idea
    const ideaRef = await addDoc(collection(db, 'ideas'), {
      ...newIdea,
      createdAt: serverTimestamp(),
    });

    // 4) Increment user's ideaCount atomically
    await updateDoc(doc(db, 'users', userId), {
      ideaCount: increment(1),
    });

    return {
      data: { id: ideaRef.id, ...newIdea },
      error: null,
    };
  } catch (error: any) {
    const msg = typeof error?.message === 'string'
      ? error.message
      : 'Failed to generate idea. Please try again.';
    console.error('Error generating idea:', error);
    return { data: null, error: msg };
  }

}

/* =========================
 * Ideas: Queries
 * =======================*/

export async function getArchivedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null; error: string | null }> {
  try {
    const ideasCollection = collection(db, 'ideas');
    const qy = query(ideasCollection, where('userId', '==', userId));
    const snap = await getDocs(qy);
    const ideas = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: data.title,
        summary: data.summary,
        outline: data.outline,
        mindMap: data.mindMap,
        favorited: data.favorited,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        language: data.language || 'English',
      } as GeneratedIdea;
    });
    return { data: ideas, error: null };
  } catch (err) {
    console.error('Error fetching archived ideas:', err);
    return { data: null, error: 'Failed to fetch archived ideas.' };
  }
}

export async function getFavoritedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null; error: string | null }> {
  try {
    const ideasCollection = collection(db, 'ideas');
    const qy = query(ideasCollection, where('userId', '==', userId), where('favorited', '==', true));
    const snap = await getDocs(qy);
    const ideas = snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        title: data.title,
        summary: data.summary,
        outline: data.outline,
        mindMap: data.mindMap,
        favorited: data.favorited,
        createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
        language: data.language || 'English',
      } as GeneratedIdea;
    });
    return { data: ideas, error: null };
  } catch (err) {
    console.error('Error fetching favorited ideas:', err);
    return { data: null, error: 'Failed to fetch favorited ideas.' };
  }
}

export async function getIdeaById(id: string): Promise<{ data: GeneratedIdea | null; error: string | null }> {
  try {
    const ref = doc(db, 'ideas', id);
    const snap = await getDoc(ref);

    if (!snap.exists()) return { data: null, error: 'Idea not found.' };

    const data = snap.data() as any;
    const idea: GeneratedIdea = {
      id: snap.id,
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
  } catch (err) {
    console.error('Error fetching idea:', err);
    return { data: null, error: 'Failed to fetch idea.' };
  }
}

/* =========================
 * Ideas: Mutations
 * =======================*/

export async function toggleFavorite(id: string, isFavorited: boolean) {
  try {
    const ref = doc(db, 'ideas', id);
    await updateDoc(ref, { favorited: isFavorited });
    revalidatePath('/archive');
    revalidatePath('/favorites');
    revalidatePath(`/idea/${id}`);
  } catch (err) {
    console.error('Error updating favorite status:', err);
    return { error: 'Failed to update favorite status.' };
  }
}

export async function regenerateMindMap(
  ideaId: string,
  ideaSummary: string,
  language: 'English' | 'Korean'
): Promise<{ success: boolean; newMindMap: MindMapNode | null; error: string | null }> {
  try {
    if (!ideaId || !ideaSummary) throw new Error('Idea ID and summary are required.');

    const mindMapResult = await generateIdeaMindMap({ idea: ideaSummary, language });
    const ref = doc(db, 'ideas', ideaId);
    await updateDoc(ref, { mindMap: mindMapResult.mindMap });

    revalidatePath(`/idea/${ideaId}`);
    revalidatePath(`/idea/${ideaId}/mindmap`);
    revalidatePath('/archive');

    return { success: true, newMindMap: mindMapResult.mindMap, error: null };
  } catch (err) {
    console.error('Error regenerating mind map:', err);
    return { success: false, newMindMap: null, error: 'Failed to regenerate mind map. Please try again.' };
  }
}

/* Node editing helpers (unchanged except for minor typing/safety) */

export async function expandMindMapNode(
  ideaId: string,
  ideaContext: string,
  parentNodeTitle: string,
  existingChildrenTitles: string[],
  language: 'English' | 'Korean'
): Promise<{ success: boolean; newNodes?: { title: string }[]; error?: string }> {
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
      if (!ideaSnap.exists()) throw new Error('Idea not found');

      const ideaData = ideaSnap.data();
      const mindMap = ideaData.mindMap as MindMapNode;

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
        throw new Error('Parent node not found in mind map');
      }
    }

    return { success: true, newNodes };
  } catch (err) {
    console.error('Error expanding mind map node:', err);
    return { success: false, error: 'Failed to generate new nodes.' };
  }
}

export async function addManualMindMapNode(
  ideaId: string,
  parentNodeTitle: string,
  newNodeTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) throw new Error('Idea not found');

    const ideaData = ideaSnap.data();
    const mindMap = ideaData.mindMap as MindMapNode;

    const success = findAndModifyNode(mindMap, parentNodeTitle, (node) => {
      if (!node.children) node.children = [];
      node.children.push({ title: newNodeTitle, children: [] });
      return true;
    });

    if (!success) throw new Error('Parent node not found');

    await updateDoc(ideaRef, { mindMap });
    revalidatePath(`/idea/${ideaId}/mindmap`);
    return { success: true };
  } catch (err: any) {
    console.error('Error adding manual mind map node:', err);
    return { success: false, error: err.message || 'Failed to add node.' };
  }
}

export async function editMindMapNode(
  ideaId: string,
  nodePath: string,
  newNodeTitle: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) throw new Error('Idea not found');

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
  } catch (err: any) {
    console.error('Error editing mind map node:', err);
    return { success: false, error: err.message || 'Failed to edit node.' };
  }
}

export async function deleteMindMapNode(ideaId: string, nodePath: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) throw new Error('Idea not found');

    const ideaData = ideaSnap.data();
    const mindMap = ideaData.mindMap as MindMapNode;

    const pathSegments = nodePath.split('>');

    if (pathSegments.length === 1) {
      throw new Error('Cannot delete the root node.');
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
  } catch (err: any) {
    console.error('Error deleting mind map node:', err);
    return { success: false, error: err.message || 'Failed to delete node.' };
  }
}

/* =========================
 * Ideas: Delete (with ideaCount--)
 * =======================*/

export async function deleteIdea(
  ideaId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId || !userId) {
      return { success: false, error: 'Invalid request.' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (tx) => {
      // 1) Check idea exists & ownership
      const ideaSnap = await tx.get(ideaRef);
      if (!ideaSnap.exists()) throw new Error('Idea not found.');
      const ideaData = ideaSnap.data() as { userId?: string };
      if (ideaData.userId !== userId) throw new Error('Permission denied.');

      // 2) Decrement user's ideaCount (not below 0)
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) throw new Error('User not found.');
      const userData = userSnap.data() as { ideaCount?: number };
      const current = userData.ideaCount ?? 0;
      const next = Math.max(0, current - 1);
      tx.update(userRef, { ideaCount: next });

      // 3) Delete idea
      tx.delete(ideaRef);
    });

    // Revalidate affected paths
    revalidatePath('/archive');
    revalidatePath('/favorites');
    revalidatePath(`/idea/${ideaId}`);
    revalidatePath(`/idea/${ideaId}/mindmap`);

    return { success: true };
  } catch (e) {
    console.error('Error deleting idea:', e);
    return { success: false, error: 'Failed to delete idea.' };
  }
}
// 파일 상단의 나머지 import 옆
// 이미 FREE_USER_API_LIMIT, FREE_USER_IDEA_LIMIT, getUserData 가 있다고 가정
export async function getUserUsage(userId: string): Promise<{
    role: 'free' | 'paid';
    dailyLeft: number | null;   // null이면 무제한
    ideasLeft: number | null;   // null이면 무제한
    error?: string | null;
  }> {
    try {
      const { data, error } = await getUserData(userId);
      if (error || !data) return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: error ?? 'User not found' };
  
      const role = data.role ?? 'free';
  
      if (role === 'paid') {
        return { role, dailyLeft: null, ideasLeft: null, error: null }; // 무제한
      }
  
      // free
      const now = new Date();
      const last = data.lastApiRequestDate;
      let usedToday = data.apiRequestCount ?? 0;
      if (last) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - last.getTime() > oneDayMs) {
          usedToday = 0;
        }
      }
      const dailyLeft = Math.max(0, FREE_USER_API_LIMIT - usedToday);
      const ideasLeft = Math.max(0, FREE_USER_IDEA_LIMIT - (data.ideaCount ?? 0));
  
      return { role, dailyLeft, ideasLeft, error: null };
    } catch (e) {
      console.error('getUserUsage error:', e);
      return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: 'Failed to fetch usage' };
    }
  }
  