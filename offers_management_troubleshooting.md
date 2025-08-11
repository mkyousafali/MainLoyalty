# OFFERS MANAGEMENT TROUBLESHOOTING GUIDE

## Issue: "Create New Offer" Button Not Working + 404 Error

### STEP 1: Check Database Setup
Run this in Supabase SQL Editor:
```sql
-- Copy and paste: test_offers_setup.sql
```

### STEP 2: Create Offers Table (if missing)
If Step 1 shows "OFFERS TABLE MISSING", run:
```sql
-- Copy and paste: create_offers_table_proper.sql
```

### STEP 3: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to Console tab
3. Navigate to /admin/offers-management
4. Look for errors (red text)
5. Click "Create New Offer" button
6. Check for new errors

### STEP 4: Check Network Tab
1. In Developer Tools, go to Network tab
2. Click "Create New Offer" button
3. Look for failed requests (red entries)
4. Check if any requests return 404

### STEP 5: Test Modal Functionality
The button should:
1. Log "Opening create modal..." in console
2. Log "Modal state set to: true" in console
3. Show the modal popup
4. NOT navigate to another page

### STEP 6: Common Issues & Solutions

#### Issue: 404 Error on Button Click
**Cause**: Button might be trying to navigate instead of opening modal
**Solution**: Buttons now have `type="button"` and `on:click|preventDefault`

#### Issue: Modal Doesn't Open
**Cause**: JavaScript error preventing modal state change
**Solution**: Check console for errors, ensure all functions are defined

#### Issue: Database Connection Error
**Cause**: Supabase client not configured properly
**Solution**: Check `.env` file and supabase.ts configuration

#### Issue: RLS (Row Level Security) Blocking Inserts
**Cause**: Database has RLS enabled without proper policies
**Solution**: Run `ALTER TABLE offers DISABLE ROW LEVEL SECURITY;`

### STEP 7: Manual Test
Try this in browser console while on offers-management page:
```javascript
// Test if modal function exists
console.log(typeof openCreateModal);

// Test if Supabase is working
console.log(window.supabase || 'Supabase not found');
```

### STEP 8: Expected Behavior
1. Click "Create New Offer" → Modal opens immediately
2. Fill form → No page navigation
3. Submit → Creates offer and closes modal
4. List refreshes automatically

### Debug Commands Added:
- `console.log('Opening create modal...')` - When button clicked
- `console.log('Modal state set to:', showCreateModal)` - Modal state
- `console.log('Create new offer called with data:')` - Form submission
- `console.log('Offer created successfully:')` - Success confirmation

### Quick Fix Commands:
```bash
# If you need to restart the dev server
cd d:\MainLoyalty\frontend\svelte
npm run dev
```

---
**Next Steps**: Run the test script and check browser console for specific error messages.
