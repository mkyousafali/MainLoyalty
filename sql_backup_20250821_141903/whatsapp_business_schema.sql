-- WhatsApp Business Manager Database Schema
-- Purpose: Complete schema for WhatsApp Business Manager with compliance and audit trails
-- Created: 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE WHATSAPP SETTINGS
-- ============================================

-- WhatsApp API Settings and Credentials
CREATE TABLE whatsapp_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_account_id VARCHAR(255) UNIQUE NOT NULL,
    phone_number_id VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    webhook_url TEXT,
    webhook_token VARCHAR(255),
    webhook_secret VARCHAR(255),
    api_version VARCHAR(10) DEFAULT 'v18.0',
    status VARCHAR(50) DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    verification_status VARCHAR(50) DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
    business_name VARCHAR(255),
    business_description TEXT,
    business_website VARCHAR(500),
    business_email VARCHAR(255),
    profile_photo_url TEXT,
    about TEXT,
    
    -- Rate limits and quotas
    daily_message_limit INTEGER DEFAULT 1000,
    current_daily_usage INTEGER DEFAULT 0,
    monthly_conversation_limit INTEGER DEFAULT 10000,
    current_monthly_usage INTEGER DEFAULT 0,
    
    -- Compliance settings
    opt_in_message TEXT,
    opt_out_keywords TEXT DEFAULT 'STOP,UNSUBSCRIBE,CANCEL',
    quiet_hours_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    quiet_hours_timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
    
    -- Business hours
    business_hours_enabled BOOLEAN DEFAULT false,
    business_hours_monday VARCHAR(50),
    business_hours_tuesday VARCHAR(50),
    business_hours_wednesday VARCHAR(50),
    business_hours_thursday VARCHAR(50),
    business_hours_friday VARCHAR(50),
    business_hours_saturday VARCHAR(50),
    business_hours_sunday VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SUBSCRIBER MANAGEMENT
-- ============================================

-- WhatsApp Subscribers/Contacts
CREATE TABLE whatsapp_subscribers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    whatsapp_id VARCHAR(255) UNIQUE,
    profile_name VARCHAR(255),
    display_name VARCHAR(255),
    
    -- Customer relationship
    customer_id VARCHAR(50), -- Link to existing customer system
    customer_number VARCHAR(50), -- Link to customer_numbers table
    
    -- Subscriber status
    subscription_status VARCHAR(50) DEFAULT 'opted_in' CHECK (subscription_status IN ('opted_in', 'opted_out', 'blocked', 'pending')),
    opt_in_date TIMESTAMP WITH TIME ZONE,
    opt_in_method VARCHAR(100), -- 'website_form', 'qr_code', 'manual_import', 'api', 'conversation'
    opt_in_source VARCHAR(255), -- URL or source identifier
    opt_out_date TIMESTAMP WITH TIME ZONE,
    opt_out_reason VARCHAR(255),
    
    -- Contact information
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    language_code VARCHAR(10) DEFAULT 'ar',
    country_code VARCHAR(10),
    city VARCHAR(255),
    
    -- Segmentation
    tags TEXT[], -- Array of tags for segmentation
    segments TEXT[], -- Array of segment names
    custom_fields JSONB, -- Flexible custom data
    
    -- Engagement metrics
    total_messages_sent INTEGER DEFAULT 0,
    total_messages_received INTEGER DEFAULT 0,
    last_message_sent TIMESTAMP WITH TIME ZONE,
    last_message_received TIMESTAMP WITH TIME ZONE,
    last_seen TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    -- Compliance
    marketing_consent BOOLEAN DEFAULT false,
    marketing_consent_date TIMESTAMP WITH TIME ZONE,
    data_processing_consent BOOLEAN DEFAULT true,
    data_processing_consent_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriber segments for targeted campaigns
CREATE TABLE whatsapp_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL, -- Segment criteria as JSON
    subscriber_count INTEGER DEFAULT 0,
    auto_update BOOLEAN DEFAULT true,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID, -- Reference to admin user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MESSAGE TEMPLATES
