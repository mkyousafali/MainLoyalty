<script lang="ts">
  import { goto } from '$app/navigation';
  import { language, t } from '$lib/stores/language';

  $: isRtl = $language === 'ar';

  const features = [
    { 
      emoji: "🛍️", 
      titleKey: "pickUpFromStore", 
      descKey: "pickUpFromStoreDesc",
      route: "/pickup-store"
    },
    { 
      emoji: "💳", 
      titleKey: "purchaseNowPayLater", 
      descKey: "purchaseNowPayLaterDesc",
      route: "/pay-later"
    },
    { 
      emoji: "🎁", 
      titleKey: "giftPointsToFriend", 
      descKey: "giftPointsToFriendDesc",
      route: "/gift-points"
    }
  ];

  function navigateToFeature(route: string) {
    goto(route);
  }
</script>

<div class="w-full" class:rtl={isRtl}>
  <h2 class="text-lg font-semibold text-gray-800 mb-4">✨ {$t.comingSoon}</h2>
  <div class="space-y-2">
    {#each features as item}
      <button 
        class="w-full flex items-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.02]"
        class:space-x-3={!isRtl}
        class:space-x-reverse={isRtl}
        class:text-left={!isRtl}
        class:text-right={isRtl}
        on:click={() => navigateToFeature(item.route)}
      >
        <div class="text-xl">{item.emoji}</div>
        <div class="flex-1 min-w-0">
          <p class="font-medium text-gray-900 text-sm truncate">{$t[item.titleKey]}</p>
          <p class="text-xs text-gray-600 truncate">{$t[item.descKey]}</p>
        </div>
        <div class="text-blue-400 flex-shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" class:rotate-180={isRtl}>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </button>
    {/each}
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
</style>
