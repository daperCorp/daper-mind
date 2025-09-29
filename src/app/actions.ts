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

// async function getUserDataServer(userId: string): Promise<{ 
//   data: SerializableUser | null; 
//   error: string | null 
// }> {
//   try {
//     const userRef = doc(db, 'users', userId);
//     const userSnap = await getDoc(userRef);
    
//     if (!userSnap.exists()) {
//       return { data: null, error: 'User not found.' };
//     }
    
//     const raw = userSnap.data() as SerializableUser & { 
//       lastApiRequestDate?: Timestamp | null 
//     };

//     return {
//       data: {
//         ...raw,
//         lastApiRequestDate: raw.lastApiRequestDate 
//           ? (raw.lastApiRequestDate as unknown as Timestamp).toDate() 
//           : null,
//       },
//       error: null,
//     };
//   } catch (err) {
//     console.error('Error fetching user data:', err);
//     return { data: null, error: 'Failed to fetch user data.' };
//   }
// }


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
 * Mind Map AI Generation (서버 전용)
 * =======================*/

// actions.ts
export async function regenerateMindMap(
  ideaSummary: string,
  language: 'English' | 'Korean'
): Promise<{ success: boolean; newMindMap: MindMapNode | null; error: string | null }> {
  try {
    if (!ideaSummary) {
      throw new Error('Summary is required.');
    }

    // AI 생성만 수행
    const mindMapResult = await generateIdeaMindMap({ idea: ideaSummary, language });

    return { success: true, newMindMap: mindMapResult.mindMap, error: null };
  } catch (err) {
    console.error('Error regenerating mind map:', err);
    return { success: false, newMindMap: null, error: 'Failed to regenerate mind map.' };
  }
}

export async function expandMindMapNode(
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
      return { success: true, newNodes };
    }
    
    return { success: false, error: 'No new nodes generated' };
  } catch (err) {
    console.error('Error expanding mind map node:', err);
    return { success: false, error: 'Failed to generate new nodes.' };
  }
}

/* =========================
 * AI Suggestions (Premium - 서버 전용)
 * =======================*/