-- ============================================

-- WhatsApp Message Templates
CREATE TABLE whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id VARCHAR(255), -- Meta template ID after approval
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('AUTHENTICATION', 'MARKETING', 'UTILITY')),
    language VARCHAR(10) NOT NULL DEFAULT 'ar',
    
    -- Template content
    header_type VARCHAR(50) CHECK (header_type IN ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT')),
    header_text VARCHAR(60),
    header_media_url TEXT,
    body_text TEXT NOT NULL,
    footer_text VARCHAR(60),
    
    -- Interactive elements
    buttons JSONB, -- Array of buttons
    quick_replies JSONB, -- Array of quick reply buttons
    call_to_actions JSONB, -- Array of CTA buttons
    
    -- Template variables
    variables JSONB, -- Array of variable definitions
    variable_count INTEGER DEFAULT 0,
    
    -- Meta approval status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'disabled', 'archived')),
    rejection_reason TEXT,
    approval_date TIMESTAMP WITH TIME ZONE,
    
    -- Usage tracking
    total_sent INTEGER DEFAULT 0,
    delivery_rate DECIMAL(5,2),
    read_rate DECIMAL(5,2),
    click_rate DECIMAL(5,2),
    
    -- Compliance
    compliance_reviewed BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CAMPAIGN MANAGEMENT
-- ============================================

