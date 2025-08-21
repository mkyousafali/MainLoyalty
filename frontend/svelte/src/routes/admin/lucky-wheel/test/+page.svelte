<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Custom currency symbol - same as customer wheel
  const wheelCurrencySymbol = '¤'; // Simple currency symbol for wheel text
  
  let isSpinning = false;
  let spinResult = null;
  let showResult = false;
  let wheelAngle = 0;
  let hasSpun = false;
  let totalSpins = 0;
  let totalWins = 0;
  let winStreak = 0;
  let lastWinAmount = 0;
  let isAnimating = false;
  
  // Mock customer data for testing
  let mockCustomer = {
    code: 'TEST12345',
    name: 'Test Customer',
    cardType: 'premium',
    spinCredits: 999999, // Unlimited credits for testing
    totalWins: 0,
    totalWinAmount: 0
  };
  
  // Mock prize categories with different probabilities for testing - Updated with professional colors
  const mockCategories = [
    { 
      id: 1, 
      name: 'Try Again', 
      name_ar: 'حاول مرة أخرى',
      color: '#E74C3C', // Professional red
      probability: 0.25, // 25% chance
      segments: 2, // Takes 2 segments of the wheel
      prize_amount: 0,
      type: 'no_prize'
    },
    { 
      id: 2, 
      name: '5 OFF', 
      name_ar: 'خصم 5',
      color: '#27AE60', // Professional green
      probability: 0.3, // 30% chance
      segments: 2,
      prize_amount: 5,
      type: 'coupon'
    },
    { 
      id: 3, 
      name: '10 OFF', 
      name_ar: 'خصم 10',
      color: '#3498DB', // Professional blue
      probability: 0.25, // 25% chance
      segments: 2,
      prize_amount: 10,
      type: 'coupon'
    },
    { 
      id: 4, 
      name: '25 OFF', 
      name_ar: 'خصم 25',
      color: '#F39C12', // Professional orange
      probability: 0.15, // 15% chance
      segments: 1,
      prize_amount: 25,
      type: 'coupon'
    },
    { 
      id: 5, 
      name: 'JACKPOT!', 
      name_ar: 'الجائزة الكبرى!',
      color: '#9B59B6', // Professional purple
      probability: 0.05, // 5% chance
      segments: 1,
      prize_amount: 50,
      type: 'jackpot'
    }
  ];
  
  // Generate wheel segments based on categories
  let wheelSegments = [];
  function generateWheelSegments() {
    wheelSegments = [];
    let currentAngle = 0;
    const totalSegments = mockCategories.reduce((sum, cat) => sum + cat.segments, 0);
    const segmentAngle = 360 / totalSegments;
    
    mockCategories.forEach(category => {
      for (let i = 0; i < category.segments; i++) {
        wheelSegments.push({
          ...category,
          startAngle: currentAngle,
          endAngle: currentAngle + segmentAngle,
          centerAngle: currentAngle + (segmentAngle / 2)
        });
        currentAngle += segmentAngle;
      }
    });
    
    // Debug: Log segment angles for verification
    console.log('Wheel segments generated:', wheelSegments.map(s => ({
      name: s.name,
      centerAngle: s.centerAngle.toFixed(1),
      startAngle: s.startAngle.toFixed(1),
      endAngle: s.endAngle.toFixed(1)
    })));
  }
  
  onMount(() => {
    checkAdminAuth();
    generateWheelSegments();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  function determineWinningSegment() {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (let category of mockCategories) {
      cumulativeProbability += category.probability;
      if (random <= cumulativeProbability) {
        // Find a segment of this category
        const categorySegments = wheelSegments.filter(seg => seg.id === category.id);
        return categorySegments[Math.floor(Math.random() * categorySegments.length)];
      }
    }
    
    // Fallback to "Try Again"
    return wheelSegments.find(seg => seg.type === 'no_prize');
  }
  
  async function executeSpin() {
    if (isSpinning || isAnimating) return;
    
    isSpinning = true;
    isAnimating = true;
    showResult = false;
    hasSpun = false;
    
    try {
      // Determine winning segment
      const winningSegment = determineWinningSegment();
      console.log('🎯 SELECTED WINNING SEGMENT:', winningSegment.name, 'at centerAngle:', winningSegment.centerAngle, '°');
      
      // CRITICAL: The wheel rotates clockwise, pointer is fixed at top (0°)
      // To align segment center with pointer, we need the segment's centerAngle to be at the 0° position
      // This means: finalWheelRotation % 360 should equal (360 - winningSegment.centerAngle) % 360
      
      const spins = 5 + Math.random() * 3; // 5-8 full rotations for drama
      const fullSpinsDegrees = Math.floor(spins) * 360;
      
      // Calculate the exact position we want the wheel to end at
      // If segment is at 45°, we want wheel rotated so that 45° aligns with top (0°)
      // This means the wheel needs to be rotated by (360 - 45) = 315°
      const targetFinalPosition = (360 - winningSegment.centerAngle) % 360;
      
      // Calculate current wheel position
      const currentPosition = wheelAngle % 360;
      
      // Calculate the rotation needed from current position to target position
      let rotationNeeded = targetFinalPosition - currentPosition;
      if (rotationNeeded < 0) {
        rotationNeeded += 360; // Ensure positive rotation
      }
      
      // Add full spins
      const totalRotation = rotationNeeded + fullSpinsDegrees;
      const finalAngle = wheelAngle + totalRotation;
      
      console.log('🔢 ROTATION CALCULATION:', {
        winningSegment: winningSegment.name,
        segmentCenterAngle: winningSegment.centerAngle,
        currentWheelAngle: wheelAngle,
        currentPosition: currentPosition.toFixed(1),
        targetFinalPosition: targetFinalPosition.toFixed(1),
        rotationNeeded: rotationNeeded.toFixed(1),
        fullSpinsDegrees: fullSpinsDegrees,
        totalRotation: totalRotation.toFixed(1),
        finalAngle: finalAngle.toFixed(1)
      });
      
      // Animate the wheel
      wheelAngle = finalAngle;
      
      // Wait for animation to complete
      setTimeout(() => {
        totalSpins++;
        
        // Debug: Verify final position
        const actualFinalPosition = finalAngle % 360;
        const expectedPosition = targetFinalPosition;
        const difference = Math.abs(actualFinalPosition - expectedPosition);
        
        console.log('✅ FINAL VERIFICATION:', {
          actualFinalPosition: actualFinalPosition.toFixed(1) + '°',
          expectedPosition: expectedPosition.toFixed(1) + '°',
          difference: difference.toFixed(1) + '°',
          isAccurate: difference < 5 ? '✅ ACCURATE' : '❌ INACCURATE'
        });
        
        if (winningSegment.type !== 'no_prize') {
          // Winner!
          spinResult = {
            result: 'win',
            category: winningSegment,
            prize_amount: winningSegment.prize_amount,
            coupon_code: `TEST-${Date.now().toString().slice(-6)}`,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          };
          totalWins++;
          winStreak++;
          lastWinAmount = winningSegment.prize_amount;
          mockCustomer.totalWins++;
          mockCustomer.totalWinAmount += winningSegment.prize_amount;
        } else {
          // No luck
          spinResult = {
            result: 'no_win',
            category: winningSegment,
            message: 'Better luck next time!'
          };
          winStreak = 0;
        }
        
        hasSpun = true;
        showResult = true;
        isSpinning = false;
        
        // Reset animation flag after a delay
        setTimeout(() => {
          isAnimating = false;
        }, 500);
        
      }, 3500); // 3.5 second spin animation
      
    } catch (error) {
      console.error('Spin execution error:', error);
      isSpinning = false;
      isAnimating = false;
    }
  }
  
  function resetTest() {
    totalSpins = 0;
    totalWins = 0;
    winStreak = 0;
    lastWinAmount = 0;
    mockCustomer.totalWins = 0;
    mockCustomer.totalWinAmount = 0;
    spinResult = null;
    showResult = false;
    hasSpun = false;
    wheelAngle = 0;
  }
  
  function generateQRCode() {
    // Mock QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=REDEEM:${spinResult.coupon_code}`;
  }
  
  $: winRate = totalSpins > 0 ? ((totalWins / totalSpins) * 100).toFixed(1) : '0.0';
</script>

<svelte:head>
  <title>Lucky Wheel Test - Unlimited Credits</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Test Mode Header -->
    <div class="bg-yellow-100 border-2 border-yellow-300 rounded-xl p-4 mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🧪</span>
          <div>
            <h1 class="text-2xl font-bold text-yellow-800">Lucky Wheel Test Mode</h1>
            <p class="text-yellow-700">Unlimited spins with mock data for testing purposes</p>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            on:click={resetTest}
            class="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            🔄 Reset Test
          </button>
          
          <a
            href="/admin/lucky-wheel/dashboard"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            📊 Go to Dashboard
          </a>
        </div>
      </div>
    </div>
    
    <!-- Test Statistics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-lg p-4 text-center">
        <div class="text-2xl font-bold text-blue-600">{totalSpins}</div>
        <div class="text-sm text-gray-600">Total Spins</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-4 text-center">
        <div class="text-2xl font-bold text-green-600">{totalWins}</div>
        <div class="text-sm text-gray-600">Total Wins</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-4 text-center">
        <div class="text-2xl font-bold text-purple-600">{winRate}%</div>
        <div class="text-sm text-gray-600">Win Rate</div>
      </div>
      
      <div class="bg-white rounded-xl shadow-lg p-4 text-center">
        <div class="text-2xl font-bold text-orange-600">{winStreak}</div>
        <div class="text-sm text-gray-600">Win Streak</div>
      </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Lucky Wheel -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-gray-800 mb-2">🎯 Lucky Wheel</h2>
          <p class="text-gray-600">Test Customer: {mockCustomer.name} ({mockCustomer.code})</p>
          <p class="text-sm text-green-600 font-semibold">Credits: {mockCustomer.spinCredits.toLocaleString()} (Unlimited)</p>
        </div>
        
        <!-- Wheel Container -->
        <div class="flex flex-col items-center">
          <div class="relative mb-8">
            <!-- Prize Indicator Pointer (pointing down into wheel) -->
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 translate-y-2 z-30">
              <div class="prize-pointer">
                <svg width="32" height="40" viewBox="0 0 32 40">
                  <!-- Outer triangle pointing down -->
                  <path d="M16 32 L6 8 L26 8 Z" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
                  <!-- Inner highlight -->
                  <path d="M16 28 L10 12 L22 12 Z" fill="#FFF8DC" opacity="0.8"/>
                  <!-- Center line for definition -->
                  <path d="M16 8 L16 32" stroke="#B8860B" stroke-width="1"/>
                  <!-- Top accent -->
                  <circle cx="16" cy="8" r="3" fill="#FFD700" stroke="#B8860B" stroke-width="2"/>
                </svg>
              </div>
            </div>
            
            <!-- Static Logo in Center -->
            <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
              <div class="w-12 h-12 bg-white rounded-full border-4 border-gray-700 flex items-center justify-center shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Logo" 
                  class="w-8 h-8 object-contain"
                />
              </div>
            </div>
            
            <!-- Wheel -->
            <div 
              class="wheel-container relative w-96 h-96 rounded-full border-8 border-gray-700 shadow-2xl overflow-hidden bg-white"
              class:spinning={isSpinning}
              style="transform: rotate({wheelAngle}deg);"
            >
              <svg class="w-full h-full" viewBox="0 0 200 200">
                {#each wheelSegments as segment, index}
                  <!-- Main segment -->
                  <path
                    d="M 100 100 L {100 + 90 * Math.cos((segment.startAngle - 90) * Math.PI / 180)} {100 + 90 * Math.sin((segment.startAngle - 90) * Math.PI / 180)} A 90 90 0 {segment.endAngle - segment.startAngle > 180 ? 1 : 0} 1 {100 + 90 * Math.cos((segment.endAngle - 90) * Math.PI / 180)} {100 + 90 * Math.sin((segment.endAngle - 90) * Math.PI / 180)} Z"
                    fill={segment.color}
                    stroke="#ffffff"
                    stroke-width="3"
                    class="drop-shadow-sm"
                  />
                  
                  <!-- Star decorations -->
                  <g transform="translate({100 + 75 * Math.cos((segment.centerAngle - 90) * Math.PI / 180)}, {100 + 75 * Math.sin((segment.centerAngle - 90) * Math.PI / 180)})">
                    <path
                      d="M0,-4 L1.2,-1.2 L4,0 L1.2,1.2 L0,4 L-1.2,1.2 L-4,0 L-1.2,-1.2 Z"
                      fill="white"
                      opacity="0.8"
                    />
                  </g>
                  
                  <!-- Prize text - vertical positioning for better readability -->
                  <g transform="translate({100 + 65 * Math.cos((segment.centerAngle - 90) * Math.PI / 180)}, {100 + 65 * Math.sin((segment.centerAngle - 90) * Math.PI / 180)}) rotate({segment.centerAngle + (segment.centerAngle > 90 && segment.centerAngle < 270 ? 180 : 0)})">
                    <text
                      x="0"
                      y="0"
                      text-anchor="middle"
                      dominant-baseline="central"
                      fill="white"
                      font-size="11"
                      font-weight="bold"
                      font-family="Arial, sans-serif"
                      style="text-shadow: 2px 2px 4px rgba(0,0,0,0.8);"
                    >
                      {#if segment.prize_amount > 0}
                        {wheelCurrencySymbol}{segment.prize_amount} OFF
                      {:else}
                        {segment.name.length > 8 ? segment.name.substring(0, 6) + '...' : segment.name}
                      {/if}
                    </text>
                  </g>
                {/each}
                
                <!-- Outer ring decoration -->
                <circle cx="100" cy="100" r="88" fill="none" stroke="#34495E" stroke-width="4" opacity="0.3"/>
                
                <!-- Small dots around the edge -->
                {#each Array(12) as _, i}
                  <circle 
                    cx={100 + 92 * Math.cos((i * 30 - 90) * Math.PI / 180)} 
                    cy={100 + 92 * Math.sin((i * 30 - 90) * Math.PI / 180)} 
                    r="2" 
                    fill="white" 
                    opacity="0.9"
                  />
                {/each}
                
                <!-- Center circle (empty, logo is placed outside) -->
                <circle cx="100" cy="100" r="25" fill="transparent" stroke="none"/>
                
                <!-- Debug: Pointer alignment line (only visible in test mode) -->
                <line x1="100" y1="15" x2="100" y2="85" stroke="rgba(255,0,0,0.3)" stroke-width="2" stroke-dasharray="5,5"/>
              </svg>
            </div>
          </div>
          
          <!-- Spin Button -->
          <button
            on:click={executeSpin}
            disabled={isSpinning || isAnimating}
            class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {#if isSpinning}
              <span class="flex items-center gap-2">
                <div class="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Spinning...
              </span>
            {:else}
              🎰 SPIN THE WHEEL
            {/if}
          </button>
          
          {#if !isSpinning && !isAnimating && totalSpins > 0}
            <p class="text-sm text-gray-500 mt-2">You can spin again immediately!</p>
          {/if}
        </div>
      </div>
      
      <!-- Results Panel -->
      <div class="space-y-6">
        <!-- Current Result -->
        {#if showResult && spinResult}
          <div class="bg-white rounded-2xl shadow-xl p-6">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">
              {#if spinResult.result === 'win'}
                🏆 Congratulations!
              {:else}
                🍀 Try Again!
              {/if}
            </h3>
            
            {#if spinResult.result === 'win'}
              <div class="space-y-4">
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div class="text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2 flex items-center justify-center gap-2">
                      <img src="/currency-symbol.svg" alt="Currency" class="w-8 h-8 inline-block" />
                      {spinResult.prize_amount}
                    </div>
                    <p class="text-green-700 font-semibold">{spinResult.category.name}</p>
                  </div>
                </div>
                
                <!-- Mock QR Code -->
                <div class="text-center">
                  <p class="text-gray-600 mb-2">Coupon Code:</p>
                  <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
                    <div class="font-mono text-lg font-bold text-gray-800">
                      {spinResult.coupon_code}
                    </div>
                  </div>
                  
                  <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <img 
                      src={generateQRCode()} 
                      alt="QR Code" 
                      class="mx-auto mb-2"
                    />
                    <p class="text-xs text-gray-500">QR Code for redemption</p>
                  </div>
                </div>
                
                <div class="text-center text-sm text-gray-500">
                  <p>🕐 Expires: {new Date(spinResult.expires_at).toLocaleDateString()}</p>
                  <p class="mt-2 text-xs">Show this code at checkout to redeem your prize!</p>
                </div>
              </div>
            {:else}
              <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                <div class="text-6xl mb-3">😔</div>
                <p class="text-orange-700 font-semibold text-lg">{spinResult.message}</p>
                <p class="text-orange-600 mt-2">You landed on: {spinResult.category.name}</p>
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Test Probabilities -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">🎲 Test Probabilities</h3>
          <div class="space-y-3">
            {#each mockCategories as category}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-3">
                  <div 
                    class="w-4 h-4 rounded-full" 
                    style="background-color: {category.color}"
                  ></div>
                  <span class="font-semibold">{category.name}</span>
                </div>
                <div class="text-right">
                  <div class="font-bold">{(category.probability * 100).toFixed(1)}%</div>
                  {#if category.prize_amount > 0}
                    <div class="text-sm text-green-600 flex items-center justify-end gap-1">
                      <img src="/currency-symbol.svg" alt="Currency" class="w-3 h-3 inline-block" />
                      {category.prize_amount}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
        
        <!-- Customer Stats -->
        <div class="bg-white rounded-2xl shadow-xl p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-4">📊 Customer Stats</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Total Wins:</span>
              <span class="font-bold text-green-600">{mockCustomer.totalWins}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Total Won:</span>
              <span class="font-bold text-green-600 flex items-center gap-1">
                <img src="/currency-symbol.svg" alt="Currency" class="w-4 h-4 inline-block" />
                {mockCustomer.totalWinAmount}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Card Type:</span>
              <span class="font-bold text-purple-600">{mockCustomer.cardType.toUpperCase()}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Credits Left:</span>
              <span class="font-bold text-blue-600">♾️ Unlimited</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .wheel-container {
    transition: transform 3.5s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .wheel-container.spinning {
    transition: transform 3.5s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .prize-pointer {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    animation: pointer-glow 2s ease-in-out infinite;
  }
  
  @keyframes pointer-glow {
    0%, 100% { 
      transform: scale(1);
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
    }
    50% { 
      transform: scale(1.05);
      filter: drop-shadow(0 6px 12px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.4));
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
