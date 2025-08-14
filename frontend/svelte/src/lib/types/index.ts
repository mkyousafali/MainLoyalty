// Shared TypeScript interfaces and types for the Urban Market Loyalty Program

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  isAdmin: boolean;
  createdAt: string;
  lastLogin?: string;
  role: UserRole;
  permissions: Permission[];
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  isMasterAdmin: boolean;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  resource: string;
  action: string;
  isRequired: boolean;
}

export type PermissionCategory = 
  | 'user_management'
  | 'customer_management'
  | 'content_management'
  | 'system_settings'
  | 'financial'
  | 'notifications'
  | 'data_management'
  | 'card_management'
  | 'rewards_coupons'
  | 'admin_tools';

export interface AdminFunction {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  category: PermissionCategory;
  requiredPermissions: string[];
  isCore: boolean; // Core functions that can't be disabled
}

export interface Customer extends User {
  loyaltyCardNumber: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  birthDate?: string;
  preferences: CustomerPreferences;
}

export interface CustomerPreferences {
  language: 'en' | 'ar';
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketing: boolean;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  description: string;
  pointsPerRiyal: number;
  isActive: boolean;
  rules: ProgramRules;
}

export interface ProgramRules {
  minPurchaseAmount: number;
  maxPointsPerTransaction: number;
  pointsValidityMonths: number;
  tierUpgradeThresholds: {
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  pointsEarned: number;
  pointsUsed: number;
  type: 'purchase' | 'redemption' | 'adjustment';
  status: 'completed' | 'pending' | 'cancelled';
  branchId: string;
  createdAt: string;
  description?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  isActive: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
  validUntil?: string;
  terms?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'points';
  discountValue: number;
  minPurchase?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  targetAudience: 'all' | 'tier' | 'custom';
  targetCriteria?: any;
}

export interface CardType {
  id: string;
  name: string;
  color: string;
  benefits: string[];
  minTier: Customer['tier'];
  isActive: boolean;
}

// Notification types (already defined in stores/notifications.ts, but centralizing here)
export interface Notification {
  id: number;
  type: 'terms_update' | 'system' | 'promotion' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState {
  isLoading: boolean;
  errors: ValidationError[];
  isDirty: boolean;
}

// Language and localization
export type Language = 'en' | 'ar';

export interface Translation {
  [key: string]: string | Translation;
}

export interface LocaleData {
  en: Translation;
  ar: Translation;
}
