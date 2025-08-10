<script>
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Pick Up from Store - Coming Soon</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
      <button 
        on:click={() => goto('/dashboard')}
        class="flex items-center text-gray-600 hover:text-gray-800"
      >
        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <h1 class="text-lg font-semibold text-gray-800">Pick Up from Store</h1>
      <div class="w-8"></div>
    </div>
  </div>

  <!-- Main Content with Blur Effect -->
  <div class="max-w-md mx-auto p-6">
    <!-- Feature Preview (Blurred) -->
    <div class="relative mb-8">
      <div class="bg-white rounded-2xl shadow-lg p-6 filter blur-sm">
        <div class="flex items-center mb-4">
          <div class="text-4xl mr-4">🛍️</div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Store Pickup Service</h2>
            <p class="text-gray-600">Order online, collect in-store</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">📍 Store Locations</span>
            <span class="text-green-600 font-semibold">15+ Branches</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">⏰ Pickup Time</span>
            <span class="text-blue-600 font-semibold">Ready in 20 mins</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">💰 Pickup Fee</span>
            <span class="text-purple-600 font-semibold">Always Free</span>
          </div>
        </div>
        
        <button class="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-xl font-semibold">
          Select Store & Order
        </button>
      </div>
      
      <!-- Coming Soon Overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-2xl">
        <div class="text-center">
          <div class="text-6xl mb-4">🏪</div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
          <p class="text-gray-600 mb-6 px-4">
            Skip the lines! Order ahead and pick up your items instantly
          </p>
          <div class="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
            ⚡ Launching Soon
          </div>
        </div>
      </div>
    </div>

    <!-- Feature Details -->
    <div class="bg-white rounded-2xl shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">How It Works:</h3>
      
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          <div class="bg-green-100 rounded-full p-2 text-green-600 font-bold text-sm">1</div>
          <div>
            <p class="font-medium text-gray-900">Browse & Order Online</p>
            <p class="text-sm text-gray-600">Choose from thousands of products in our app</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-blue-100 rounded-full p-2 text-blue-600 font-bold text-sm">2</div>
          <div>
            <p class="font-medium text-gray-900">Select Your Store</p>
            <p class="text-sm text-gray-600">Pick the most convenient location for pickup</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-purple-100 rounded-full p-2 text-purple-600 font-bold text-sm">3</div>
          <div>
            <p class="font-medium text-gray-900">Get Ready Notification</p>
            <p class="text-sm text-gray-600">We'll notify you when your order is ready</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-orange-100 rounded-full p-2 text-orange-600 font-bold text-sm">4</div>
          <div>
            <p class="font-medium text-gray-900">Quick Pickup</p>
            <p class="text-sm text-gray-600">Show QR code and collect your items instantly</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Store Locator Preview -->
    <div class="mt-6 bg-white rounded-2xl shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">🗺️ Find Stores Near You</h3>
      <div class="bg-gray-100 rounded-xl p-4 text-center">
        <div class="text-3xl mb-2">📍</div>
        <p class="text-gray-600 text-sm">Interactive store map coming soon</p>
      </div>
    </div>

    <!-- Notify Me Button -->
    <div class="mt-6">
      <button class="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
        🔔 Notify Me When Available
      </button>
    </div>
  </div>
</div>
