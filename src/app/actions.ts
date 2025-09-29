'use server';

import '@/ai';
import { generateIdeaTitle } from '@/ai/flows/generate-idea-title';
import { generateIdeaSummary } from '@/ai/flows/generate-idea-summary';
import { generateIdeaOutline } from '@/ai/flows/generate-idea-outline';
import { generateIdeaMindMap, type MindMapNode } from '@/ai/flows/generate-idea-mindmap';
import { generateMindMapNode } from '@/ai/flows/generate-mindmap-node';
import { generateAISuggestions as generateAISuggestionsFlow } from '@/ai/flows/generate-ai-suggestions';
import type { GenerateAISuggestionsOutput } from '@/ai/flows/generate-ai-suggestions';
import { generateBusinessPlan as generateBusinessPlanFlow } from '@/ai/flows/generate-business-plan';
import type { GenerateBusinessPlanOutput } from '@/ai/flows/generate-business-plan';
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
  Timestamp,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { FREE_USER_API_LIMIT, FREE_USER_IDEA_LIMIT } from '@/lib/constants';

/* =========================
 * Types (서버/클라이언트 공통)
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

/* =========================
 * Schemas
 * =======================*/

const IdeaSchema = z.object({
  idea: z.string().min(10, { message: 'Please provide a more detailed idea (at least 10 characters).' }),
  userId: z.string().min(1, { message: 'User ID is required.' }),
  language: z.enum(['English', 'Korean']),
  requestId: z.string().min(1, { message: 'Request ID is required.' }),
});

/* =========================
 * Helper Functions (서버 전용)
 * =======================*/

