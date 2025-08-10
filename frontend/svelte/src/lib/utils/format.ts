// Number and currency formatting utilities

/**
 * Format a number as Saudi Riyal currency
 */
export function formatCurrency(amount: number, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar') {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-SA', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number, locale: 'en' | 'ar' = 'en'): string {
  if (locale === 'ar') {
    return new Intl.NumberFormat('ar-SA').format(num);
  }
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format points display
 */
export function formatPoints(points: number, locale: 'en' | 'ar' = 'en'): string {
  const formattedNumber = formatNumber(points, locale);
  
  if (locale === 'ar') {
    return `${formattedNumber} نقطة`;
  }
  
  return `${formattedNumber} point${points !== 1 ? 's' : ''}`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Round to specified decimal places
 */
export function roundTo(num: number, decimals: number = 2): number {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Generate a random number within range
 */
export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
