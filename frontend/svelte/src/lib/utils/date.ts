// Date and time utilities for the loyalty program

/**
 * Format a date string for display
 */
export function formatDate(date: string | Date, locale: 'en' | 'ar' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'ar') {
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format a date and time string for display
 */
export function formatDateTime(date: string | Date, locale: 'en' | 'ar' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (locale === 'ar') {
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get relative time (e.g., "2 hours ago")
 */
export function getRelativeTime(date: string | Date, locale: 'en' | 'ar' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds);
    if (interval >= 1) {
      if (locale === 'ar') {
        const arabicUnits = {
          year: interval === 1 ? 'سنة' : 'سنوات',
          month: interval === 1 ? 'شهر' : 'أشهر',
          week: interval === 1 ? 'أسبوع' : 'أسابيع',
          day: interval === 1 ? 'يوم' : 'أيام',
          hour: interval === 1 ? 'ساعة' : 'ساعات',
          minute: interval === 1 ? 'دقيقة' : 'دقائق'
        };
        return `منذ ${interval} ${arabicUnits[unit as keyof typeof arabicUnits]}`;
      }
      return `${interval} ${unit}${interval !== 1 ? 's' : ''} ago`;
    }
  }
  
  return locale === 'ar' ? 'الآن' : 'just now';
}

/**
 * Check if a date is in the current year
 */
export function isCurrentYear(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.getFullYear() === new Date().getFullYear();
}

/**
 * Get end of year date for points validity
 */
export function getEndOfYear(year?: number): Date {
  const targetYear = year || new Date().getFullYear();
  return new Date(targetYear, 11, 31, 23, 59, 59, 999);
}
