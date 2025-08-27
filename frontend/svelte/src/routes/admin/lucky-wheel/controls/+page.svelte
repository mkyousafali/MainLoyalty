<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = true;
  let isSystemActive = true;
  let maxDailySpins = 3;
  let cooldownPeriod = 24; // hours
  let minPrizeValue = 5;
  let maxPrizeValue = 100;
  let wheelConfig = {
    spinDuration: 3000,
    autoStart: false,
    soundEnabled: true,
    animationSpeed: 'normal'
  };
  
  onMount(() => {
    checkAdminAuth();
    loadSystemSettings();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadSystemSettings() {
    try {
      // This would connect to your database to load settings
      // For now, using default values
      isLoading = false;
    } catch (error) {
      console.error('Error loading system settings:', error);
      isLoading = false;
    }
  }
  
  async function saveSettings() {
    try {
      // Save settings to database
      console.log('Saving settings...');
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  }
  
  async function resetToDefaults() {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      isSystemActive = true;
      maxDailySpins = 3;
      cooldownPeriod = 24;
      minPrizeValue = 5;
      maxPrizeValue = 100;
      wheelConfig = {
        spinDuration: 3000,
        autoStart: false,
        soundEnabled: true,
        animationSpeed: 'normal'
      };
    }
  }
</script>

<svelte:head>
  <title>System Controls - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        ⚙️ System Controls
      </h1>
      <p class="text-gray-600 mt-2">Configure Lucky Wheel system settings and behavior</p>
    </div>

    {#if isLoading}
      <div class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    {:else}
      <div class="space-y-6">
        <!-- System Status -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">System Status</h2>
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class={`w-4 h-4 rounded-full ${isSystemActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span class="text-lg font-medium">Lucky Wheel System</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" bind:checked={isSystemActive} class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <p class="text-sm text-gray-600 mt-2">
            {isSystemActive ? 'System is active and accepting spins' : 'System is disabled - no spins allowed'}
          </p>
        </div>

        <!-- Spin Limits -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Spin Limits</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Max Daily Spins per Customer</label>
              <input 
                type="number" 
                bind:value={maxDailySpins}
                min="1"
                max="10"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cooldown Period (hours)</label>
              <input 
                type="number" 
                bind:value={cooldownPeriod}
                min="1"
                max="168"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <!-- Prize Value Limits -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Prize Value Limits</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Minimum Prize Value</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">¤</span>
                <input 
                  type="number" 
                  bind:value={minPrizeValue}
                  min="1"
                  class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Maximum Prize Value</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-gray-500">¤</span>
                <input 
                  type="number" 
                  bind:value={maxPrizeValue}
                  min="1"
                  class="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Wheel Configuration -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Wheel Configuration</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Spin Duration (ms)</label>
              <input 
                type="number" 
                bind:value={wheelConfig.spinDuration}
                min="1000"
                max="10000"
                step="500"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Animation Speed</label>
              <select bind:value={wheelConfig.animationSpeed} class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                <option value="slow">Slow</option>
                <option value="normal">Normal</option>
                <option value="fast">Fast</option>
              </select>
            </div>
            <div class="flex items-center space-x-3">
              <input 
                type="checkbox" 
                bind:checked={wheelConfig.autoStart}
                id="autoStart"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label for="autoStart" class="text-sm font-medium text-gray-700">Auto-start wheel on load</label>
            </div>
            <div class="flex items-center space-x-3">
              <input 
                type="checkbox" 
                bind:checked={wheelConfig.soundEnabled}
                id="soundEnabled"
                class="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
              />
              <label for="soundEnabled" class="text-sm font-medium text-gray-700">Enable spin sound effects</label>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex flex-col sm:flex-row gap-4">
            <button 
              on:click={saveSettings}
              class="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              💾 Save Settings
            </button>
            <button 
              on:click={resetToDefaults}
              class="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              🔄 Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
