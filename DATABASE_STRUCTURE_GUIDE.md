# 📊 Urban Market Loyalty System - Database Table Structures

## 🎯 Required Tables for Upload System

### 1. **customer_transactions** (Main Transaction Table)
```sql
CREATE TABLE customer_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id TEXT,
    bill_no TEXT,                    -- ✅ REQUIRED: Invoice/Receipt number
    bill_date DATE,                  -- ✅ REQUIRED: Transaction date (YYYY-MM-DD)
    bill_amount DECIMAL(15,2),       -- ✅ REQUIRED: Total purchase amount
    customer_id UUID,                -- Auto-filled (NULL for unregistered)
    customer_code TEXT,              -- ✅ REQUIRED: Mobile number
    customer_mobile TEXT,            -- ✅ REQUIRED: Mobile number
    card_number TEXT,                -- Optional
    branch_id UUID,                  -- ✅ REQUIRED: Selected branch
    transaction_type TEXT DEFAULT 'purchase',
    payment_method TEXT,             -- Optional
    amount DECIMAL(15,2),            -- Same as bill_amount
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    points_earned INTEGER DEFAULT 0, -- ✅ From Excel: "Points to Add"
    points_used INTEGER DEFAULT 0,   -- ✅ From Excel: "Points to Redeem"
    points_redeemed INTEGER DEFAULT 0,
    add_amt INTEGER DEFAULT 0,       -- Same as points_earned
    redeem INTEGER DEFAULT 0,        -- Same as points_used
    balance_after INTEGER DEFAULT 0, -- Calculated: current + earned - used
    receipt_number TEXT,
    receipt_url TEXT,
    notes TEXT,
    cashier_id TEXT,
    processed_by UUID,
    uploaded_by UUID,
    transaction_date TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP DEFAULT NOW(),
    upload_batch_id UUID,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **customers** (Registered Customers)
```sql
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name TEXT,
    mobile TEXT,                     -- Used for lookup
    customer_code TEXT,              -- Used for lookup
    points INTEGER DEFAULT 0,
    total_spent DECIMAL(15,2) DEFAULT 0,
    branch_id UUID,
    card_status TEXT DEFAULT 'registered',
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. **customer_numbers** (Eligible Customers)
```sql
CREATE TABLE customer_numbers (
    customer TEXT PRIMARY KEY,       -- Mobile number
    status TEXT DEFAULT 'not_registered',
    branch_id UUID,
    uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **branches** (Available Branches)
```sql
CREATE TABLE branches (
    id UUID PRIMARY KEY,
    name_en TEXT,                    -- Displayed in dropdown
    name_ar TEXT,
    address TEXT,
    phone TEXT
);
```

## 📋 Excel Upload Format

### **Required Columns (Exact Order):**
| Column | Name | Format | Example | Required |
|--------|------|--------|---------|----------|
| A | Bill No | Text | 545439 | ✅ Yes |
| B | Bill Date | YYYY-MM-DD | 2025-07-27 | ✅ Yes |
| C | Bill Amount | Decimal | 27.9 | ✅ Yes |
| D | Customer Mobile | Text | 0500014006 | ✅ Yes |
| E | Points to Add | Integer | 0.28 → 0 | ✅ Yes |
| F | Points to Redeem | Integer | 0 | Optional |

### **Data Processing Rules:**
1. **Mobile Numbers**: `0500014006` → `500014006` (auto-normalized)
2. **Unknown Customers**: Automatically added to `customer_numbers` table
3. **Points Calculation**: `balance_after = current_points + points_earned - points_used`
4. **Customer Lookup**: First by `mobile`, then by `customer_code`

## 🔧 Upload Process Flow

1. **Parse Excel** → Extract 6 columns
2. **Validate Mobile** → Accept both `5xxxxxxxx` and `05xxxxxxxx`
3. **Customer Lookup** → Check `customers` table
4. **Eligibility Check** → Check `customer_numbers` table  
5. **Auto-Add** → Add new customers to `customer_numbers`
6. **Insert Transaction** → Add to `customer_transactions`
7. **Update Points** → Update registered customers' points

## ✅ Current Status
- **Database Tables**: ✅ All accessible
- **Excel Format**: ✅ Updated with real examples
- **Auto-Add**: ✅ Working
- **Mobile Validation**: ✅ Both formats supported
- **Progress Tracking**: ✅ Enhanced with statistics

## 🎯 Sample Data (Your Format)
```
545439  | 2025-07-27 | 27.9   | 0500014006 | 0.28 | 0
555741  | 2025-08-04 | 284.86 | 0500014006 | 2.85 | 0
479569  | 2025-05-30 | 21.24  | 0500019376 | 0.11 | 0
```

This matches your Excel file perfectly! 🎉
