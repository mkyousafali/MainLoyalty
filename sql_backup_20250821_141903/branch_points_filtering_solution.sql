-- ======================================
-- BRANCH POINTS FILTERING SOLUTION
-- ======================================
-- Solutions for filtering customer points by branch when there's no automatic assignment

-- ======================================
-- 1. GET CUSTOMER POINTS BY SPECIFIC BRANCH
-- ======================================
-- This query shows all points earned/redeemed at a specific branch for a customer
-- Usage: Replace customer_id and branch_id with actual values

-- Example: Get all points for customer at specific branch
SELECT 
    ct.transaction_date,
    ct.bill_no,
    ct.bill_amount,
    ct.points_earned,
    ct.points_redeemed,
    ct.points_earned - ct.points_redeemed as net_points,
    b.name as branch_name,
    b.name_en as branch_name_en,
    b.name_ar as branch_name_ar
FROM customer_transactions ct
JOIN branches b ON ct.branch_id = b.id
WHERE ct.customer_id = 'CUSTOMER_UUID_HERE'
  AND ct.branch_id = 'BRANCH_UUID_HERE'
  AND ct.status = 'completed'
ORDER BY ct.transaction_date DESC;

-- ======================================
-- 2. GET TOTAL POINTS SUMMARY BY BRANCH FOR A CUSTOMER
-- ======================================
-- This gives totals per branch for a customer

SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.name_en as branch_name_en,
    b.name_ar as branch_name_ar,
    COUNT(ct.id) as total_transactions,
    SUM(ct.points_earned) as total_points_earned,
    SUM(ct.points_redeemed) as total_points_redeemed,
    SUM(ct.points_earned) - SUM(ct.points_redeemed) as net_points,
    SUM(ct.bill_amount) as total_spent,
    MAX(ct.transaction_date) as last_transaction_date
FROM customer_transactions ct
JOIN branches b ON ct.branch_id = b.id
WHERE ct.customer_id = 'CUSTOMER_UUID_HERE'
  AND ct.status = 'completed'
GROUP BY b.id, b.name, b.name_en, b.name_ar
ORDER BY net_points DESC;

-- ======================================
-- 3. GET ALL CUSTOMER'S TRANSACTIONS WITH BRANCH INFO
-- ======================================
-- This shows everything for customer with branch details

SELECT 
    ct.transaction_date,
    ct.bill_no,
    ct.bill_date,
    ct.bill_amount,
    ct.points_earned,
    ct.points_redeemed,
    ct.transaction_type,
    ct.notes,
    b.id as branch_id,
    b.name as branch_name,
    b.name_en as branch_name_en,
    b.name_ar as branch_name_ar,
    b.address as branch_address
FROM customer_transactions ct
LEFT JOIN branches b ON ct.branch_id = b.id
WHERE ct.customer_id = 'CUSTOMER_UUID_HERE'
  AND ct.status = 'completed'
ORDER BY ct.transaction_date DESC;

-- ======================================
-- 4. CUSTOMER POINTS BALANCE PER BRANCH (Current Active Points)
-- ======================================
-- This calculates the current available points at each branch
-- Note: This assumes points are branch-specific, not global

SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.name_en as branch_name_en,
    b.name_ar as branch_name_ar,
    COALESCE(SUM(ct.points_earned), 0) - COALESCE(SUM(ct.points_redeemed), 0) as current_points_balance,
    COUNT(ct.id) as transaction_count,
    MAX(ct.transaction_date) as last_visit
FROM branches b
LEFT JOIN customer_transactions ct ON b.id = ct.branch_id 
    AND ct.customer_id = 'CUSTOMER_UUID_HERE'
    AND ct.status = 'completed'
WHERE b.is_active = true
GROUP BY b.id, b.name, b.name_en, b.name_ar
HAVING COUNT(ct.id) > 0  -- Only show branches where customer has transactions
ORDER BY current_points_balance DESC;

-- ======================================
-- 5. BRANCH SELECTION WITH POINTS PREVIEW
-- ======================================
-- This query helps customers choose which branch to view
-- Shows branches they've visited with basic stats

SELECT 
    b.id as branch_id,
    b.name as branch_name,
    b.name_en as branch_name_en,
    b.name_ar as branch_name_ar,
    b.address,
    b.phone,
    COUNT(ct.id) as visit_count,
    SUM(ct.points_earned) as total_points_earned,
    SUM(ct.bill_amount) as total_spent,
    MIN(ct.transaction_date) as first_visit,
    MAX(ct.transaction_date) as last_visit
