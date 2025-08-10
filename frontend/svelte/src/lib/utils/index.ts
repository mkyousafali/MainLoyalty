// Main utils export file - centralized access to all utilities

export * from './date';
export * from './format';
export * from './validation';
export * from './storage';

// Re-export commonly used functions with shorter names for convenience
export { formatCurrency as currency } from './format';
export { formatPoints as points } from './format';
export { formatDate as date } from './date';
export { formatDateTime as datetime } from './date';
export { getRelativeTime as relativeTime } from './date';
export { getStorageItem as getStorage } from './storage';
export { setStorageItem as setStorage } from './storage';
