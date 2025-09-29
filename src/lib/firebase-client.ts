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
    runTransaction
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase';
  import type { MindMapNode } from '@/ai/flows/generate-idea-mindmap';
  import type { GenerateAISuggestionsOutput } from '@/ai/flows/generate-ai-suggestions';
  import type { GenerateBusinessPlanOutput } from '@/ai/flows/generate-business-plan';
  import { nanoid } from 'nanoid';
  
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
    
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      photoURL: user.photoURL ?? null,
      lastLogin: serverTimestamp(),
      role: 'free',
      ideaCount: 0,
      apiRequestCount: 0,
      lastApiRequestDate: null,
    }, { merge: true });
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
        return { data: null, error: 'Idea ID is required' };
      }
  
      const ideaRef = doc(db, 'ideas', ideaId);
      const ideaSnap = await getDoc(ideaRef);
  
      if (!ideaSnap.exists()) {
        return { data: null, error: 'Idea not found' };
      }
  
      const ideaData = ideaSnap.data();
      const ownerId = ideaData.userId;
  
      const shareId = nanoid(12);
      const now = new Date();
      const expiresAt = expiresInDays 
        ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
        : undefined;
  
      const shareLink: ShareLink = {
        id: shareId,
        ideaId,
        ownerId,
        createdAt: now,
        expiresAt,
        accessCount: 0,
        isActive: true,
      };
  
      const shareRef = doc(db, 'shareLinks', shareId);
      await setDoc(shareRef, {
        ...shareLink,
        createdAt: serverTimestamp(),
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      });
  
      return { data: shareLink, error: null };
    } catch (error: any) {
      console.error('Error creating share link:', error);
      return { data: null, error: 'Failed to create share link' };
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