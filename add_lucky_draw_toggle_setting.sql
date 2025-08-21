-- ========================================
-- ADD LUCKY DRAW TOGGLE SETTING
-- ========================================
-- Add system setting to enable/disable Lucky Draw feature globally

-- Insert Lucky Draw enable/disable setting into system_settings
INSERT INTO public.system_settings (
    setting_key, 
    setting_value, 
    setting_type, 
    description, 
    is_public
) VALUES (
    'lucky_draw_enabled',
    'true'::jsonb,
    'system',
    'Enable or disable Lucky Draw feature for all customers',
    true
) ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    setting_type = EXCLUDED.setting_type,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- Create function to get Lucky Draw setting
CREATE OR REPLACE FUNCTION get_lucky_draw_enabled()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            (setting_value->>'lucky_draw_enabled')::boolean,
            (setting_value)::boolean,
            true
        )
        FROM public.system_settings 
        WHERE setting_key = 'lucky_draw_enabled'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to toggle Lucky Draw setting
CREATE OR REPLACE FUNCTION toggle_lucky_draw_setting(enabled BOOLEAN)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the setting
    UPDATE public.system_settings 
    SET 
        setting_value = enabled::text::jsonb,
        updated_at = NOW()
    WHERE setting_key = 'lucky_draw_enabled';
    
    -- If no rows updated, insert new record
    IF NOT FOUND THEN
        INSERT INTO public.system_settings (
            setting_key, 
            setting_value, 
            setting_type, 
            description, 
            is_public
        ) VALUES (
            'lucky_draw_enabled',
            enabled::text::jsonb,
            'system',
            'Enable or disable Lucky Draw feature for all customers',
            true
        );
    END IF;
    
    RETURN enabled;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_lucky_draw_enabled() TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_lucky_draw_setting(BOOLEAN) TO authenticated;

COMMENT ON FUNCTION get_lucky_draw_enabled() IS 'Get current Lucky Draw enabled/disabled status';
COMMENT ON FUNCTION toggle_lucky_draw_setting(BOOLEAN) IS 'Toggle Lucky Draw feature on/off globally';
