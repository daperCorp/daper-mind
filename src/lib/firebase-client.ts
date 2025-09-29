import { 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc,
    query, 
    where, 
    collection,
    serverTimestamp,
    Timestamp,
    increment,
    runTransaction,
    addDoc  
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
  import type { GenerateAISuggestionsOutput } from '@/ai/flows/generate-ai-suggestions';
  import type { GenerateBusinessPlanOutput } from '@/ai/flows/generate-business-plan';
  import { nanoid } from 'nanoid';
  import { getAuth } from 'firebase/auth' 
  /* =========================
   * Types
   * =======================*/
  
  export type SerializableUser = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role?: 'free' | 'paid';
    ideaCount?: number;
    apiRequestCount?: number;
    lastApiRequestDate?: Date | null;
  };
  
  export type GeneratedIdea = {
    id?: string;
    title: string;
    summary: string;
    outline: string;
    mindMap?: MindMapNode;
    aiSuggestions?: any;
    businessPlan?: GenerateBusinessPlanOutput;
    businessPlanGeneratedAt?: Date;
    favorited?: boolean;
    createdAt?: Date;
    userId?: string;
    language?: 'English' | 'Korean';
  };
  
  export interface ShareLink {
    id: string;
    ideaId: string;
    ownerId: string;
    createdAt: Date;
    expiresAt?: Date;
    accessCount: number;
    isActive: boolean;
  }
  
  /* =========================
   * Users
   * =======================*/
  
  export async function upsertUserClient(user: SerializableUser) {
    const userRef = doc(db, 'users', user.uid);
    
    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (userDoc.exists()) {
          // 기존 사용자: 프로필 정보만 업데이트
          transaction.update(userRef, {
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            photoURL: user.photoURL ?? null,
            lastLogin: serverTimestamp(),
          });
        } else {
          // 신규 사용자: 전체 초기화
          transaction.set(userRef, {
            uid: user.uid,
            email: user.email ?? null,
            displayName: user.displayName ?? null,
            photoURL: user.photoURL ?? null,
            lastLogin: serverTimestamp(),
            role: 'free',
            ideaCount: 0,
            apiRequestCount: 0,
            lastApiRequestDate: null,
          });
        }
      });
    } catch (err) {
      console.error('Error upserting user:', err);
      throw err;
    }
  }
  
  export async function getUserData(userId: string): Promise<{ 
    data: SerializableUser | null; 
    error: string | null 
  }> {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { data: null, error: 'User not found.' };
      }
      
      const raw = userSnap.data() as SerializableUser & { 
        lastApiRequestDate?: Timestamp | null 
      };
  
      return {
        data: {
          ...raw,
          lastApiRequestDate: raw.lastApiRequestDate 
            ? (raw.lastApiRequestDate as unknown as Timestamp).toDate() 
            : null,
        },
        error: null,
      };
    } catch (err) {
      console.error('Error fetching user data:', err);
      return { data: null, error: 'Failed to fetch user data.' };
    }
  }
  
  /* =========================
   * Ideas: Queries
   * =======================*/
  
  export async function getArchivedIdeas(userId: string): Promise<{ 
    data: GeneratedIdea[] | null; 
    error: string | null 
  }> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'Invalid user ID provided.' };
      }
  
      const ideasCollection = collection(db, 'ideas');
      const qy = query(ideasCollection, where('userId', '==', userId));
      const snap = await getDocs(qy);
      
      const ideas = snap.docs.map((d) => {
        const data = d.data();
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
          aiSuggestions: data.aiSuggestions,
          businessPlan: data.businessPlan,
          businessPlanGeneratedAt: data.businessPlanGeneratedAt 
            ? data.businessPlanGeneratedAt.toDate() 
            : undefined,
        } as GeneratedIdea;
      });
  
      ideas.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  
      return { data: ideas, error: null };
    } catch (err: any) {
      console.error('Error fetching archived ideas:', err);
      return { data: null, error: 'Failed to fetch archived ideas.' };
    }
  }
  
  export async function getFavoritedIdeas(userId: string): Promise<{ 
    data: GeneratedIdea[] | null; 
    error: string | null 
  }> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'Invalid user ID provided.' };
      }
  
      const ideasCollection = collection(db, 'ideas');
      const qy = query(
        ideasCollection, 
        where('userId', '==', userId), 
        where('favorited', '==', true)
      );
      const snap = await getDocs(qy);
      
      const ideas = snap.docs.map((d) => {
        const data = d.data();
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
          aiSuggestions: data.aiSuggestions,
          businessPlan: data.businessPlan,
          businessPlanGeneratedAt: data.businessPlanGeneratedAt 
            ? data.businessPlanGeneratedAt.toDate() 
            : undefined,
        } as GeneratedIdea;
      });
  
      ideas.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
  
      return { data: ideas, error: null };
    } catch (err: any) {
      console.error('Error fetching favorited ideas:', err);
      return { data: null, error: 'Failed to fetch favorite ideas.' };
    }
  }
  
  export async function getIdeaById(id: string): Promise<{ 
    data: GeneratedIdea | null; 
    error: string | null 
  }> {
    try {
      const ref = doc(db, 'ideas', id);
      const snap = await getDoc(ref);
  
      if (!snap.exists()) {
        return { data: null, error: 'Idea not found.' };
      }
  
      const data = snap.data() as any;
      const idea: GeneratedIdea = {
        id: snap.id,
        title: data.title,
        summary: data.summary,
        outline: data.outline,
        mindMap: data.mindMap,
        aiSuggestions: data.aiSuggestions,
        businessPlan: data.businessPlan,
        businessPlanGeneratedAt: data.businessPlanGeneratedAt 
          ? data.businessPlanGeneratedAt.toDate() 
          : undefined,
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
    } catch (err) {
      console.error('Error updating favorite status:', err);
      throw new Error('Failed to update favorite status.');
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
        return { success: false, error: 'No valid fields to update.' };
      }
  
      updateData.updatedAt = serverTimestamp();
  
      const ideaRef = doc(db, 'ideas', ideaId);
      const ideaSnap = await getDoc(ideaRef);
      
      if (!ideaSnap.exists()) {
        return { success: false, error: 'Idea not found.' };
      }
  
      await updateDoc(ideaRef, updateData);
  
      return { success: true };
    } catch (error: any) {
      console.error('Error updating idea content:', error);
      return { success: false, error: 'Failed to update idea.' };
    }
  }
  
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
        const ideaSnap = await tx.get(ideaRef);
        if (!ideaSnap.exists()) throw new Error('Idea not found.');
        
        const ideaData = ideaSnap.data() as { userId?: string };
        if (ideaData.userId !== userId) throw new Error('Permission denied.');
  
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists()) throw new Error('User not found.');
        
        const userData = userSnap.data() as { ideaCount?: number };
        const current = userData.ideaCount ?? 0;
        const next = Math.max(0, current - 1);
        
        tx.update(userRef, { ideaCount: next });
        tx.delete(ideaRef);
      });
  
      return { success: true };
    } catch (e: any) {
      console.error('Error deleting idea:', e);
      return { success: false, error: e.message || 'Failed to delete idea.' };
    }
  }
  
  /* =========================
   * Mind Map Operations
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
  
  export async function addManualMindMapNode(
    ideaId: string,
    parentNodeTitle: string,
    newNodeTitle: string
  ): Promise<{ success: boolean; error?: string }> {
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
  
      if (!success) throw new Error('Parent node not found');
  
      await updateDoc(ideaRef, { mindMap });
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
          const childIndex = currentNode.children?.findIndex(
            (c: any) => c.title === pathSegments[i]
          );
          if (childIndex === -1 || !currentNode.children) {
            throw new Error(`Node not found at path segment: ${pathSegments[i]}`);
          }
          currentNode = currentNode.children[childIndex];
        }
      }
  
      currentNode.title = newNodeTitle;
      await updateDoc(ideaRef, { mindMap });
      
      return { success: true };
    } catch (err: any) {
      console.error('Error editing mind map node:', err);
      return { success: false, error: err.message || 'Failed to edit node.' };
    }
  }
  
  export async function deleteMindMapNode(
    ideaId: string, 
    nodePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const ideaRef = doc(db, 'ideas', ideaId);
      const ideaSnap = await getDoc(ideaRef);
      
      if (!ideaSnap.exists()) {
        throw new Error('Idea not found');
      }
  
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
          const childIndex = currentNode.children?.findIndex(
            (c: any) => c.title === pathSegments[i]
          );
          if (childIndex === -1 || !currentNode.children) {
            throw new Error(`Node not found at path segment: ${pathSegments[i]}`);
          }
          currentNode = currentNode.children[childIndex];
        }
      }
  
      const nodeToDeleteTitle = pathSegments[pathSegments.length - 1];
      const childIndex = parentNode.children.findIndex(
        (c: any) => c.title === nodeToDeleteTitle
      );
  
      if (childIndex > -1) {
        parentNode.children.splice(childIndex, 1);
      } else {
        throw new Error("Node to delete not found in parent's children.");
      }
  
      await updateDoc(ideaRef, { mindMap });
      return { success: true };
    } catch (err: any) {
      console.error('Error deleting mind map node:', err);
      return { success: false, error: err.message || 'Failed to delete node.' };
    }
  }
  
  /* =========================
   * Idea Sharing
   * =======================*/
  
  export async function createShareLink(
    ideaId: string,
    expiresInDays?: number
  ): Promise<{ data: ShareLink | null; error: string | null }> {
    try {
      if (!ideaId) {
        return { data: null, error: 'Idea ID is required' }
      }
  
      const ideaRef = doc(db, 'ideas', ideaId)
      const ideaSnap = await getDoc(ideaRef)
      if (!ideaSnap.exists()) {
        return { data: null, error: 'Idea not found' }
      }
  
      // ✅ 현재 로그인 사용자로 ownerId 고정(규칙 충족)
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) return { data: null, error: 'NOT_AUTHENTICATED' }
      const ownerId = user.uid
  
      const shareId = nanoid(12)
      const now = new Date()
      const expiresAt =
        expiresInDays ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000) : undefined
  
      const shareLink: ShareLink = {
        id: shareId,
        ideaId,
        ownerId,                           // ✅ 변경
        createdAt: now,
        expiresAt,
        accessCount: 0,
        isActive: true,
      }
  
      const shareRef = doc(db, 'shareLinks', shareId)
      await setDoc(shareRef, {
        ...shareLink,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      })
  
      return { data: shareLink, error: null }
    } catch (error: any) {
      console.error('Error creating share link:', error)
      return { data: null, error: 'Failed to create share link' }
    }
  }
  
  export async function getShareLinks(ideaId: string): Promise<{ 
    data: ShareLink[] | null; 
    error: string | null 
  }> {
    try {
      const q = query(
        collection(db, 'shareLinks'),
        where('ideaId', '==', ideaId),
        where('isActive', '==', true)
      );
  
      const snap = await getDocs(q);
      const links = snap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          expiresAt: data.expiresAt ? data.expiresAt.toDate() : undefined,
        } as ShareLink;
      });
  
      return { data: links, error: null };
    } catch (error: any) {
      console.error('Error fetching share links:', error);
      return { data: null, error: 'Failed to fetch share links' };
    }
  }
  
  export async function deactivateShareLink(shareId: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    try {
      const shareRef = doc(db, 'shareLinks', shareId);
      await updateDoc(shareRef, {
        isActive: false,
        deactivatedAt: serverTimestamp(),
      });
  
      return { success: true };
    } catch (error: any) {
      console.error('Error deactivating share link:', error);
      return { success: false, error: 'Failed to deactivate share link' };
    }
  }
  
  export async function getIdeaByShareLink(shareId: string): Promise<{ 
    data: GeneratedIdea | null; 
    error: string | null 
  }> {
    try {
      if (!shareId) {
        return { data: null, error: 'Share ID is required' };
      }
  
      const shareRef = doc(db, 'shareLinks', shareId);
      const shareSnap = await getDoc(shareRef);
  
      if (!shareSnap.exists()) {
        return { data: null, error: 'Share link not found or expired' };
      }
  
      const shareData = shareSnap.data() as any;
  
      if (!shareData.isActive) {
        return { data: null, error: 'This share link has been disabled' };
      }
  
      if (shareData.expiresAt) {
        const expiresAt = shareData.expiresAt.toDate();
        if (new Date() > expiresAt) {
          return { data: null, error: 'This share link has expired' };
        }
      }
  
      const { data: idea, error } = await getIdeaById(shareData.ideaId);
      if (error || !idea) {
        return { data: null, error: error || 'Idea not found' };
      }
  
      await updateDoc(shareRef, {
        accessCount: increment(1),
        lastAccessedAt: serverTimestamp(),
      });
  
      return { data: idea, error: null };
    } catch (error: any) {
      console.error('Error getting idea by share link:', error);
      return { data: null, error: 'Failed to access shared idea' };
    }
  }

  // lib/firebase-client.ts에 추가
