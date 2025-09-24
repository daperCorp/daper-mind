'use client';
import { useLanguage } from '@/context/language-context';
type Dict = 'English' | 'Korean';

export type Translations = {
  [key: string]: Record<Dict, string>;
};

export const translations: Translations = {
  // Common
  success: { English: 'Success', Korean: '성공' },
  error: { English: 'Error', Korean: '오류' },
  cancel: { English: 'Cancel', Korean: '취소' },
  close: { English: 'Close', Korean: '닫기' },
  delete: { English: 'Delete', Korean: '삭제' },
  deleting: { English: 'Deleting...', Korean: '삭제 중...' },
  loading: { English: 'Loading...', Korean: '로딩 중...' },
  tryAgain: { English: 'Try Again', Korean: '다시 시도' },
  clearSearch: { English: 'Clear Search', Korean: '검색 초기화' },
  
  // Sidebar
  newIdea: { English: 'New Idea', Korean: '새 아이디어' },
  archive: { English: 'Archive', Korean: '보관함' },
  favorites: { English: 'Favorites', Korean: '즐겨찾기' },

  // Header
  aiIdeaArchitect: { English: 'AI Idea Architect', Korean: 'AI 아이디어 설계자' },

  // Idea Generation
  describeYourIdea: { English: 'Describe your idea...', Korean: '아이디어를 설명해주세요...' },
  generating: { English: 'Generating...', Korean: '생성 중...' },
  generateIdea: { English: 'Generate Idea', Korean: '아이디어 생성' },
  generatedIdea: { English: 'Generated Idea', Korean: '생성된 아이디어' },
  generate: { English: 'Generate', Korean: '생성' },
  generateAnother: { English: 'Generate Another', Korean: '새로 생성하기' },
  ideaOutline: { English: 'Idea Outline', Korean: '아이디어 개요' },
  summary: { English: 'Summary', Korean: '요약' },
  mindMap: { English: 'Mind Map', Korean: '마인드맵' },
  mindMapRegenerated: { English: 'Mind map has been regenerated.', Korean: '마인드맵이 재생성되었습니다.' },
  regenerate: { English: 'Regenerate', Korean: '재생성' },
  regenerateMindMap: { English: 'Regenerate Mind Map', Korean: '마인드맵 재생성' },

  // Archive & Favorites Page
  ideaArchive: { English: 'Idea Archive', Korean: '아이디어 보관함' },
  archiveEmpty: {
    English: 'Your archive is empty',
    Korean: '보관함이 비어있습니다',
  },
  favoriteIdeas: { English: 'Favorite Ideas', Korean: '즐겨찾는 아이디어' },
  favoritesEmpty: {
    English: 'No favorites yet',
    Korean: '즐겨찾기가 없습니다',
  },
  searchIdeas: { English: 'Search ideas...', Korean: '아이디어 검색...' },
  searchFavorites: { English: 'Search favorites...', Korean: '즐겨찾기 검색...' },
  newest: { English: 'Newest', Korean: '최신순' },
  oldest: { English: 'Oldest', Korean: '오래된순' },
  titleSort: { English: 'A-Z', Korean: '가나다순' },
  compactCards: { English: 'Compact cards', Korean: '컴팩트 카드' },
  comfortableCards: { English: 'Comfortable cards', Korean: '편안한 카드' },
  item: { English: 'item', Korean: '개' },
  items: { English: 'items', Korean: '개' },
  favorite: { English: 'favorite', Korean: '즐겨찾기' },
  favorites2: { English: 'favorites', Korean: '즐겨찾기' },
  favorited: { English: 'Favorited', Korean: '즐겨찾기됨' },
  removedFromFavorites: { English: 'Removed from favorites', Korean: '즐겨찾기에서 제거됨' },
  ideaRemovedFromFavorites: { English: 'The idea has been removed from your favorites.', Korean: '아이디어가 즐겨찾기에서 제거되었습니다.' },
  deleted: { English: 'Deleted', Korean: '삭제됨' },
  ideaRemoved: { English: 'Idea has been removed.', Korean: '아이디어가 제거되었습니다.' },
  ideaDeletedFromFavorites: { English: 'Idea has been removed from favorites and deleted.', Korean: '아이디어가 즐겨찾기에서 제거되고 삭제되었습니다.' },
  deleteThisIdea: { English: 'Delete this idea?', Korean: '이 아이디어를 삭제하시겠습니까?' },
  deleteFavoriteIdea: { English: 'Delete this favorite idea?', Korean: '이 즐겨찾기 아이디어를 삭제하시겠습니까?' },
  deleteConfirmation: { English: 'This action cannot be undone.', Korean: '이 작업은 되돌릴 수 없습니다.' },
  deleteFavoriteConfirmation: { 
    English: 'This will remove the idea from your favorites and delete it permanently. This action cannot be undone.',
    Korean: '이 작업은 즐겨찾기에서 아이디어를 제거하고 영구적으로 삭제합니다. 되돌릴 수 없습니다.'
  },
  noMatchingIdeas: { English: 'No matching ideas', Korean: '일치하는 아이디어 없음' },
  noMatchingFavorites: { English: 'No matching favorites', Korean: '일치하는 즐겨찾기 없음' },
  adjustSearchTerms: { English: 'Try adjusting your search terms or clear the search.', Korean: '검색어를 조정하거나 검색을 초기화해보세요.' },
  adjustSearchTermsBrowse: { English: 'Try adjusting your search terms or browse all your favorite ideas.', Korean: '검색어를 조정하거나 모든 즐겨찾기 아이디어를 둘러보세요.' },
  generateFirstIdea: { English: 'Generate Your First Idea', Korean: '첫 번째 아이디어 생성하기' },
  browseYourIdeas: { English: 'Browse Your Ideas', Korean: '아이디어 둘러보기' },
  startCreating: { English: 'Start creating amazing ideas! Generate your first idea to see it appear here.', Korean: '멋진 아이디어 만들기를 시작하세요! 첫 번째 아이디어를 생성하면 여기에 나타납니다.' },
  starIdeasToSee: { English: 'Star ideas you love to see them here. Your favorite ideas will be easily accessible and organized.', Korean: '좋아하는 아이디어에 별표를 표시하면 여기에서 볼 수 있습니다. 즐겨찾는 아이디어들을 쉽게 접근하고 정리할 수 있습니다.' },

  // Idea Detail Page
  createdOn: { English: 'Created on', Korean: '작성일' },
  share: { English: 'Share', Korean: '공유' },
  export: { English: 'Export', Korean: '내보내기' },
  outline: { English: 'Outline', Korean: '개요' },
  linkCopied: { English: 'Link copied to clipboard!', Korean: '링크가 클립보드에 복사되었습니다!' },
  linkCopyError: { English: 'Could not copy link.', Korean: '링크를 복사할 수 없습니다.' },
  ideaExported: { English: 'Idea exported as a text file.', Korean: '아이디어를 텍스트 파일로 내보냈습니다.' },
  viewDetails: { English: 'View Details', Korean: '상세보기' },
  goToArchive: { English: 'Go to Archive', Korean: '보관함으로 가기' },

  // User Profile & Authentication
  logout: { English: 'Log out', Korean: '로그아웃' },
  id: { English: 'ID', Korean: '아이디' },
  settings: { English: 'Settings', Korean: '설정' },
  language: { English: 'Language', Korean: '언어' },
  getHelp: { English: 'Get help', Korean: '도움말' },
  upgradePlan: { English: 'Upgrade plan', Korean: '플랜 업그레이드' },
  upgradeNow: { English: 'Upgrade Now', Korean: '지금 업그레이드' },
  authenticationRequired: { English: 'Authentication Required', Korean: '인증이 필요합니다' },
  pleaseLogin: { English: 'Please log in to view your ideas.', Korean: '아이디어를 보려면 로그인해주세요.' },
  signInToTrackUsage: { English: 'Sign in to track usage', Korean: '사용량 추적을 위해 로그인하세요' },
  mustBeLoggedIn: { English: 'You must be logged in to delete an idea.', Korean: '아이디어를 삭제하려면 로그인해야 합니다.' },

  // Language Selector
  selectLanguage: { English: 'Select language', Korean: '언어 선택' },
  english: { English: 'English', Korean: '영어' },
  korean: { English: 'Korean', Korean: '한국어' },

  // Login Page
  login: { English: 'Login', Korean: '로그인' },
  loginPrompt: {
    English: 'Enter your email below to login to your account.',
    Korean: '계정에 로그인하려면 아래에 이메일을 입력하세요.',
  },
  email: { English: 'Email', Korean: '이메일' },
  password: { English: 'Password', Korean: '비밀번호' },
  signIn: { English: 'Sign In', Korean: '로그인' },
  orContinueWith: { English: 'Or continue with', Korean: '또는 다음으로 계속' },
  signInWithGoogle: { English: 'Sign in with Google', Korean: 'Google로 로그인' },
  noAccount: { English: "Don't have an account?", Korean: '계정이 없으신가요?' },
  signUp: { English: 'Sign up', Korean: '가입하기' },

  // Register Page
  signUpTitle: { English: 'Sign Up', Korean: '가입하기' },
  signUpPrompt: { English: 'Enter your information to create an account.', Korean: '계정을 만들려면 정보를 입력하세요.' },
  confirmPassword: { English: 'Confirm Password', Korean: '비밀번호 확인' },
  passwordsDoNotMatch: { English: 'Passwords do not match', Korean: '비밀번호가 일치하지 않습니다.' },
  createAccount: { English: 'Create an account', Korean: '계정 만들기' },
  alreadyHaveAccount: { English: 'Already have an account?', Korean: '이미 계정이 있으신가요?' },

  // Settings Page
  myAccount: { English: 'My Account', Korean: '내 계정' },
  accountDescription: { English: 'View and manage your account details.', Korean: '계정 정보를 보고 관리합니다.' },
  planDetails: { English: 'Plan & Billing', Korean: '플랜 및 결제' },
  planDescription: {
    English: 'View and manage your current plan and billing details.',
    Korean: '현재 플랜 및 결제 정보를 보고 관리합니다.',
  },
  currentPlan: { English: 'Current Plan', Korean: '현재 플랜' },
  free: { English: 'Free', Korean: '무료' },
  paid: { English: 'Premium', Korean: '프리미엄' },
  plan: { English: 'Plan', Korean: '플랜' },
  manageAccount: { English: 'Manage Account', Korean: '계정 관리' },
  manageAccountDescription: {
    English: 'Manage your account settings and preferences.',
    Korean: '계정 설정 및 환경설정을 관리합니다.',
  },
  contactSupport: { English: 'Contact Support', Korean: '고객 지원팀에 문의' },
  contactSupportDescription: {
    English: 'Get help with your account, billing, or any other questions.',
    Korean: '계정, 결제 또는 기타 질문에 대한 도움을 받으세요.',
  },
  signOut: { English: 'Sign Out', Korean: '로그아웃' },
  signOutDescription: { English: 'Sign out of your account on this device.', Korean: '이 기기에서 계정에서 로그아웃합니다.' },
  signOutConfirmTitle: { English: 'Are you sure you want to sign out?', Korean: '정말로 로그아웃하시겠습니까?' },
  signOutConfirmDescription: { English: 'You will be returned to the login page.', Korean: '로그인 페이지로 돌아갑니다.' },
  languageDescription: { English: 'Choose the language for the application interface.', Korean: '애플리케이션 인터페이스의 언어를 선택하세요.' },
  privacyPolicy: { English: 'Privacy Policy', Korean: '개인정보 처리방침' },
  viewPricing: { English: 'View pricing', Korean: '가격 보기' },
  manageBilling: { English: 'Manage billing', Korean: '결제 관리' },
  changePlan: { English: 'Change plan', Korean: '플랜 변경' },

  // Plan / Usage
  freePlan: { English: 'Free Plan', Korean: '무료 플랜' },
  paidPlan: { English: 'Paid Plan', Korean: '유료 플랜' },
  remainingIdeas: { English: 'Remaining Ideas', Korean: '남은 아이디어' },
  remainingGenerations: { English: 'Remaining Generations', Korean: '남은 생성 횟수' },
  dailyLeft: { English: 'Daily left', Korean: '일일 남은 횟수' },
  ideasLeft: { English: 'Ideas left', Korean: '남은 아이디어' },
  loadingUsage: { English: 'Loading usage…', Korean: '사용량 로딩 중…' },
  quotaSignInPrompt: {
    English: 'Sign in to track usage',
    Korean: '사용량 확인을 위해 로그인하세요',
  },
  dailyLimitReached: {
    English: 'You have reached your daily limit. Please upgrade to continue.',
    Korean: '오늘의 사용 한도에 도달했습니다. 계속하려면 업그레이드하세요.',
  },
  ideaLimitReached: {
    English: 'You have reached the maximum number of saved ideas.',
    Korean: '저장할 수 있는 아이디어의 최대 개수에 도달했습니다.',
  },
  usage: { English: 'Usage', Korean: '사용 현황' },
  ideasUsed: { English: 'Ideas Used', Korean: '사용한 아이디어' },
  ideasRemaining: { English: 'Ideas Remaining', Korean: '남은 아이디어' },
  generationsUsed: { English: 'Generations Used', Korean: '사용한 생성 횟수' },
  generationsRemaining: { English: 'Generations Remaining', Korean: '남은 생성 횟수' },
  today: { English: 'Today', Korean: '오늘' },
  needMore: { English: 'Need more?', Korean: '더 필요하세요?' },
  upgrade: { English: 'Upgrade', Korean: '업그레이드' },

  // Error messages and loading states
  errorLoadingIdeas: { English: 'Error loading ideas', Korean: '아이디어 로딩 오류' },
  errorLoadingFavorites: { English: 'Error loading favorites', Korean: '즐겨찾기 로딩 오류' },
  failedToLoadIdeas: { English: 'Failed to load ideas. Please try again.', Korean: '아이디어를 불러오지 못했습니다. 다시 시도해주세요.' },
  failedToLoadFavorites: { English: 'Failed to load favorite ideas. Please try again.', Korean: '즐겨찾기 아이디어를 불러오지 못했습니다. 다시 시도해주세요.' },
  unexpectedError: { English: 'An unexpected error occurred.', Korean: '예상치 못한 오류가 발생했습니다.' },
  failedToDeleteIdea: { English: 'Failed to delete idea.', Korean: '아이디어 삭제에 실패했습니다.' },

  // Dialog specific
  whatsNext: { English: "What's Next?", Korean: '다음 단계는?' },
  exploreFullDetails: { English: 'Explore the full details and mind map visualization', Korean: '전체 상세 내용과 마인드맵 시각화를 탐색하세요' },
  addToFavorites: { English: 'Add to favorites for quick access later', Korean: '나중에 빠르게 접근할 수 있도록 즐겨찾기에 추가하세요' },
  generateMoreIdeas: { English: 'Generate more ideas to build your collection', Korean: '컬렉션을 구축하기 위해 더 많은 아이디어를 생성하세요' },
  savedToArchive: { English: 'Saved to Archive', Korean: '보관함에 저장됨' },
  justNow: { English: 'Just now', Korean: '방금 전' },
  status: { English: 'Status', Korean: '상태' },
  generated: { English: 'Generated!', Korean: '생성 완료!' },

  // Limit messages
  reachedDailyAndTotalLimits: { English: "You've reached both your daily and total idea limits", Korean: '일일 한도와 전체 아이디어 한도에 모두 도달했습니다' },
  reachedDailyLimit: { English: "You've reached your daily limit", Korean: '일일 한도에 도달했습니다' },
  reachedTotalLimit: { English: "You've reached your total idea limit", Korean: '전체 아이디어 한도에 도달했습니다' },
  comeBackTomorrow: { English: 'Come back tomorrow for more daily generations, or upgrade for unlimited access.', Korean: '내일 다시 오시면 더 많은 일일 생성이 가능하거나, 무제한 액세스를 위해 업그레이드하세요.' },
  upgradeForUnlimited: { English: 'Upgrade to Premium for unlimited idea generation and storage.', Korean: '무제한 아이디어 생성 및 저장을 위해 프리미엄으로 업그레이드하세요.' },

  // Loading and generation states
  analyzing: { English: 'Analyzing', Korean: '분석 중' },
  structuring: { English: 'Structuring', Korean: '구조화 중' },
  finalizing: { English: 'Finalizing', Korean: '마무리 중' },
  generatingYourIdea: { English: 'Generating Your Idea', Korean: '아이디어 생성 중' },
  aiCraftingDetails: { English: 'Our AI is crafting a detailed outline and summary for your idea...', Korean: 'AI가 귀하의 아이디어에 대한 상세한 개요와 요약을 작성하고 있습니다...' },

  // Helpful prompts
  tryExamples: { English: '💡 Try: "A mobile app for tracking daily habits" or "An eco-friendly business idea"', Korean: '💡 예시: "일일 습관을 추적하는 모바일 앱" 또는 "친환경 비즈니스 아이디어"' },
  signInPrompt: { English: '🔒', Korean: '🔒' },
  signInToStart: { English: 'to start generating and saving your ideas', Korean: '아이디어 생성 및 저장을 시작하려면' },

  // Missing keys from previous components
  removeFromFavorites: { English: 'Remove from favorites', Korean: '즐겨찾기에서 제거' },
  regenerating: { English: 'Regenerating...', Korean: '재생성 중...' },
  deleteIdea: { English: 'Delete Idea', Korean: '아이디어 삭제' },
  unfavorite: { English: 'Unfavorite', Korean: '즐겨찾기 해제' },
};

// ✅ 언어코드 → 사전에 쓰는 키로 매핑
const LANG_MAP: Record<string, Dict> = {
  en: 'English',
  ko: 'Korean',
  English: 'English',
  Korean: 'Korean',
};

// ✅ 안전한 번역 헬퍼
export function translate(key: keyof typeof translations, language: string): string {
  const lang = LANG_MAP[language] ?? 'English';
  const entry = translations[key];
  // 키가 없거나 해당 언어가 없을 때도 안전하게 처리
  return entry?.[lang] ?? entry?.English ?? key;
}
export function useT() {
  const { language } = useLanguage();
  return (key: keyof typeof translations | string) => translate(key, language);
}