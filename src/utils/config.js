// Default configuration values for Cold Email Warmer
export const DEFAULT_CONFIG = {
  // Personalization settings
  defaultStyle: 'professional', // professional, casual, friendly, formal
  autoPersonalize: false, // Automatically personalize on compose
  personalizationDepth: 'basic', // basic, deep
  
  // AI settings
  aiEnabled: true,
  useLocalAI: true,
  aiFallback: true,
  
  // Variants
  generateVariants: true,
  numVariants: 3,
  
  // Subject lines
  generateSubjectLines: true,
  numSubjectLines: 5,
  
  // Follow-ups
  followUpEnabled: true,
  defaultFollowUpSequence: 3, // Number of follow-ups
  
  // Templates
  defaultTemplate: 'cold-outreach',
  
  // Research
  researchEnabled: true,
  researchDepth: 'basic', // basic, deep
  
  // History
  saveHistory: true,
  maxHistoryItems: 100,
  
  // User info
  userName: '',
  userTitle: '',
  userCompany: '',
  userEmail: '',
  
  // Data retention
  dataRetentionDays: 90,
  autoCleanup: true
};

export const STORAGE_KEYS = {
  CONFIG: 'emailWarmerConfig',
  EMAIL_HISTORY: 'emailHistory',
  RESEARCH_CACHE: 'researchCache',
  TEMPLATES: 'emailTemplates',
  FOLLOW_UP_SEQUENCES: 'followUpSequences',
  USAGE_STATS: 'usageStats'
};