export async function getUserUsage(userId: string): Promise<{
  role: 'free' | 'paid';
  dailyLeft: number | null;
  ideasLeft: number | null;
  error?: string | null;
}> {
  try {
    const { data, error } = await getUserData(userId); // 클라이언트 함수 사용
    
    if (error || !data) {
      return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: error ?? 'User not found' };
    }

    const role = data.role ?? 'free';

    if (role === 'paid') {
      return { role, dailyLeft: null, ideasLeft: null, error: null };
    }

    // 무료 사용자 계산
    const now = new Date();
    const last = data.lastApiRequestDate;
    let usedToday = data.apiRequestCount ?? 0;

    if (last) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now.getTime() - last.getTime() > oneDayMs) {
        usedToday = 0;
      }
    } else {
      usedToday = 0;
    }

    const dailyLeft = Math.max(0, 2 - usedToday); // FREE_USER_API_LIMIT
    const totalIdeasUsed = data.ideaCount ?? 0;
    const ideasLeft = Math.max(0, 5 - totalIdeasUsed); // FREE_USER_IDEA_LIMIT

    return { role, dailyLeft, ideasLeft, error: null };
  } catch (e) {
    console.error('getUserUsage error:', e);
    return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: 'Failed to fetch usage' };
  }
}


export async function saveGeneratedIdea(
  userId: string,
  ideaData: {
    title: string;
    summary: string;
    outline: string;
    language: 'English' | 'Korean';
  },
  requestId: string
): Promise<{ id: string | null; error: string | null }> {
  try {
    // 아이디어 저장
    const ideaRef = await addDoc(collection(db, 'ideas'), {
      ...ideaData,
      userId,
      favorited: false,
      createdAt: serverTimestamp(),
    });

    // 사용자 카운트 증가
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ideaCount: increment(1),
    });

    return { id: ideaRef.id, error: null };
  } catch (error: any) {
    console.error('Error saving idea:', error);
    return { id: null, error: error.message };
  }
}

