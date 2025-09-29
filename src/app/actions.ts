'use server';

import '@/ai'; // Import to register flows
import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { generateIdeaMindMap, type MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { generateMindMapNode } from '@/ai/flows/generate-mindmap-node';
import { generateAISuggestions as generateAISuggestionsFlow } from '@/ai/flows/generate-ai-suggestions';
import type { GenerateAISuggestionsOutput } from '@/ai/flows/generate-ai-suggestions';
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

// export type GeneratedIdea = {
//   id?: string;
//   title: string;
//   summary: string;
//   outline: string;
//   mindMap?: MindMapNode;
//   favorited?: boolean;
//   createdAt?: Date;
//   userId?: string;
//   language?: 'English' | 'Korean';
// };

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
    console.log('👤 upsertUser 시작:', { uid: user.uid });
    
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
      // ✅ 새 사용자 -> 명확한 초기값 설정
      console.log('🆕 새 사용자 생성');
      await setDoc(
        userRef,
        {
          ...base,
          role: 'free',
          ideaCount: 0,
          apiRequestCount: 0,
          lastApiRequestDate: null, // 명시적으로 null
        },
        { merge: true }
      );
      console.log('✅ 새 사용자 생성 완료');
    } else {
      // ✅ 기존 사용자 -> 기본값 보장하되 기존값 유지
      const data = snap.data() as Partial<SerializableUser>;
      console.log('🔄 기존 사용자 업데이트:', {
        기존role: data.role,
        기존ideaCount: data.ideaCount,
        기존apiRequestCount: data.apiRequestCount
      });
      
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
      console.log('✅ 기존 사용자 업데이트 완료');
    }

    return { error: null };
  } catch (err) {
    console.error('❌ upsertUser 오류:', err);
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
      // const userRef = doc(db, 'users', userId);
      // await runTransaction(db, async (tx) => {
      //   const snap = await tx.get(userRef);
      //   if (!snap.exists()) throw new Error('User not found.');
      //   const curr = snap.data() as {
      //     apiRequestCount?: number;
      //     lastApiRequestDate?: Timestamp | null;
      //   };

      //   let count = curr.apiRequestCount ?? 0;
      //   const lastTs = curr.lastApiRequestDate instanceof Timestamp ? curr.lastApiRequestDate.toDate() : null;

      //   if (lastTs) {
      //     const oneDayMs = 24 * 60 * 60 * 1000;
      //     if (now.getTime() - lastTs.getTime() > oneDayMs) {
      //       count = 0;
      //     }
      //   }

      //   if (count >= FREE_USER_API_LIMIT) {
      //     throw new Error('Free users are limited to 2 idea generations per day. Please upgrade to generate more.');
      //   }

      //   tx.update(userRef, {
      //     apiRequestCount: count + 1,
      //     lastApiRequestDate: serverTimestamp(),
      //   });
      // });
    }

  // 2) Generate AI content - 실패 가능성이 있는 부분
  const maxRetries = 2;
  let titleResult: any = null;
  let summaryResult: any = null; 
  let outlineResult: any = null;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      [titleResult, summaryResult, outlineResult] = await Promise.all([
        generateIdeaTitle({ ideaDescription, language }),
        generateIdeaSummary({ idea: ideaDescription, language }),
        generateIdeaOutline({ idea: ideaDescription, language }),
      ]);
      
      // 성공시 루프 탈출
      break;
      
    } catch (error: any) {
      lastError = error;
      console.error(`AI generation attempt ${attempt + 1} failed:`, error);
      
      // 503 에러이고 재시도 가능한 경우
      if (error.message?.includes('503') && attempt < maxRetries) {
        console.log(`Retrying after 503 error, attempt ${attempt + 2}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
      
      // 재시도 불가능하거나 마지막 시도
      throw error;
    }
  }

  // 3) AI 생성 성공 후에만 사용량 증가
  if ((userData.role ?? 'free') === 'free') {
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
      const now = new Date();

      if (lastTs) {
        const oneDayMs = 24 * 60 * 60 * 1000;
        if (now.getTime() - lastTs.getTime() > oneDayMs) {
          count = 0;
        }
      }

      // 다시 한 번 확인 (동시성 문제 방지)
      if (count >= FREE_USER_API_LIMIT) {
        throw new Error('Free users are limited to 2 idea generations per day.');
      }

      // ✅ AI 생성이 성공했으므로 이제 사용량 증가
      tx.update(userRef, {
        apiRequestCount: count + 1,
        lastApiRequestDate: serverTimestamp(),
      });
    });
  }


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
      requestId,
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
    console.error('Error in generateIdea:', error);
    
    // ✅ 에러 발생시 사용량 차감 없음
    let errorMessage = 'Failed to generate idea. Please try again.';
    
    if (error?.message?.includes('503') || error?.message?.includes('Service Unavailable')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again in a few minutes. Your usage quota has not been affected.';
    } else if (error?.message?.includes('Free users are limited')) {
      errorMessage = error.message; // 사용량 제한 메시지 그대로 사용
    }
    
    return { data: null, error: errorMessage };
  }

}

/* =========================
 * Ideas: Queries
 * =======================*/

export async function getArchivedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null; error: string | null }> {
  try {
    console.log('getArchivedIdeas: Starting fetch for userId:', userId);
    
    // 입력 검증
    if (!userId || userId.trim() === '') {
      console.error('getArchivedIdeas: Invalid userId provided');
      return { data: null, error: 'Invalid user ID provided.' };
    }

    // Firestore 연결 확인
    if (!db) {
      console.error('getArchivedIdeas: Firestore database not initialized');
      return { data: null, error: 'Database connection not available.' };
    }

    console.log('getArchivedIdeas: Creating query...');
    const ideasCollection = collection(db, 'ideas');
    const qy = query(ideasCollection, where('userId', '==', userId));
    
    console.log('getArchivedIdeas: Executing query...');
    const snap = await getDocs(qy);
    
    console.log('getArchivedIdeas: Query completed, processing', snap.docs.length, 'documents');
    
    const ideas = snap.docs.map((d) => {
      try {
        const data = d.data();
        console.log('getArchivedIdeas: Processing document', d.id, 'with data keys:', Object.keys(data));
        
        // 필수 필드 확인
        if (!data.title || !data.summary) {
          console.warn('getArchivedIdeas: Document', d.id, 'missing required fields');
        }
        
        return {
          id: d.id,
          title: data.title || 'Untitled',
          summary: data.summary || 'No summary available',
          outline: data.outline,
          mindMap: data.mindMap,
          favorited: Boolean(data.favorited),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          language: data.language || 'English',
          userId: data.userId, // userId도 포함
        } as GeneratedIdea;
      } catch (docError) {
        console.error('getArchivedIdeas: Error processing document', d.id, ':', docError);
        // 문서 처리 실패 시에도 기본값으로 반환
        return {
          id: d.id,
          title: 'Error loading title',
          summary: 'Error loading summary',
          outline: '',
          mindMap: undefined,
          favorited: false,
          createdAt: new Date(),
          language: 'English',
          userId: userId,
        } as GeneratedIdea;
      }
    });

    console.log('getArchivedIdeas: Successfully processed', ideas.length, 'ideas');
    
    // 날짜순으로 정렬 (최신순)
    ideas.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return { data: ideas, error: null };
  } catch (err) {
    console.error('getArchivedIdeas: Error fetching archived ideas:', err);
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to fetch archived ideas.';
    
    if (err instanceof Error) {
      console.error('getArchivedIdeas: Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.message.includes('permission-denied')) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (err.message.includes('unavailable')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (err.message.includes('not-found')) {
        errorMessage = 'Ideas collection not found.';
      }
    }
    
    return { data: null, error: errorMessage };
  }
}

export async function getFavoritedIdeas(userId: string): Promise<{ data: GeneratedIdea[] | null; error: string | null }> {
  try {
    console.log('getFavoritedIdeas: Starting fetch for userId:', userId);
    
    // 입력 검증
    if (!userId || userId.trim() === '') {
      console.error('getFavoritedIdeas: Invalid userId provided');
      return { data: null, error: 'Invalid user ID provided.' };
    }

    // Firestore 연결 확인
    if (!db) {
      console.error('getFavoritedIdeas: Firestore database not initialized');
      return { data: null, error: 'Database connection not available.' };
    }

    console.log('getFavoritedIdeas: Creating query...');
    const ideasCollection = collection(db, 'ideas');
    const qy = query(
      ideasCollection, 
      where('userId', '==', userId), 
      where('favorited', '==', true)
    );
    
    console.log('getFavoritedIdeas: Executing query...');
    const snap = await getDocs(qy);
    
    console.log('getFavoritedIdeas: Query completed, processing', snap.docs.length, 'documents');
    
    const ideas = snap.docs.map((d) => {
      try {
        const data = d.data();
        console.log('getFavoritedIdeas: Processing document', d.id, 'with data keys:', Object.keys(data));
        
        // 필수 필드 확인
        if (!data.title || !data.summary) {
          console.warn('getFavoritedIdeas: Document', d.id, 'missing required fields');
        }
        
        // favorited 필드 확인
        if (!data.favorited) {
          console.warn('getFavoritedIdeas: Document', d.id, 'favorited field is false or missing');
        }
        
        return {
          id: d.id,
          title: data.title || 'Untitled',
          summary: data.summary || 'No summary available',
          outline: data.outline,
          mindMap: data.mindMap,
          favorited: Boolean(data.favorited),
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          language: data.language || 'English',
          userId: data.userId,
        } as GeneratedIdea;
      } catch (docError) {
        console.error('getFavoritedIdeas: Error processing document', d.id, ':', docError);
        // 문서 처리 실패 시에도 기본값으로 반환
        return {
          id: d.id,
          title: 'Error loading title',
          summary: 'Error loading summary',
          outline: '',
          mindMap: undefined,
          favorited: true, // 즐겨찾기 쿼리에서 온 것이므로 true
          createdAt: new Date(),
          language: 'English',
          userId: userId,
        } as GeneratedIdea;
      }
    });

    console.log('getFavoritedIdeas: Successfully processed', ideas.length, 'favorite ideas');
    
    // 날짜순으로 정렬 (최신순)
    ideas.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    return { data: ideas, error: null };
  } catch (err) {
    console.error('getFavoritedIdeas: Error fetching favorited ideas:', err);
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to fetch favorite ideas.';
    
    if (err instanceof Error) {
      console.error('getFavoritedIdeas: Error details:', {
        name: err.name,
        message: err.message,
        stack: err.stack
      });
      
      if (err.message.includes('permission-denied')) {
        errorMessage = 'Permission denied. Please check your authentication.';
      } else if (err.message.includes('unavailable')) {
        errorMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (err.message.includes('not-found')) {
        errorMessage = 'Ideas collection not found.';
      }
    }
    
    return { data: null, error: errorMessage };
  }
}

// export async function getIdeaById(id: string): Promise<{ data: GeneratedIdea | null; error: string | null }> {
//   try {
//     const ref = doc(db, 'ideas', id);
//     const snap = await getDoc(ref);

//     if (!snap.exists()) return { data: null, error: 'Idea not found.' };

//     const data = snap.data() as any;
//     const idea: GeneratedIdea = {
//       id: snap.id,
//       title: data.title,
//       summary: data.summary,
//       outline: data.outline,
//       mindMap: data.mindMap,
//       favorited: data.favorited,
//       createdAt: data.createdAt ? data.createdAt.toDate() : undefined,
//       userId: data.userId,
//       language: data.language || 'English',
//     };
//     return { data: idea, error: null };
//   } catch (err) {
//     console.error('Error fetching idea:', err);
//     return { data: null, error: 'Failed to fetch idea.' };
//   }
// }

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
    console.log('🔍 getUserUsage 시작:', { userId });
    
    const { data, error } = await getUserData(userId);
    if (error || !data) {
      console.error('❌ getUserData 실패:', { error, data });
      return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: error ?? 'User not found' };
    }

    console.log('📊 사용자 데이터:', {
      role: data.role,
      apiRequestCount: data.apiRequestCount,
      ideaCount: data.ideaCount,
      lastApiRequestDate: data.lastApiRequestDate
    });

    const role = data.role ?? 'free';

    if (role === 'paid') {
      console.log('✅ 유료 사용자 - 무제한 반환');
      return { role, dailyLeft: null, ideasLeft: null, error: null }; // 무제한
    }

    // ✅ 무료 사용자 사용량 계산 로직 개선
    const now = new Date();
    const last = data.lastApiRequestDate;
    let usedToday = data.apiRequestCount ?? 0;
    
    // ✅ 일일 사용량 리셋 로직 개선
    if (last) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const timeDiff = now.getTime() - last.getTime();
      
      console.log('📅 일일 리셋 체크:', {
        now: now.toISOString(),
        last: last.toISOString(),
        timeDiff: timeDiff,
        oneDayMs: oneDayMs,
        shouldReset: timeDiff > oneDayMs
      });
      
      if (timeDiff > oneDayMs) {
        console.log('🔄 일일 사용량 리셋');
        usedToday = 0;
      }
    } else {
      // ✅ lastApiRequestDate가 null인 경우 (새 사용자) - 사용량 0으로 시작
      console.log('🆕 새 사용자 또는 첫 사용 - 사용량 0으로 시작');
      usedToday = 0;
    }

    const dailyLeft = Math.max(0, FREE_USER_API_LIMIT - usedToday);
    const totalIdeasUsed = data.ideaCount ?? 0;
    const ideasLeft = Math.max(0, FREE_USER_IDEA_LIMIT - totalIdeasUsed);

    const result = {
      role,
      dailyLeft,
      ideasLeft,
      error: null
    };

    console.log('✅ 사용량 계산 완료:', {
      ...result,
      계산과정: {
        FREE_USER_API_LIMIT,
        usedToday,
        dailyLeft,
        FREE_USER_IDEA_LIMIT,
        totalIdeasUsed,
        ideasLeft
      }
    });

    return result;
    
  } catch (e) {
    console.error('💥 getUserUsage 예외:', e);
    return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: 'Failed to fetch usage' };
  }
}

export async function updateIdeaContent(
  ideaId: string,
  updates: {
    title?: string;
    summary?: string;
    outline?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required.' };
    }

    // 업데이트할 필드 검증
    const allowedFields = ['title', 'summary', 'outline'];
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        // 기본적인 검증
        if (typeof value === 'string' && value.trim().length > 0) {
          updateData[key] = value.trim();
        } else if (value === '') {
          // 빈 문자열도 허용 (사용자가 의도적으로 지울 수 있음)
          updateData[key] = '';
        }
      }
    }

    // 업데이트할 내용이 없으면 에러
    if (Object.keys(updateData).length === 0) {
      return { success: false, error: 'No valid fields to update.' };
    }

    // 수정 시간 추가
    updateData.updatedAt = serverTimestamp();

    // Firestore 업데이트
    const ideaRef = doc(db, 'ideas', ideaId);
    
    // 문서 존재 확인 후 업데이트
    const ideaSnap = await getDoc(ideaRef);
    if (!ideaSnap.exists()) {
      return { success: false, error: 'Idea not found.' };
    }

    await updateDoc(ideaRef, updateData);

    // 관련 페이지들 재검증
    revalidatePath(`/idea/${ideaId}`);
    revalidatePath('/archive');
    revalidatePath('/favorites');

    console.log('Idea content updated:', { ideaId, updates: Object.keys(updateData) });

    return { success: true };
    
  } catch (error: any) {
    console.error('Error updating idea content:', error);
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'Failed to update idea.';
    
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. You can only edit your own ideas.';
    } else if (error.code === 'not-found') {
      errorMessage = 'Idea not found.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Service temporarily unavailable. Please try again.';
    }
    
    return { success: false, error: errorMessage };
  }
}

// 추가로 권한 검증이 필요한 경우의 개선된 버전
export async function updateIdeaContentSecure(
  ideaId: string,
  userId: string,
  updates: {
    title?: string;
    summary?: string;
    outline?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId || !userId) {
      return { success: false, error: 'Idea ID and User ID are required.' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    
    // 트랜잭션으로 권한 확인 후 업데이트
    await runTransaction(db, async (transaction) => {
      const ideaDoc = await transaction.get(ideaRef);
      
      if (!ideaDoc.exists()) {
        throw new Error('Idea not found.');
      }
      
      const ideaData = ideaDoc.data();
      
      // 소유자 확인
      if (ideaData.userId !== userId) {
        throw new Error('Permission denied. You can only edit your own ideas.');
      }
      
      // 업데이트할 필드 준비
      const allowedFields = ['title', 'summary', 'outline'];
      const updateData: any = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          if (typeof value === 'string') {
            updateData[key] = value.trim();
          }
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        throw new Error('No valid fields to update.');
      }
      
      updateData.updatedAt = serverTimestamp();
      
      // 트랜잭션으로 업데이트
      transaction.update(ideaRef, updateData);
    });

    // 관련 페이지들 재검증
    revalidatePath(`/idea/${ideaId}`);
    revalidatePath('/archive');
    revalidatePath('/favorites');

    return { success: true };
    
  } catch (error: any) {
    console.error('Error updating idea content:', error);
    return { success: false, error: error.message || 'Failed to update idea.' };
  }
}
  // actions.ts 파일에 추가할 부분


/**
 * AI 개선 제안 생성 (유료 사용자 전용)
 */
export async function generateAISuggestions(input: {
  ideaId: string;
  title: string;
  summary: string;
  outline: string;
  language: 'English' | 'Korean';
}): Promise<GenerateAISuggestionsOutput> {
  try {
    const { ideaId, title, summary, outline, language } = input;

    // 1. 아이디어 소유자 확인
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    
    if (!ideaSnap.exists()) {
      throw new Error('Idea not found');
    }

    const ideaData = ideaSnap.data();
    const userId = ideaData.userId;

    // 2. 사용자 권한 확인
    const { data: userData, error: userError } = await getUserData(userId);
    if (userError || !userData) {
      throw new Error('User not found');
    }

    if ((userData.role ?? 'free') !== 'paid') {
      throw new Error('Premium feature - Upgrade to Pro plan');
    }

    // 3. AI 분석 생성
    const result = await generateAISuggestionsFlow({
      ideaId,
      title,
      summary,
      outline,
      language,
    });

    return result;
  } catch (error: any) {
    console.error('Error generating AI suggestions:', error);
    throw error;
  }
}

/**
 * AI 분석 결과를 Firebase에 저장
 */
export async function saveAISuggestions(
  ideaId: string,
  suggestions: GenerateAISuggestionsOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    
    // 트랜잭션으로 안전하게 업데이트
    await runTransaction(db, async (transaction) => {
      const ideaDoc = await transaction.get(ideaRef);
      
      if (!ideaDoc.exists()) {
        throw new Error('Idea not found');
      }

      const ideaData = ideaDoc.data();
      const userId = ideaData.userId;

      // 사용자 권한 재확인
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if ((userData.role ?? 'free') !== 'paid') {
        throw new Error('Premium feature - Upgrade to Pro plan');
      }

      // AI 분석 저장
      transaction.update(ideaRef, {
        aiSuggestions: suggestions,
        updatedAt: serverTimestamp(),
      });
    });

    // 캐시 무효화
    revalidatePath(`/idea/${ideaId}`);

    console.log('AI suggestions saved successfully:', ideaId);
    return { success: true };

  } catch (error: any) {
    console.error('Error saving AI suggestions:', error);
    
    let errorMessage = 'Failed to save AI suggestions';
    if (error.message?.includes('Premium feature')) {
      errorMessage = error.message;
    } else if (error.message?.includes('not found')) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
}

/**
 * 저장된 AI 분석 가져오기
 */
export async function getAISuggestions(
  ideaId: string
): Promise<{ data: GenerateAISuggestionsOutput | null; error: string | null }> {
  try {
    if (!ideaId) {
      return { data: null, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      return { data: null, error: 'Idea not found' };
    }

    const ideaData = ideaSnap.data();
    
    // 권한 확인 (선택사항: 소유자만 볼 수 있게 하려면)
    // const userId = ideaData.userId;
    // const { data: userData } = await getUserData(userId);
    // if (!userData || userData.role !== 'paid') {
    //   return { data: null, error: 'Premium feature' };
    // }

    const aiSuggestions = ideaData.aiSuggestions as GenerateAISuggestionsOutput | undefined;

    if (!aiSuggestions) {
      return { data: null, error: null }; // 아직 생성되지 않음
    }

    return { data: aiSuggestions, error: null };

  } catch (error: any) {
    console.error('Error fetching AI suggestions:', error);
    return { data: null, error: 'Failed to fetch AI suggestions' };
  }
}

// GeneratedIdea 타입에 aiSuggestions 추가
export type GeneratedIdea = {
  id?: string;
  title: string;
  summary: string;
  outline: string;
  mindMap?: MindMapNode;
  aiSuggestions?: GenerateAISuggestionsOutput; // ✅ 추가
  favorited?: boolean;
  createdAt?: Date;
  userId?: string;
  language?: 'English' | 'Korean';
};

// getIdeaById 함수 업데이트 (aiSuggestions 포함)
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
      aiSuggestions: data.aiSuggestions, // ✅ 추가
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