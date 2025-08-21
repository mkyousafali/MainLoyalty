import { writable, get } from 'svelte/store';
import { goto } from '$app/navigation';

export interface User {
  id?: string; // Add Supabase-compatible ID
  mobile: string;
  name: string;
  place?: string;
  branch?: string;
  loginTime: string;
  lastActivity?: string;
  sessionId?: string;
  type: 'customer' | 'admin';
}

export interface AdminUser {
  id?: string; // Add Supabase-compatible ID
  email: string;
  name: string;
  role: string;
  branch?: string;
  loginTime: string;
  lastActivity?: string;
  sessionId?: string;
  type: 'admin';
}

// Create authentication stores
export const user = writable<User | AdminUser | null>(null);
export const isAuthenticated = writable<boolean>(false);
export const isAdmin = writable<boolean>(false);

// Session management
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const ACTIVITY_UPDATE_INTERVAL = 60000; // Update activity every minute
let activityTrackingStarted = false;

// Generate session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Update user activity
export function updateActivity() {
  const currentUser = get(user);
  if (!currentUser) return;

  const now = new Date().toISOString();
  const updatedUser = { ...currentUser, lastActivity: now };
  user.set(updatedUser);

  // Save to localStorage
  if (typeof localStorage !== 'undefined') {
    if (currentUser.type === 'customer') {
      localStorage.setItem('loyaltyUser', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    }
  }
}

// Check if session is valid
function isSessionValid(userData: User | AdminUser): boolean {
  if (!userData.loginTime) return false;
  
  const loginTime = new Date(userData.loginTime).getTime();
  const now = Date.now();
  
  // Check if session has expired (30 days)
  if (now - loginTime > SESSION_DURATION) {
    console.log('Session expired due to age');
    return false;
  }
  
  return true;
}

// Auto-refresh session activity
function startActivityTracking() {
  // Prevent multiple activity tracking instances
  if (activityTrackingStarted) return;
  activityTrackingStarted = true;

  // Update activity every minute
  setInterval(() => {
    updateActivity();
  }, ACTIVITY_UPDATE_INTERVAL);

  // Update activity on user interactions
  if (typeof window !== 'undefined') {
    const events = ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'];
    let lastUpdate = Date.now();
    
    const handleActivity = () => {
      const now = Date.now();
      // Only update if it's been more than 30 seconds since last update
      if (now - lastUpdate > 30000) {
        updateActivity();
        lastUpdate = now;
      }
    };
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }
}

// Check if user is logged in on app start
export function initializeAuth() {
  if (typeof localStorage !== 'undefined') {
    // Check for customer login
    const customerData = localStorage.getItem('loyaltyUser');
    const adminData = localStorage.getItem('adminUser');
    
    if (customerData) {
      try {
        const parsedUser = JSON.parse(customerData);
        
        // Validate session
        if (isSessionValid(parsedUser)) {
          // Update last activity on initialization
          parsedUser.lastActivity = new Date().toISOString();
          user.set({ ...parsedUser, type: 'customer' });
          isAuthenticated.set(true);
          isAdmin.set(false);
          
          // Save updated activity
          localStorage.setItem('loyaltyUser', JSON.stringify(parsedUser));
          
          // Start activity tracking
          startActivityTracking();
          
          console.log('✅ Customer session restored successfully');
        } else {
          console.log('❌ Customer session expired, clearing storage');
          localStorage.removeItem('loyaltyUser');
          localStorage.removeItem('loyaltyCardNumber');
        }
      } catch (error) {
        console.error('Error parsing customer user data:', error);
        localStorage.removeItem('loyaltyUser');
        localStorage.removeItem('loyaltyCardNumber');
      }
    } else if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        
        // Validate session
        if (isSessionValid(parsedAdmin)) {
          // Update last activity on initialization
          parsedAdmin.lastActivity = new Date().toISOString();
          user.set({ ...parsedAdmin, type: 'admin' });
          isAuthenticated.set(true);
          isAdmin.set(true);
          
          // Save updated activity
          localStorage.setItem('adminUser', JSON.stringify(parsedAdmin));
          
          // Start activity tracking
          startActivityTracking();
          
          console.log('✅ Admin session restored successfully');
        } else {
          console.log('❌ Admin session expired, clearing storage');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('adminSession');
        }
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        localStorage.removeItem('adminUser');
        localStorage.removeItem('adminSession');
      }
    }
  }
}