export async function incrementUserApiUsage(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists()) throw new Error('User not found.');
    
    const curr = snap.data() as {
      apiRequestCount?: number;
      lastApiRequestDate?: Timestamp | null;
    };

    let count = curr.apiRequestCount ?? 0;
    const lastTs = curr.lastApiRequestDate instanceof Timestamp 
      ? curr.lastApiRequestDate.toDate() 
      : null;
    const now = new Date();

    if (lastTs) {
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (now.getTime() - lastTs.getTime() > oneDayMs) {
        count = 0;
      }
    }

    tx.update(userRef, {
      apiRequestCount: count + 1,
      lastApiRequestDate: serverTimestamp(),
    });
  });
}

// lib/firebase-client.ts
export async function updateMindMap(ideaId: string, mindMap: MindMapNode) {
  try {
    const ref = doc(db, 'ideas', ideaId);
    await updateDoc(ref, { mindMap });
  } catch (err) {
    console.error('Error updating mind map:', err);
    throw err;
  }
}

// lib/firebase-client.ts
export async function addNodesToMindMap(
  ideaId: string,
  parentNodeTitle: string,
  newNodes: { title: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);
    
    if (!ideaSnap.exists()) {
      throw new Error('Idea not found');
    }

    const ideaData = ideaSnap.data();
    const mindMap = ideaData.mindMap as MindMapNode;

    // 재귀적으로 부모 노드 찾아서 자식 추가
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

    if (!findAndAdd(mindMap)) {
      throw new Error('Parent node not found in mind map');
    }

    await updateDoc(ideaRef, { mindMap });
    return { success: true };
  } catch (err: any) {
    console.error('Error adding nodes to mind map:', err);
    return { success: false, error: err.message || 'Failed to add nodes' };
  }
}

