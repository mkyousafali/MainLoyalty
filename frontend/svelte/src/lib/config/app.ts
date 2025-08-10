// Application configuration constants

export const APP_CONFIG = {
  name: 'Urban Market Loyalty Program',
  version: '1.0.0',
  description: 'Customer loyalty program for Urban Market establishments',
  
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
    timeout: 30000,
    retryAttempts: 3
  },
  
  // Loyalty Program Settings
  loyalty: {
    pointsPerRiyal: 1,
    pointsValidityMonths: 12, // Points valid until end of calendar year
    minPurchaseAmount: 1,
    maxPointsPerTransaction: 10000,
    
    // Tier thresholds (points needed)
    tiers: {
      bronze: 0,
      silver: 1000,
      gold: 5000,
      platinum: 15000
    }
  },
  
  // Pagination
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    pageSizes: [10, 20, 50, 100]
  },
  
  // File upload limits
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    maxFiles: 10
  },
  
  // Session and storage
  session: {
    tokenKey: 'loyalty_token',
    userKey: 'loyalty_user',
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    refreshThreshold: 5 * 60 * 1000 // 5 minutes
  },
  
  // Notification settings
  notifications: {
    maxNotifications: 100,
    defaultDuration: 5000, // 5 seconds
    position: 'top-right'
  },
  
  // Localization
  localization: {
    defaultLanguage: 'en' as 'en' | 'ar',
    supportedLanguages: ['en', 'ar'] as const,
    rtlLanguages: ['ar'] as const
  },
  
  // Contact information
  contact: {
    email: 'support@urbanmarket.sa',
    phone: '+966 11 123 4567',
    whatsapp: '+966 50 000 0000',
    address: 'King Fahd Road, Riyadh, Saudi Arabia'
  },
  
  // Business hours
  businessHours: {
    workDays: 'Sunday through Thursday',
    hours: '9:00 AM to 6:00 PM',
    timezone: 'Asia/Riyadh'
  }
} as const;

// Feature flags for conditional functionality
export const FEATURES = {
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  enableNotifications: true,
  enableDarkMode: true,
  enableBiometrics: import.meta.env.VITE_ENABLE_BIOMETRICS === 'true',
  enablePushNotifications: import.meta.env.VITE_ENABLE_PUSH === 'true',
  enableGeolocation: import.meta.env.VITE_ENABLE_LOCATION === 'true',
  enableOfflineMode: true,
  enableDebugMode: import.meta.env.DEV,
  enableBetaFeatures: import.meta.env.VITE_ENABLE_BETA === 'true'
} as const;

// Environment detection
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
  baseUrl: import.meta.env.BASE_URL
} as const;
