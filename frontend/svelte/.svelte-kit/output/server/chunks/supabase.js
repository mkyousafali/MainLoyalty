import { createClient } from "@supabase/supabase-js";
import { p as public_env } from "./shared-server.js";
const supabaseUrl = public_env.PUBLIC_SUPABASE_URL || "https://sfydwpimwnxocrgpiour.supabase.co";
const supabaseAnonKey = public_env.PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmeWR3cGltd254b2NyZ3Bpb3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzI5MTYsImV4cCI6MjA2OTYwODkxNn0.GQmHZT5waxLrfcn6JQ40ImVJ1obTdqxdLFv0edZaanE";
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const TABLES = {
  // System
  SYSTEM_SETTINGS: "system_settings",
  TERMS_CONDITIONS: "terms_conditions",
  // User Management
  ROLES: "roles",
  PERMISSIONS: "permissions",
  ROLE_PERMISSIONS: "role_permissions",
  ADMIN_USERS: "admin_users",
  USER_SESSIONS: "user_sessions",
  PASSWORD_RESET_TOKENS: "password_reset_tokens",
  // Business Structure
  BRANCHES: "branches",
  // Customer Management
  CUSTOMERS: "customers",
  CARD_TYPES: "card_types",
  CUSTOMER_CARDS: "customer_cards",
  // Rewards & Offers
  REWARD_CATEGORIES: "reward_categories",
  COUPONS: "coupons",
  OFFERS: "offers",
  SPECIAL_GIFTS: "special_gifts",
  // Transactions
  CUSTOMER_TRANSACTIONS: "customer_transactions",
  CUSTOMER_GIFT_POINTS: "customer_gift_points",
  CUSTOMER_REWARDS: "customer_rewards",
  CUSTOMER_COUPONS: "customer_coupons",
  // Notifications
  NOTIFICATIONS: "notifications",
  NOTIFICATION_RECIPIENTS: "notification_recipients",
  // Audit
  USER_ACTIVITY_LOGS: "user_activity_logs"
};
export {
  TABLES as T,
  supabase as s
};
