# Database Column Naming Reference

This document provides a comprehensive reference for all database table columns to prevent naming mismatches and ensure consistency across the application..

## Naming Conventions

- **Database Columns**: `snake_case` (e.g., `created_at`, `fuel_product_id`)
- **Drizzle Schema**: `camelCase` (e.g., `createdAt`, `fuelProductId`)
- **API Responses**: `snake_case` (matches database)
- **Frontend State**: `camelCase` (matches Drizzle schema)

## Core Tables

### `users`
- `id` (uuid, PRIMARY KEY)
- `email` (text, NOT NULL)
- `password_hash` (text, NOT NULL)
- `full_name` (text)
- `username` (text)
- `created_at` (timestamp, DEFAULT now())

### `credit_customers`
- `id` (uuid, PRIMARY KEY)
- `organization_name` (text, NOT NULL)
- `contact_person` (text)
- `phone_number` (text)
- `mobile_number` (text)
- `email` (text)
- `address` (text)
- `gst_number` (text)
- `pan_number` (text)
- `credit_limit` (numeric, DEFAULT 0)
- `current_balance` (numeric, DEFAULT 0)
- `last_payment_date` (date)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())

### `fuel_products`
- `id` (uuid, PRIMARY KEY)
- `product_name` (text, NOT NULL)
- `product_code` (text)
- `short_name` (text, NOT NULL, DEFAULT '')
- `current_rate` (numeric)
- `gst_percentage` (numeric)
- `tds_percentage` (numeric)
- `wgt_percentage` (numeric)
- `lfrn` (text, NOT NULL, DEFAULT '')
- `unit` (text, DEFAULT 'Liters')
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())

### `tanks`
- `id` (uuid, PRIMARY KEY)
- `tank_number` (text, NOT NULL)
- `fuel_product_id` (uuid, FK to fuel_products.id)
- `capacity` (numeric)
- `current_stock` (numeric)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())

### `nozzles`
- `id` (uuid, PRIMARY KEY)
- `nozzle_number` (text, NOT NULL)
- `tank_id` (uuid, FK to tanks.id)
- `fuel_product_id` (uuid, FK to fuel_products.id)
- `pump_station` (text)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())

## Sales Tables

### `guest_sales`
- `id` (uuid, PRIMARY KEY)
- `sale_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `mobile_number` (text)
- `vehicle_number` (text)
- `fuel_product_id` (uuid, NOT NULL, FK to fuel_products.id)
- `nozzle_id` (uuid, FK to nozzles.id)
- `quantity` (numeric, NOT NULL)
- `price_per_unit` (numeric, NOT NULL)
- `discount` (numeric, DEFAULT 0)
- `payment_mode` (text)
- `total_amount` (numeric)
- `customer_name` (text)
- `offer_type` (text)
- `gst_tin` (text)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

### `credit_sales`
- `id` (uuid, PRIMARY KEY)
- `sale_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `credit_customer_id` (uuid, NOT NULL, FK to credit_customers.id)
- `fuel_product_id` (uuid, NOT NULL, FK to fuel_products.id)
- `vehicle_number` (text)
- `quantity` (numeric, NOT NULL)
- `price_per_unit` (numeric, NOT NULL)
- `discount` (numeric, DEFAULT 0)
- `total_amount` (numeric)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

### `lub_sales`
- `id` (uuid, PRIMARY KEY)
- `sale_date` (date, NOT NULL)
- `shift` (text)
- `employee_id` (uuid, FK to employees.id)
- `product` (text)
- `sale_rate` (numeric)
- `quantity` (numeric)
- `discount` (numeric)
- `amount` (numeric)
- `description` (text)
- `sale_type` (text)
- `gst` (jsonb)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

## Financial Tables

### `recoveries`
- `id` (uuid, PRIMARY KEY)
- `recovery_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `credit_customer_id` (uuid, NOT NULL, FK to credit_customers.id)
- `received_amount` (numeric, NOT NULL) ⚠️ **NOT `amount`**
- `discount` (numeric, DEFAULT 0)
- `payment_mode` (text)
- `notes` (text)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

### `expenses`
- `id` (uuid, PRIMARY KEY)
- `expense_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `expense_type_id` (uuid, FK to expense_types.id) ⚠️ **NOT `vendor_id`**
- `flow_type` (text)
- `payment_mode` (text)
- `amount` (numeric, NOT NULL)
- `description` (text)
- `employee_id` (uuid, FK to employees.id)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

### `expense_types`
- `id` (uuid, PRIMARY KEY)
- `expense_type_name` (text, NOT NULL) ⚠️ **NOT `exp_name`**
- `effect_for` (text)
- `options` (text)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())

## Employee Tables

### `employees`
- `id` (uuid, PRIMARY KEY)
- `employee_name` (text, NOT NULL)
- `designation` (text)
- `phone_number` (text)
- `mobile_number` (text)
- `address` (text)
- `salary` (numeric)
- `joining_date` (date)
- `join_date` (date)
- `employee_number` (text)
- `phone_no` (text)
- `id_proof_no` (text)
- `salary_type` (text)
- `has_pf` (boolean, DEFAULT false)
- `has_esi` (boolean, DEFAULT false)
- `has_income_tax` (boolean, DEFAULT false)
- `description` (text)
- `image_url` (text)
- `is_active` (boolean, DEFAULT true)
- `status` (text, DEFAULT 'Active')
- `created_at` (timestamp, DEFAULT now())

## Vendor Tables

