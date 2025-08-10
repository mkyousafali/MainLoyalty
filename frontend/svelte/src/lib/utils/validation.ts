// Form validation utilities

import type { ValidationError } from '$lib/types';

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Saudi mobile number
 */
export function validateSaudiMobile(mobile: string): boolean {
  // Saudi mobile numbers start with 05 and have 10 digits total
  const mobileRegex = /^(05)[0-9]{8}$/;
  return mobileRegex.test(mobile.replace(/\s+/g, ''));
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate required field
 */
export function validateRequired(value: string, fieldName: string): ValidationError | null {
  if (!value || value.trim().length === 0) {
    return {
      field: fieldName,
      message: `${fieldName} is required`
    };
  }
  return null;
}

/**
 * Validate minimum length
 */
export function validateMinLength(value: string, minLength: number, fieldName: string): ValidationError | null {
  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters long`
    };
  }
  return null;
}

/**
 * Validate maximum length
 */
export function validateMaxLength(value: string, maxLength: number, fieldName: string): ValidationError | null {
  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${maxLength} characters long`
    };
  }
  return null;
}

/**
 * Validate a form and return all errors
 */
export function validateForm(data: Record<string, any>, rules: Record<string, any[]>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const [field, validators] of Object.entries(rules)) {
    const value = data[field];
    
    for (const validator of validators) {
      const error = validator(value, field);
      if (error) {
        errors.push(error);
        break; // Stop at first error for this field
      }
    }
  }
  
  return errors;
}
