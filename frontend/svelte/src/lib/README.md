# Library Structure (`src/lib`)

This directory contains all shared, reusable code for the Urban Market Loyalty Program. Following SvelteKit best practices, everything here is accessible via the `$lib` alias.

## Directory Structure

```
src/lib/
├── admin/                 # Admin-specific components
├── components/            # Shared UI components
├── config/               # Configuration files
├── stores/               # Svelte stores for state management
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
└── index.ts              # Main exports file
```

## Usage Guidelines

### 1. Always use `$lib` imports
✅ **Good:**
```typescript
import { formatCurrency, APP_CONFIG } from '$lib';
import { customerNotifications } from '$lib/stores/notifications';
import type { Customer } from '$lib/types';
```

❌ **Bad:**
```typescript
import { formatCurrency } from '../../../lib/utils/format';
import { customerNotifications } from '../../lib/stores/notifications';
```

### 2. Import from specific modules when needed
```typescript
// For specific utilities
import { formatDate, validateEmail } from '$lib/utils';

// For specific types
import type { Customer, Transaction } from '$lib/types';

// For specific stores
import { customerNotifications, unreadNotificationCount } from '$lib/stores/notifications';
```

### 3. Use the main export for commonly used items
```typescript
// Main export includes commonly used utilities with shorter names
import { currency, points, date, getStorage } from '$lib';
```

## Directory Details

### `/admin`
Admin-specific Svelte components that are reused across admin pages.

**Files:**
- `ExtendValidity.svelte` - Component for extending point validity
- `SupportSettings.svelte` - Support configuration component
- `UploadCustomers.svelte` - Customer data upload component
- `UploadTransactions.svelte` - Transaction data upload component

### `/components`
Shared UI components used throughout the application.

**Files:**
- `CommandPalette.svelte` - Global command palette
- `DarkModeToggle.svelte` - Dark mode toggle button
- `MiniProfilePanel.svelte` - User profile dropdown
- `StatusIndicator.svelte` - Status indicator component
- `ExampleUsage.svelte` - Example showing proper lib usage

### `/config`
Configuration files and constants.

**Files:**
- `app.ts` - Main application configuration
- `theme.ts` - Theme and styling configuration

**Key exports:**
- `APP_CONFIG` - Application settings and constants
- `FEATURES` - Feature flags
- `ENV` - Environment variables
- `THEME_CONFIG` - Theme colors, typography, spacing
- `CSS_VARIABLES` - CSS custom properties

### `/stores`
Svelte stores for reactive state management.

**Files:**
- `auth.ts` - Authentication state
- `cardTypes.ts` - Card type management
- `darkMode.ts` - Dark mode state
- `language.ts` / `language.js` - Language/localization state
- `notifications.ts` - Notification management

### `/types`
TypeScript interfaces and type definitions.

**Key types:**
- `User`, `Customer` - User-related types
- `Transaction`, `Reward`, `Offer` - Business logic types
- `Notification` - Notification system types
- `ApiResponse`, `PaginatedResponse` - API response types
- `Language`, `Translation` - Localization types

### `/utils`
Utility functions organized by category.

**Files:**
- `date.ts` - Date/time formatting and manipulation
- `format.ts` - Number, currency, and display formatting
- `validation.ts` - Form validation helpers
- `storage.ts` - Local storage utilities with type safety
- `index.ts` - Main utils export with convenient aliases

**Key functions:**
- `formatCurrency()`, `formatPoints()`, `formatNumber()`
- `formatDate()`, `formatDateTime()`, `getRelativeTime()`
- `validateEmail()`, `validateSaudiMobile()`, `validatePassword()`
- `getStorageItem()`, `setStorageItem()`, `removeStorageItem()`

## Examples

### Using Utilities
```typescript
import { formatCurrency, formatPoints, validateEmail } from '$lib/utils';
import { APP_CONFIG } from '$lib/config/app';

// Format currency
const price = formatCurrency(99.99, 'ar'); // "٩٩٫٩٩ ر.س"

// Format points
const userPoints = formatPoints(1500, 'en'); // "1,500 points"

// Validate email
const isValid = validateEmail('user@example.com'); // true

// Use app config
const pointsPerRiyal = APP_CONFIG.loyalty.pointsPerRiyal; // 1
```

### Using Types
```typescript
import type { Customer, Transaction } from '$lib/types';

const customer: Customer = {
  id: '123',
  name: 'Ahmed Al-Salem',
  // ... other properties
};
```

### Using Stores
```typescript
import { customerNotifications, addNotification } from '$lib/stores/notifications';
import { unreadNotificationCount } from '$lib';

// Add a notification
addNotification({
  type: 'terms_update',
  title: 'Terms Updated',
  message: 'Please review the new terms.',
  timestamp: new Date().toISOString(),
  isRead: false,
  priority: 'medium'
});

// Subscribe to unread count
$: badgeCount = $unreadNotificationCount;
```

## Best Practices

1. **Keep it modular** - One file should serve one specific purpose
2. **Use TypeScript** - Leverage type safety throughout
3. **Export consistently** - Make sure to export from the main index files
4. **Document complex functions** - Add JSDoc comments for complex utilities
5. **Test thoroughly** - Write tests for utility functions
6. **Avoid circular dependencies** - Keep imports clean and unidirectional

## Migration Notes

When moving existing code to use `$lib`:

1. Move shared components to appropriate subdirectories
2. Update all imports to use `$lib` alias
3. Consolidate duplicate utility functions
4. Extract types to the types directory
5. Use the storage utilities instead of direct localStorage calls
6. Replace hardcoded values with configuration constants
