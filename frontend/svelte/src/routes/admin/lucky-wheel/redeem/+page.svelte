<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  let isLoading = false;
  let searchCode = '';
  let customerCode = '';
  let searchResult: any = null;
  let redeemablePrizes: any[] = [];
  let selectedPrize: any = null;
  let showRedeemModal = false;
  let redeemStatus = '';
  let redeemMessage = '';
  let showScanner = false;
  
  // Recent redemptions for cashier reference
  let recentRedemptions: any[] = [];
  
  onMount(() => {
    checkAdminAuth();
    loadRecentRedemptions();
  });
  
  function checkAdminAuth() {
    const adminSession = localStorage.getItem('adminSession');
    if (adminSession !== 'active') {
      goto('/admin-login');
    }
  }
  
  async function loadRecentRedemptions() {
    try {
      // This would load recent redemptions from database
      // For now, showing placeholder data
      recentRedemptions = [
        {
          id: 1,
          customer_code: 'CUST001',
          customer_name: 'John Doe',
          prize_code: 'LUCKY-ABC123',
          prize_amount: 25,
          category: 'Discount Coupon',
          redeemed_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
          cashier: 'Admin'
        },
        {
          id: 2,
          customer_code: 'CUST045',
          customer_name: 'Jane Smith',
          prize_code: 'LUCKY-XYZ789',
          prize_amount: 15,
          category: 'Cash Prize',
          redeemed_at: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
          cashier: 'Admin'
        },
        {
          id: 3,
          customer_code: 'CUST089',
          customer_name: 'Mike Johnson',
          prize_code: 'LUCKY-DEF456',
          prize_amount: 10,
          category: 'Store Credit',
          redeemed_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          cashier: 'Admin'
        }
      ];
    } catch (error) {
      console.error('Error loading recent redemptions:', error);
    }
  }
  
  async function searchPrize() {
    if (!searchCode.trim()) {
      alert('Please enter a prize code or customer code');
      return;
    }
    
    isLoading = true;
    searchResult = null;
    redeemablePrizes = [];
    
    try {
      // This would search the database for the prize/customer
      // For now, showing mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (searchCode.toUpperCase().startsWith('LUCKY-')) {
        // Searching by prize code
        searchResult = {
          type: 'prize',
          prize_code: searchCode.toUpperCase(),
          customer_code: 'CUST001',
          customer_name: 'John Doe',
          prize_amount: 25,
          category: 'Discount Coupon',
          color: '#3498DB',
          status: 'active',
          expires_at: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
          won_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        };
      } else {
        // Searching by customer code
        customerCode = searchCode.toUpperCase();
        searchResult = {
          type: 'customer',
          customer_code: customerCode,
          customer_name: 'John Doe',
          phone: '+1234567890',
          email: 'john@example.com'
        };
        
        // Load customer's redeemable prizes
        redeemablePrizes = [
          {
            id: 1,
            prize_code: 'LUCKY-ABC123',
            prize_amount: 25,
            category: 'Discount Coupon',
            color: '#3498DB',
            status: 'active',
            expires_at: new Date(Date.now() + 86400000 * 7).toISOString(),
            won_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: 2,
            prize_code: 'LUCKY-DEF456',
            prize_amount: 10,
            category: 'Store Credit',
            color: '#27AE60',
            status: 'active',
            expires_at: new Date(Date.now() + 86400000 * 5).toISOString(),
            won_at: new Date(Date.now() - 7200000).toISOString()
          }
        ];
      }
    } catch (error) {
      console.error('Search error:', error);
      searchResult = { type: 'error', message: 'Prize or customer not found' };
    } finally {
      isLoading = false;
    }
  }
  
  function openRedeemModal(prize: any) {
    selectedPrize = prize;
    showRedeemModal = true;
    redeemStatus = '';
    redeemMessage = '';
  }
  
  async function confirmRedemption() {
    if (!selectedPrize) return;
    
    isLoading = true;
    redeemStatus = '';
    
    try {
      // This would update the database to mark prize as redeemed
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      redeemStatus = 'success';
      redeemMessage = `Prize ¤${selectedPrize.prize_amount} successfully redeemed!`;
      
      // Add to recent redemptions
      recentRedemptions.unshift({
        id: Date.now(),
        customer_code: searchResult.customer_code,
        customer_name: searchResult.customer_name,
        prize_code: selectedPrize.prize_code,
        prize_amount: selectedPrize.prize_amount,
        category: selectedPrize.category,
        redeemed_at: new Date().toISOString(),
        cashier: 'Admin'
      });
      
      // Remove from redeemable prizes
      redeemablePrizes = redeemablePrizes.filter(p => p.id !== selectedPrize.id);
      
      // Close modal after short delay
      setTimeout(() => {
        showRedeemModal = false;
        selectedPrize = null;
      }, 2000);
      
    } catch (error) {
      console.error('Redemption error:', error);
      redeemStatus = 'error';
      redeemMessage = 'Failed to redeem prize. Please try again.';
    } finally {
      isLoading = false;
    }
  }
  
  function clearSearch() {
    searchCode = '';
    customerCode = '';
    searchResult = null;
    redeemablePrizes = [];
  }
  
  function closeRedeemModal() {
    showRedeemModal = false;
    selectedPrize = null;
    redeemStatus = '';
    redeemMessage = '';
  }
  
  function getStatusBadgeClass(status: string) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'redeemed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }
  
  // Mock QR scanner function
  function toggleScanner() {
    showScanner = !showScanner;
    if (showScanner) {
      // In a real implementation, this would activate the camera
      console.log('QR Scanner activated');
    }
  }
  
  // Mock QR scan result
  function handleQRScan(code: string) {
    searchCode = code;
    showScanner = false;
    searchPrize();
  }