async function getUserDataServer(userId: string): Promise<{ 
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
 * AI Idea Generation (서버 전용)
 * =======================*/

// export async function generateIdea(
//   prevState: any,
//   formData: FormData
// ): Promise<{ data: GeneratedIdea | null; error: string | null }> {
//   const validated = IdeaSchema.safeParse({
//     idea: formData.get('idea'),
//     userId: formData.get('userId'),
//     language: formData.get('language'),
//     requestId: formData.get('requestId'),
//   });

//   if (!validated.success) {
//     const f = validated.error.flatten().fieldErrors;
//     return { 
//       data: null, 
//       error: f.idea?.[0] || f.userId?.[0] || f.language?.[0] || f.requestId?.[0] || 'Invalid input.' 
//     };
//   }

//   const { idea: ideaDescription, userId, language, requestId } = validated.data;

//   // 중복 제출 방지
//   const lockRef = doc(db, 'locks', requestId);
//   const locked = await runTransaction(db, async (tx) => {
//     const snap = await tx.get(lockRef);
//     if (snap.exists()) return false;
//     tx.set(lockRef, { userId, createdAt: serverTimestamp(), status: 'processing' });
//     return true;
//   });

//   if (!locked) {
//     return { data: null, error: 'Duplicate submission detected. Please wait.' };
//   }

//   try {
//     // 1. 사용자 데이터 로드 및 제한 확인
//     const { data: userData, error: userError } = await getUserDataServer(userId);
//     if (userError || !userData) {
//       return { data: null, error: userError || 'User data not found.' };
//     }

//     if ((userData.role ?? 'free') === 'free') {
//       // 총 아이디어 제한
//       if ((userData.ideaCount ?? 0) >= FREE_USER_IDEA_LIMIT) {
//         return {
//           data: null,
//           error: 'Free users are limited to 5 saved ideas. Please upgrade to create more.',
//         };
//       }

//       // 일일 생성 제한
//       const now = new Date();
//       const last = userData.lastApiRequestDate;
//       let currentCount = userData.apiRequestCount ?? 0;

//       if (last) {
//         const oneDayMs = 24 * 60 * 60 * 1000;
//         if (now.getTime() - last.getTime() > oneDayMs) {
//           currentCount = 0;
//         }
//       }

//       if (currentCount >= FREE_USER_API_LIMIT) {
//         return {
//           data: null,
//           error: 'Free users are limited to 2 idea generations per day. Please upgrade to generate more.',
//         };
//       }
//     }

//     // 2. AI 콘텐츠 생성 (재시도 로직 포함)
//     const maxRetries = 2;
//     let titleResult: any = null;
//     let summaryResult: any = null;
//     let outlineResult: any = null;

//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//       try {
//         [titleResult, summaryResult, outlineResult] = await Promise.all([
//           generateIdeaTitle({ ideaDescription, language }),
//           generateIdeaSummary({ idea: ideaDescription, language }),
//           generateIdeaOutline({ idea: ideaDescription, language }),
//         ]);
//         break;
//       } catch (error: any) {
//         console.error(`AI generation attempt ${attempt + 1} failed:`, error);
        
//         if (error.message?.includes('503') && attempt < maxRetries) {
//           console.log(`Retrying after 503 error, attempt ${attempt + 2}...`);
//           await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
//           continue;
//         }
//         throw error;
//       }
//     }

//     // 3. AI 생성 성공 후 사용량 증가 (무료 사용자만)
//     if ((userData.role ?? 'free') === 'free') {
//       const userRef = doc(db, 'users', userId);
//       await runTransaction(db, async (tx) => {
//         const snap = await tx.get(userRef);
//         if (!snap.exists()) throw new Error('User not found.');

//         const curr = snap.data() as {
//           apiRequestCount?: number;
//           lastApiRequestDate?: Timestamp | null;
//         };

//         let count = curr.apiRequestCount ?? 0;
//         const lastTs = curr.lastApiRequestDate instanceof Timestamp 
//           ? curr.lastApiRequestDate.toDate() 
//           : null;
//         const now = new Date();

//         if (lastTs) {
//           const oneDayMs = 24 * 60 * 60 * 1000;
//           if (now.getTime() - lastTs.getTime() > oneDayMs) {
//             count = 0;
//           }
//         }

//         if (count >= FREE_USER_API_LIMIT) {
//           throw new Error('Free users are limited to 2 idea generations per day.');
//         }

//         tx.update(userRef, {
//           apiRequestCount: count + 1,
//           lastApiRequestDate: serverTimestamp(),
//         });
//       });
//     }

//     // 4. 아이디어 저장
//     const newIdea = {
//       title: titleResult.ideaTitle,
//       summary: summaryResult.summary,
//       outline: outlineResult.outline,
//       favorited: false,
//       userId,
//       language,
//     };

//     const ideaRef = await addDoc(collection(db, 'ideas'), {
//       ...newIdea,
//       requestId,
//       createdAt: serverTimestamp(),
//     });

//     // 5. 사용자 ideaCount 증가
//     await updateDoc(doc(db, 'users', userId), {
//       ideaCount: increment(1),
//     });

//     return {
//       data: { id: ideaRef.id, ...newIdea },
//       error: null,
//     };
//   } catch (error: any) {
//     console.error('Error in generateIdea:', error);

//     let errorMessage = 'Failed to generate idea. Please try again.';

//     if (error?.message?.includes('503') || error?.message?.includes('Service Unavailable')) {
//       errorMessage = 'AI service is temporarily unavailable. Please try again in a few minutes. Your usage quota has not been affected.';
//     } else if (error?.message?.includes('Free users are limited')) {
//       errorMessage = error.message;
//     }

//     return { data: null, error: errorMessage };
//   }
// }

// actions.ts

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
    return { 
      data: null, 
      error: f.idea?.[0] || f.userId?.[0] || f.language?.[0] || f.requestId?.[0] || 'Invalid input.' 
    };
  }

  const { idea: ideaDescription, userId, language, requestId } = validated.data;

  try {
    // AI 생성만 서버에서 수행 (Firestore 접근 없음)
    const [titleResult, summaryResult, outlineResult] = await Promise.all([
      generateIdeaTitle({ ideaDescription, language }),
      generateIdeaSummary({ idea: ideaDescription, language }),
      generateIdeaOutline({ idea: ideaDescription, language }),
    ]);

    // AI 생성된 데이터만 반환 (저장은 클라이언트에서)
    return {
      data: {
        title: titleResult.ideaTitle,
        summary: summaryResult.summary,
        outline: outlineResult.outline,
        favorited: false,
        userId,
        language,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error in generateIdea:', error);
    return { 
      data: null, 
      error: 'Failed to generate idea. Please try again.' 
    };
  }
}


/* =========================
 * Usage Tracking (서버 전용)
 * =======================*/

// export async function getUserUsage(userId: string): Promise<{
//   role: 'free' | 'paid';
//   dailyLeft: number | null;
//   ideasLeft: number | null;
//   error?: string | null;
// }> {
//   try {
//     const { data, error } = await getUserDataServer(userId);
//     if (error || !data) {
//       return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: error ?? 'User not found' };
//     }

//     const role = data.role ?? 'free';

//     if (role === 'paid') {
//       return { role, dailyLeft: null, ideasLeft: null, error: null };
//     }

//     // 무료 사용자 사용량 계산
//     const now = new Date();
//     const last = data.lastApiRequestDate;
//     let usedToday = data.apiRequestCount ?? 0;

//     if (last) {
//       const oneDayMs = 24 * 60 * 60 * 1000;
//       if (now.getTime() - last.getTime() > oneDayMs) {
//         usedToday = 0;
//       }
//     } else {
//       usedToday = 0;
//     }

//     const dailyLeft = Math.max(0, FREE_USER_API_LIMIT - usedToday);
//     const totalIdeasUsed = data.ideaCount ?? 0;
//     const ideasLeft = Math.max(0, FREE_USER_IDEA_LIMIT - totalIdeasUsed);

//     return { role, dailyLeft, ideasLeft, error: null };
//   } catch (e) {
//     console.error('getUserUsage error:', e);
//     return { role: 'free', dailyLeft: 0, ideasLeft: 0, error: 'Failed to fetch usage' };
//   }
// }

/* =========================
 * Mind Map AI Generation (서버 전용)
 * =======================*/

export async function regenerateMindMap(
  ideaId: string,
  ideaSummary: string,
  language: 'English' | 'Korean'
): Promise<{ success: boolean; newMindMap: MindMapNode | null; error: string | null }> {
  try {
    if (!ideaId || !ideaSummary) {
      throw new Error('Idea ID and summary are required.');
    }

    const mindMapResult = await generateIdeaMindMap({ idea: ideaSummary, language });
    const ref = doc(db, 'ideas', ideaId);
    await updateDoc(ref, { mindMap: mindMapResult.mindMap });

    revalidatePath(`/idea/${ideaId}`);
    revalidatePath(`/idea/${ideaId}/mindmap`);
    revalidatePath('/archive');

    return { success: true, newMindMap: mindMapResult.mindMap, error: null };
  } catch (err) {
    console.error('Error regenerating mind map:', err);
    return { success: false, newMindMap: null, error: 'Failed to regenerate mind map.' };
  }
}

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
      
      if (!ideaSnap.exists()) {
        throw new Error('Idea not found');
      }

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

/* =========================
 * AI Suggestions (Premium - 서버 전용)
 * =======================*/

export async function generateAISuggestions(input: {
  ideaId: string;
  title: string;
  summary: string;
  outline: string;
  language: 'English' | 'Korean';
}): Promise<GenerateAISuggestionsOutput> {
  try {
    const { ideaId, title, summary, outline, language } = input;

    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      throw new Error('Idea not found');
    }

    const ideaData = ideaSnap.data();
    const userId = ideaData.userId;

    const { data: userData, error: userError } = await getUserDataServer(userId);
    if (userError || !userData) {
      throw new Error('User not found');
    }

    if ((userData.role ?? 'free') !== 'paid') {
      throw new Error('Premium feature - Upgrade to Pro plan');
    }

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

export async function saveAISuggestions(
  ideaId: string,
  suggestions: GenerateAISuggestionsOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);

    await runTransaction(db, async (transaction) => {
      const ideaDoc = await transaction.get(ideaRef);

      if (!ideaDoc.exists()) {
        throw new Error('Idea not found');
      }

      const ideaData = ideaDoc.data();
      const userId = ideaData.userId;

      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if ((userData.role ?? 'free') !== 'paid') {
        throw new Error('Premium feature - Upgrade to Pro plan');
      }

      transaction.update(ideaRef, {
        aiSuggestions: suggestions,
        updatedAt: serverTimestamp(),
      });
    });

    revalidatePath(`/idea/${ideaId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving AI suggestions:', error);
    return { success: false, error: error.message || 'Failed to save AI suggestions' };
  }
}

/* =========================
 * Business Plan (Premium - 서버 전용)
 * =======================*/

export async function generateBusinessPlan(input: {
  ideaId: string;
  title: string;
  summary: string;
  outline: string;
  aiSuggestions?: any;
  language: 'English' | 'Korean';
}): Promise<GenerateBusinessPlanOutput> {
  try {
    const { ideaId, title, summary, outline, aiSuggestions, language } = input;

    const ideaRef = doc(db, 'ideas', ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      throw new Error('Idea not found');
    }

    const ideaData = ideaSnap.data();
    const userId = ideaData.userId;

    const { data: userData, error: userError } = await getUserDataServer(userId);
    if (userError || !userData) {
      throw new Error('User not found');
    }

    if ((userData.role ?? 'free') !== 'paid') {
      throw new Error('Premium feature - Upgrade to Pro plan');
    }

    const result = await generateBusinessPlanFlow({
      ideaId,
      title,
      summary,
      outline,
      aiSuggestions,
      language,
    });

    return result;
  } catch (error: any) {
    console.error('Error generating business plan:', error);
    throw error;
  }
}

export async function saveBusinessPlan(
  ideaId: string,
  businessPlan: GenerateBusinessPlanOutput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!ideaId) {
      return { success: false, error: 'Idea ID is required' };
    }

    const ideaRef = doc(db, 'ideas', ideaId);

    await runTransaction(db, async (transaction) => {
      const ideaDoc = await transaction.get(ideaRef);

      if (!ideaDoc.exists()) {
        throw new Error('Idea not found');
      }

      const ideaData = ideaDoc.data();
      const userId = ideaData.userId;

      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      if ((userData.role ?? 'free') !== 'paid') {
        throw new Error('Premium feature - Upgrade to Pro plan');
      }

      transaction.update(ideaRef, {
        businessPlan: businessPlan,
        businessPlanGeneratedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    revalidatePath(`/idea/${ideaId}`);
    revalidatePath(`/idea/${ideaId}/business-plan`);

    return { success: true };
  } catch (error: any) {
    console.error('Error saving business plan:', error);
    return { success: false, error: error.message || 'Failed to save business plan' };
  }
}

/* =========================
 * Business Plan Export (서버 전용)
 * =======================*/

export async function exportBusinessPlan(
  ideaId: string,
  format: 'markdown' | 'text' = 'markdown'
): Promise<{ content: string | null; error: string | null }> {
  try {
    // 서버에서 직접 Firestore 조회
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