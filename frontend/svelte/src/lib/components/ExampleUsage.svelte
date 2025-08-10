<!-- Example component showing proper lib usage -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { formatCurrency, formatPoints, formatDate, currency, points } from '$lib/utils';
  import { APP_CONFIG } from '$lib/config/app';
  import type { Customer, Transaction } from '$lib/types';
  
  // Example data
  let customer: Customer = {
    id: '1',
    name: 'Ahmed Al-Salem',
    email: 'ahmed@example.com',
    mobile: '0551234567',
    isAdmin: false,
    createdAt: new Date().toISOString(),
    loyaltyCardNumber: 'LC001234',
    points: 2500,
    tier: 'gold',
    preferences: {
      language: 'ar',
      notifications: {
        email: true,
        sms: true,
        push: false
      },
      marketing: true
    }
  };
  
  let recentTransactions: Transaction[] = [
    {
      id: 'tx1',
      customerId: customer.id,
      amount: 150.75,
      pointsEarned: 151,
      pointsUsed: 0,
      type: 'purchase',
      status: 'completed',
      branchId: 'branch1',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      description: 'Grocery shopping'
    }
  ];
</script>

<div class="p-6 bg-white rounded-lg shadow-sm">
  <h2 class="text-xl font-bold mb-4">Customer Profile Example</h2>
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Customer Info -->
    <div>
      <h3 class="font-semibold text-gray-800 mb-3">Customer Information</h3>
      <div class="space-y-2 text-sm">
        <p><strong>Name:</strong> {customer.name}</p>
        <p><strong>Email:</strong> {customer.email}</p>
        <p><strong>Mobile:</strong> {customer.mobile}</p>
        <p><strong>Tier:</strong> <span class="capitalize">{customer.tier}</span></p>
        <p><strong>Points:</strong> {formatPoints(customer.points, customer.preferences.language)}</p>
        <p><strong>Member Since:</strong> {formatDate(customer.createdAt, customer.preferences.language)}</p>
      </div>
    </div>
    
    <!-- Recent Transactions -->
    <div>
      <h3 class="font-semibold text-gray-800 mb-3">Recent Transactions</h3>
      {#each recentTransactions as transaction}
        <div class="border rounded-lg p-3 mb-3">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm text-gray-600">{transaction.description}</p>
              <p class="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">{formatCurrency(transaction.amount)}</p>
              <p class="text-sm text-green-600">+{points(transaction.pointsEarned)}</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- App Config Example -->
  <div class="mt-6 p-4 bg-gray-50 rounded-lg">
    <h3 class="font-semibold text-gray-800 mb-2">App Configuration</h3>
    <div class="text-sm text-gray-600 space-y-1">
      <p><strong>Points per Riyal:</strong> {APP_CONFIG.loyalty.pointsPerRiyal}</p>
      <p><strong>Contact Email:</strong> {APP_CONFIG.contact.email}</p>
      <p><strong>Business Hours:</strong> {APP_CONFIG.businessHours.workDays}, {APP_CONFIG.businessHours.hours}</p>
    </div>
  </div>
</div>