</script>

<svelte:head>
  <title>Prize Redemption - Lucky Wheel Admin</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h1 class="text-3xl font-bold text-gray-900 flex items-center">
        🎟️ Prize Redemption Center
      </h1>
      <p class="text-gray-600 mt-2">Scan or enter prize codes to redeem customer prizes</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Search Section -->
      <div class="lg:col-span-2">
        <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">🔍 Search Prize or Customer</h2>
          
          <div class="flex gap-3 mb-4">
            <div class="flex-1">
              <input
                type="text"
                bind:value={searchCode}
                placeholder="Enter prize code (LUCKY-ABC123) or customer code (CUST001)"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-lg"
                on:keypress={(e) => e.key === 'Enter' && searchPrize()}
              />
            </div>
            <button 
              on:click={toggleScanner}
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              class:bg-green-600={showScanner}
              class:hover:bg-green-700={showScanner}
            >
              📱 {showScanner ? 'Stop' : 'QR Scan'}
            </button>
            <button 
              on:click={searchPrize}
              disabled={isLoading || !searchCode.trim()}
              class="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳' : '🔍'} Search
            </button>
          </div>
          
          <div class="flex gap-2">
            <button 
              on:click={clearSearch}
              class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
            <span class="text-sm text-gray-500 py-2">
              Tip: Use LUCKY-CODE for prize codes or CUST001 for customer codes
            </span>
          </div>
        </div>

        <!-- QR Scanner Mock -->
        {#if showScanner}
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">📱 QR Code Scanner</h3>
            <div class="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div class="text-6xl mb-4">📷</div>
              <p class="text-gray-600 mb-4">QR Scanner would be active here</p>
              <div class="space-y-2">
                <button 
                  on:click={() => handleQRScan('LUCKY-ABC123')}
                  class="block w-full px-4 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                >
                  Mock Scan: LUCKY-ABC123
                </button>
                <button 
                  on:click={() => handleQRScan('CUST001')}
                  class="block w-full px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                >
                  Mock Scan: CUST001
                </button>
              </div>
            </div>
          </div>
        {/if}

        <!-- Search Results -->
        {#if searchResult}
          <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Search Results</h3>
            
            {#if searchResult.type === 'error'}
              <div class="text-center py-8">
                <div class="text-6xl mb-4">❌</div>
                <p class="text-red-600 font-medium">{searchResult.message}</p>
                <p class="text-gray-500 text-sm mt-2">Please check the code and try again</p>
              </div>
            
            {:else if searchResult.type === 'prize'}
              <!-- Single Prize Result -->
              <div class="border rounded-lg p-4">
                <div class="flex justify-between items-start mb-3">
                  <div>
                    <h4 class="font-bold text-lg" style="color: {searchResult.color}">{searchResult.category}</h4>
                    <p class="text-gray-600">Code: {searchResult.prize_code}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-green-600">¤{searchResult.prize_amount}</p>
                    <span class={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(searchResult.status)}`}>
                      {searchResult.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <strong>Customer:</strong> {searchResult.customer_name}
                  </div>
                  <div>
                    <strong>Won:</strong> {new Date(searchResult.won_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Customer Code:</strong> {searchResult.customer_code}
                  </div>
                  <div>
                    <strong>Expires:</strong> {new Date(searchResult.expires_at).toLocaleDateString()}
                  </div>
                </div>
                
                {#if searchResult.status === 'active'}
                  <button 
                    on:click={() => openRedeemModal(searchResult)}
                    class="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    🎟️ Redeem This Prize
                  </button>
                {:else}
                  <div class="w-full py-3 bg-gray-100 text-gray-500 rounded-lg text-center font-medium">
                    Prize Already {searchResult.status}
                  </div>
                {/if}
              </div>
            
            {:else if searchResult.type === 'customer'}
              <!-- Customer Info -->
              <div class="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 class="font-bold text-lg text-blue-900">Customer Information</h4>
                <div class="grid grid-cols-2 gap-4 text-sm mt-2">
                  <div><strong>Name:</strong> {searchResult.customer_name}</div>
                  <div><strong>Code:</strong> {searchResult.customer_code}</div>
                  <div><strong>Phone:</strong> {searchResult.phone}</div>
                  <div><strong>Email:</strong> {searchResult.email}</div>
                </div>
              </div>
              
              <!-- Customer's Redeemable Prizes -->
              <h4 class="font-bold text-lg text-gray-900 mb-3">Redeemable Prizes ({redeemablePrizes.length})</h4>
              
              {#if redeemablePrizes.length === 0}
                <div class="text-center py-8 text-gray-500">
                  <div class="text-4xl mb-2">🎁</div>
                  <p>No active prizes found for this customer</p>
                </div>
              {:else}
                <div class="space-y-3">
                  {#each redeemablePrizes as prize}
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div class="flex justify-between items-start">
                        <div class="flex-1">
                          <h5 class="font-medium" style="color: {prize.color}">{prize.category}</h5>
                          <p class="text-sm text-gray-600">Code: {prize.prize_code}</p>
                          <p class="text-xs text-gray-500">
                            Won: {new Date(prize.won_at).toLocaleString()} • 
                            Expires: {new Date(prize.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div class="text-right ml-4">
                          <p class="text-2xl font-bold text-green-600">¤{prize.prize_amount}</p>
                          <button 
                            on:click={() => openRedeemModal(prize)}
                            class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Redeem
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>
              {/if}
            {/if}
          </div>
        {/if}
      </div>

      <!-- Recent Redemptions Sidebar -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">📋 Recent Redemptions</h3>
          
          <div class="space-y-3">
            {#each recentRedemptions.slice(0, 10) as redemption}
              <div class="border rounded-lg p-3 text-sm">
                <div class="flex justify-between items-start mb-2">
                  <div class="font-medium text-gray-900">{redemption.customer_name}</div>
                  <div class="font-bold text-green-600">¤{redemption.prize_amount}</div>
                </div>
                <div class="text-gray-600 text-xs space-y-1">
                  <div>Code: {redemption.prize_code}</div>
                  <div>{redemption.category}</div>
                  <div>{new Date(redemption.redeemed_at).toLocaleString()}</div>
                  <div>By: {redemption.cashier}</div>
                </div>
              </div>
            {/each}
          </div>
          
          {#if recentRedemptions.length === 0}
            <div class="text-center py-8 text-gray-500">
              <div class="text-3xl mb-2">📋</div>
              <p class="text-sm">No recent redemptions</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Redemption Confirmation Modal -->
{#if showRedeemModal && selectedPrize}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
      <div class="p-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Confirm Prize Redemption</h2>
        
        {#if redeemStatus === ''}
          <!-- Confirmation State -->
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">🎟️</div>
            <h3 class="text-xl font-bold" style="color: {selectedPrize.color}">{selectedPrize.category}</h3>
            <p class="text-3xl font-bold text-green-600 my-2">¤{selectedPrize.prize_amount}</p>
            <p class="text-gray-600">Code: {selectedPrize.prize_code}</p>
            
            <div class="bg-gray-50 rounded-lg p-4 mt-4 text-left text-sm">
              <div class="grid grid-cols-2 gap-2">
                <div><strong>Customer:</strong></div>
                <div>{searchResult.customer_name}</div>
                <div><strong>Customer Code:</strong></div>
                <div>{searchResult.customer_code}</div>
                <div><strong>Expires:</strong></div>
                <div>{new Date(selectedPrize.expires_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          
          <div class="flex space-x-3">
            <button 
              on:click={confirmRedemption}
              disabled={isLoading}
              class="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
            >
              {isLoading ? '⏳ Processing...' : '✅ Confirm Redemption'}
            </button>
            <button 
              on:click={closeRedeemModal}
              disabled={isLoading}
              class="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        
        {:else if redeemStatus === 'success'}
          <!-- Success State -->
          <div class="text-center">
            <div class="text-6xl mb-4">✅</div>
            <h3 class="text-xl font-bold text-green-600 mb-2">Redemption Successful!</h3>
            <p class="text-gray-700">{redeemMessage}</p>
            <p class="text-sm text-gray-500 mt-2">This window will close automatically...</p>
          </div>
          
        {:else if redeemStatus === 'error'}
          <!-- Error State -->
          <div class="text-center mb-6">
            <div class="text-6xl mb-4">❌</div>
            <h3 class="text-xl font-bold text-red-600 mb-2">Redemption Failed</h3>
            <p class="text-gray-700">{redeemMessage}</p>
          </div>
          
          <div class="flex space-x-3">
            <button 
              on:click={confirmRedemption}
              class="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🔄 Try Again
            </button>
            <button 
              on:click={closeRedeemModal}
              class="flex-1 px-4 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}