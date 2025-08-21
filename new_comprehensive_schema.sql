-- ================================================================
-- NEW COMPREHENSIVE SCHEMA FOR MAINLOYALTY SYSTEM
-- ================================================================
-- Version: 2.0
-- Created: August 21, 2025
-- Purpose: Unified schema with all 23 tables provided by user
-- Note: This schema is separate from production and won't affect running app
-- ================================================================

-- Enable UUID extension for PostgreSQL/Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- TABLE DEFINITIONS (23 TABLES TOTAL)
-- ================================================================

-- ================================================================
-- TABLE #1: ADMIN_USERS
-- ================================================================
-- Purpose: Store admin user accounts with authentication and role management
-- Dependencies: Requires roles table (will be provided later)
-- ================================================================

CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  username text NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role_id uuid NULL,
  is_active boolean NULL DEFAULT true,
  last_login timestamp without time zone NULL,
  login_attempts integer NULL DEFAULT 0,
  profile_image_url text NULL,
  phone text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_email_key UNIQUE (email),
  CONSTRAINT admin_users_username_key UNIQUE (username),
  CONSTRAINT admin_users_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id)
) TABLESPACE pg_default;

-- Indexes for admin_users table
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON public.admin_users USING btree (username) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_admin_users_role_id ON public.admin_users USING btree (role_id) TABLESPACE pg_default;

-- Trigger for updating updated_at column
CREATE TRIGGER trigger_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #2: BRANCHES
-- ================================================================
-- Purpose: Store branch/location information with multilingual support
-- Features: GPS coordinates, social media links, manager details, contact info
-- ================================================================

CREATE TABLE public.branches (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  name_en text NULL,
  name_ar text NULL,
  location_en text NULL,
  location_ar text NULL,
  address text NULL,
  email text NULL,
  website text NULL,
  instagram text NULL,
  manager_name text NULL,
  manager_phone text NULL,
  manager_email text NULL,
  code text NULL,
  is_active boolean NULL DEFAULT true,
  opening_hours text NULL,
  latitude numeric(10, 8) NULL,
  longitude numeric(11, 8) NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  contact_number text NULL,
  snapchat text NULL,
  tiktok text NULL,
  CONSTRAINT branches_pkey PRIMARY KEY (id),
  CONSTRAINT branches_code_key UNIQUE (code)
) TABLESPACE pg_default;

