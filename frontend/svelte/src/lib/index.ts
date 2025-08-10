// Main library exports - centralized access to all shared code

// Core components
export { default as AdminNav } from './AdminNav.svelte';
export { default as TopBar } from './TopBar.svelte';
export { default as ComingSoon } from './ComingSoon.svelte';

// Shared components
export { default as CommandPalette } from './components/CommandPalette.svelte';
export { default as DarkModeToggle } from './components/DarkModeToggle.svelte';
export { default as MiniProfilePanel } from './components/MiniProfilePanel.svelte';
export { default as StatusIndicator } from './components/StatusIndicator.svelte';

// Admin components
export { default as ExtendValidity } from './admin/ExtendValidity.svelte';
export { default as SupportSettings } from './admin/SupportSettings.svelte';
export { default as UploadCustomers } from './admin/UploadCustomers.svelte';
export { default as UploadTransactions } from './admin/UploadTransactions.svelte';

// Stores
export * from './stores/auth';
export * from './stores/cardTypes';
export * from './stores/darkMode';
export * from './stores/language';
export * from './stores/notifications';
export * from './stores/permissions';

// Utilities (re-export everything from utils)
export * from './utils';

// Configuration
export * from './config/app';
export * from './config/theme';
export * from './config/constants';

// Types (explicitly export to avoid conflicts)
export type {
  User as LibUser,
  Customer,
  CustomerPreferences,
  LoyaltyProgram,
  ProgramRules,
  Transaction,
  Branch,
  Reward,
  Offer,
  CardType as LibCardType,
  Notification as LibNotification,
  ApiResponse,
  PaginatedResponse,
  ValidationError,
  FormState,
  Language,
  Translation,
  LocaleData
} from './types';
