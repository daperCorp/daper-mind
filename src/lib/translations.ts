
'use client';

type Translations = {
  [key: string]: {
    [lang in 'English' | 'Korean']: string;
  };
};

export const translations: Translations = {
  // Sidebar
  newIdea: { English: 'New Idea', Korean: '새 아이디어' },
  archive: { English: 'Archive', Korean: '보관함' },
  favorites: { English: 'Favorites', Korean: '즐겨찾기' },

  // Header
  aiIdeaArchitect: { English: 'AI Idea Architect', Korean: 'AI 아이디어 설계자' },
  
  // Idea Architect Page
  describeYourIdea: { English: 'Describe your idea', Korean: '아이디어를 설명해주세요' },
  generating: { English: 'Generating...', Korean: '생성 중...' },
  generateIdea: { English: 'Generate Idea', Korean: '아이디어 생성' },
  ideaOutline: { English: 'Idea Outline', Korean: '아이디어 개요' },
  summary: { English: 'Summary', Korean: '요약' },
  
  // Archive Page
  ideaArchive: { English: 'Idea Archive', Korean: '아이디어 보관함' },
  archiveEmpty: { English: 'Your archive is empty. Generate some ideas to get started!', Korean: '보관함이 비어있습니다. 아이디어를 생성하여 시작해보세요!' },

  // Favorites Page
  favoriteIdeas: { English: 'Favorite Ideas', Korean: '즐겨찾는 아이디어' },
  favoritesEmpty: { English: 'You have no favorites yet. Star an idea in the archive to see it here!', Korean: '즐겨찾는 아이디어가 없습니다. 보관함에서 아이디어에 별표를 표시하여 여기에 추가하세요!' },

  // Idea Detail Page
  createdOn: { English: 'Created on', Korean: '작성일' },
  share: { English: 'Share', Korean: '공유' },
  export: { English: 'Export', Korean: '내보내기' },
  outline: { English: 'Outline', Korean: '개요' },
  linkCopied: { English: 'Link copied to clipboard!', Korean: '링크가 클립보드에 복사되었습니다!' },
  linkCopyError: { English: 'Could not copy link.', Korean: '링크를 복사할 수 없습니다.' },
  ideaExported: { English: 'Idea exported as a text file.', Korean: '아이디어를 텍스트 파일로 내보냈습니다.' },

  // User Profile
  logout: { English: 'Log out', Korean: '로그아웃' },

  // Language Selector
  selectLanguage: { English: 'Select language', Korean: '언어 선택' },
  english: { English: 'English', Korean: '영어' },
  korean: { English: 'Korean', Korean: '한국어' },

  // Login Page
  login: { English: 'Login', Korean: '로그인' },
  loginPrompt: { English: 'Enter your email below to login to your account.', Korean: '계정에 로그인하려면 아래에 이메일을 입력하세요.' },
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
};