// actions.ts
export async function generateAISuggestions(input: {
  title: string;
  summary: string;
  outline: string;
  language: 'English' | 'Korean';
}): Promise<GenerateAISuggestionsOutput> {
  try {
    const { title, summary, outline, language } = input;

    // AI 생성만 수행
    const result = await generateAISuggestionsFlow({
      ideaId: '', // Flow에서 필요없다면 제거
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

// export async function saveAISuggestions(
//   ideaId: string,
//   suggestions: GenerateAISuggestionsOutput
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     if (!ideaId) {
//       return { success: false, error: 'Idea ID is required' };
//     }

//     const ideaRef = doc(db, 'ideas', ideaId);

//     await runTransaction(db, async (transaction) => {
//       const ideaDoc = await transaction.get(ideaRef);

//       if (!ideaDoc.exists()) {
//         throw new Error('Idea not found');
//       }

//       const ideaData = ideaDoc.data();
//       const userId = ideaData.userId;

//       const userRef = doc(db, 'users', userId);
//       const userDoc = await transaction.get(userRef);

//       if (!userDoc.exists()) {
//         throw new Error('User not found');
//       }

//       const userData = userDoc.data();
//       if ((userData.role ?? 'free') !== 'paid') {
//         throw new Error('Premium feature - Upgrade to Pro plan');
//       }

//       transaction.update(ideaRef, {
//         aiSuggestions: suggestions,
//         updatedAt: serverTimestamp(),
//       });
//     });

//     revalidatePath(`/idea/${ideaId}`);
//     return { success: true };
//   } catch (error: any) {
//     console.error('Error saving AI suggestions:', error);
//     return { success: false, error: error.message || 'Failed to save AI suggestions' };
//   }
// }

/* =========================
 * Business Plan (Premium - 서버 전용)
 * =======================*/

// actions.ts
export async function generateBusinessPlan(input: {
  title: string;
  summary: string;
  outline: string;
  aiSuggestions?: any;
  language: 'English' | 'Korean';
}): Promise<GenerateBusinessPlanOutput> {
  try {
    const { title, summary, outline, aiSuggestions, language } = input;

    // AI 생성만 수행 (Firestore 접근 제거)
    const result = await generateBusinessPlanFlow({
      ideaId: '', // Flow에서 필요없다면 제거 가능
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

// export async function saveBusinessPlan(
//   ideaId: string,
//   businessPlan: GenerateBusinessPlanOutput
// ): Promise<{ success: boolean; error?: string }> {
//   try {
//     if (!ideaId) {
//       return { success: false, error: 'Idea ID is required' };
//     }

//     const ideaRef = doc(db, 'ideas', ideaId);

//     await runTransaction(db, async (transaction) => {
//       const ideaDoc = await transaction.get(ideaRef);

//       if (!ideaDoc.exists()) {
//         throw new Error('Idea not found');
//       }

//       const ideaData = ideaDoc.data();
//       const userId = ideaData.userId;

//       const userRef = doc(db, 'users', userId);
//       const userDoc = await transaction.get(userRef);

//       if (!userDoc.exists()) {
//         throw new Error('User not found');
//       }

//       const userData = userDoc.data();
//       if ((userData.role ?? 'free') !== 'paid') {
//         throw new Error('Premium feature - Upgrade to Pro plan');
//       }

//       transaction.update(ideaRef, {
//         businessPlan: businessPlan,
//         businessPlanGeneratedAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//       });
//     });

//     revalidatePath(`/idea/${ideaId}`);
//     revalidatePath(`/idea/${ideaId}/business-plan`);

//     return { success: true };
//   } catch (error: any) {
//     console.error('Error saving business plan:', error);
//     return { success: false, error: error.message || 'Failed to save business plan' };
//   }
// }

/* =========================
 * Business Plan Export (서버 전용)
 * =======================*/

// export async function exportBusinessPlan(
//   ideaId: string,
//   format: 'markdown' | 'text' = 'markdown'
// ): Promise<{ content: string | null; error: string | null }> {
//   try {
//     // 서버에서 직접 Firestore 조회
//     const ideaRef = doc(db, 'ideas', ideaId);
//     const ideaSnap = await getDoc(ideaRef);

//     if (!ideaSnap.exists()) {
//       return { content: null, error: 'Idea not found' };
//     }

//     const ideaData = ideaSnap.data();
//     const businessPlan = ideaData.businessPlan as GenerateBusinessPlanOutput | undefined;

//     if (!businessPlan) {
//       return { content: null, error: 'Business plan not found' };
//     }

//     let content = '';

//     if (format === 'markdown') {
//       content = `# ${ideaData.title} - 사업계획서\n\n`;
//       content += `생성일: ${new Date().toLocaleDateString()}\n\n`;
//       content += `---\n\n`;

//       businessPlan.sections.forEach(section => {
//         content += `## ${section.title}\n\n`;
//         content += `${section.content}\n\n`;
//         content += `---\n\n`;
//       });

//       content += `## 메타데이터\n\n`;
//       content += `- **타겟 시장**: ${businessPlan.metadata.targetMarket}\n`;
//       content += `- **비즈니스 모델**: ${businessPlan.metadata.businessModel}\n`;
//       content += `- **필요 자금**: ${businessPlan.metadata.fundingNeeded}\n`;
//       content += `- **시장 출시**: ${businessPlan.metadata.timeToMarket}\n`;
//     } else {
//       content = `${ideaData.title} - 사업계획서\n`;
//       content += `생성일: ${new Date().toLocaleDateString()}\n\n`;
//       content += `${'='.repeat(60)}\n\n`;

//       businessPlan.sections.forEach(section => {
//         content += `${section.title}\n`;
//         content += `${'-'.repeat(section.title.length)}\n\n`;
//         content += `${section.content}\n\n`;
//         content += `${'='.repeat(60)}\n\n`;
//       });

//       content += `메타데이터\n`;
//       content += `${'-'.repeat(10)}\n\n`;
//       content += `타겟 시장: ${businessPlan.metadata.targetMarket}\n`;
//       content += `비즈니스 모델: ${businessPlan.metadata.businessModel}\n`;
//       content += `필요 자금: ${businessPlan.metadata.fundingNeeded}\n`;
//       content += `시장 출시: ${businessPlan.metadata.timeToMarket}\n`;
//     }

//     return { content, error: null };
//   } catch (error: any) {
//     console.error('Error exporting business plan:', error);
//     return { content: null, error: 'Failed to export business plan' };
//   }
// }