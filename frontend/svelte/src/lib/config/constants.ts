// Application constants and enums

// User Tiers
export const USER_TIERS = {
  BRONZE: 'bronze',
  SILVER: 'silver', 
  GOLD: 'gold',
  PLATINUM: 'platinum'
} as const;

export type UserTier = typeof USER_TIERS[keyof typeof USER_TIERS];

// Transaction Types
export const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  REDEMPTION: 'redemption',
  ADJUSTMENT: 'adjustment'
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

// Transaction Status
export const TRANSACTION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  CANCELLED: 'cancelled'
} as const;

export type TransactionStatus = typeof TRANSACTION_STATUS[keyof typeof TRANSACTION_STATUS];

// Notification Types
export const NOTIFICATION_TYPES = {
  TERMS_UPDATE: 'terms_update',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
  WARNING: 'warning',
  INFO: 'info'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  ARABIC: 'ar'
} as const;

export type LanguageCode = typeof LANGUAGES[keyof typeof LANGUAGES];

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/auth/register'
  },
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    UPDATE: '/customers/:id',
    DELETE: '/customers/:id',
    TRANSACTIONS: '/customers/:id/transactions'
  },
  TRANSACTIONS: {
    LIST: '/transactions',
    CREATE: '/transactions',
    UPDATE: '/transactions/:id'
  },
  REWARDS: {
    LIST: '/rewards',
    CREATE: '/rewards',
    REDEEM: '/rewards/:id/redeem'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/read-all'
  }
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'loyalty_token',
  USER_DATA: 'loyalty_user',
  NOTIFICATIONS: 'customerNotifications',
  LANGUAGE: 'loyalty_language',
  THEME: 'loyalty_theme',
  PREFERENCES: 'loyalty_preferences'
} as const;

// Form Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SAUDI_MOBILE: /^(05)[0-9]{8}$/,
  SAUDI_LANDLINE: /^(01)[0-9]{7}$/,
  POSTAL_CODE: /^[0-9]{5}$/,
  // Strong password: at least 8 chars, 1 uppercase, 1 lowercase, 1 number
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  FILENAME: 'YYYY-MM-DD_HH-mm-ss'
} as const;

// File Upload Limits
export const FILE_LIMITS = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENTS: ['application/pdf', 'text/csv', 'application/vnd.ms-excel'],
  MAX_FILES: 10
} as const;

// Pagination Defaults
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;

// Status Colors for UI
export const STATUS_COLORS = {
  SUCCESS: '#10b981',
  WARNING: '#f59e0b', 
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  PENDING: '#6b7280'
} as const;

// Animation Durations (in milliseconds)
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
} as const;

// Breakpoints (matching Tailwind defaults)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536
} as const;