-- WhatsApp Campaigns
CREATE TABLE whatsapp_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50) DEFAULT 'promotional' CHECK (campaign_type IN ('promotional', 'transactional', 'notification', 'reminder')),
    
    -- Campaign settings
    template_id UUID REFERENCES whatsapp_templates(id),
    segment_id UUID REFERENCES whatsapp_segments(id),
    
    -- Targeting
    target_audience JSONB, -- Audience criteria if not using segment
    estimated_recipients INTEGER,
    
    -- Scheduling
    send_type VARCHAR(50) DEFAULT 'immediate' CHECK (send_type IN ('immediate', 'scheduled', 'recurring')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    recurring_pattern JSONB, -- For recurring campaigns
    timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
    
    -- Compliance checks
    respect_quiet_hours BOOLEAN DEFAULT true,
    respect_business_hours BOOLEAN DEFAULT false,
    max_send_rate INTEGER DEFAULT 100, -- Messages per minute
    
    -- Campaign status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled', 'failed')),
    
    -- Results
    recipients_count INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    clicks_count INTEGER DEFAULT 0,
    opt_outs_count INTEGER DEFAULT 0,
    
    -- Cost tracking
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Execution tracking
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign recipients for tracking individual sends
CREATE TABLE whatsapp_campaign_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES whatsapp_campaigns(id) ON DELETE CASCADE,
    subscriber_id UUID REFERENCES whatsapp_subscribers(id),
    phone_number VARCHAR(50) NOT NULL,
    
    -- Send status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    
    -- Message details
    message_id VARCHAR(255), -- WhatsApp message ID
    template_variables JSONB, -- Personalized variables
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INBOX & CONVERSATIONS
-- ============================================

-- WhatsApp Conversations
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscriber_id UUID REFERENCES whatsapp_subscribers(id),
    phone_number VARCHAR(50) NOT NULL,
    whatsapp_id VARCHAR(255),
    
    -- Conversation status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived', 'spam')),
    priority VARCHAR(50) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Assignment
    assigned_to UUID, -- Admin user ID
    assigned_at TIMESTAMP WITH TIME ZONE,
    team VARCHAR(255),
    
    -- 24-hour window compliance
    last_customer_message_at TIMESTAMP WITH TIME ZONE,
    service_window_expires_at TIMESTAMP WITH TIME ZONE,
    window_status VARCHAR(50) DEFAULT 'closed' CHECK (window_status IN ('open', 'closed', 'expired')),
    
    -- Conversation metadata
    subject VARCHAR(255),
    tags TEXT[],
    notes TEXT,
    total_messages INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    
    -- Automation
    ai_enabled BOOLEAN DEFAULT true,
    auto_reply_enabled BOOLEAN DEFAULT true,
    escalation_triggered BOOLEAN DEFAULT false,
    escalation_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- WhatsApp Messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id VARCHAR(255) UNIQUE, -- WhatsApp message ID
    conversation_id UUID REFERENCES whatsapp_conversations(id),
    subscriber_id UUID REFERENCES whatsapp_subscribers(id),
    campaign_id UUID REFERENCES whatsapp_campaigns(id), -- If from campaign
    
    -- Message details
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact', 'interactive', 'template')),
    
    -- Content
    content TEXT,
    media_url TEXT,
    media_type VARCHAR(100),
    file_name VARCHAR(255),
    file_size INTEGER,
    
    -- Interactive message data
    interactive_data JSONB,
    button_payload JSONB,
    list_reply JSONB,
    
    -- Template message data
    template_name VARCHAR(255),
    template_language VARCHAR(10),
    template_variables JSONB,
    
    -- Message status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Timestamps
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Compliance and context
    within_service_window BOOLEAN,
    requires_template BOOLEAN DEFAULT false,
    
    -- Metadata
    context JSONB, -- Message context from WhatsApp
    metadata JSONB, -- Additional metadata
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AI & AUTOMATION
-- ============================================

-- AI Configuration
CREATE TABLE whatsapp_ai_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'Default AI Assistant',
    
    -- AI Provider settings
    ai_provider VARCHAR(100) DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic', 'custom')),
    api_key_encrypted TEXT,
    model_name VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    
    -- AI Behavior
    personality TEXT DEFAULT 'You are a helpful customer service assistant for Urban Market loyalty program.',
    system_prompt TEXT,
    max_tokens INTEGER DEFAULT 150,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    
    -- Auto-reply settings
    auto_reply_enabled BOOLEAN DEFAULT false,
    auto_reply_delay_seconds INTEGER DEFAULT 30,
    business_hours_only BOOLEAN DEFAULT true,
    
    -- Escalation rules
    escalation_keywords TEXT[],
    escalation_sentiment_threshold DECIMAL(3,2) DEFAULT -0.5,
    max_auto_replies INTEGER DEFAULT 3,
    human_handoff_enabled BOOLEAN DEFAULT true,
    
    -- Knowledge base
    knowledge_base TEXT,
    faq_data JSONB,
    
    -- Compliance
    compliance_mode BOOLEAN DEFAULT true,
    blocked_topics TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Conversation History for context
CREATE TABLE whatsapp_ai_context (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES whatsapp_conversations(id),
    context_data JSONB NOT NULL,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUTOMATION RULES
-- ============================================

-- Automation Rules
CREATE TABLE whatsapp_automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Trigger conditions
    trigger_type VARCHAR(100) NOT NULL CHECK (trigger_type IN ('keyword', 'new_subscriber', 'opt_in', 'business_hours', 'inactivity', 'sentiment')),
    trigger_conditions JSONB NOT NULL,
    
    -- Actions
    action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('send_template', 'assign_agent', 'add_tag', 'create_ticket', 'api_webhook')),
    action_config JSONB NOT NULL,
    
    -- Rule settings
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    max_executions_per_user INTEGER DEFAULT 1,
    
    -- Tracking
    total_executions INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ANALYTICS & REPORTS
-- ============================================

-- Daily Analytics Summary
CREATE TABLE whatsapp_analytics_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- Message metrics
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    
    -- Subscriber metrics
    new_subscribers INTEGER DEFAULT 0,
    opt_outs INTEGER DEFAULT 0,
    active_subscribers INTEGER DEFAULT 0,
    
    -- Conversation metrics
    conversations_started INTEGER DEFAULT 0,
    conversations_closed INTEGER DEFAULT 0,
    avg_response_time_minutes INTEGER DEFAULT 0,
    
    -- Campaign metrics
    campaigns_sent INTEGER DEFAULT 0,
    campaign_recipients INTEGER DEFAULT 0,
    
    -- Cost metrics
    total_cost DECIMAL(10,2) DEFAULT 0.00,
    cost_per_message DECIMAL(6,4) DEFAULT 0.00,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT & COMPLIANCE
-- ============================================

-- Audit Log for WhatsApp activities
CREATE TABLE whatsapp_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL, -- 'subscriber', 'campaign', 'template', etc.
    entity_id UUID,
    
    -- User info
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(100),
    
    -- Action details
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    
    -- Compliance
    compliance_flag BOOLEAN DEFAULT false,
    compliance_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance Violations Log
CREATE TABLE whatsapp_compliance_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Violation details
    subscriber_id UUID REFERENCES whatsapp_subscribers(id),
    message_id UUID REFERENCES whatsapp_messages(id),
    campaign_id UUID REFERENCES whatsapp_campaigns(id),
    
    description TEXT NOT NULL,
    violation_data JSONB,
    resolution_status VARCHAR(50) DEFAULT 'open' CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    
    -- Response tracking
    reported_to_meta BOOLEAN DEFAULT false,
    reported_at TIMESTAMP WITH TIME ZONE,
    meta_response TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- WEBHOOK EVENTS
-- ============================================

-- Webhook Events Log
CREATE TABLE whatsapp_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    
    -- Event data
    raw_payload JSONB NOT NULL,
    processed_payload JSONB,
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processed', 'failed', 'ignored')),
    processing_error TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Related entities
    subscriber_id UUID REFERENCES whatsapp_subscribers(id),
    message_id UUID REFERENCES whatsapp_messages(id),
    conversation_id UUID REFERENCES whatsapp_conversations(id),
    
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Subscribers indexes
CREATE INDEX idx_whatsapp_subscribers_phone ON whatsapp_subscribers(phone_number);
CREATE INDEX idx_whatsapp_subscribers_customer ON whatsapp_subscribers(customer_number);
CREATE INDEX idx_whatsapp_subscribers_status ON whatsapp_subscribers(subscription_status);
CREATE INDEX idx_whatsapp_subscribers_tags ON whatsapp_subscribers USING GIN(tags);
CREATE INDEX idx_whatsapp_subscribers_active ON whatsapp_subscribers(is_active) WHERE is_active = true;

-- Messages indexes
CREATE INDEX idx_whatsapp_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_subscriber ON whatsapp_messages(subscriber_id);
CREATE INDEX idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at);
CREATE INDEX idx_whatsapp_messages_status ON whatsapp_messages(status);

