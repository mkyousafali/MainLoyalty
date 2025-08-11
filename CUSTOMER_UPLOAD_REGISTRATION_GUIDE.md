# 📋 Customer Upload & Registration Flow Guide

## Overview
The Urban Market Loyalty System uses a two-step process for customer management:
1. **Admin Upload**: Eligible customer numbers are uploaded via Excel/CSV
2. **Customer Registration**: Customers register themselves using their mobile numbers

## 🔄 Complete Flow

### Step 1: Admin Uploads Customer Numbers
1. Admin goes to `/admin/upload-customers`
2. Selects "Eligibility Upload" mode
3. Uploads Excel/CSV file with mobile numbers
4. Numbers are stored in `customer_numbers` table with status `not_registered`

### Step 2: Customer Self-Registration
1. Customer visits `/login` page
2. Enters mobile number
3. System checks:
   - ✅ First: Is customer already registered in `customers` table?
   - ✅ Then: Is customer eligible in `customer_numbers` table?
4. If eligible but not registered → proceed to registration form
5. Customer completes registration details
6. System creates record in `customers` table
7. Updates `customer_numbers` status to `registered`

## 📊 Database Tables

### `customer_numbers` (Eligibility List)
```sql
- id: UUID (primary key)
- customer: VARCHAR(10) (mobile number, unique)
- status: TEXT ('not_registered' | 'registered')
- uploaded_at: TIMESTAMP
- branch_id: INTEGER (foreign key to branches)
- uploaded_by: UUID (admin who uploaded)
```

### `customers` (Registered Customers)
```sql
- id: UUID (primary key)
- customer_code: TEXT (mobile number)
- card_number: TEXT (same as mobile)
- full_name: TEXT
- mobile: TEXT
- phone: TEXT
- email: TEXT (optional)
- address: TEXT
- place: TEXT
- nearest_branch_id: INTEGER
- card_type_id: INTEGER (optional)
- valid_until: TIMESTAMP
- is_active: BOOLEAN
- registration_date: TIMESTAMP
```

## 🎯 Upload Modes

### 1. Eligibility Upload
- **Purpose**: Upload mobile numbers for future registration
- **Data**: Only mobile numbers (10 digits starting with 5)
- **Table**: `customer_numbers`
- **Status**: `not_registered`

### 2. Full Registration Upload
- **Purpose**: Bulk register customers with complete data
- **Data**: mobile, full_name, address, branch_id, email (optional)
- **Table**: `customers` (directly)
- **Status**: Fully registered and active

## 📝 File Formats

### Eligibility Upload CSV
```csv
mobile
5012345678
5023456789
5034567890
```

### Full Registration CSV
```csv
mobile,full_name,address,branch_id,email
5012345678,Ahmed Al-Rashid,Riyadh Al-Malaz,1,ahmed@example.com
5023456789,Fatima Al-Zahra,Jeddah Al-Balad,2,fatima@example.com
```

## 🔧 Technical Implementation

### Login Page Logic (`/login`)
```typescript
1. User enters mobile number
2. Check if already registered:
   - Query: SELECT * FROM customers WHERE customer_code = mobile
   - If found with full_name → redirect to dashboard
3. Check eligibility:
   - Query: SELECT * FROM customer_numbers WHERE customer = mobile
   - If not found → show "not eligible" error
   - If found with status 'not_registered' → show registration form
4. Complete registration:
   - Insert into customers table
   - Update customer_numbers status to 'registered'
```

### Upload Page Logic (`/admin/upload-customers`)
```typescript
1. Admin selects upload mode (eligibility or full)
2. Uploads Excel/CSV file
3. Parse and validate data
4. For eligibility mode:
   - Insert into customer_numbers table
5. For full mode:
   - Insert directly into customers table
```

## 🐛 Common Issues & Solutions

### Issue 1: Customer can't register
**Problem**: Mobile number not in eligibility list
**Solution**: Admin must upload the number via eligibility upload first

### Issue 2: Upload fails
**Problem**: Invalid mobile number format
**Solution**: Ensure numbers are exactly 10 digits starting with 5

### Issue 3: Duplicate registration
**Problem**: Customer tries to register again
**Solution**: System checks existing registration and redirects to dashboard

### Issue 4: Missing branch
**Problem**: Invalid branch_id in upload
**Solution**: Use valid branch IDs (1, 2, 3, etc.) that exist in branches table

## 📊 Status Tracking

### Customer Number Statuses
- `not_registered`: Number uploaded but customer hasn't registered yet
- `registered`: Customer has completed registration

### Customer Statuses  
- `is_active: true`: Customer account is active
- `is_active: false`: Customer account is disabled

## 🔐 Security Considerations

1. **Mobile Number Validation**: Must be exactly 10 digits starting with 5
2. **Branch Validation**: Must reference existing branch
3. **Duplicate Prevention**: Unique constraints on mobile numbers
4. **Admin Access**: Only admins can upload customer numbers

## 📈 Monitoring & Analytics

### Upload History
- Track all uploads in `customer_upload_logs` table
- Monitor success/error rates
- View recent upload history in admin panel

### Registration Analytics
- Count eligible vs registered customers
- Track registration completion rates
- Monitor daily/monthly registrations

## 🛠️ Maintenance Tasks

### Regular Cleanup
```sql
-- Find eligible customers who haven't registered (>30 days)
SELECT customer, uploaded_at 
FROM customer_numbers 
WHERE status = 'not_registered' 
AND uploaded_at < NOW() - INTERVAL '30 days';

-- Count registration completion rate
SELECT 
  COUNT(*) as total_eligible,
  COUNT(CASE WHEN status = 'registered' THEN 1 END) as registered,
  ROUND(COUNT(CASE WHEN status = 'registered' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM customer_numbers;
```

## 🚀 Setup Instructions

1. **Run Database Migration**:
   ```sql
   -- Execute: db/add_customer_numbers_table.sql
   ```

2. **Test Upload Flow**:
   - Go to `/admin/upload-customers`
   - Upload sample eligibility file
   - Verify numbers appear in customer_numbers table

3. **Test Registration Flow**:
   - Go to `/login`
   - Enter uploaded mobile number
   - Complete registration form
   - Verify customer appears in customers table
   - Verify customer_numbers status updates to 'registered'

## 📞 Support

For technical issues with the upload/registration system:
1. Check database table exists: `customer_numbers`
2. Verify mobile number format: 10 digits starting with 5
3. Confirm branch_id exists in branches table
4. Check Supabase connection and permissions