// lib/firebase-client.ts
export async function saveAISuggestions(
  ideaId: string,
  suggestions: GenerateAISuggestionsOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    
    // 클라이언트에서는 권한 체크 없이 바로 저장
    // (Firestore 보안 규칙이 자동으로 권한 체크)
    await updateDoc(ideaRef, {
      aiSuggestions: suggestions,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving AI suggestions:', error);
    return { success: false, error: error.message || 'Failed to save AI suggestions' };
  }
}

// lib/firebase-client.ts
export async function saveBusinessPlan(
  ideaId: string,
  businessPlan: GenerateBusinessPlanOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);
    
    await updateDoc(ideaRef, {
      businessPlan: businessPlan,
      businessPlanGeneratedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error('Error saving business plan:', error);
    return { success: false, error: error.message || 'Failed to save business plan' };
  }
}

// lib/firebase-client.ts
export async function exportBusinessPlan(
  ideaId: string,
  format: 'markdown' | 'text' = 'markdown'
): Promise<{ content: string | null; error: string | null }> {
  try {
    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      return { content: null, error: 'Idea not found' };
    }

    const ideaData = ideaSnap.data();
    const businessPlan = ideaData.businessPlan as GenerateBusinessPlanOutput | undefined;

    if (!businessPlan) {
      return { content: null, error: 'Business plan not found' };
    }

    let content = '';

    if (format === 'markdown') {
      content = `# ${ideaData.title} - 사업계획서\n\n`;
      content += `생성일: ${new Date().toLocaleDateString()}\n\n`;
      content += `---\n\n`;

      businessPlan.sections.forEach(section => {
        content += `## ${section.title}\n\n`;
        content += `${section.content}\n\n`;
        content += `---\n\n`;
      });

      content += `## 메타데이터\n\n`;
      content += `- **타겟 시장**: ${businessPlan.metadata.targetMarket}\n`;
      content += `- **비즈니스 모델**: ${businessPlan.metadata.businessModel}\n`;
      content += `- **필요 자금**: ${businessPlan.metadata.fundingNeeded}\n`;
      content += `- **시장 출시**: ${businessPlan.metadata.timeToMarket}\n`;
    } else {
      content = `${ideaData.title} - 사업계획서\n`;
      content += `생성일: ${new Date().toLocaleDateString()}\n\n`;
      content += `${'='.repeat(60)}\n\n`;

      businessPlan.sections.forEach(section => {
        content += `${section.title}\n`;
        content += `${'-'.repeat(section.title.length)}\n\n`;
        content += `${section.content}\n\n`;
        content += `${'='.repeat(60)}\n\n`;
      });

      content += `메타데이터\n`;
      content += `${'-'.repeat(10)}\n\n`;
      content += `타겟 시장: ${businessPlan.metadata.targetMarket}\n`;
      content += `비즈니스 모델: ${businessPlan.metadata.businessModel}\n`;
      content += `필요 자금: ${businessPlan.metadata.fundingNeeded}\n`;
      content += `시장 출시: ${businessPlan.metadata.timeToMarket}\n`;
    }

    return { content, error: null };
  } catch (error: any) {
    console.error('Error exporting business plan:', error);
    return { content: null, error: 'Failed to export business plan' };
  }
}