-- Conversations indexes
CREATE INDEX idx_whatsapp_conversations_subscriber ON whatsapp_conversations(subscriber_id);
CREATE INDEX idx_whatsapp_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_assigned ON whatsapp_conversations(assigned_to);
CREATE INDEX idx_whatsapp_conversations_window ON whatsapp_conversations(service_window_expires_at);
CREATE INDEX idx_whatsapp_conversations_activity ON whatsapp_conversations(last_activity);

-- Campaigns indexes
CREATE INDEX idx_whatsapp_campaigns_status ON whatsapp_campaigns(status);
CREATE INDEX idx_whatsapp_campaigns_scheduled ON whatsapp_campaigns(scheduled_at);
CREATE INDEX idx_whatsapp_campaigns_template ON whatsapp_campaigns(template_id);

-- Templates indexes
CREATE INDEX idx_whatsapp_templates_status ON whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_category ON whatsapp_templates(category);
CREATE INDEX idx_whatsapp_templates_language ON whatsapp_templates(language);

-- Analytics indexes
CREATE INDEX idx_whatsapp_analytics_date ON whatsapp_analytics_daily(date);

-- Audit indexes
CREATE INDEX idx_whatsapp_audit_entity ON whatsapp_audit_log(entity_type, entity_id);
CREATE INDEX idx_whatsapp_audit_created ON whatsapp_audit_log(created_at);
CREATE INDEX idx_whatsapp_audit_user ON whatsapp_audit_log(user_id);

