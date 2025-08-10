<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { getGlobalWhatsAppLink } from '$lib/stores/globalSettings';
  import { language, t } from '$lib/stores/language.js';

  let branches: any[] = [];
  let selectedBranch: any = null;
  let whatsappLink = 'https://wa.me/966112345678'; // fallback
  let loading = true;
  let error = '';

  async function loadBranches() {
    try {
      const { data, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .order('name');

      if (branchError) {
        console.error('Error loading branches:', branchError);
        branches = [];
        return;
      }

      if (data && data.length > 0) {
        branches = data;
        console.log('Branches loaded from database:', data.length, 'branches');
      } else {
        branches = [];
      }
    } catch (err: any) {
      console.error('Error loading branches:', err);
      branches = [];
    }
  }

  async function loadGlobalSettings() {
    try {
      loading = true;
      error = '';
      
      whatsappLink = await getGlobalWhatsAppLink();
      console.log('✅ WhatsApp link loaded:', whatsappLink);
    } catch (err: any) {
      console.error('Error loading WhatsApp link:', err);
      error = `Failed to load support settings: ${err.message}`;
    } finally {
      loading = false;
    }
  }

  function setupRealtimeListener() {
    const channel = supabase
      .channel('global_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_settings',
          filter: 'setting_key=eq.whatsapp_support_link'
        },
        () => {
          setTimeout(() => {
            loadGlobalSettings();
          }, 500);
        }
      )
      .subscribe();

    return channel;
  }

  onMount(() => {
    loadGlobalSettings();
    loadBranches();
    const channel = setupRealtimeListener();
    return () => {
      supabase.removeChannel(channel);
    };
  });
</script>

