import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export interface User {
  mobile: string;
  name: string;
  place?: string;
  branch?: string;
  loginTime: string;
  type: 'customer' | 'admin';
}

export interface AdminUser {
  email: string;
  name: string;
  role: string;
  branch?: string;
  loginTime: string;
  type: 'admin';
}

// Create authentication stores
export const user = writable<User | AdminUser | null>(null);
export const isAuthenticated = writable<boolean>(false);
export const isAdmin = writable<boolean>(false);

// Check if user is logged in on app start
export function initializeAuth() {
  if (typeof localStorage !== 'undefined') {
    // Check for customer login
    const customerData = localStorage.getItem('loyaltyUser');
    const adminData = localStorage.getItem('adminUser');
    
    if (customerData) {
      try {
        const parsedUser = JSON.parse(customerData);
        user.set({ ...parsedUser, type: 'customer' });
        isAuthenticated.set(true);
        isAdmin.set(false);
      } catch (error) {
        console.error('Error parsing customer user data:', error);
        localStorage.removeItem('loyaltyUser');
        localStorage.removeItem('loyaltyCardNumber');
      }
    } else if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData);
        user.set({ ...parsedAdmin, type: 'admin' });
        isAuthenticated.set(true);
        isAdmin.set(true);
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        localStorage.removeItem('adminUser');
      }
    }
  }
}

// Login functions
export function loginCustomer(userData: Omit<User, 'type'>) {
  const customerUser: User = { ...userData, type: 'customer' };
  user.set(customerUser);
  isAuthenticated.set(true);
  isAdmin.set(false);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('loyaltyUser', JSON.stringify(userData));
    localStorage.setItem('loyaltyCardNumber', userData.mobile);
  }
}

export function loginAdmin(adminData: Omit<AdminUser, 'type'>) {
  const adminUser: AdminUser = { ...adminData, type: 'admin' };
  user.set(adminUser);
  isAuthenticated.set(true);
  isAdmin.set(true);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('adminUser', JSON.stringify(adminData));
    localStorage.setItem('adminSession', 'active');
  }
}

// Logout function
export function logout() {
  user.set(null);
  isAuthenticated.set(false);
  isAdmin.set(false);
  
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('loyaltyUser');
    localStorage.removeItem('loyaltyCardNumber');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminSession');
  }
  
  goto('/login');
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
  const publicRoutes = ['/login', '/admin-login', '/register'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  return !isPublicRoute;
}

// Get redirect path based on user type
export function getRedirectPath(userType: 'customer' | 'admin'): string {
  return userType === 'admin' ? '/admin' : '/dashboard';
}