-- Webhook indexes
CREATE INDEX idx_whatsapp_webhook_status ON whatsapp_webhook_events(processing_status);
CREATE INDEX idx_whatsapp_webhook_type ON whatsapp_webhook_events(event_type);
CREATE INDEX idx_whatsapp_webhook_received ON whatsapp_webhook_events(received_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update service window on customer messages
CREATE OR REPLACE FUNCTION update_service_window()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.direction = 'inbound' THEN
        UPDATE whatsapp_conversations 
        SET 
            last_customer_message_at = NEW.created_at,
            service_window_expires_at = NEW.created_at + INTERVAL '24 hours',
            window_status = 'open',
            updated_at = NOW(),
            last_activity = NOW()
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for service window updates
CREATE TRIGGER trigger_update_service_window
    AFTER INSERT ON whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_service_window();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER trigger_whatsapp_settings_updated_at BEFORE UPDATE ON whatsapp_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_subscribers_updated_at BEFORE UPDATE ON whatsapp_subscribers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_segments_updated_at BEFORE UPDATE ON whatsapp_segments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_campaigns_updated_at BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_whatsapp_ai_config_updated_at BEFORE UPDATE ON whatsapp_ai_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional for development)
-- ============================================

-- Insert default AI configuration
INSERT INTO whatsapp_ai_config (
    name,
    personality,
    system_prompt,
    auto_reply_enabled,
    business_hours_only
) VALUES (
    'Urban Market Assistant',
    'You are a helpful customer service assistant for Urban Market loyalty program. You help customers with points, rewards, and general inquiries in Arabic and English.',
    'You are an AI assistant for Urban Market loyalty program. Respond in the customer''s language (Arabic or English). Be helpful, professional, and concise. If you cannot help with a complex issue, politely suggest they speak with a human agent.',
    false,
    true
);

-- Insert default automation rules
INSERT INTO whatsapp_automation_rules (
    name,
    description,
    trigger_type,
    trigger_conditions,
    action_type,
    action_config
) VALUES (
    'Welcome New Subscribers',
    'Send welcome message to new opt-ins',
    'opt_in',
    '{"source": "any"}',
    'send_template',
    '{"template_name": "welcome_message", "delay_minutes": 1}'
),
(
    'Business Hours Auto-Reply',
    'Send auto-reply during business hours',
    'business_hours',
    '{"outside_hours": true}',
    'send_template',
    '{"template_name": "business_hours_reply"}'
);

-- ============================================
-- COMMENTS AND DOCUMENTATION
-- ============================================

COMMENT ON TABLE whatsapp_settings IS 'Core WhatsApp Business API configuration and settings';
COMMENT ON TABLE whatsapp_subscribers IS 'WhatsApp subscriber contacts with opt-in compliance tracking';
COMMENT ON TABLE whatsapp_segments IS 'Subscriber segments for targeted campaigns';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates for business messaging';
COMMENT ON TABLE whatsapp_campaigns IS 'Marketing and notification campaigns';
COMMENT ON TABLE whatsapp_conversations IS 'Customer conversations with 24-hour window compliance';
COMMENT ON TABLE whatsapp_messages IS 'All WhatsApp messages (inbound and outbound)';
COMMENT ON TABLE whatsapp_ai_config IS 'AI assistant configuration and behavior settings';
COMMENT ON TABLE whatsapp_audit_log IS 'Audit trail for all WhatsApp Manager activities';
COMMENT ON TABLE whatsapp_compliance_violations IS 'Track and resolve compliance violations';
COMMENT ON TABLE whatsapp_webhook_events IS 'Log all webhook events from WhatsApp API';
COMMENT ON TABLE whatsapp_analytics_daily IS 'Daily analytics and performance metrics';

-- Grant permissions (adjust as needed for your user roles)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO whatsapp_admin;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO whatsapp_user;