FROM branches b
INNER JOIN customer_transactions ct ON b.id = ct.branch_id
WHERE ct.customer_id = 'CUSTOMER_UUID_HERE'
  AND ct.status = 'completed'
  AND b.is_active = true
GROUP BY b.id, b.name, b.name_en, b.name_ar, b.address, b.phone
ORDER BY total_points_earned DESC;

-- ======================================
-- 6. FRONTEND IMPLEMENTATION SUGGESTIONS
-- ======================================

-- For SvelteKit frontend, create these functions:

/*
// Get customer's branches with points
async function getCustomerBranches(customerId: string) {
    const { data, error } = await supabase
        .rpc('get_customer_branches_with_points', { customer_uuid: customerId });
    return { data, error };
}

// Get transactions for specific branch
async function getCustomerBranchTransactions(customerId: string, branchId: string) {
    const { data, error } = await supabase
        .from('customer_transactions')
        .select(`
            *,
            branches (
                name,
                name_en, 
                name_ar,
                address
            )
        `)
        .eq('customer_id', customerId)
        .eq('branch_id', branchId)
        .eq('status', 'completed')
        .order('transaction_date', { ascending: false });
    
    return { data, error };
}

// Get points summary by branch
async function getCustomerPointsSummary(customerId: string) {
    const { data, error } = await supabase
        .from('customer_transactions')
        .select(`
            branch_id,
            points_earned,
            points_redeemed,
            bill_amount,
            transaction_date,
            branches (
                name,
                name_en,
                name_ar
            )
        `)
        .eq('customer_id', customerId)
        .eq('status', 'completed');
    
    // Process data to group by branch
    const branchSummary = {};
    data?.forEach(transaction => {
        const branchId = transaction.branch_id;
        if (!branchSummary[branchId]) {
            branchSummary[branchId] = {
                branch: transaction.branches,
                totalEarned: 0,
                totalRedeemed: 0,
                totalSpent: 0,
                transactionCount: 0
            };
        }
        branchSummary[branchId].totalEarned += transaction.points_earned;
        branchSummary[branchId].totalRedeemed += transaction.points_redeemed;
        branchSummary[branchId].totalSpent += transaction.bill_amount;
        branchSummary[branchId].transactionCount++;
    });
    
    return Object.values(branchSummary);
}
*/

-- ======================================
-- 7. DATABASE FUNCTIONS (Optional - for better performance)
-- ======================================

-- Create a database function for customer branch points
CREATE OR REPLACE FUNCTION get_customer_branches_with_points(customer_uuid UUID)
RETURNS TABLE (
    branch_id UUID,
    branch_name TEXT,
    branch_name_en TEXT,
    branch_name_ar TEXT,
    branch_address TEXT,
    total_points_earned BIGINT,
    total_points_redeemed BIGINT,
    current_balance BIGINT,
    total_spent DECIMAL(15,2),
    transaction_count BIGINT,
    first_visit TIMESTAMP,
    last_visit TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.name_en,
        b.name_ar,
        b.address,
        COALESCE(SUM(ct.points_earned), 0)::BIGINT,
        COALESCE(SUM(ct.points_redeemed), 0)::BIGINT,
        (COALESCE(SUM(ct.points_earned), 0) - COALESCE(SUM(ct.points_redeemed), 0))::BIGINT,
        COALESCE(SUM(ct.bill_amount), 0),
        COUNT(ct.id),
        MIN(ct.transaction_date),
        MAX(ct.transaction_date)
    FROM branches b
    INNER JOIN customer_transactions ct ON b.id = ct.branch_id
    WHERE ct.customer_id = customer_uuid
      AND ct.status = 'completed'
      AND b.is_active = true
    GROUP BY b.id, b.name, b.name_en, b.name_ar, b.address
    ORDER BY (COALESCE(SUM(ct.points_earned), 0) - COALESCE(SUM(ct.points_redeemed), 0)) DESC;
END;
$$ LANGUAGE plpgsql;

-- ======================================
-- 8. UI/UX SUGGESTIONS
-- ======================================

/*
Frontend Flow Suggestion:

1. Customer Login → Show Total Points Across All Branches

2. "View by Branch" Button → Shows list of branches they've visited with:
   - Branch name
   - Points earned at that branch  
   - Total spent at that branch
   - Last visit date

3. Customer Clicks Specific Branch → Shows detailed view:
   - Current points balance at that branch
   - Transaction history at that branch
   - Points earned/redeemed timeline
   - Option to redeem points (if applicable)

4. Branch Comparison View:
   - Side-by-side comparison of points at different branches
   - Charts showing spending patterns by branch
   - Favorite branch identification
*/
