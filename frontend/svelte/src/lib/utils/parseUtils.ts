// Utility function to safely parse float values while preserving zero
// This replaces the problematic parseFloat(value) || 0 pattern

export function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = parseFloat(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
}

// Usage examples:
// safeParseFloat("0") returns 0 (not defaultValue)
// safeParseFloat("0.00") returns 0 (not defaultValue)  
// safeParseFloat("1.23") returns 1.23
// safeParseFloat("") returns 0 (defaultValue)
// safeParseFloat(null) returns 0 (defaultValue)
// safeParseFloat("invalid") returns 0 (defaultValue)
