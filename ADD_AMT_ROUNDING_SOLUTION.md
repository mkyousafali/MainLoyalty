# SOLUTION: add_amt Column Rounding Issue

## Problem Identified
The issue is specifically with the `add_amt` column in your `customer_transactions` table. The Excel values are being rounded because:

1. **Database Schema Issue**: `add_amt` column is defined as `INTEGER` in Supabase
2. **Frontend Parsing Issue**: Using `parseInt()` instead of `parseFloat()` for decimal values

## What's Happening
- Excel value: `0.28` → `parseInt()` converts to `0` → `INTEGER` column stores `0`
- Excel value: `2.85` → `parseInt()` converts to `2` → `INTEGER` column stores `2`  
- Excel value: `0.11` → `parseInt()` converts to `0` → `INTEGER` column stores `0`
- Excel value: `1.53` → `parseInt()` converts to `1` → `INTEGER` column stores `1`
- Excel value: `0.94` → `parseInt()` converts to `0` → `INTEGER` column stores `0`

## Fix Applied

### 1. Database Schema Fix (Run in Supabase SQL Editor)
```sql
-- Change add_amt from INTEGER to DECIMAL(15,3)
ALTER TABLE customer_transactions 
ALTER COLUMN add_amt TYPE DECIMAL(15,3);

-- Also fix redeem column 
ALTER TABLE customer_transactions 
ALTER COLUMN redeem TYPE DECIMAL(15,3);
```

### 2. Frontend Code Fix (Already Applied)
Changed from `parseInt()` to `parseFloat()` in upload processing:

**Before (Wrong):**
```javascript
add_amt: parseInt(row[4]?.toString().trim() || '0'),  // Rounds 0.28 to 0
redeem: parseInt(row[5]?.toString().trim() || '0'),   // Rounds 2.85 to 2
```

**After (Correct):**
```javascript
add_amt: parseFloat(row[4]?.toString().trim() || '0'),  // Preserves 0.28
redeem: parseFloat(row[5]?.toString().trim() || '0'),   // Preserves 2.85
```

## Files Modified
- `d:\MainLoyalty\fix_add_amt_column.sql` - Database migration script
- `d:\MainLoyalty\frontend\svelte\src\routes\admin\upload-transactions\+page.svelte` - Frontend fixes
- `d:\MainLoyalty\fix_decimal_precision_complete.sql` - Complete migration script

## Testing Steps

1. **Execute Database Migration:**
   - Open Supabase SQL Editor
   - Run the `fix_add_amt_column.sql` script

2. **Test Excel Upload:**
   Create a test Excel with these exact values:
   ```
   Bill No | Bill Date  | Bill Amount | Customer Mobile | Points to Add | Points to Redeem
   TEST001 | 2025-08-09 | 27.9       | 0548357066     | 0.28         | 0
   TEST002 | 2025-08-09 | 284.86     | 0548357066     | 2.85         | 0
   TEST003 | 2025-08-09 | 21.24      | 0548357066     | 0.11         | 0
   ```

3. **Verify Results:**
   Check that `add_amt` values in database show as `0.280`, `2.850`, `0.110` instead of `0`, `3`, `0`.

## Expected Result After Fix
- ✅ Excel value `0.28` → Database stores `0.280`
- ✅ Excel value `2.85` → Database stores `2.850`
- ✅ Excel value `0.11` → Database stores `0.110`
- ✅ Excel value `1.53` → Database stores `1.530`
- ✅ Excel value `0.94` → Database stores `0.940`

## Why This Specific Column?
Your Excel file structure is:
- Column C (index 2): Bill Amount → Works fine (uses parseFloat)
- **Column E (index 4): Points to Add → This maps to add_amt column** ⚠️
- Column F (index 5): Points to Redeem → This maps to redeem column ⚠️

The `add_amt` column is where your decimal values from "Points to Add" are being stored and rounded.
