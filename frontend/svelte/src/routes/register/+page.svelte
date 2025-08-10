<!--
===============================================
🎯 CUSTOMER REGISTRATION PAGE
===============================================
Customer enters mobile number → verifies eligibility → completes registration
Mobile number moves from customer_numbers to customers table
-->

<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';
  import { isAuthenticated, user } from '$lib/stores/auth';

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let currentStep = 1; // 1: Mobile Check, 2: Registration Form, 3: Success
  let mobileNumber = '';
  let isLoading = false;
  let error = '';
  let branches: any[] = [];
  
  // Registration form data
  let formData = {
    name: '',
    email: '',
    area: '',
    branch_id: '',
    password: '',
    confirmPassword: ''
  };

  // ==========================================
  // MOBILE NUMBER VERIFICATION
  // ==========================================
  async function checkEligibility() {
    if (!mobileNumber) {
      error = 'Please enter your mobile number';
      return;
    }

    // Validate mobile format
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      error = 'Please enter a valid 10-digit mobile number';
      return;
    }

    isLoading = true;
    error = '';

    try {
      // Check if number is in eligibility list
      const { data: eligibleNumber, error: eligibilityError } = await supabase
        .from('customer_numbers')
        .select('*')
        .eq('customer_code', cleanMobile)
        .eq('status', 'not_registered')
        .single();

      if (eligibilityError || !eligibleNumber) {
        error = 'This mobile number is not eligible for registration. Please contact support.';
        return;
      }

      // Check if already registered
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('customer_code', cleanMobile)
        .single();

      if (existingCustomer) {
        error = 'This mobile number is already registered. Please login instead.';
        return;
      }

      // Mobile is eligible, proceed to registration form
      mobileNumber = cleanMobile;
      currentStep = 2;

    } catch (err) {
      console.error('Eligibility check error:', err);
      error = 'An error occurred while checking eligibility. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  // ==========================================
  // REGISTRATION FORM SUBMISSION
  // ==========================================
  async function submitRegistration() {
    // Validate form
    if (!formData.name.trim()) {
      error = 'Please enter your full name';
      return;
    }

    if (!formData.area.trim()) {
      error = 'Please enter your area/place';
      return;
    }

    if (!formData.branch_id) {
      error = 'Please select your preferred branch';
      return;
    }

    if (formData.password.length < 6) {
      error = 'Password must be at least 6 characters long';
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      error = 'Passwords do not match';
      return;
    }

    isLoading = true;
    error = '';

    try {
      // Get default card type (Bronze)
      const { data: cardTypes } = await supabase
        .from('card_types')
        .select('id')
        .eq('name_en', 'Bronze')
        .single();

      const defaultCardType = cardTypes?.id;

      // Hash password (in production, you'd want proper password hashing)
      const passwordHash = btoa(formData.password); // Simple base64 encoding for demo

      // Insert customer record
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert({
          customer: mobileNumber,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          area: formData.area.trim(),
          branch_id: formData.branch_id,
          card_type_id: defaultCardType,
          points: 0,
          total_spent: 0,
          status: 'active',
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year validity
          password_hash: passwordHash,
          joined_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Customer insert error:', insertError);
        throw insertError;
      }

      // Update customer_numbers status to 'registered'
      await supabase
        .from('customer_numbers')
        .update({ status: 'registered' })
        .eq('customer_code', mobileNumber);

      // Create welcome notification
      await supabase
        .from('notifications')
        .insert({
          type: 'system',
          message: `Welcome ${formData.name}! Your loyalty account has been created successfully.`
        });

      // Move to success step
      currentStep = 3;

    } catch (err) {
      console.error('Registration error:', err);
      error = 'Registration failed. Please try again or contact support.';
    } finally {
      isLoading = false;
    }
  }

  // ==========================================
  // LOAD BRANCHES
  // ==========================================
  async function loadBranches() {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .order('name_en');

      if (error) throw error;
      branches = data || [];
    } catch (err) {
      console.error('Failed to load branches:', err);
    }
  }

  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  function formatMobileInput(event: Event) {
    const target = event.target as HTMLInputElement;
    let value = target.value.replace(/\D/g, '');
    if (value.length > 10) value = value.slice(0, 10);
    mobileNumber = value;
  }

  function goBack() {
    currentStep = 1;
    error = '';
    formData = {
      name: '',
      email: '',
      area: '',
      branch_id: '',
      password: '',
      confirmPassword: ''
    };
  }

  // ==========================================
  // LIFECYCLE
  // ==========================================
</script>

<svelte:head>
  <title>Customer Registration - Urban Market Loyalty</title>
</svelte:head>

<!-- ==========================================
     REGISTRATION CONTAINER
     ========================================== -->
<div class="registration-container">
  <div class="registration-card">
    <!-- Header -->
    <div class="registration-header">
      <h1 class="registration-title">🎯 Customer Registration</h1>
      <p class="registration-subtitle">
        {#if currentStep === 1}
          Enter your mobile number to start registration
        {:else if currentStep === 2}
          Complete your profile information
        {:else}
          Registration completed successfully!
        {/if}
      </p>
    </div>

    <!-- Progress Indicator -->
    <div class="progress-indicator">
      <div class="progress-step {currentStep >= 1 ? 'active' : ''}">
        <div class="step-number">1</div>
        <div class="step-label">Mobile Verification</div>
      </div>
      <div class="progress-line {currentStep >= 2 ? 'active' : ''}"></div>
      <div class="progress-step {currentStep >= 2 ? 'active' : ''}">
        <div class="step-number">2</div>
        <div class="step-label">Registration Form</div>
      </div>
      <div class="progress-line {currentStep >= 3 ? 'active' : ''}"></div>
      <div class="progress-step {currentStep >= 3 ? 'active' : ''}">
        <div class="step-number">3</div>
        <div class="step-label">Complete</div>
      </div>
    </div>

    <!-- Step 1: Mobile Number Verification -->
    {#if currentStep === 1}
      <div class="form-section">
        <div class="form-group">
          <label for="mobile" class="form-label">Mobile Number</label>
          <input
            id="mobile"
            type="tel"
            bind:value={mobileNumber}
            on:input={formatMobileInput}
            placeholder="Enter your 10-digit mobile number"
            class="form-input"
            maxlength="10"
            autocomplete="tel"
          />
          <div class="form-hint">
            Enter the mobile number you were registered with
          </div>
        </div>

        <button
          class="btn btn-primary"
          on:click={checkEligibility}
          disabled={!mobileNumber || isLoading}
        >
          {#if isLoading}
            <span class="loading-spinner"></span>
            <span>Checking...</span>
          {:else}
            <span>Verify Mobile Number</span>
          {/if}
        </button>
      </div>
    {/if}

    <!-- Step 2: Registration Form -->
    {#if currentStep === 2}
      <div class="form-section">
        <div class="verified-mobile">
          <span class="verified-icon">✅</span>
          <span class="verified-text">Mobile {mobileNumber} verified successfully</span>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="name" class="form-label">Full Name *</label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              placeholder="Enter your full name"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              bind:value={formData.email}
              placeholder="Enter your email (optional)"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="area" class="form-label">Area / Place *</label>
            <input
              id="area"
              type="text"
              bind:value={formData.area}
              placeholder="Enter your area or city"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="branch" class="form-label">Preferred Branch *</label>
            <select
              id="branch"
              bind:value={formData.branch_id}
              class="form-select"
              required
            >
              <option value="">Select your preferred branch</option>
              {#each branches as branch}
                <option value={branch.id}>{branch.name_en}</option>
              {/each}
            </select>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password *</label>
            <input
              id="password"
              type="password"
              bind:value={formData.password}
              placeholder="Create a password (min 6 characters)"
              class="form-input"
              minlength="6"
              required
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="form-label">Confirm Password *</label>
            <input
              id="confirmPassword"
              type="password"
              bind:value={formData.confirmPassword}
              placeholder="Confirm your password"
              class="form-input"
              required
            />
          </div>
        </div>

        <div class="terms-section">
          <div class="terms-text">
            By registering, you agree to our Terms & Conditions and Privacy Policy.
            You will start with a Bronze loyalty card.
          </div>
        </div>

        <div class="form-actions">
          <button
            class="btn btn-secondary"
            on:click={goBack}
            disabled={isLoading}
          >
            ← Back
          </button>
          <button
            class="btn btn-primary"
            on:click={submitRegistration}
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="loading-spinner"></span>
              <span>Registering...</span>
            {:else}
              <span>Complete Registration</span>
            {/if}
          </button>
        </div>
      </div>
    {/if}

    <!-- Step 3: Success -->
    {#if currentStep === 3}
      <div class="success-section">
        <div class="success-icon">🎉</div>
        <h2 class="success-title">Registration Successful!</h2>
        <div class="success-details">
          <p class="success-message">
            Welcome to Urban Market Loyalty Program! Your account has been created successfully.
          </p>
          <div class="success-info">
            <div class="info-item">
              <span class="info-label">Mobile Number:</span>
              <span class="info-value">{mobileNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Full Name:</span>
              <span class="info-value">{formData.name}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Card Type:</span>
              <span class="info-value">Bronze</span>
            </div>
            <div class="info-item">
              <span class="info-label">Starting Points:</span>
              <span class="info-value">0</span>
            </div>
          </div>
        </div>

        <div class="success-actions">
          <button
            class="btn btn-primary"
            on:click={() => goto('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button
            class="btn btn-secondary"
            on:click={() => goto('/login')}
          >
            Login Now
          </button>
        </div>
      </div>
    {/if}

    <!-- Error Message -->
    {#if error}
      <div class="error-message">
        <span class="error-icon">❌</span>
        <span class="error-text">{error}</span>
      </div>
    {/if}
  </div>
</div>

<style>
  /* ==========================================
     CONTAINER & LAYOUT
     ========================================== */
  .registration-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .registration-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 600px;
    overflow: hidden;
  }

  /* ==========================================
     HEADER
     ========================================== */
  .registration-header {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    padding: 2rem;
    text-align: center;
  }

  .registration-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .registration-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    margin: 0;
  }

  /* ==========================================
     PROGRESS INDICATOR
     ========================================== */
  .progress-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: #f8fafc;
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #e5e7eb;
    color: #6b7280;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .progress-step.active .step-number {
    background: #3b82f6;
    color: white;
  }

  .step-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
    white-space: nowrap;
  }

  .progress-step.active .step-label {
    color: #3b82f6;
  }

  .progress-line {
    width: 60px;
    height: 2px;
    background: #e5e7eb;
    margin: 0 1rem;
    transition: all 0.3s ease;
  }

  .progress-line.active {
    background: #3b82f6;
  }

  /* ==========================================
     FORM SECTIONS
     ========================================== */
  .form-section {
    padding: 2rem;
  }

  .success-section {
    padding: 2rem;
    text-align: center;
  }

  .verified-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .verified-icon {
    font-size: 1.2rem;
  }

  .verified-text {
    color: #166534;
    font-weight: 500;
  }

  /* ==========================================
     FORM CONTROLS
     ========================================== */
  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .form-input,
  .form-select {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.2s ease;
    background: white;
  }

  .form-input:focus,
  .form-select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-hint {
    font-size: 0.875rem;
    color: #6b7280;
    margin-top: 0.5rem;
  }

  .form-grid {
    display: grid;
    gap: 1.5rem;
  }

  @media (min-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr 1fr;
    }

    .form-group:nth-child(1),
    .form-group:nth-child(3) {
      grid-column: 1 / -1;
    }
  }

  /* ==========================================
     TERMS SECTION
     ========================================== */
  .terms-section {
    margin: 2rem 0;
    padding: 1rem;
    background: #fffbeb;
    border: 1px solid #fed7aa;
    border-radius: 8px;
  }

  .terms-text {
    font-size: 0.875rem;
    color: #92400e;
    text-align: center;
  }

  /* ==========================================
     BUTTONS
     ========================================== */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
    font-size: 0.875rem;
    min-height: 44px;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    flex: 1;
  }

  .btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .btn-secondary {
    background: #f8fafc;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .btn-secondary:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #9ca3af;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* ==========================================
     SUCCESS SECTION
     ========================================== */
  .success-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .success-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 1rem 0;
  }

  .success-message {
    font-size: 1rem;
    color: #6b7280;
    margin-bottom: 2rem;
  }

  .success-info {
    background: #f8fafc;
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    text-align: left;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .info-item:last-child {
    border-bottom: none;
  }

  .info-label {
    font-weight: 500;
    color: #6b7280;
  }

  .info-value {
    font-weight: 600;
    color: #1f2937;
  }

  .success-actions {
    display: flex;
    gap: 1rem;
    flex-direction: column;
  }

  @media (min-width: 480px) {
    .success-actions {
      flex-direction: row;
    }
  }

  /* ==========================================
     ERROR MESSAGE
     ========================================== */
  .error-message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 2rem;
    background: #fef2f2;
    border-top: 1px solid #fecaca;
    color: #dc2626;
  }

  .error-icon {
    font-size: 1.2rem;
  }

  .error-text {
    font-weight: 500;
  }

  /* ==========================================
     LOADING SPINNER
     ========================================== */
  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ==========================================
     RESPONSIVE DESIGN
     ========================================== */
  @media (max-width: 640px) {
    .registration-container {
      padding: 1rem;
    }

    .progress-indicator {
      padding: 1rem;
    }

    .progress-step {
      font-size: 0.75rem;
    }

    .step-number {
      width: 32px;
      height: 32px;
    }

    .progress-line {
      width: 40px;
      margin: 0 0.5rem;
    }

    .form-section,
    .success-section {
      padding: 1.5rem;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>
