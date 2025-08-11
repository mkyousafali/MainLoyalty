<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { getGlobalWhatsAppLink } from '$lib/stores/globalSettings';
  import { language, t } from '$lib/stores/language.js';

  type Branch = {
    id: string;
    name?: string;
    name_en?: string;
    name_ar?: string;
    code?: string;
    location_en?: string;
    location_ar?: string;
    address?: string;
    opening_hours?: string;
    website?: string;
    contact_number?: string;
    email?: string;
    instagram?: string;
    snapchat?: string;
    tiktok?: string;
    manager_name?: string;
    manager_phone?: string;
    manager_email?: string;
    is_active?: boolean;
  };

  let branches: Branch[] = [];
  let selectedBranch: Branch | null = null;
  let whatsappLink = 'https://wa.me/966112345678'; // fallback
  let loadingGlobal = true;
  let loadingBranches = true;
  let errorGlobal = '';
  let errorBranches = '';

  // — Helpers —
  function normalizeToE164(raw?: string, defaultCountry = '966'): string | null {
    if (!raw) return null;
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return null;

    // If starts with 00… -> turn into +…
    if (digits.startsWith('00')) return `+${digits.slice(2)}`;
    // If starts with country code already (e.g., 9665…)
    if (digits.startsWith(defaultCountry)) return `+${digits}`;
    // If starts with 0 (e.g., 05xxxxxxxx in KSA) -> replace with country code
    if (digits.startsWith('0')) return `+${defaultCountry}${digits.slice(1)}`;
    // Otherwise assume it's local without leading 0 but missing country
    return `+${defaultCountry}${digits}`;
  }

  function waHref(phone?: string) {
    const e164 = normalizeToE164(phone);
    return e164 ? `https://wa.me/${e164.replace('+', '')}` : '#';
  }

  // — Data loaders —
  async function loadBranches() {
    try {
      loadingBranches = true;
      errorBranches = '';

      const { data, error: branchError } = await supabase
        .from('branches')
        .select('*')
        .eq('is_active', true)
        .order('name_en', { ascending: true });

      if (branchError) throw branchError;

      branches = Array.isArray(data) ? (data as Branch[]) : [];
      if (branches.length === 0) selectedBranch = null;
    } catch (err: any) {
      console.error('Error loading branches:', err);
      branches = [];
      selectedBranch = null;
      errorBranches = 'Failed to load branch information. Please try again.';
    } finally {
      loadingBranches = false;
    }
  }

  async function loadGlobalSettings() {
    try {
      loadingGlobal = true;
      errorGlobal = '';
      const link = await getGlobalWhatsAppLink();
      if (typeof link === 'string' && link.trim()) {
        whatsappLink = link.trim();
      }
      // else keep fallback
    } catch (err: any) {
      console.error('Error loading WhatsApp link:', err);
      errorGlobal = `Failed to load support settings: ${err?.message || 'Unknown error'}`;
    } finally {
      loadingGlobal = false;
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
          // debounce slightly to allow transaction to settle
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

<div
  class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 font-[Montserrat]"
  class:rtl={$language === 'ar'}
>
  <!-- Ambient blobs -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
    <div class="absolute top-40 right-20 w-40 h-40 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float-delayed"></div>
    <div class="absolute bottom-20 left-20 w-36 h-36 bg-gradient-to-r from-green-200 to-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float"></div>
  </div>

  <div class="max-w-6xl mx-auto relative z-10">
    <!-- Header / logo -->
    <div class="text-center mb-12">
      <div class="logo-container">
        <img src="/logo.png" alt="Urban Market Logo" class="logo-image mx-auto" />
      </div>
    </div>

    <!-- WhatsApp Support CTA -->
    <div class="text-center mb-16">
      <div
        class="relative overflow-hidden bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 rounded-3xl shadow-2xl p-8 transition-all duration-300"
      >
        <div class="absolute inset-0 opacity-10">
          <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer"></div>
        </div>

        <div class="relative z-10">
          <div class="flex items-center justify-center gap-3 mb-4">
            <div class="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <span class="text-3xl">🤖</span>
            </div>
            <h2 class="text-2xl font-bold text-white">{$t.needHelp}</h2>
          </div>

          {#if loadingGlobal}
            <div
              class="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-2xl shadow-lg font-semibold text-lg"
            >
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {$t.loading}
            </div>
          {:else if errorGlobal}
            <div class="bg-red-500/20 border border-red-300 rounded-xl p-4 mb-4 backdrop-blur-sm">
              <p class="text-red-100 text-sm">{errorGlobal}</p>
            </div>
            <button
              on:click={loadGlobalSettings}
              class="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              <span class="text-lg animate-spin">🔄</span>
              {$t.retry}
            </button>
          {:else}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              class="group inline-flex items-center gap-3 bg-white text-green-700 px-8 py-4 rounded-2xl shadow-xl font-bold text-lg transition-all transform hover:scale-105 active:scale-95 hover:shadow-2xl"
              aria-label="Open WhatsApp Support"
            >
              <div class="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <span class="text-2xl animate-pulse">💬</span>
              </div>
              {$t.chatWithAI}
              <div class="p-1 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <span class="text-sm transform group-hover:translate-x-1 transition-transform">
                  {$language === 'ar' ? '↙' : '↗'}
                </span>
              </div>
            </a>
          {/if}
        </div>
      </div>
    </div>

    <!-- Branches -->
    {#if loadingBranches}
      <!-- Skeleton -->
      <div class="grid gap-6 md:gap-8">
        {#each Array(3) as _, i}
          <div class="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm animate-pulse" aria-hidden="true">
            <div class="h-6 w-48 bg-gray-200 rounded mb-4"></div>
            <div class="space-y-3">
              <div class="h-4 w-3/4 bg-gray-200 rounded"></div>
              <div class="h-4 w-2/3 bg-gray-200 rounded"></div>
              <div class="h-4 w-1/2 bg-gray-200 rounded"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if errorBranches}
      <div class="text-center py-12">
        <div class="inline-flex items-center gap-3 bg-red-50 text-red-700 border border-red-200 px-5 py-3 rounded-2xl">
          <span>⚠️</span>
          <span>{errorBranches}</span>
        </div>
        <div class="mt-6">
          <button
            on:click={loadBranches}
            class="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow hover:bg-black/90"
          >
            <span class="text-lg">🔄</span>
            {$t.retry}
          </button>
        </div>
      </div>
    {:else if branches.length > 0}
      <div class="mb-8">
        <!-- Section header -->
        <div class="text-center mb-12">
          <div
            class="inline-flex items-center gap-4 bg-white rounded-2xl shadow-xl px-6 py-4"
          >
            <div class="p-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl text-white">
              <span class="text-2xl">📍</span>
            </div>
            <h2 class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {$t.branchContactInfo}
            </h2>
          </div>
        </div>

        <div class="grid gap-6 md:gap-8">
          {#each branches.filter(b => b != null) as branch (branch.id)}
            <div class="group relative">
              <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>

              <div
                class="relative bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500"
              >
                <button
                  class="w-full p-6 text-left hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 flex items-center justify-between transition-all duration-300"
                  on:click={() => (selectedBranch = selectedBranch?.id === branch.id ? null : branch)}
                  aria-expanded={selectedBranch?.id === branch.id}
                  aria-controls={`branch-panel-${branch.id}`}
                >
                  <div class="flex items-center gap-4">
                    <div
                      class="relative p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl text-white transform group-hover:scale-110 transition-transform duration-300"
                    >
                      <span class="text-2xl">🏬</span>
                      <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-20 rounded-2xl transition-opacity duration-300"></div>
                    </div>

                    <div class="space-y-2">
                      <h3
                        class="font-bold text-2xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-1 group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
                      >
                        {$language === 'ar'
                          ? (branch.name_ar || branch.name_en || branch.name || $t.unnamedBranch)
                          : (branch.name_en || branch.name || branch.name_ar || $t.unnamedBranch)}
                      </h3>

                      <div class="space-y-2">
                        {#if branch.location_en || branch.location_ar}
                          <div class="flex items-center gap-3 group/location hover:bg-blue-50 rounded-lg px-3 py-2 transition-colors">
                            <div class="p-2 bg-blue-100 rounded-lg group-hover/location:bg-blue-200 transition-colors">
                              <span class="text-blue-600">🏙️</span>
                            </div>
                            <span class="font-medium text-blue-700">
                              {$language === 'ar' ? (branch.location_ar || branch.location_en) : (branch.location_en || branch.location_ar)}
                            </span>
                          </div>
                        {/if}

                        {#if branch.address}
                          <div class="flex items-center gap-3 group/address hover:bg-red-50 rounded-lg px-3 py-2 transition-colors">
                            <div class="p-2 bg-red-100 rounded-lg group-hover/address:bg-red-200 transition-colors">
                              <span class="text-red-600">📍</span>
                            </div>
                            <span class="text-gray-700">{branch.address}</span>
                          </div>
                        {:else}
                          <div class="flex items-center gap-3 px-3 py-2">
                            <div class="p-2 bg-gray-100 rounded-lg">
                              <span class="text-gray-400">📍</span>
                            </div>
                            <span class="text-gray-400 italic">{$t.locationNotSpecified}</span>
                          </div>
                        {/if}

                        {#if branch.opening_hours}
                          <div class="flex items-center gap-3 group/hours hover:bg-green-50 rounded-lg px-3 py-2 transition-colors">
                            <div class="p-2 bg-green-100 rounded-lg group-hover/hours:bg-green-200 transition-colors">
                              <span class="text-green-600">🕒</span>
                            </div>
                            <span class="text-green-700 font-medium">{branch.opening_hours}</span>
                          </div>
                        {/if}
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center gap-4">
                    {#if selectedBranch?.id === branch.id}
                      <div class="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">
                        {$t.open}
                      </div>
                    {/if}
                    <div class="p-4 bg-gradient-to-r from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100 rounded-2xl transition-all duration-300 transform group-hover:scale-110">
                      <span
                        class="text-2xl transition-transform duration-300 {selectedBranch?.id === branch.id ? 'rotate-90 scale-125' : ''} {selectedBranch?.id === branch.id ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'}"
                      >
                        {$language === 'ar' ? '⬅️' : '➡️'}
                      </span>
                    </div>
                  </div>
                </button>

                {#if selectedBranch?.id === branch.id}
                  <div id={`branch-panel-${branch.id}`} class="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50">
                    <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <!-- Quick Contact -->
                      <div class="space-y-4">
                        <h4 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                          <span class="text-xl">🔗</span>
                          <span>{$t.quickContact}</span>
                        </h4>

                        {#if branch.website}
                          <a
                            href={branch.website}
                            target="_blank"
                            class="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
                          >
                            <div class="bg-white/20 p-2 rounded-lg">
                              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                              </svg>
                            </div>
                            <div class="flex-1">
                              <p class="font-semibold text-lg">{$t.visitWebsite || 'Visit Website'}</p>
                            </div>
                            <span class="text-xl opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                          </a>
                        {/if}

                        {#if branch.contact_number}
                          <a
                            href={waHref(branch.contact_number)}
                            target="_blank"
                            class="flex items-center gap-3 p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
                          >
                            <div class="bg-white/20 p-2 rounded-lg">
                              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884"/>
                              </svg>
                            </div>
                            <div>
                              <p class="font-medium">{$t.whatsappContact || 'WhatsApp Contact'}</p>
                            </div>
                            <span class="ml-auto text-xs opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                          </a>
                        {/if}

                        {#if branch.email}
                          <a
                            href={`mailto:${branch.email}`}
                            class="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                          >
                            <div class="bg-white/20 p-2 rounded-lg">
                              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                              </svg>
                            </div>
                            <div>
                              <p class="font-medium">{$t.emailContact || 'Email Contact'}</p>
                            </div>
                            <span class="ml-auto text-xs opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                          </a>
                        {/if}

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {#if branch.instagram}
                            <a
                              href={branch.instagram}
                              target="_blank"
                              class="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
                            >
                              <div class="bg-white/20 p-2 rounded-lg">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z"/>
                                </svg>
                              </div>
                              <div class="flex-1">
                                <p class="font-medium text-sm">{$t.instagram || 'Instagram'}</p>
                              </div>
                              <span class="ml-auto text-xs opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                            </a>
                          {/if}

                          {#if branch.snapchat}
                            <a
                              href={branch.snapchat}
                              target="_blank"
                              class="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 shadow-lg"
                            >
                              <div class="bg-white/30 p-2 rounded-lg">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.718-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.748.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987"/>
                                </svg>
                              </div>
                              <div class="flex-1">
                                <p class="font-medium text-sm">{$t.snapchat || 'Snapchat'}</p>
                              </div>
                              <span class="ml-auto text-xs opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                            </a>
                          {/if}

                          {#if branch.tiktok}
                            <a
                              href={branch.tiktok}
                              target="_blank"
                              class="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-lg hover:from-black hover:to-gray-800 transition-all transform hover:scale-105 shadow-lg"
                            >
                              <div class="bg-white/20 p-2 rounded-lg">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5.76 20.5a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.8-.5z"/>
                                </svg>
                              </div>
                              <div class="flex-1">
                                <p class="font-medium text-sm">{$t.tiktok || 'TikTok'}</p>
                              </div>
                              <span class="ml-auto text-xs opacity-75">{$language === 'ar' ? '↙️' : '↗️'}</span>
                            </a>
                          {/if}
                        </div>
                      </div>

                      <!-- Manager & Branch Info -->
                      <div class="space-y-4">
                        <h4 class="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                          <span class="text-xl">👔</span>
                          <span>{$t.branchManager || 'Branch Manager'}</span>
                        </h4>

                        {#if branch.manager_name || branch.manager_phone || branch.manager_email}
                          <div class="bg-white p-4 rounded-lg border border-gray-200 space-y-3">
                            {#if branch.manager_name}
                              <div class="flex items-center gap-3">
                                <span class="text-lg">👨‍💼</span>
                                <div>
                                  <p class="font-medium text-gray-800">{branch.manager_name}</p>
                                  <p class="text-xs text-gray-500">{$t.branchManager || 'Branch Manager'}</p>
                                </div>
                              </div>
                            {/if}

                            <div class="grid grid-cols-1 gap-2">
                              {#if branch.manager_phone}
                                <a
                                  href={waHref(branch.manager_phone)}
                                  target="_blank"
                                  class="flex items-center gap-3 p-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm"
                                >
                                  <span class="text-base">📱</span>
                                  <span>{branch.manager_phone}</span>
                                  <span class="ml-auto text-xs">{$t.whatsapp || 'WhatsApp'}</span>
                                </a>
                              {/if}

                              {#if branch.manager_email}
                                <a
                                  href={`mailto:${branch.manager_email}`}
                                  class="flex items-center gap-3 p-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm"
                                >
                                  <span class="text-base">📧</span>
                                  <span>{branch.manager_email}</span>
                                  <span class="ml-auto text-xs">{$t.email || 'Email'}</span>
                                </a>
                              {/if}
                            </div>
                          </div>
                        {:else}
                          <div class="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                            <p class="text-gray-500 text-sm">
                              {$t.managerInfoNotAvailable || 'Manager contact information not available'}
                            </p>
                          </div>
                        {/if}

                        <div class="bg-white p-4 rounded-lg border border-gray-200 space-y-2">
                          <h5 class="font-medium text-gray-800 mb-3 flex items-center gap-2">
                            <span class="text-lg">📋</span>
                            <span>{$t.branchDetails || 'Branch Details'}</span>
                          </h5>

                          {#if branch.code}
                            <div class="flex justify-between items-center py-1">
                              <span class="text-sm text-gray-600">{$t.branchCode || 'Branch Code'}:</span>
                              <span class="text-sm font-medium bg-gray-100 px-2 py-1 rounded">{branch.code}</span>
                            </div>
                          {/if}

                          {#if branch.location_en || branch.location_ar}
                            <div class="flex justify-between items-center py-1">
                              <span class="text-sm text-gray-600">{$t.city || 'City'}:</span>
                              <span class="text-sm font-medium">
                                {$language === 'ar' ? (branch.location_ar || branch.location_en) : (branch.location_en || branch.location_ar)}
                              </span>
                            </div>
                          {/if}

                          {#if branch.opening_hours}
                            <div class="flex justify-between items-center py-1">
                              <span class="text-sm text-gray-600">{$t.openingHours || 'Opening Hours'}:</span>
                              <span class="text-sm font-medium text-green-600">{branch.opening_hours}</span>
                            </div>
                          {/if}
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <!-- Empty state -->
      <div class="text-center py-16">
        <div class="relative inline-block">
          <div class="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-3xl blur-lg opacity-50"></div>
          <div class="relative bg-white p-12 rounded-3xl shadow-xl">
            <div class="text-6xl mb-4 animate-bounce">🏢</div>
            <h3 class="text-2xl font-bold text-gray-800 mb-2">{$t.noBranches || 'No Branches Available'}</h3>
            <p class="text-gray-600">{$t.checkBackLater || 'Please check back later for branch information.'}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Animations */
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(1deg); }
    66% { transform: translateY(5px) rotate(-1deg); }
  }
  @keyframes float-delayed {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(8px) rotate(-1deg); }
    66% { transform: translateY(-12px) rotate(1deg); }
  }
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  @keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes pulse-gentle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-float-delayed { animation: float-delayed 8s ease-in-out infinite; animation-delay: 2s; }
  .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
  .animate-gradient { background-size: 400% 400%; animation: gradient-shift 4s ease infinite; }
  .animate-pulse-gentle { animation: pulse-gentle 3s ease-in-out infinite; }
  .animate-slide-up { animation: slide-up 0.6s ease-out; }

  /* Smooth transitions everywhere */
  * { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

  /* RTL */
  .rtl { direction: rtl; }
  .rtl .flex { flex-direction: row-reverse; }
  .rtl .text-left { text-align: right; }
  .rtl .ml-auto { margin-left: 0; margin-right: auto; }

  /* Logo frame */
  .logo-container {
    background: white;
    border-radius: 16px;
    padding: 1.25rem 1.75rem;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.12),
      inset 0 2px 4px rgba(255, 255, 255, 0.8),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    border: 4px solid rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    display: inline-block;
  }
  .logo-container:hover {
    transform: scale(1.04);
    box-shadow:
      0 12px 40px rgba(0, 0, 0, 0.15),
      inset 0 2px 4px rgba(255, 255, 255, 0.9),
      0 0 0 2px rgba(255, 255, 255, 0.15);
  }
  .logo-image {
    max-width: 120px;
    height: auto;
    max-height: 60px;
    object-fit: contain;
    transition: all 0.3s ease;
  }

  /* Subtle card hover lift */
  .hover\\:-translate-y-1:hover { transform: translateY(-4px); }
</style>
