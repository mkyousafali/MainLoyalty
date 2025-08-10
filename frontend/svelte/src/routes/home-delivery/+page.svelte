<script>
  import { goto } from '$app/navigation';
  import { language, t } from '$lib/stores/language';
</script>

<svelte:head>
  <title>{$t.homeDelivery} - {$t.comingSoon}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" class:rtl={$language === 'ar'}>
  <!-- Main Content with Blur Effect -->
  <div class="max-w-md mx-auto p-6">
    <!-- Feature Preview (Blurred) -->
    <div class="relative mb-8">
      <div class="bg-white rounded-2xl shadow-lg p-6 filter blur-sm">
        <div class="flex items-center mb-4">
          <div class="text-4xl mr-4">🏠</div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Home Delivery Service</h2>
            <p class="text-gray-600">Fresh groceries at your doorstep</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">🛒 Grocery Items</span>
            <span class="text-green-600 font-semibold">500+ Products</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">⏰ Delivery Time</span>
            <span class="text-blue-600 font-semibold">30-60 mins</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">🚚 Delivery Fee</span>
            <span class="text-purple-600 font-semibold">Free for 50+ SAR</span>
          </div>
        </div>
        
        <button class="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl font-semibold">
          Start Shopping
        </button>
      </div>
      
      <!-- Coming Soon Overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-2xl">
        <div class="text-center">
          <div class="text-6xl mb-4">🚀</div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
          <p class="text-gray-600 mb-6 px-4">
            We're working hard to bring you the best home delivery experience
          </p>
          <div class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
            ✨ Launching Soon
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Details -->
    <div class="bg-white rounded-2xl shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">What to Expect:</h3>
      
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          <div class="text-xl">🛍️</div>
          <div>
            <p class="font-medium text-gray-900">Wide Product Selection</p>
            <p class="text-sm text-gray-600">Fresh produce, pantry staples, and daily essentials</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="text-xl">⚡</div>
          <div>
            <p class="font-medium text-gray-900">Fast Delivery</p>
            <p class="text-sm text-gray-600">Get your orders within 30-60 minutes</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="text-xl">🎯</div>
          <div>
            <p class="font-medium text-gray-900">Earn Loyalty Points</p>
            <p class="text-sm text-gray-600">Get points for every delivery order</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="text-xl">💝</div>
          <div>
            <p class="font-medium text-gray-900">Special Offers</p>
            <p class="text-sm text-gray-600">Exclusive discounts for loyal customers</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Notify Me Button -->
    <div class="mt-6">
      <button class="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
        🔔 {$t.notifyWhenAvailable}
      </button>
    </div>
  </div>
</div>

<style>
  .rtl {
    direction: rtl;
    font-family: 'Cairo', sans-serif;
  }
</style>