<div class="min-h-screen bg-gray-100 py-10 px-4 font-[Montserrat]" class:rtl={$language === 'ar'}>
  <div class="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="logo-container">
        <img src="/logo.png" alt="Urban Market Logo" class="logo-image" />
      </div>
    </div>

    <!-- WhatsApp Support -->
    <div class="text-center mb-10 p-6 bg-green-50 rounded-xl border border-green-200">
      <h2 class="text-lg font-semibold text-gray-800 mb-3">{$t.needHelp}</h2>

      {#if loading}
        <div class="inline-block bg-gray-400 text-white px-8 py-4 rounded-xl shadow-lg font-semibold text-lg">
          ⏳ {$t.loading}
        </div>
      {:else if error}
        <div class="text-red-600 text-sm mb-4">{error}</div>
        <button
          on:click={loadGlobalSettings}
          class="inline-block bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all transform hover:scale-105"
        >
          🔄 {$t.retry}
        </button>
      {:else}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl shadow-lg font-semibold text-lg transition-all transform hover:scale-105"
        >
          💬 {$t.chatWithAI}
        </a>
      {/if}
    </div>

    <!-- Branch Contacts -->
    {#if branches.length > 0}
      <div class="mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <span class="text-3xl">📍</span>
          <span>{$t.branchContactInfo}</span>
        </h2>

        <div class="space-y-4">
          {#each branches as branch}
            <div class="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all bg-white group">
              <button
                class="w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between transition-colors"
                on:click={() => selectedBranch = selectedBranch === branch ? null : branch}
              >
                <div class="flex items-center gap-3">
                  <span class="text-2xl">🏬</span>
                  <div>
                    <h3 class="font-bold text-xl text-gray-900 mb-1">
                      {branch.name || branch.name_ar || $t.unnamedBranch}
                    </h3>
                    <p class="text-sm text-gray-600 flex items-center gap-2">
                      <span class="text-red-500">📍</span>
                      <span>{branch.address || $t.locationNotSpecified}</span>
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  {#if selectedBranch === branch}
                    <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {$t.open}
                    </span>
                  {/if}
                  <div class="bg-gray-100 group-hover:bg-blue-100 p-2 rounded-full transition-all duration-300">
                    <span class="text-2xl transition-transform duration-300 {selectedBranch === branch ? 'rotate-90 text-blue-600' : 'text-gray-500'}">
                      {$language === 'ar' ? '⬅️' : '➡️'}
                    </span>
                  </div>
                </div>
              </button>

              {#if selectedBranch === branch}
                <div class="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50">
                  <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Contact Section -->
                    <div class="space-y-4">
                      <h4 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                        <span class="text-xl">🔗</span>
                        <span>{$t.quickContact}</span>
                      </h4>

                      {#if branch.website || branch.website_url}
                        <a 
                          href={branch.website || branch.website_url} 
                          target="_blank" 
                          class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
                        >
                          <div class="bg-white bg-opacity-20 p-2 rounded-lg">
                            <span class="text-2xl">🌐</span>
                          </div>
                          <div class="flex-1">
                            <p class="font-semibold text-lg">{$t.visitWebsite}</p>
                            <p class="text-blue-100 text-sm">{(branch.website || branch.website_url).replace(/^https?:\/\//, '')}</p>
                          </div>
                          <span class="text-xl opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                        </a>
                      {/if}

                      {#if branch.contact_phone || branch.phone}
                        <a 
                          href={`https://wa.me/${(branch.contact_phone || branch.phone).replace(/[^\d]/g, '')}`} 
                          target="_blank" 
                          class="flex items-center gap-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <span class="text-xl">📞</span>
                          <div>
                            <p class="font-medium">{$t.whatsappContact}</p>
                            <p class="text-sm opacity-75">{branch.contact_phone || branch.phone}</p>
                          </div>
                          <span class="ml-auto text-xs">{$language === 'ar' ? '↙️' : '↗️'}</span>
                        </a>
                      {/if}

                      {#if branch.instagram || branch.instagram_url}
                        <a 
                          href={branch.instagram || branch.instagram_url} 
                          target="_blank" 
                          class="flex items-center gap-3 p-3 bg-pink-50 text-pink-700 rounded-lg hover:bg-pink-100 transition-colors"
                        >
                          <span class="text-xl">📸</span>
                          <div>
                            <p class="font-medium">{$t.instagram}</p>
                            <p class="text-sm opacity-75">@{((branch.instagram || branch.instagram_url).split('/').pop() || '').replace('@', '')}</p>
                          </div>
                          <span class="ml-auto text-xs">{$language === 'ar' ? '↙️' : '↗️'}</span>
                        </a>
                      {/if}

                      {#if branch.snap || branch.snap_url}
                        <a 
                          href={branch.snap || branch.snap_url} 
                          target="_blank" 
                          class="flex items-center gap-3 p-3 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                        >
                          <span class="text-xl">👻</span>
                          <div>
                            <p class="font-medium">{$t.snapchat}</p>
                            <p class="text-sm opacity-75">@{((branch.snap || branch.snap_url).split('/').pop() || '').replace('@', '')}</p>
                          </div>
                          <span class="ml-auto text-xs">{$language === 'ar' ? '↙️' : '↗️'}</span>
                        </a>
                      {/if}
                    </div>

                    <!-- Resources -->
                    <div class="space-y-4">
                      <h4 class="font-medium text-gray-800 mb-3">📄 {$t.resources}</h4>

                      {#if branch.code || branch.email}
                        <div class="space-y-2 text-sm text-gray-600 bg-white p-3 rounded-lg border">
                          {#if branch.code}
                            <p><span class="font-medium">{$t.branchCode}:</span> {branch.code}</p>
                          {/if}
                          {#if branch.email}
                            <p><span class="font-medium">{$t.email}:</span> <a href={`mailto:${branch.email}`} class="text-blue-600 hover:underline">{branch.email}</a></p>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* RTL Support */
  .rtl {
    direction: rtl;
  }

  .rtl .flex {
    flex-direction: row-reverse;
  }

  .rtl .text-left {
    text-align: right;
  }

  .rtl .ml-auto {
    margin-left: 0;
    margin-right: auto;
  }

  .logo-container {
    background: white;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), inset 0 2px 4px rgba(255, 255, 255, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1);
    border: 4px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    display: inline-block;
  }
  .logo-container:hover {
    transform: scale(1.05);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15), inset 0 2px 4px rgba(255, 255, 255, 0.9), 0 0 0 2px rgba(255, 255, 255, 0.2);
  }
  .logo-image {
    max-width: 120px;
    max-height: 60px;
    object-fit: contain;
    transition: all 0.3s ease;
  }
</style>