-- Indexes for branches table
CREATE INDEX IF NOT EXISTS idx_branches_tiktok ON public.branches USING btree (tiktok) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_branches_email ON public.branches USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_branches_manager_name ON public.branches USING btree (manager_name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_branches_name ON public.branches USING btree (name) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_branches_code ON public.branches USING btree (code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches USING btree (is_active) TABLESPACE pg_default;

-- Trigger for updating updated_at column
CREATE TRIGGER trigger_branches_updated_at 
  BEFORE UPDATE ON branches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #3: CARD_TYPES
-- ================================================================
-- Purpose: Define loyalty card tiers with upgrade paths and benefits
-- Features: Multilingual support, JSONB benefits, self-referencing upgrades
-- ================================================================

CREATE TABLE public.card_types (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  name_en text NULL,
  name_ar text NULL,
  color text NULL DEFAULT '#CD7F32'::text,
  point_limit integer NULL DEFAULT 0,
  discount_percentage numeric(5, 2) NULL DEFAULT 0,
  upgrade_to uuid NULL,
  benefits jsonb NULL,
  validity_months integer NULL DEFAULT 12,
  annual_fee numeric(10, 2) NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT card_types_pkey PRIMARY KEY (id),
  CONSTRAINT card_types_name_key UNIQUE (name),
  CONSTRAINT card_types_upgrade_to_fkey FOREIGN KEY (upgrade_to) REFERENCES card_types (id)
) TABLESPACE pg_default;

-- Trigger for updating updated_at column
CREATE TRIGGER trigger_card_types_updated_at 
  BEFORE UPDATE ON card_types 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #4: CUSTOMER_CARDS
-- ================================================================
-- Purpose: Physical/virtual loyalty cards linking customers to card types
-- Dependencies: Requires card_types and customers tables
-- Features: Status management, expiry tracking, card lifecycle
-- ================================================================

CREATE TABLE public.customer_cards (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  card_number text NOT NULL,
  card_type_id uuid NULL,
  customer_id uuid NULL,
  status text NULL DEFAULT 'available'::text,
  issued_date timestamp without time zone NULL,
  expiry_date timestamp without time zone NULL,
  notes text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT customer_cards_pkey PRIMARY KEY (id),
  CONSTRAINT customer_cards_card_number_key UNIQUE (card_number),
  CONSTRAINT customer_cards_card_type_id_fkey FOREIGN KEY (card_type_id) REFERENCES card_types (id),
  CONSTRAINT customer_cards_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT customer_cards_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'available'::text,
          'assigned'::text,
          'blocked'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for customer_cards table
CREATE INDEX IF NOT EXISTS idx_customer_cards_card_number ON public.customer_cards USING btree (card_number) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_cards_customer_id ON public.customer_cards USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_cards_status ON public.customer_cards USING btree (status) TABLESPACE pg_default;

-- Trigger for updating updated_at column
CREATE TRIGGER trigger_customer_cards_updated_at 
  BEFORE UPDATE ON customer_cards 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #5: CUSTOMER_NUMBERS
-- ================================================================
-- Purpose: Track customer number registration status and branch associations
-- Features: Registration workflow tracking, branch assignment, upload auditing
-- ================================================================

CREATE TABLE public.customer_numbers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  customer character varying(10) NOT NULL,
  status text NULL DEFAULT 'not_registered'::text,
  uploaded_at timestamp without time zone NULL DEFAULT now(),
  uploaded_by uuid NULL,
  branch_id uuid NULL,
  CONSTRAINT customer_numbers_pkey PRIMARY KEY (id),
  CONSTRAINT customer_numbers_customer_key UNIQUE (customer),
  CONSTRAINT customer_numbers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT customer_numbers_status_check CHECK (
    (
      status = ANY (ARRAY['not_registered'::text, 'registered'::text])
    )
  )
) TABLESPACE pg_default;

-- Indexes for customer_numbers table
CREATE INDEX IF NOT EXISTS idx_customer_numbers_customer ON public.customer_numbers USING btree (customer) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_numbers_status ON public.customer_numbers USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_numbers_branch_id ON public.customer_numbers USING btree (branch_id) TABLESPACE pg_default;

-- ================================================================
-- TABLE #6: CUSTOMER_TRANSACTIONS
-- ================================================================
-- Purpose: Complete transaction management with points, payments, and receipts
-- Dependencies: Requires customers, admin_users, branches tables
-- Features: Multi-type transactions, points system, payment methods, audit trail
-- ================================================================

CREATE TABLE public.customer_transactions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  bill_no text NULL,
  bill_date date NULL,
  bill_amount numeric(15, 2) NULL DEFAULT 0,
  customer_id uuid NULL,
  customer_mobile text NULL,
  branch_id uuid NULL,
  transaction_type text NULL DEFAULT 'purchase'::text,
  amount numeric(15, 2) NULL DEFAULT 0,
  points_earned numeric(15, 3) NULL DEFAULT 0,
  points_redeemed numeric(15, 3) NULL DEFAULT 0,
  notes text NULL,
  transaction_date timestamp without time zone NULL DEFAULT now(),
  status text NULL DEFAULT 'completed'::text,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  transaction_id text NULL,
  customer_code text NULL,
  card_number text NULL,
  payment_method text NULL,
  tax_amount numeric(10, 2) NULL DEFAULT 0,
  discount_amount numeric(10, 2) NULL DEFAULT 0,
  points_used integer NULL DEFAULT 0,
  balance_after integer NULL DEFAULT 0,
  receipt_number text NULL,
  receipt_url text NULL,
  cashier_id text NULL,
  processed_by uuid NULL,
  uploaded_by uuid NULL,
  processed_at timestamp without time zone NULL DEFAULT now(),
  upload_batch_id uuid NULL,
  add_amt numeric(15, 3) NULL DEFAULT 0.000,
  redeem numeric(15, 3) NULL DEFAULT 0.000,
  CONSTRAINT customer_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT customer_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers (id),
  CONSTRAINT customer_transactions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES admin_users (id),
  CONSTRAINT customer_transactions_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES admin_users (id),
  CONSTRAINT customer_transactions_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT customer_transactions_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'pending'::text,
          'completed'::text,
          'cancelled'::text,
          'refunded'::text
        ]
      )
    )
  ),
  CONSTRAINT customer_transactions_payment_method_check CHECK (
    (
      payment_method = ANY (
        ARRAY[
          'cash'::text,
          'card'::text,
          'digital'::text,
          'points'::text
        ]
      )
    )
  ),
  CONSTRAINT customer_transactions_transaction_type_check CHECK (
    (
      transaction_type = ANY (
        ARRAY[
          'purchase'::text,
          'refund'::text,
          'adjustment'::text,
          'bonus'::text,
          'redemption'::text,
          'upload'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for customer_transactions table
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_id ON public.customer_transactions USING btree (customer_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_customer_mobile ON public.customer_transactions USING btree (customer_mobile) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_branch_id ON public.customer_transactions USING btree (branch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_no ON public.customer_transactions USING btree (bill_no) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_transaction_date ON public.customer_transactions USING btree (transaction_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_bill_date ON public.customer_transactions USING btree (bill_date) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customer_transactions_status ON public.customer_transactions USING btree (status) TABLESPACE pg_default;

-- Trigger for updating updated_at column
CREATE TRIGGER trigger_customer_transactions_updated_at 
  BEFORE UPDATE ON customer_transactions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #7: CUSTOMER_UPLOAD_LOGS
-- ================================================================
-- Purpose: Track customer data upload operations and their results
-- Features: Upload statistics, error tracking with JSONB, mode differentiation
-- ================================================================

CREATE TABLE public.customer_upload_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  file_name text NULL,
  upload_mode text NULL,
  record_count integer NULL DEFAULT 0,
  success_count integer NULL DEFAULT 0,
  error_count integer NULL DEFAULT 0,
  errors jsonb NULL,
  uploaded_at timestamp without time zone NULL DEFAULT now(),
  uploaded_by uuid NULL,
  CONSTRAINT customer_upload_logs_pkey PRIMARY KEY (id),
  CONSTRAINT customer_upload_logs_upload_mode_check CHECK (
    (
      upload_mode = ANY (ARRAY['eligibility'::text, 'full'::text])
    )
  )
) TABLESPACE pg_default;

-- Indexes for customer_upload_logs table
CREATE INDEX IF NOT EXISTS idx_customer_upload_logs_uploaded_at ON public.customer_upload_logs USING btree (uploaded_at) TABLESPACE pg_default;

-- ================================================================
-- TABLE #8: CUSTOMERS
-- ================================================================
-- Purpose: Core customer management with loyalty program integration
-- Dependencies: Requires branches, card_types tables, self-referencing for referrals
-- Features: Complete profile, points tracking, referrals, consent management
-- ================================================================

CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  customer_code text NOT NULL,
  mobile text NULL,
  full_name text NULL,
  name text NULL,
  email text NULL,
  phone text NULL,
  address text NULL,
  area text NULL,
  place text NULL,
  date_of_birth date NULL,
  gender text NULL,
  nationality text NULL,
  occupation text NULL,
  nearest_branch_id uuid NULL,
  branch_id uuid NULL,
  card_type_id uuid NULL,
  card_number text NULL,
  card_unique_code text NULL,
  card_status text NULL DEFAULT 'unregistered'::text,
  card_issued_date timestamp without time zone NULL,
  card_expiry_date timestamp without time zone NULL,
  valid_until timestamp without time zone NULL,
  points integer NULL DEFAULT 0,
  total_points integer NULL DEFAULT 0,
  points_earned_total integer NULL DEFAULT 0,
  points_redeemed_total integer NULL DEFAULT 0,
  total_spent numeric(15, 2) NULL DEFAULT 0,
  total_visits integer NULL DEFAULT 0,
  last_visit_date timestamp without time zone NULL,
  status text NULL DEFAULT 'active'::text,
  is_active boolean NULL DEFAULT true,
  registration_date timestamp without time zone NULL,
  joined_at timestamp without time zone NULL DEFAULT now(),
  password_hash text NULL,
  preferences jsonb NULL,
  marketing_consent boolean NULL DEFAULT false,
  sms_consent boolean NULL DEFAULT true,
  email_consent boolean NULL DEFAULT false,
  referral_code text NULL,
  referred_by uuid NULL,
  profile_image_url text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  password text NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_mobile_key UNIQUE (mobile),
  CONSTRAINT customers_referral_code_key UNIQUE (referral_code),
  CONSTRAINT customers_card_unique_code_key UNIQUE (card_unique_code),
  CONSTRAINT customers_customer_code_key UNIQUE (customer_code),
  CONSTRAINT customers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT customers_card_type_id_fkey FOREIGN KEY (card_type_id) REFERENCES card_types (id),
  CONSTRAINT customers_nearest_branch_id_fkey FOREIGN KEY (nearest_branch_id) REFERENCES branches (id),
  CONSTRAINT customers_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES customers (id),
  CONSTRAINT customers_card_status_check CHECK (
    (
      card_status = ANY (
        ARRAY[
          'unregistered'::text,
          'registered'::text,
          'blocked'::text,
          'expired'::text
        ]
      )
    )
  ),
  CONSTRAINT customers_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'active'::text,
          'inactive'::text,
          'blocked'::text,
          'suspended'::text
        ]
      )
    )
  ),
  CONSTRAINT customers_gender_check CHECK (
    (
      gender = ANY (ARRAY['male'::text, 'female'::text])
    )
  )
) TABLESPACE pg_default;

-- Indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers USING btree (mobile) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers USING btree (customer_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_card_number ON public.customers USING btree (card_number) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_card_unique_code ON public.customers USING btree (card_unique_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON public.customers USING btree (branch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_card_type_id ON public.customers USING btree (card_type_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_card_status ON public.customers USING btree (card_status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_customers_points ON public.customers USING btree (points) TABLESPACE pg_default;

-- Triggers for customers table
CREATE TRIGGER trigger_check_card_upgrade 
  BEFORE UPDATE OF points ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION check_card_upgrade();

CREATE TRIGGER trigger_customers_generate_card_code 
  BEFORE INSERT OR UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION generate_card_unique_code();

CREATE TRIGGER trigger_customers_updated_at 
  BEFORE UPDATE ON customers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE #9: GLOBAL_SETTINGS
-- ================================================================
-- Purpose: System-wide configuration settings with flexible value types
-- Features: Key-value configuration, type specification, branch-specific settings
-- ================================================================

CREATE TABLE public.global_settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  setting_key text NOT NULL,
  setting_value text NULL,
  setting_type text NULL DEFAULT 'text'::text,
  description text NULL,
  branch_id uuid NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT global_settings_pkey PRIMARY KEY (id),
  CONSTRAINT global_settings_setting_key_key UNIQUE (setting_key)
) TABLESPACE pg_default;

-- Indexes for global_settings table
CREATE INDEX IF NOT EXISTS idx_global_settings_key ON public.global_settings USING btree (setting_key) TABLESPACE pg_default;

-- ================================================================
-- TABLE #10: NOTIFICATION_RECIPIENTS
-- ================================================================
-- Purpose: Track notification delivery and engagement per customer
-- Dependencies: Requires notifications table (will be provided later)
-- Features: Delivery tracking, read receipts, click tracking, status workflow
-- ================================================================

CREATE TABLE public.notification_recipients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL,
  customer_code text NOT NULL,
  sent_at timestamp with time zone NULL DEFAULT now(),
  read_at timestamp with time zone NULL,
  clicked_at timestamp with time zone NULL,
  status text NULL DEFAULT 'sent'::text,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notification_recipients_pkey PRIMARY KEY (id),
  CONSTRAINT notification_recipients_notification_id_customer_code_key UNIQUE (notification_id, customer_code),
  CONSTRAINT notification_recipients_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES notifications (id) ON DELETE CASCADE,
  CONSTRAINT notification_recipients_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'pending'::text,
          'sent'::text,
          'delivered'::text,
          'read'::text,
          'clicked'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for notification_recipients table
CREATE INDEX IF NOT EXISTS idx_notification_recipients_customer ON public.notification_recipients USING btree (customer_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notification ON public.notification_recipients USING btree (notification_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notification_recipients_status ON public.notification_recipients USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notification_recipients_read_at ON public.notification_recipients USING btree (read_at) TABLESPACE pg_default;

-- ================================================================
-- TABLE #11: NOTIFICATIONS
-- ================================================================
-- Purpose: Core notification system with multilingual and multi-channel support
-- Features: Scheduling, targeting, priority levels, channel selection
-- ================================================================

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general'::text,
  title text NOT NULL,
  title_en text NULL,
  title_ar text NULL,
  message text NOT NULL,
  message_en text NULL,
  message_ar text NULL,
  priority text NOT NULL DEFAULT 'normal'::text,
  channels text[] NOT NULL DEFAULT '{}'::text[],
  recipient_type text NULL DEFAULT 'customer'::text,
  target_audience jsonb NULL DEFAULT '{}'::jsonb,
  action_url text NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  scheduled_at timestamp with time zone NULL,
  sent_at timestamp with time zone NULL,
  expires_at timestamp with time zone NULL,
  created_by uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES admin_users (id) ON DELETE SET NULL,
  CONSTRAINT notifications_priority_check CHECK (
    (
      priority = ANY (
        ARRAY[
          'low'::text,
          'normal'::text,
          'high'::text,
          'urgent'::text
        ]
      )
    )
  ),
  CONSTRAINT notifications_recipient_type_check CHECK (
    (
      recipient_type = ANY (
        ARRAY['customer'::text, 'admin'::text, 'all'::text]
      )
    )
  ),
  CONSTRAINT notifications_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'draft'::text,
          'scheduled'::text,
          'sent'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_at ON public.notifications USING btree (scheduled_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications USING btree (created_by) TABLESPACE pg_default;

-- ================================================================
-- TABLE #12: OFFERS
-- ================================================================
-- Purpose: Promotional offers and discount management system
-- Dependencies: References branches table
-- Features: Discount types, validity periods, redemption limits, branch-specific offers
-- ================================================================

CREATE TABLE public.offers (
  id serial NOT NULL,
  title character varying(255) NOT NULL,
  description text NULL,
  branch_id uuid NULL,
  discount_percentage numeric(5, 2) NULL DEFAULT 0.00,
  discount_amount numeric(10, 2) NULL DEFAULT 0.00,
  minimum_purchase numeric(10, 2) NULL DEFAULT 0.00,
  valid_from date NULL DEFAULT CURRENT_DATE,
  valid_until date NOT NULL,
  image_url text NULL,
  pdf_url text NULL,
  terms_conditions text NULL,
  max_redemptions integer NULL,
  current_redemptions integer NULL DEFAULT 0,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Indexes for offers table
CREATE INDEX IF NOT EXISTS idx_offers_active_valid ON public.offers USING btree (is_active, valid_until) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_offers_branch_id ON public.offers USING btree (branch_id) TABLESPACE pg_default;

-- ================================================================
-- TABLE #13: PASSWORD_RESET_TOKENS
-- ================================================================
-- Purpose: Secure password reset token management for admin users
-- Dependencies: References admin_users table
-- Features: Token expiration, usage tracking, cascade deletion
-- ================================================================

CREATE TABLE public.password_reset_tokens (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  token text NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  used boolean NULL DEFAULT false,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT password_reset_tokens_token_key UNIQUE (token),
  CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ================================================================
-- TABLE #14: PERMISSIONS
-- ================================================================
-- Purpose: Define granular permissions for role-based access control
-- Features: Module-based organization, action specification, unique naming
-- ================================================================

CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  module text NOT NULL,
  action text NOT NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id),
  CONSTRAINT permissions_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- ================================================================
-- TABLE #15: PRIVACY_POLICY
-- ================================================================
-- Purpose: Manage privacy policy content with multilingual support and versioning
-- Dependencies: References auth.users (Supabase authentication system)
-- Features: Multilingual content, version control, activation status
-- ================================================================

CREATE TABLE public.privacy_policy (
  id bigserial NOT NULL,
  title_en text NOT NULL DEFAULT 'Privacy Policy'::text,
  title_ar text NOT NULL DEFAULT 'سياسة الخصوصية'::text,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  last_updated timestamp with time zone NULL DEFAULT now(),
  updated_by uuid NULL,
  version integer NULL DEFAULT 1,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT privacy_policy_pkey PRIMARY KEY (id),
  CONSTRAINT privacy_policy_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users (id)
) TABLESPACE pg_default;

-- Indexes for privacy_policy table
CREATE INDEX IF NOT EXISTS idx_privacy_policy_active ON public.privacy_policy USING btree (is_active) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_privacy_policy_version ON public.privacy_policy USING btree (version) TABLESPACE pg_default;

-- Trigger for privacy_policy table
CREATE TRIGGER trigger_update_privacy_policy_timestamp 
  BEFORE UPDATE ON privacy_policy 
  FOR EACH ROW 
  EXECUTE FUNCTION update_privacy_policy_timestamp();

-- ================================================================
-- TABLE #16: ROLE_PERMISSIONS
-- ================================================================
-- Purpose: Junction table linking roles to permissions for RBAC system
-- Dependencies: Requires roles and permissions tables (roles table to be provided)
-- Features: Many-to-many relationship, unique combinations, cascade deletion
-- ================================================================

CREATE TABLE public.role_permissions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  role_id uuid NULL,
  permission_id uuid NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT role_permissions_role_id_permission_id_key UNIQUE (role_id, permission_id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE,
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- ================================================================
-- TABLE #17: ROLES
-- ================================================================
-- Purpose: Define user roles for the RBAC (Role-Based Access Control) system
-- Features: Role management, activation status, unique naming
-- Note: This completes the RBAC triangle with admin_users and permissions!
-- ================================================================

CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  description text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- ================================================================
-- TABLE #18: SYSTEM_SETTINGS
-- ================================================================
-- Purpose: Advanced system configuration with JSONB values and categorization
-- Features: Type-based settings, public/private visibility, JSONB flexibility
-- ================================================================

CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  setting_key text NOT NULL,
  setting_value jsonb NULL,
  setting_type text NULL,
  description text NULL,
  is_public boolean NULL DEFAULT false,
  updated_by uuid NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT system_settings_pkey PRIMARY KEY (id),
  CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key),
  CONSTRAINT system_settings_setting_type_check CHECK (
    (
      setting_type = ANY (
        ARRAY[
          'system'::text,
          'loyalty'::text,
          'notification'::text,
          'payment'::text,
          'security'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- ================================================================
-- TABLE #19: TERMS_CONDITIONS
-- ================================================================
-- Purpose: Legal document management with multilingual support and version control
-- Features: Bilingual content (EN/AR), version tracking, activation control, effective dating
-- Dependencies: None (standalone legal document management)
-- ================================================================

CREATE TABLE public.terms_conditions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  version text NOT NULL,
  content_en text NULL,
  content_ar text NULL,
  effective_date date NOT NULL,
  is_active boolean NULL DEFAULT false,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT terms_conditions_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for terms_conditions table
CREATE INDEX IF NOT EXISTS idx_terms_conditions_version ON public.terms_conditions USING btree (version) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_terms_conditions_active ON public.terms_conditions USING btree (is_active) WHERE is_active = true TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_terms_conditions_effective_date ON public.terms_conditions USING btree (effective_date DESC) TABLESPACE pg_default;
CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_conditions_active_unique ON public.terms_conditions USING btree (is_active) WHERE is_active = true TABLESPACE pg_default;

-- ================================================================
-- TABLE #20: TRANSACTION_UPLOAD_LOGS
-- ================================================================
-- Purpose: Track transaction upload operations with comprehensive error reporting
-- Features: Upload statistics, JSONB error tracking, branch and user auditing
-- Dependencies: References admin_users and branches tables for auditing
-- ================================================================

CREATE TABLE public.transaction_upload_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  uploaded_by uuid NULL,
  branch_id uuid NULL,
  file_name text NULL,
  record_count integer NULL DEFAULT 0,
  success_count integer NULL DEFAULT 0,
  error_count integer NULL DEFAULT 0,
  errors jsonb NULL,
  uploaded_at timestamp without time zone NULL DEFAULT now(),
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT transaction_upload_logs_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Indexes for transaction_upload_logs table
CREATE INDEX IF NOT EXISTS idx_transaction_upload_logs_uploaded_by ON public.transaction_upload_logs USING btree (uploaded_by) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transaction_upload_logs_branch_id ON public.transaction_upload_logs USING btree (branch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transaction_upload_logs_uploaded_at ON public.transaction_upload_logs USING btree (uploaded_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_transaction_upload_logs_errors ON public.transaction_upload_logs USING gin (errors) TABLESPACE pg_default;

-- ================================================================
-- TABLE #21: UPLOAD_JOBS
-- ================================================================
-- Purpose: Asynchronous upload job processing with status tracking and progress monitoring
-- Features: Job queue management, JSONB progress tracking, status workflow, timing analytics
-- Dependencies: References auth.users (Supabase auth) and branches tables
-- ================================================================

CREATE TABLE public.upload_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  branch_id uuid NULL,
  file_name text NOT NULL,
  status text NULL DEFAULT 'pending'::text,
  progress jsonb NULL DEFAULT '{"total": 0, "processed": 0}'::jsonb,
  data jsonb NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  started_at timestamp with time zone NULL,
  completed_at timestamp with time zone NULL,
  CONSTRAINT upload_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT upload_jobs_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches (id),
  CONSTRAINT upload_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id),
  CONSTRAINT upload_jobs_status_check CHECK (
    (
      status = ANY (
        ARRAY[
          'pending'::text,
          'processing'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- Indexes for upload_jobs table
CREATE INDEX IF NOT EXISTS idx_upload_jobs_status ON public.upload_jobs USING btree (status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_upload_jobs_user ON public.upload_jobs USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_upload_jobs_branch_id ON public.upload_jobs USING btree (branch_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created_at ON public.upload_jobs USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_upload_jobs_progress ON public.upload_jobs USING gin (progress) TABLESPACE pg_default;

-- ================================================================
-- TABLE #22: USER_ACTIVITY_LOGS
-- ================================================================
-- Purpose: Comprehensive audit logging system for all user activities
-- Features: Action tracking, data change monitoring, security logging, session management
-- Dependencies: References admin_users table for user accountability
-- ================================================================

CREATE TABLE public.user_activity_logs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  action text NOT NULL,
  module text NULL,
  entity_type text NULL,
  entity_id text NULL,
  old_values jsonb NULL,
  new_values jsonb NULL,
  ip_address inet NULL,
  user_agent text NULL,
  session_id text NULL,
  description text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT user_activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT user_activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES admin_users (id)
) TABLESPACE pg_default;

-- Indexes for user_activity_logs table
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON public.user_activity_logs USING btree (action) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_module ON public.user_activity_logs USING btree (module) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_entity ON public.user_activity_logs USING btree (entity_type, entity_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_session_id ON public.user_activity_logs USING btree (session_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_ip_address ON public.user_activity_logs USING btree (ip_address) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_old_values ON public.user_activity_logs USING gin (old_values) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_new_values ON public.user_activity_logs USING gin (new_values) TABLESPACE pg_default;

-- ================================================================
-- TABLE #23: USER_SESSIONS (FINAL TABLE!)
-- ================================================================
-- Purpose: Session management and authentication security for admin users
-- Features: Token-based authentication, session expiration, device tracking, security monitoring
-- Dependencies: References admin_users table with cascade deletion for cleanup
-- ================================================================

CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NULL,
  session_token text NOT NULL,
  expires_at timestamp without time zone NOT NULL,
  ip_address inet NULL,
  user_agent text NULL,
  created_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT user_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT user_sessions_session_token_key UNIQUE (session_token),
  CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES admin_users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for user_sessions table
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions USING btree (session_token) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_sessions_ip_address ON public.user_sessions USING btree (ip_address) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON public.user_sessions USING btree (expires_at) WHERE expires_at > now() TABLESPACE pg_default;

-- ================================================================
-- 🎉🎉🎉 SCHEMA COMPLETION CELEBRATION! 🎉🎉🎉
-- ================================================================
-- ALL 23/23 TABLES SUCCESSFULLY IMPLEMENTED!
-- 
-- COMPREHENSIVE SCHEMA SUMMARY:
-- ✅ User Management (RBAC Complete): admin_users, roles, permissions, role_permissions
-- ✅ Authentication & Security: user_sessions, password_reset_tokens, user_activity_logs
-- ✅ Customer Management: customers, customer_numbers, customer_cards
-- ✅ Loyalty System: card_types, customer_transactions, branches
-- ✅ Notification System: notifications, notification_recipients
-- ✅ Offer Management: offers, terms_conditions, privacy_policy
-- ✅ Upload Management: upload_jobs, transaction_upload_logs, customer_upload_logs
-- ✅ System Configuration: global_settings, system_settings
-- 
-- NEXT STEPS:
-- 1. Add required functions and triggers
-- 2. Insert initial data and seed values
-- 3. Implement partner apps integration system
-- 4. Deploy comprehensive schema to production
-- 
-- STATUS: READY FOR PARTNER APPS INTEGRATION! 🚀
-- ================================================================

-- ================================================================
-- PARTNER APPS INTEGRATION SYSTEM - COMPREHENSIVE IMPLEMENTATION
-- ================================================================
-- Based on detailed 13-step integration plan for per-partner email login
-- Features: Per-app identity, SSO tokens, trust management, embedding support
-- ================================================================

-- ================================================================
-- STEP 1: ADD MISSING FUNCTIONS (REQUIRED FOR TRIGGERS)
-- ================================================================

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check and trigger card upgrades based on points
CREATE OR REPLACE FUNCTION check_card_upgrade()
RETURNS TRIGGER AS $$
DECLARE
    upgrade_card_type_id UUID;
BEGIN
    -- Only proceed if points increased
    IF NEW.points > OLD.points THEN
        -- Find if current card type has an upgrade path and user qualifies
        SELECT ct.upgrade_to INTO upgrade_card_type_id
        FROM card_types ct
        WHERE ct.id = NEW.card_type_id
          AND ct.upgrade_to IS NOT NULL
          AND NEW.points >= (
              SELECT ct2.point_limit 
              FROM card_types ct2 
              WHERE ct2.id = ct.upgrade_to
          );
        
        -- Perform upgrade if eligible
        IF upgrade_card_type_id IS NOT NULL THEN
            NEW.card_type_id = upgrade_card_type_id;
            
            -- Log the upgrade (optional)
            INSERT INTO user_activity_logs (
                user_id, action, module, entity_type, entity_id,
                description, old_values, new_values
            ) VALUES (
                NULL, 'card_upgrade', 'loyalty', 'customer', NEW.id::text,
                'Automatic card upgrade based on points threshold',
                jsonb_build_object('old_card_type_id', OLD.card_type_id),
                jsonb_build_object('new_card_type_id', NEW.card_type_id)
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique card codes
CREATE OR REPLACE FUNCTION generate_card_unique_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if card_unique_code is null
    IF NEW.card_unique_code IS NULL THEN
        NEW.card_unique_code = 'CARD_' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
        
        -- Ensure uniqueness (retry if collision)
        WHILE EXISTS (SELECT 1 FROM customers WHERE card_unique_code = NEW.card_unique_code) LOOP
            NEW.card_unique_code = 'CARD_' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8));
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update privacy policy timestamp
CREATE OR REPLACE FUNCTION update_privacy_policy_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    IF NEW.version IS NULL OR NEW.version = OLD.version THEN
        NEW.version = COALESCE(OLD.version, 1) + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- STEP 2: PARTNER APPS CORE TABLES
-- ================================================================

-- ================================================================
-- TABLE: PARTNER_APPS
-- Purpose: Core partner application registry with embedding and trust settings
-- Features: Per-app configuration, open modes, domain allowlists, token delivery
-- ================================================================

CREATE TABLE public.partner_apps (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  icon_url TEXT NULL,
  category TEXT NULL DEFAULT 'general'::text,
  open_mode TEXT NOT NULL DEFAULT 'auto'::text,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  allow_domains TEXT[] NOT NULL DEFAULT '{}',
  token_delivery TEXT NOT NULL DEFAULT 'post'::text,
  created_by UUID NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_by UUID NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_apps_pkey PRIMARY KEY (id),
  CONSTRAINT partner_apps_name_unique UNIQUE (name),
  CONSTRAINT partner_apps_open_mode_check CHECK (
    open_mode = ANY (ARRAY['auto'::text, 'embed'::text, 'external'::text, 'deeplink'::text])
  ),
  CONSTRAINT partner_apps_token_delivery_check CHECK (
    token_delivery = ANY (ARRAY['query'::text, 'fragment'::text, 'post'::text, 'backchannel'::text])
  ),
  CONSTRAINT partner_apps_category_check CHECK (
    category = ANY (ARRAY['general'::text, 'finance'::text, 'crm'::text, 'analytics'::text, 'communication'::text, 'productivity'::text, 'custom'::text])
  )
) TABLESPACE pg_default;

-- Indexes for partner_apps
CREATE INDEX idx_partner_apps_enabled_pinned ON public.partner_apps USING btree (is_enabled, is_pinned, sort_order) TABLESPACE pg_default;
CREATE INDEX idx_partner_apps_category ON public.partner_apps USING btree (category) TABLESPACE pg_default;
CREATE INDEX idx_partner_apps_created_by ON public.partner_apps USING btree (created_by) TABLESPACE pg_default;

-- Trigger for partner_apps
CREATE TRIGGER trigger_partner_apps_updated_at 
  BEFORE UPDATE ON partner_apps 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 3: PARTNER APPS PERMISSIONS & FEATURE FLAGS
-- ================================================================

-- Insert partner apps permissions into existing permissions table
INSERT INTO public.permissions (name, description, module, action) VALUES
  ('partner_apps:manage', 'Manage partner applications configuration', 'partner_apps', 'manage'),
  ('partner_apps:view', 'View and access partner applications', 'partner_apps', 'view'),
  ('partner_sso:verify_email', 'Verify email for partner app access', 'partner_sso', 'verify_email')
ON CONFLICT (name) DO NOTHING;

-- Insert feature flag into system_settings
INSERT INTO public.system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
  ('partner_apps_enabled', 'true', 'system', 'Enable Partner Apps integration system', false),
  ('partner_sso_token_expiry_minutes', '5', 'system', 'Partner SSO token expiry time in minutes', false),
  ('partner_email_verification_expiry_days', '30', 'system', 'Partner email verification validity in days', false)
ON CONFLICT (setting_key) DO NOTHING;

-- ================================================================
-- STEP 4: PARTNER TRUST & SECURITY TABLES
-- ================================================================

-- ================================================================
-- TABLE: PARTNER_SSO_KEYS
-- Purpose: Cryptographic key management for partner SSO
-- Features: RSA/symmetric keys, JWKS support, key rotation
-- ================================================================

CREATE TABLE public.partner_sso_keys (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  key_type TEXT NOT NULL DEFAULT 'rsa'::text,
  kid TEXT NOT NULL, -- Key ID for JWKS
  public_jwk JSONB NULL, -- For RSA keys
  shared_secret_hint TEXT NULL, -- For symmetric keys (hint only, not actual secret)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMP WITHOUT TIME ZONE NULL,
  CONSTRAINT partner_sso_keys_pkey PRIMARY KEY (id),
  CONSTRAINT partner_sso_keys_kid_unique UNIQUE (kid),
  CONSTRAINT partner_sso_keys_key_type_check CHECK (
    key_type = ANY (ARRAY['rsa'::text, 'symmetric'::text])
  )
) TABLESPACE pg_default;

-- Indexes for partner_sso_keys
CREATE INDEX idx_partner_sso_keys_active ON public.partner_sso_keys USING btree (is_active) WHERE is_active = true TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_keys_type ON public.partner_sso_keys USING btree (key_type) TABLESPACE pg_default;

-- ================================================================
-- TABLE: PARTNER_APP_TRUSTS
-- Purpose: Trust relationships and SSO configuration per partner
-- Features: JWKS/shared secret auth, ACS endpoints, audience validation
-- ================================================================

CREATE TABLE public.partner_app_trusts (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  partner_app_id UUID NOT NULL REFERENCES partner_apps(id) ON DELETE CASCADE,
  audience TEXT NOT NULL, -- Expected audience in JWT
  expected_issuer TEXT NOT NULL, -- Expected issuer (MainLoyalty)
  accepted_alg TEXT NOT NULL DEFAULT 'RS256'::text,
  jwks_url TEXT NULL, -- Partner's JWKS endpoint (preferred)
  shared_secret_id UUID NULL REFERENCES partner_sso_keys(id) ON DELETE SET NULL,
  acs_url TEXT NULL, -- Assertion Consumer Service URL
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_app_trusts_pkey PRIMARY KEY (id),
  CONSTRAINT partner_app_trusts_app_unique UNIQUE (partner_app_id),
  CONSTRAINT partner_app_trusts_auth_method_check CHECK (
    (jwks_url IS NOT NULL AND shared_secret_id IS NULL) OR
    (jwks_url IS NULL AND shared_secret_id IS NOT NULL)
  )
) TABLESPACE pg_default;

-- Indexes for partner_app_trusts
CREATE INDEX idx_partner_app_trusts_app_id ON public.partner_app_trusts USING btree (partner_app_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_app_trusts_secret_id ON public.partner_app_trusts USING btree (shared_secret_id) TABLESPACE pg_default;

-- Trigger for partner_app_trusts
CREATE TRIGGER trigger_partner_app_trusts_updated_at 
  BEFORE UPDATE ON partner_app_trusts 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 5: PER-USER PARTNER IDENTITY TABLES
-- ================================================================

-- ================================================================
-- TABLE: USER_PARTNER_APP_IDENTITY
-- Purpose: Per-user, per-partner app email verification and identity
-- Features: Email verification per app, expiration tracking, status management
-- ================================================================

CREATE TABLE public.user_partner_app_identity (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_app_id UUID NOT NULL REFERENCES partner_apps(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITHOUT TIME ZONE NULL,
  method TEXT NULL, -- 'magic_link', 'google_oauth', 'microsoft_oauth'
  verification_expires_at TIMESTAMP WITHOUT TIME ZONE NULL,
  last_used_at TIMESTAMP WITHOUT TIME ZONE NULL,
  status TEXT NOT NULL DEFAULT 'active'::text,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT user_partner_app_identity_pkey PRIMARY KEY (id),
  CONSTRAINT user_partner_app_identity_user_app_unique UNIQUE (user_id, partner_app_id),
  CONSTRAINT user_partner_app_identity_status_check CHECK (
    status = ANY (ARRAY['active'::text, 'revoked'::text, 'expired'::text])
  ),
  CONSTRAINT user_partner_app_identity_method_check CHECK (
    method = ANY (ARRAY['magic_link'::text, 'google_oauth'::text, 'microsoft_oauth'::text])
  )
) TABLESPACE pg_default;

-- Indexes for user_partner_app_identity
CREATE INDEX idx_user_partner_app_identity_user ON public.user_partner_app_identity USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_user_partner_app_identity_app ON public.user_partner_app_identity USING btree (partner_app_id) TABLESPACE pg_default;
CREATE INDEX idx_user_partner_app_identity_verified ON public.user_partner_app_identity USING btree (verified, verification_expires_at) TABLESPACE pg_default;
CREATE INDEX idx_user_partner_app_identity_status ON public.user_partner_app_identity USING btree (status) TABLESPACE pg_default;

-- Trigger for user_partner_app_identity
CREATE TRIGGER trigger_user_partner_app_identity_updated_at 
  BEFORE UPDATE ON user_partner_app_identity 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- TABLE: PARTNER_GRANTS (OPTIONAL ACCESS CONTROL)
-- Purpose: Optional fine-grained access control per user per app
-- Features: Allow/deny specific users for specific apps, scopes support
-- ================================================================

CREATE TABLE public.partner_grants (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_app_id UUID NOT NULL REFERENCES partner_apps(id) ON DELETE CASCADE,
  scopes TEXT[] NULL DEFAULT '{}',
  is_allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_grants_pkey PRIMARY KEY (id),
  CONSTRAINT partner_grants_user_app_unique UNIQUE (user_id, partner_app_id)
) TABLESPACE pg_default;

-- Indexes for partner_grants
CREATE INDEX idx_partner_grants_user ON public.partner_grants USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_grants_app ON public.partner_grants USING btree (partner_app_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_grants_allowed ON public.partner_grants USING btree (is_allowed) TABLESPACE pg_default;

-- Trigger for partner_grants
CREATE TRIGGER trigger_partner_grants_updated_at 
  BEFORE UPDATE ON partner_grants 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- STEP 6: SESSION MANAGEMENT & AUDIT TABLES
-- ================================================================

-- ================================================================
-- TABLE: PARTNER_SSO_SESSIONS
-- Purpose: Track SSO session lifecycle per user per app
-- Features: Verification workflow tracking, session expiration, status management
-- ================================================================

CREATE TABLE public.partner_sso_sessions (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_app_id UUID NOT NULL REFERENCES partner_apps(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_verification'::text,
  started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP WITHOUT TIME ZONE NULL,
  expires_at TIMESTAMP WITHOUT TIME ZONE NULL,
  last_refreshed_at TIMESTAMP WITHOUT TIME ZONE NULL,
  CONSTRAINT partner_sso_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT partner_sso_sessions_status_check CHECK (
    status = ANY (ARRAY['pending_verification'::text, 'verified'::text, 'expired'::text])
  )
) TABLESPACE pg_default;

-- Indexes for partner_sso_sessions
CREATE INDEX idx_partner_sso_sessions_user ON public.partner_sso_sessions USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_sessions_app ON public.partner_sso_sessions USING btree (partner_app_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_sessions_status ON public.partner_sso_sessions USING btree (status) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_sessions_expires_at ON public.partner_sso_sessions USING btree (expires_at) TABLESPACE pg_default;

-- ================================================================
-- TABLE: PARTNER_SSO_TOKENS
-- Purpose: Audit trail of issued SSO tokens and their outcomes
-- Features: Token delivery tracking, nonce management, success/failure logging
-- ================================================================

CREATE TABLE public.partner_sso_tokens (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  partner_app_id UUID NOT NULL REFERENCES partner_apps(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  mode_resolved TEXT NOT NULL, -- Final resolved open mode (embed/external/deeplink)
  delivery TEXT NOT NULL, -- How token was delivered (query/fragment/post/backchannel)
  nonce TEXT NOT NULL, -- Unique nonce for this token
  issued_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  used_at TIMESTAMP WITHOUT TIME ZONE NULL,
  result TEXT NULL DEFAULT 'pending'::text,
  failure_reason TEXT NULL,
  CONSTRAINT partner_sso_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT partner_sso_tokens_nonce_unique UNIQUE (nonce),
  CONSTRAINT partner_sso_tokens_result_check CHECK (
    result = ANY (ARRAY['pending'::text, 'success'::text, 'failed'::text, 'expired'::text])
  ),
  CONSTRAINT partner_sso_tokens_mode_resolved_check CHECK (
    mode_resolved = ANY (ARRAY['embed'::text, 'external'::text, 'deeplink'::text])
  ),
  CONSTRAINT partner_sso_tokens_delivery_check CHECK (
    delivery = ANY (ARRAY['query'::text, 'fragment'::text, 'post'::text, 'backchannel'::text])
  )
) TABLESPACE pg_default;

-- Indexes for partner_sso_tokens
CREATE INDEX idx_partner_sso_tokens_user ON public.partner_sso_tokens USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_tokens_app ON public.partner_sso_tokens USING btree (partner_app_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_tokens_issued_at ON public.partner_sso_tokens USING btree (issued_at DESC) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_tokens_result ON public.partner_sso_tokens USING btree (result) TABLESPACE pg_default;
CREATE INDEX idx_partner_sso_tokens_expires_at ON public.partner_sso_tokens USING btree (expires_at) TABLESPACE pg_default;

-- ================================================================
-- TABLE: PARTNER_LOGS (COMPREHENSIVE AUDIT)
-- Purpose: Detailed audit logging for all partner app operations
-- Features: Action tracking, entity logging, JSONB details, admin accountability
-- ================================================================

CREATE TABLE public.partner_logs (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  actor_user_id UUID NULL REFERENCES admin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL, -- partner_app, user_identity, sso_session, etc.
  entity_id UUID NULL,
  details JSONB NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT partner_logs_pkey PRIMARY KEY (id),
  CONSTRAINT partner_logs_action_check CHECK (
    action = ANY (ARRAY[
      'create_app'::text, 'update_app'::text, 'delete_app'::text,
      'verify_email'::text, 'revoke_identity'::text, 'change_email'::text,
      'open_app'::text, 'issue_token'::text, 'check_embedding'::text,
      'grant_access'::text, 'revoke_access'::text,
      'probe_embedding'::text, 'token_delivery_success'::text, 'token_delivery_failed'::text
    ])
  ),
  CONSTRAINT partner_logs_entity_check CHECK (
    entity = ANY (ARRAY[
      'partner_app'::text, 'user_partner_app_identity'::text, 
      'partner_sso_session'::text, 'partner_sso_token'::text,
      'partner_grant'::text, 'partner_app_trust'::text
    ])
  )
) TABLESPACE pg_default;

-- Indexes for partner_logs
CREATE INDEX idx_partner_logs_actor ON public.partner_logs USING btree (actor_user_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_logs_action ON public.partner_logs USING btree (action) TABLESPACE pg_default;
CREATE INDEX idx_partner_logs_entity ON public.partner_logs USING btree (entity, entity_id) TABLESPACE pg_default;
CREATE INDEX idx_partner_logs_created_at ON public.partner_logs USING btree (created_at DESC) TABLESPACE pg_default;
CREATE INDEX idx_partner_logs_details ON public.partner_logs USING gin (details) TABLESPACE pg_default;

-- ================================================================
-- STEP 7: INITIAL SEED DATA
-- ================================================================

-- Create default RSA key for partner SSO (placeholder - replace with actual key generation)
INSERT INTO public.partner_sso_keys (
  kid, key_type, public_jwk, is_active
) VALUES (
  'main-rsa-2025', 
  'rsa', 
  '{"kty":"RSA","use":"sig","kid":"main-rsa-2025","alg":"RS256","n":"placeholder","e":"AQAB"}',
  true
) ON CONFLICT (kid) DO NOTHING;

-- ================================================================
-- STEP 8: HELPER VIEWS FOR COMMON QUERIES
-- ================================================================

-- View for active partner apps with user verification status
CREATE OR REPLACE VIEW partner_apps_with_user_status AS
SELECT 
  pa.id,
  pa.name,
  pa.url,
  pa.icon_url,
  pa.category,
  pa.open_mode,
  pa.is_enabled,
  pa.is_pinned,
  pa.sort_order,
  CASE 
    WHEN upai.verified = true AND upai.verification_expires_at > NOW() THEN 'verified'
    WHEN upai.verified = true AND upai.verification_expires_at <= NOW() THEN 'expired'
    WHEN upai.id IS NOT NULL THEN 'not_verified'
    ELSE 'no_identity'
  END as verification_status,
  upai.email as user_email,
  upai.verified_at,
  upai.verification_expires_at,
  upai.last_used_at
FROM partner_apps pa
LEFT JOIN user_partner_app_identity upai ON pa.id = upai.partner_app_id
WHERE pa.is_enabled = true;

-- View for partner app analytics
CREATE OR REPLACE VIEW partner_app_analytics AS
SELECT 
  pa.id,
  pa.name,
  pa.category,
  COUNT(DISTINCT upai.user_id) as total_users_with_identity,
  COUNT(DISTINCT CASE WHEN upai.verified = true AND upai.verification_expires_at > NOW() THEN upai.user_id END) as verified_users,
  COUNT(DISTINCT pst.user_id) as users_with_tokens,
  COUNT(pst.id) as total_tokens_issued,
  COUNT(CASE WHEN pst.result = 'success' THEN 1 END) as successful_tokens,
  ROUND(
    CASE WHEN COUNT(pst.id) > 0 
    THEN (COUNT(CASE WHEN pst.result = 'success' THEN 1 END)::numeric / COUNT(pst.id)::numeric * 100)
    ELSE 0 
    END, 2
  ) as success_rate_percentage
FROM partner_apps pa
LEFT JOIN user_partner_app_identity upai ON pa.id = upai.partner_app_id
LEFT JOIN partner_sso_tokens pst ON pa.id = pst.partner_app_id
WHERE pa.is_enabled = true
GROUP BY pa.id, pa.name, pa.category;

-- ================================================================
-- STEP 9: ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS for all partner tables
ALTER TABLE public.partner_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_app_trusts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sso_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_partner_app_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_sso_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_logs ENABLE ROW LEVEL SECURITY;

-- Partner Apps: Admins can manage, users can view enabled apps
CREATE POLICY "partner_apps_admin_full_access" ON public.partner_apps
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "partner_apps_user_view_enabled" ON public.partner_apps
  FOR SELECT TO authenticated
  USING (is_enabled = true);

-- User Partner App Identity: Users can only access their own identities
CREATE POLICY "user_partner_app_identity_own_access" ON public.user_partner_app_identity
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::uuid)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::uuid);

-- Partner Grants: Users can view their own grants, admins can manage
CREATE POLICY "partner_grants_own_view" ON public.partner_grants
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::uuid);

CREATE POLICY "partner_grants_admin_manage" ON public.partner_grants
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Partner SSO Sessions: Users can access their own sessions
CREATE POLICY "partner_sso_sessions_own_access" ON public.partner_sso_sessions
  FOR ALL TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::uuid)
  WITH CHECK (user_id = (auth.jwt() ->> 'sub')::uuid);

-- Partner SSO Tokens: Users can view their own tokens (for audit)
CREATE POLICY "partner_sso_tokens_own_view" ON public.partner_sso_tokens
  FOR SELECT TO authenticated
  USING (user_id = (auth.jwt() ->> 'sub')::uuid);

-- Admin-only policies for sensitive tables
CREATE POLICY "partner_app_trusts_admin_only" ON public.partner_app_trusts
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "partner_sso_keys_admin_only" ON public.partner_sso_keys
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "partner_logs_admin_view" ON public.partner_logs
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- ================================================================
-- 🎉 PARTNER APPS INTEGRATION SYSTEM COMPLETE! 🎉
-- ================================================================

-- COMPREHENSIVE IMPLEMENTATION SUMMARY:
-- ✅ All 4 Required Functions Added (triggers now functional)
-- ✅ Core Partner Apps Table (name, URL, open modes, domains, delivery)
-- ✅ Trust & Security (JWKS/shared secrets, ACS endpoints, algorithms)
-- ✅ Per-User Identity Management (email per app, verification, expiration)
-- ✅ Session Management (verification workflow, status tracking)
-- ✅ Token Audit Trail (delivery modes, success/failure tracking)
-- ✅ Access Control (optional grants, allow/deny per user/app)
-- ✅ Comprehensive Logging (all operations, JSONB details)
-- ✅ Analytics Views (user stats, success rates, verification status)
-- ✅ Row Level Security (proper access control across all tables)
-- ✅ Permissions & Feature Flags (RBAC integration)
-- ✅ Initial Seed Data (RSA key placeholder, settings)

-- IMPLEMENTATION FEATURES:
-- 🔐 Per-Partner Email Login (email verification per app, never shared)
-- 🎯 Multiple Open Modes (auto-detect, embed, external, deeplink)
-- 🚀 Token Delivery Options (query, fragment, POST, backchannel)
-- 🔒 Trust Management (JWKS URLs, shared secrets, audience validation)
-- 📊 Rich Analytics (success rates, user verification status)
-- 🛡️ Security First (domain allowlists, short-lived tokens, audit logs)
-- ⚡ Admin Controls (enable/disable, pin to sidebar, access grants)
-- 🎨 Flexible UI (sidebar quick access, full management pages)

-- NEXT STEPS FOR FRONTEND:
-- 1. Implement sidebar "Partner Apps" with pinned app quick buttons
-- 2. Build /partner-apps user page (Open App, Login with Email, Re-verify Email)
-- 3. Build /admin/support-settings/partner-apps management interface
-- 4. Add /partner/:id embedded app view with iframe and controls
-- 5. Implement email verification flow (magic links/OAuth)
-- 6. Add partner app resolver logic (auto-detect embedding, token delivery)
-- 7. Create partner onboarding workflow for admins
-- 8. Add telemetry dashboard for partner app analytics

-- STATUS: COMPLETE DATABASE FOUNDATION - READY FOR FRONTEND IMPLEMENTATION! 🚀
-- ================================================================
