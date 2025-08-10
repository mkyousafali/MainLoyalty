<script>
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>Gift Points to a Friend - Coming Soon</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
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
      <h1 class="text-lg font-semibold text-gray-800">Gift Points</h1>
      <div class="w-8"></div>
    </div>
  </div>

  <!-- Main Content with Blur Effect -->
  <div class="max-w-md mx-auto p-6">
    <!-- Feature Preview (Blurred) -->
    <div class="relative mb-8">
      <div class="bg-white rounded-2xl shadow-lg p-6 filter blur-sm">
        <div class="flex items-center mb-4">
          <div class="text-4xl mr-4">🎁</div>
          <div>
            <h2 class="text-xl font-bold text-gray-800">Gift Points to Friends</h2>
            <p class="text-gray-600">Share the love with loyalty points</p>
          </div>
        </div>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">💎 Your Points Balance</span>
            <span class="text-green-600 font-semibold">2,450 Points</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">🎯 Min. Gift Amount</span>
            <span class="text-blue-600 font-semibold">100 Points</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span class="text-gray-700">⚡ Transfer Time</span>
            <span class="text-purple-600 font-semibold">Instant</span>
          </div>
        </div>
        
        <div class="mt-6 space-y-3">
          <input type="text" placeholder="Friend's mobile number" class="w-full p-3 border border-gray-300 rounded-xl">
          <input type="number" placeholder="Points to gift" class="w-full p-3 border border-gray-300 rounded-xl">
          <button class="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-3 rounded-xl font-semibold">
            Send Gift 🎁
          </button>
        </div>
      </div>
      
      <!-- Coming Soon Overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-2xl">
        <div class="text-center">
          <div class="text-6xl mb-4">💕</div>
          <h3 class="text-2xl font-bold text-gray-800 mb-2">Coming Soon!</h3>
          <p class="text-gray-600 mb-6 px-4">
            Spread joy by sharing your loyalty points with friends and family
          </p>
          <div class="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold">
            💝 Sharing is Caring
          </div>
        </div>
      </div>
    </div>

    <!-- How It Works -->
    <div class="bg-white rounded-2xl shadow-md p-6 mb-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">How Gift Points Work:</h3>
      
      <div class="space-y-4">
        <div class="flex items-start space-x-3">
          <div class="bg-pink-100 rounded-full p-2 text-pink-600 font-bold text-sm">1</div>
          <div>
            <p class="font-medium text-gray-900">Select Points Amount</p>
            <p class="text-sm text-gray-600">Choose how many points you want to gift (min. 100)</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-orange-100 rounded-full p-2 text-orange-600 font-bold text-sm">2</div>
          <div>
            <p class="font-medium text-gray-900">Enter Friend's Details</p>
            <p class="text-sm text-gray-600">Add their mobile number or select from contacts</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-purple-100 rounded-full p-2 text-purple-600 font-bold text-sm">3</div>
          <div>
            <p class="font-medium text-gray-900">Add Personal Message</p>
            <p class="text-sm text-gray-600">Include a sweet note with your gift</p>
          </div>
        </div>
        
        <div class="flex items-start space-x-3">
          <div class="bg-green-100 rounded-full p-2 text-green-600 font-bold text-sm">4</div>
          <div>
            <p class="font-medium text-gray-900">Instant Transfer</p>
            <p class="text-sm text-gray-600">Points are transferred immediately to their account</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Gift Types -->
    <div class="bg-white rounded-2xl shadow-md p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">🎊 Popular Gift Amounts:</h3>
      
      <div class="grid grid-cols-2 gap-3">
        <div class="p-4 border border-gray-200 rounded-xl text-center">
          <div class="text-2xl mb-1">☕</div>
          <p class="font-semibold text-gray-800">100 Points</p>
          <p class="text-xs text-gray-600">Coffee treat</p>
        </div>
        
        <div class="p-4 border border-gray-200 rounded-xl text-center">
          <div class="text-2xl mb-1">🍰</div>
          <p class="font-semibold text-gray-800">250 Points</p>
          <p class="text-xs text-gray-600">Sweet surprise</p>
        </div>
        
        <div class="p-4 border border-gray-200 rounded-xl text-center">
          <div class="text-2xl mb-1">🛍️</div>
          <p class="font-semibold text-gray-800">500 Points</p>
          <p class="text-xs text-gray-600">Shopping spree</p>
        </div>
        
        <div class="p-4 border border-gray-200 rounded-xl text-center">
          <div class="text-2xl mb-1">🎁</div>
          <p class="font-semibold text-gray-800">1000 Points</p>
          <p class="text-xs text-gray-600">Big gift</p>
        </div>
      </div>
    </div>

    <!-- Benefits -->
    <div class="mt-6 bg-gradient-to-r from-pink-100 to-orange-100 rounded-2xl p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">✨ Gift Benefits:</h3>
      
      <div class="space-y-3">
        <div class="flex items-center space-x-3">
          <div class="text-lg">🎯</div>
          <p class="text-sm text-gray-700">Both sender and receiver get bonus points</p>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="text-lg">📱</div>
          <p class="text-sm text-gray-700">Beautiful gift notifications with animations</p>
        </div>
        
        <div class="flex items-center space-x-3">
          <div class="text-lg">🏆</div>
          <p class="text-sm text-gray-700">Build your gifting streak for extra rewards</p>
        </div>
      </div>
    </div>

    <!-- Notify Me Button -->
    <div class="mt-6">
      <button class="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300">
        🔔 Notify Me When Available
      </button>
    </div>
  </div>
</div>
