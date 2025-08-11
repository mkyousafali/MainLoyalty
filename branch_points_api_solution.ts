// ======================================
// BRANCH POINTS API ENDPOINTS
// ======================================
// SvelteKit API routes for handling branch-based points filtering

// File: src/routes/api/customer/[customerId]/branches/+server.ts
// GET /api/customer/[customerId]/branches
// Returns all branches where customer has transactions with points summary

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params }) => {
    const { customerId } = params;
    
    if (!customerId) {
        return json({ error: 'Customer ID is required' }, { status: 400 });
    }

    try {
        // Get customer's branches with points summary
        const { data, error } = await supabase
            .from('customer_transactions')
            .select(`
                branch_id,
                points_earned,
                points_redeemed,
                bill_amount,
                transaction_date,
                branches (
                    id,
                    name,
                    name_en,
                    name_ar,
                    address,
                    phone
                )
            `)
            .eq('customer_id', customerId)
            .eq('status', 'completed');

        if (error) {
            return json({ error: error.message }, { status: 500 });
        }

        // Group by branch and calculate totals
        const branchSummary: Record<string, any> = {};
        
        data?.forEach(transaction => {
            const branchId = transaction.branch_id;
            if (!branchSummary[branchId]) {
                branchSummary[branchId] = {
                    branch_id: branchId,
                    branch_info: transaction.branches,
                    total_points_earned: 0,
                    total_points_redeemed: 0,
                    current_balance: 0,
                    total_spent: 0,
                    transaction_count: 0,
                    first_visit: transaction.transaction_date,
                    last_visit: transaction.transaction_date
                };
            }
            
            const branch = branchSummary[branchId];
            branch.total_points_earned += transaction.points_earned || 0;
            branch.total_points_redeemed += transaction.points_redeemed || 0;
            branch.total_spent += parseFloat(transaction.bill_amount || '0');
            branch.transaction_count++;
            
            // Update first/last visit dates
            if (transaction.transaction_date < branch.first_visit) {
                branch.first_visit = transaction.transaction_date;
            }
            if (transaction.transaction_date > branch.last_visit) {
                branch.last_visit = transaction.transaction_date;
            }
        });

        // Calculate current balance and sort by points
        const branches = Object.values(branchSummary).map((branch: any) => ({
            ...branch,
            current_balance: branch.total_points_earned - branch.total_points_redeemed
        })).sort((a, b) => b.current_balance - a.current_balance);

        return json({ 
            success: true,
            branches,
            total_branches: branches.length 
        });

    } catch (err) {
        console.error('Error fetching customer branches:', err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

// ======================================
// File: src/routes/api/customer/[customerId]/branches/[branchId]/transactions/+server.ts  
// GET /api/customer/[customerId]/branches/[branchId]/transactions
// Returns detailed transactions for specific customer at specific branch

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/supabase';

export const GET: RequestHandler = async ({ params, url }) => {
    const { customerId, branchId } = params;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    if (!customerId || !branchId) {
        return json({ error: 'Customer ID and Branch ID are required' }, { status: 400 });
    }

    try {
        // Get transactions for specific customer at specific branch
        const { data, error, count } = await supabase
            .from('customer_transactions')
            .select(`
                id,
                transaction_date,
                bill_no,
                bill_date,
                bill_amount,
                points_earned,
                points_redeemed,
                transaction_type,
                notes,
                status,
                branches (
                    name,
                    name_en,
                    name_ar,
                    address
                )
            `, { count: 'exact' })
            .eq('customer_id', customerId)
            .eq('branch_id', branchId)
            .eq('status', 'completed')
            .order('transaction_date', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return json({ error: error.message }, { status: 500 });
        }

        // Calculate totals for this branch
        const totals = data?.reduce((acc, transaction) => ({
            total_points_earned: acc.total_points_earned + (transaction.points_earned || 0),
            total_points_redeemed: acc.total_points_redeemed + (transaction.points_redeemed || 0),
            total_spent: acc.total_spent + parseFloat(transaction.bill_amount || '0')
        }), { 
            total_points_earned: 0, 
            total_points_redeemed: 0, 
            total_spent: 0 
        }) || { total_points_earned: 0, total_points_redeemed: 0, total_spent: 0 };

        return json({
            success: true,
            transactions: data,
            pagination: {
                total: count || 0,
                limit,
                offset,
                has_more: (count || 0) > offset + limit
            },
            summary: {
                ...totals,
                current_balance: totals.total_points_earned - totals.total_points_redeemed,
                branch_info: data?.[0]?.branches || null
            }
        });

    } catch (err) {
        console.error('Error fetching branch transactions:', err);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
};

// ======================================
// FRONTEND SVELTE COMPONENT EXAMPLE
// ======================================

/*
<!-- File: src/routes/customer/[customerId]/points/+page.svelte -->
<script lang="ts">
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    
    const customerId = $page.params.customerId;
    
    let branches = [];
    let selectedBranch = null;
    let branchTransactions = [];
    let loading = false;
    let error = '';
    
    // Load customer's branches on component mount
    onMount(async () => {
        await loadCustomerBranches();
    });
    
    async function loadCustomerBranches() {
        loading = true;
        try {
            const response = await fetch(`/api/customer/${customerId}/branches`);
            const result = await response.json();
            
            if (result.success) {
                branches = result.branches;
            } else {
                error = result.error || 'Failed to load branches';
            }
        } catch (err) {
            error = 'Network error loading branches';
        }
        loading = false;
    }
    
    async function selectBranch(branch) {
        selectedBranch = branch;
        loading = true;
        try {
            const response = await fetch(`/api/customer/${customerId}/branches/${branch.branch_id}/transactions`);
            const result = await response.json();
            
            if (result.success) {
                branchTransactions = result.transactions;
            } else {
                error = result.error || 'Failed to load transactions';
            }
        } catch (err) {
            error = 'Network error loading transactions';
        }
        loading = false;
    }
    
    function backToBranches() {
        selectedBranch = null;
        branchTransactions = [];
    }
</script>

{#if loading}
    <div class="loading">Loading...</div>
{:else if error}
    <div class="error">Error: {error}</div>
{:else if selectedBranch}
    <!-- Branch Detail View -->
    <div class="branch-detail">
        <button on:click={backToBranches} class="back-btn">← Back to Branches</button>
        
        <h2>{selectedBranch.branch_info.name}</h2>
        <div class="points-summary">
            <div class="stat">
                <h3>Current Points</h3>
                <p class="points">{selectedBranch.current_balance}</p>
            </div>
            <div class="stat">
                <h3>Total Earned</h3>
                <p>{selectedBranch.total_points_earned}</p>
            </div>
            <div class="stat">
                <h3>Total Spent</h3>
                <p>${selectedBranch.total_spent.toFixed(2)}</p>
            </div>
        </div>
        
        <h3>Transaction History</h3>
        <div class="transactions">
            {#each branchTransactions as transaction}
                <div class="transaction">
                    <div class="transaction-date">{new Date(transaction.transaction_date).toLocaleDateString()}</div>
                    <div class="transaction-details">
                        <div>Bill #{transaction.bill_no}</div>
                        <div>Amount: ${transaction.bill_amount}</div>
                        <div>Points: +{transaction.points_earned}</div>
                    </div>
                </div>
            {/each}
        </div>
    </div>
{:else}
    <!-- Branch Selection View -->
    <div class="branches-list">
        <h1>Your Points by Branch</h1>
        
        {#each branches as branch}
            <div class="branch-card" on:click={() => selectBranch(branch)}>
                <div class="branch-info">
                    <h3>{branch.branch_info.name}</h3>
                    <p>{branch.branch_info.address}</p>
                </div>
                <div class="branch-stats">
                    <div class="current-points">{branch.current_balance} points</div>
                    <div class="visit-count">{branch.transaction_count} visits</div>
                    <div class="last-visit">Last: {new Date(branch.last_visit).toLocaleDateString()}</div>
                </div>
            </div>
        {/each}
    </div>
{/if}

<style>
    .branch-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .branch-card:hover {
        background-color: #f5f5f5;
    }
    
    .current-points {
        font-size: 1.2rem;
        font-weight: bold;
        color: #2563eb;
    }
    
    .points-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin: 1rem 0;
    }
    
    .stat {
        text-align: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;
    }
    
    .transaction {
        border-bottom: 1px solid #eee;
        padding: 0.5rem 0;
        display: flex;
        justify-content: space-between;
    }
    
    .loading, .error {
        text-align: center;
        padding: 2rem;
    }
    
    .error {
        color: #dc3545;
    }
</style>
*/
