import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';

// Supabase configuration
const supabaseUrl = env.PUBLIC_SUPABASE_URL || 'https://sfydwpimwnxocrgpiour.supabase.co';
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeWR3cGltd254b2NyZ3Bpb3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzI5MTYsImV4cCI6MjA2OTYwODkxNn0.GQmHZT5waxLrfcn6JQ40ImVJ1obTdqxdLFv0edZaanE';

// Create Supabase client with proper headers
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  }
});

// Database table names (matching your schema)
export const TABLES = {
  // System
  SYSTEM_SETTINGS: 'system_settings',
  TERMS_CONDITIONS: 'terms_conditions',
  
  // User Management
  ROLES: 'roles',
  PERMISSIONS: 'permissions',
  ROLE_PERMISSIONS: 'role_permissions',
  ADMIN_USERS: 'admin_users',
  USER_SESSIONS: 'user_sessions',
  PASSWORD_RESET_TOKENS: 'password_reset_tokens',
  
  // Business Structure
  BRANCHES: 'branches',
  
  // Customer Management
  CUSTOMERS: 'customers',
  CARD_TYPES: 'card_types',
  CUSTOMER_CARDS: 'customer_cards',
  
  // Rewards & Offers
  REWARD_CATEGORIES: 'reward_categories',
  COUPONS: 'coupons',
  OFFERS: 'offers',
  SPECIAL_GIFTS: 'special_gifts',
  
  // Transactions
  CUSTOMER_TRANSACTIONS: 'customer_transactions',
  CUSTOMER_GIFT_POINTS: 'customer_gift_points',
  CUSTOMER_REWARDS: 'customer_rewards',
  CUSTOMER_COUPONS: 'customer_coupons',
  
  // Notifications
  NOTIFICATIONS: 'notifications',
  NOTIFICATION_RECIPIENTS: 'notification_recipients',
  
  // Audit
  USER_ACTIVITY_LOGS: 'user_activity_logs'
};

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  },
  
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  
  getUser: async () => {
    return await supabase.auth.getUser();
  },
  
  getSession: async () => {
    return await supabase.auth.getSession();
  }
};

// Database helpers
export const db = {
  // Generic CRUD operations
  select: async (table: string, columns = '*', filters?: Record<string, any>) => {
    let query = supabase.from(table).select(columns);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    return await query;
  },
  
  insert: async (table: string, data: Record<string, any>) => {
    return await supabase.from(table).insert(data);
  },
  
  update: async (table: string, id: number, data: Record<string, any>) => {
    return await supabase.from(table).update(data).eq('id', id);
  },
  
  delete: async (table: string, id: number) => {
    return await supabase.from(table).delete().eq('id', id);
  },
  
  // Customer operations
  getCustomers: async (searchTerm?: string) => {
    let query = supabase
      .from(TABLES.CUSTOMERS)
      .select(`
        id,
        customer_code,
        full_name,
        email,
        phone,
        total_points,
        created_at,
        (
          SELECT COUNT(*) 
          FROM ${TABLES.CUSTOMER_TRANSACTIONS} 
          WHERE customer_id = ${TABLES.CUSTOMERS}.id
        ) as total_transactions,
        (
          SELECT COALESCE(SUM(amount), 0) 
          FROM ${TABLES.CUSTOMER_TRANSACTIONS} 
          WHERE customer_id = ${TABLES.CUSTOMERS}.id
        ) as total_amount
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (searchTerm) {
      query = query.or(`
        full_name.ilike.%${searchTerm}%,
        customer_code.ilike.%${searchTerm}%,
        email.ilike.%${searchTerm}%,
        phone.ilike.%${searchTerm}%
      `);
    }
    
    return await query;
  },
  
  // Transaction operations
  getTransactionSummary: async (customerId?: number, branchId?: number) => {
    let query = supabase
      .from(TABLES.CUSTOMER_TRANSACTIONS)
      .select(`
        id,
        transaction_id,
        customer_id,
        branch_id,
        transaction_type,
        amount,
        points_earned,
        points_redeemed,
        processed_at,
        customers:customer_id (
          customer_code,
          full_name
        ),
        branches:branch_id (
          name_en
        )
      `)
      .order('processed_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    return await query;
  }
};

// Real-time subscriptions
export const subscriptions = {
  onTransactionChange: (callback: (payload: any) => void) => {
    return supabase
      .channel('transaction-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.CUSTOMER_TRANSACTIONS
      }, callback)
      .subscribe();
  },
  
  onCustomerChange: (callback: (payload: any) => void) => {
    return supabase
      .channel('customer-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: TABLES.CUSTOMERS
      }, callback)
      .subscribe();
  }
};

export default supabase;