### `vendors`
- `id` (uuid, PRIMARY KEY)
- `vendor_name` (text, NOT NULL)
- `vendor_type` (text)
- `contact_person` (text)
- `phone_number` (text)
- `mobile_number` (text)
- `email` (text)
- `address` (text)
- `gst_number` (text)
- `pan_number` (text)
- `opening_balance` (numeric)
- `current_balance` (numeric)
- `opening_date` (date)
- `opening_type` (text)
- `description` (text)
- `is_active` (boolean, DEFAULT true)
- `created_at` (timestamp, DEFAULT now())
- `updated_at` (timestamp, DEFAULT now())

### `vendor_transactions`
- `id` (uuid, PRIMARY KEY)
- `transaction_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `vendor_id` (uuid, NOT NULL, FK to vendors.id)
- `transaction_type` (text)
- `amount` (numeric, NOT NULL)
- `payment_mode` (text)
- `description` (text)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

## Inventory Tables

### `opening_stock`
- `id` (uuid, PRIMARY KEY)
- `product` (text, NOT NULL)
- `unit` (text)
- `opening_stock` (numeric)
- `created_at` (timestamp, DEFAULT now())

### `daily_sale_rates`
- `id` (uuid, PRIMARY KEY)
- `rate_date` (date, NOT NULL)
- `fuel_product_id` (uuid, NOT NULL, FK to fuel_products.id)
- `open_rate` (numeric)
- `close_rate` (numeric)
- `variation_amount` (numeric)
- `created_at` (timestamp, DEFAULT now())

### `denominations`
- `id` (uuid, PRIMARY KEY)
- `denomination_value` (numeric, NOT NULL)
- `count` (integer, NOT NULL)
- `total_amount` (numeric, NOT NULL)
- `date` (date, NOT NULL)
- `created_at` (timestamp, DEFAULT now())

## Operations Tables

### `tank_transfers`
- `id` (uuid, PRIMARY KEY)
- `transfer_date` (date, NOT NULL)
- `from_tank_id` (uuid, FK to tanks.id)
- `to_tank_id` (uuid, FK to tanks.id)
- `amount` (numeric, NOT NULL)
- `created_at` (timestamp, DEFAULT now())

### `tank_dips`
- `id` (uuid, PRIMARY KEY)
- `tank_id` (uuid, FK to tanks.id)
- `dip_value` (numeric, NOT NULL)
- `dip_date` (date, NOT NULL)
- `created_at` (timestamp, DEFAULT now())

### `sale_entries`
- `id` (uuid, PRIMARY KEY)
- `sale_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `shift_id` (uuid, FK to duty_shifts.id)
- `pump_station` (text)
- `nozzle_id` (uuid, FK to nozzles.id)
- `fuel_product_id` (uuid, FK to fuel_products.id)
- `opening_reading` (numeric)
- `closing_reading` (numeric)
- `quantity` (numeric)
- `price_per_unit` (numeric)
- `net_sale_amount` (numeric)
- `employee_id` (uuid, FK to employees.id)
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

## Common Column Patterns

### Standard Columns (Most Tables)
- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `created_at` (timestamp, DEFAULT now())
- `created_by` (uuid, FK to users.id)

### Status Columns
- `is_active` (boolean, DEFAULT true)
- `status` (text, DEFAULT 'Active')

### Amount Columns
- `amount` (numeric, NOT NULL)
- `total_amount` (numeric)
- `discount` (numeric, DEFAULT 0)
- `price_per_unit` (numeric, NOT NULL)

### Date Columns
- `sale_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `recovery_date` (date, NOT NULL, DEFAULT CURRENT_DATE)
- `expense_date` (date, NOT NULL, DEFAULT CURRENT_DATE)

### Foreign Key Columns
- `*_id` (uuid, FK to parent_table.id)
- `fuel_product_id` (uuid, FK to fuel_products.id)
- `credit_customer_id` (uuid, FK to credit_customers.id)
- `employee_id` (uuid, FK to employees.id)
- `vendor_id` (uuid, FK to vendors.id)
- `tank_id` (uuid, FK to tanks.id)
- `nozzle_id` (uuid, FK to nozzles.id)

## Common Mistakes to Avoid

### 1. Column Name Mismatches
❌ **Wrong**: `et.exp_name` (should be `et.expense_type_name`)  
❌ **Wrong**: `e.vendor_id` (should be `e.employee_id`)  
❌ **Wrong**: `NEW.amount` in recovery trigger (should be `NEW.received_amount`)  

✅ **Correct**: Always use exact column names from database schema

### 2. UUID Validation
❌ **Wrong**: Using hardcoded strings like "HSD" as UUIDs  
✅ **Correct**: Use actual UUIDs from database or validate with `isValidUUID()`

### 3. Foreign Key References
❌ **Wrong**: Referencing non-existent columns  
✅ **Correct**: Always verify foreign key column names exist

### 4. Data Type Mismatches
❌ **Wrong**: Sending strings where numeric values expected  
✅ **Correct**: Convert and validate data types before database operations

## API Response Format

All API endpoints should return data in this format:

```json
{
  "ok": true,
  "rows": [
    {
      "id": "uuid",
      "column_name": "value",
      "created_at": "timestamp"
    }
  ]
}
```

Error responses:

```json
{
  "ok": false,
  "error": "Error message"
}
```

## Validation Rules

### UUID Fields
- Must be valid UUID format
- Use `isValidUUID()` helper for validation
- Common UUID fields: `id`, `*_id` columns

### Numeric Fields
- Must be valid numbers
- Use `parseFloat()` or `parseInt()` for conversion
- Common numeric fields: `amount`, `quantity`, `price_per_unit`

### Required Fields
- Must not be null or empty
- Use `validateFormData()` helper
- Check for required fields before database operations

---

**Important**: Always refer to this document when writing SQL queries or API endpoints to ensure column name consistency. When in doubt, run the database schema audit script to get the most current column information.