// Login functions
export function loginCustomer(userData: Omit<User, 'type' | 'sessionId' | 'lastActivity'>) {
  const now = new Date().toISOString();
  const sessionId = generateSessionId();
  
  const customerUser: User = { 
    ...userData, 
    type: 'customer',
    sessionId,
    lastActivity: now
  };
  
  user.set(customerUser);
  isAuthenticated.set(true);
  isAdmin.set(false);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('loyaltyUser', JSON.stringify(customerUser));
    localStorage.setItem('loyaltyCardNumber', userData.mobile);
  }
  
  // Start activity tracking
  startActivityTracking();
  
  console.log('✅ Customer logged in successfully with persistent session');
}

export function loginAdmin(adminData: Omit<AdminUser, 'type' | 'sessionId' | 'lastActivity'>) {
  const now = new Date().toISOString();
  const sessionId = generateSessionId();
  
  const adminUser: AdminUser = { 
    ...adminData, 
    type: 'admin',
    sessionId,
    lastActivity: now
  };
  
  user.set(adminUser);
  isAuthenticated.set(true);
  isAdmin.set(true);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('adminUser', JSON.stringify(adminUser));
    localStorage.setItem('adminSession', 'active');
  }
  
  // Start activity tracking
  startActivityTracking();
  
  console.log('✅ Admin logged in successfully with persistent session');
}

// Logout function
export function logout() {
  const currentUser = get(user);
  console.log('🔓 Logging out user:', currentUser?.type);
  
  user.set(null);
  isAuthenticated.set(false);
  isAdmin.set(false);
  
  // Reset activity tracking flag
  activityTrackingStarted = false;
  
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('loyaltyUser');
    localStorage.removeItem('loyaltyCardNumber');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSession');
  }
  
  console.log('✅ User logged out successfully');
  goto('/login');
}

// Session info functions
export function getSessionInfo(): { isValid: boolean; timeRemaining?: number; lastActivity?: string } {
  const currentUser = get(user);
  if (!currentUser) return { isValid: false };
  
  if (!isSessionValid(currentUser)) {
    return { isValid: false };
  }
  
  const loginTime = new Date(currentUser.loginTime).getTime();
  const timeRemaining = SESSION_DURATION - (Date.now() - loginTime);
  
  return {
    isValid: true,
    timeRemaining,
    lastActivity: currentUser.lastActivity
  };
}

export function extendSession() {
  const currentUser = get(user);
  if (!currentUser) return false;
  
  const now = new Date().toISOString();
  const updatedUser = { 
    ...currentUser, 
    loginTime: now, 
    lastActivity: now 
  };
  
  user.set(updatedUser);
  
  // Save to localStorage
  if (typeof localStorage !== 'undefined') {
    if (currentUser.type === 'customer') {
      localStorage.setItem('loyaltyUser', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    }
  }
  
  console.log('✅ Session extended successfully');
  return true;
}

// Route guard functions
export function requireAuth(currentUser: User | AdminUser | null, currentPath: string) {
  if (!currentUser) {
    goto('/login');
    return false;
  }
  return true;
}

export function requireCustomerAuth(currentUser: User | AdminUser | null, currentPath: string) {
  if (!currentUser) {
    goto('/login');
    return false;
  }
  
  if (currentUser.type === 'admin') {
    goto('/admin');
    return false;
  }
  
  return true;
}

export function requireAdminAuth(currentUser: User | AdminUser | null, currentPath: string) {
  if (!currentUser) {
    goto('/admin-login');
    return false;
  }
  
  if (currentUser.type === 'customer') {
    goto('/dashboard');
    return false;
  }
  
  return true;
}

// Check if route requires authentication
export function isProtectedRoute(pathname: string): boolean {
  const publicRoutes = ['/login', '/admin-login', '/checkout-staff/login', '/register', '/privacy-policy', '/terms-conditions'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  return !isPublicRoute;
}

// Get redirect path based on user type
export function getRedirectPath(userType: 'customer' | 'admin'): string {
  return userType === 'admin' ? '/admin' : '/dashboard';
}
