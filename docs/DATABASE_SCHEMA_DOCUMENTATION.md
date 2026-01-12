# PetroPal Database Schema Documentation

## Overview

This document provides comprehensive documentation of the PetroPal database schema, including all tables, columns, relationships, triggers, and API endpoints.

**Last Updated:** October 19, 2025  
**Database Status:** HEALTHY ✅  
**Total Tables:** 72  
**Total Triggers:** 8  
**Total Foreign Keys:** 67  

## Database Health Summary

- ✅ **Connection:** Database connection successful
- ✅ **Tables:** All required tables exist (72/72)
- ✅ **Foreign Keys:** 67 foreign key constraints found
- ✅ **Triggers:** All critical triggers exist (8/8)
- ✅ **Data Integrity:** No orphaned records found
- ✅ **Performance:** Database performance optimal
- ✅ **API Compatibility:** All API endpoints compatible

## Core Business Tables

### 1. Users & Authentication

#### `users`
Primary user authentication table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| email | text | NOT NULL | User email address |
| password_hash | text | NOT NULL | Hashed password |
| full_name | text | | User's full name |
| username | text | | Username for login |
| created_at | timestamp | DEFAULT now() | Account creation timestamp |

#### `password_reset_tokens`
Password reset token management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Token identifier |
| user_id | uuid | NOT NULL, FK to users.id | User requesting reset |
| token | text | NOT NULL | Reset token |
| expires_at | timestamp | NOT NULL | Token expiration |
| used | boolean | DEFAULT false | Whether token was used |
| created_at | timestamp | DEFAULT now() | Token creation time |

#### `user_roles`
User role assignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Role assignment ID |
| user_id | uuid | NOT NULL, FK to users.id | User ID |
| role | text | NOT NULL | Role name (admin, manager, operator) |
| created_at | timestamp | DEFAULT now() | Assignment timestamp |

### 2. Customer Management

#### `credit_customers`
Credit customers for fuel purchases.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Customer ID |
| organization_name | text | NOT NULL | Company/organization name |
| contact_person | text | | Primary contact person |
| phone_number | text | | Primary phone number |
| mobile_number | text | | Mobile number |
| email | text | | Email address |
| address | text | | Business address |
| gst_number | text | | GST registration number |
| pan_number | text | | PAN number |
| credit_limit | numeric | DEFAULT 0 | Credit limit amount |
| current_balance | numeric | DEFAULT 0 | Current outstanding balance |
| last_payment_date | date | | Date of last payment |
| is_active | boolean | DEFAULT true | Customer status |
| created_at | timestamp | DEFAULT now() | Customer creation date |

### 3. Product Management

#### `fuel_products`
Fuel product catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Product ID |
| product_name | text | NOT NULL | Product name (e.g., "Petrol", "Diesel") |
| product_code | text | | Product code |
| short_name | text | NOT NULL, DEFAULT '' | Short name for display |
| current_rate | numeric | | Current selling rate per liter |
| gst_percentage | numeric | | GST percentage |
| tds_percentage | numeric | | TDS percentage |
| wgt_percentage | numeric | | WGT percentage |
| lfrn | text | NOT NULL, DEFAULT '' | LFRN code |
| unit | text | DEFAULT 'Liters' | Unit of measurement |
| is_active | boolean | DEFAULT true | Product status |
| created_at | timestamp | DEFAULT now() | Product creation date |

#### `lubricants`
Lubricant products catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Lubricant ID |
| lubricant_name | text | NOT NULL | Lubricant name |
| product_code | text | | Product code |
| purchase_rate | numeric | | Purchase rate |
| sale_rate | numeric | | Selling rate |
| current_stock | integer | | Current stock quantity |
| minimum_stock | integer | | Minimum stock level |
| hsn_code | text | | HSN code |
| gst_percentage | numeric | | GST percentage |
| mrp_rate | numeric | | MRP rate |
| unit | text | DEFAULT 'Liters' | Unit of measurement |
| is_active | boolean | DEFAULT true | Product status |
| created_at | timestamp | DEFAULT now() | Product creation date |

### 4. Infrastructure

#### `tanks`
Fuel storage tanks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Tank ID |
| tank_number | text | NOT NULL | Tank number/identifier |
| fuel_product_id | uuid | FK to fuel_products.id | Fuel product stored |
| capacity | numeric | | Tank capacity in liters |
| current_stock | numeric | | Current stock level |
| is_active | boolean | DEFAULT true | Tank status |
| created_at | timestamp | DEFAULT now() | Tank creation date |

#### `nozzles`
Fuel dispensing nozzles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Nozzle ID |
| nozzle_number | text | NOT NULL | Nozzle number/identifier |
| tank_id | uuid | FK to tanks.id | Connected tank |
| fuel_product_id | uuid | FK to fuel_products.id | Fuel product dispensed |
| pump_station | text | | Pump station identifier |
| is_active | boolean | DEFAULT true | Nozzle status |
| created_at | timestamp | DEFAULT now() | Nozzle creation date |

### 5. Sales Transactions

#### `guest_sales`
Cash sales to walk-in customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Sale ID |
| sale_date | date | NOT NULL, DEFAULT CURRENT_DATE | Sale date |
| mobile_number | text | | Customer mobile number |
| vehicle_number | text | | Vehicle number |
| fuel_product_id | uuid | NOT NULL, FK to fuel_products.id | Fuel product sold |
| nozzle_id | uuid | FK to nozzles.id | Nozzle used |
| quantity | numeric | NOT NULL | Quantity sold (liters) |
| price_per_unit | numeric | NOT NULL | Price per liter |
| discount | numeric | DEFAULT 0 | Discount amount |
| payment_mode | text | | Payment method |
| total_amount | numeric | | Total sale amount |
| customer_name | text | | Customer name |
| offer_type | text | | Offer type |
| gst_tin | text | | GST/TIN number |
| created_at | timestamp | DEFAULT now() | Sale timestamp |
| created_by | uuid | FK to users.id | User who created sale |

#### `credit_sales`
Credit sales to registered customers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Sale ID |
| sale_date | date | NOT NULL, DEFAULT CURRENT_DATE | Sale date |
| credit_customer_id | uuid | NOT NULL, FK to credit_customers.id | Credit customer |
| fuel_product_id | uuid | NOT NULL, FK to fuel_products.id | Fuel product sold |
| vehicle_number | text | | Vehicle number |
| quantity | numeric | NOT NULL | Quantity sold (liters) |
| price_per_unit | numeric | NOT NULL | Price per liter |
| discount | numeric | DEFAULT 0 | Discount amount |
| total_amount | numeric | | Total sale amount |
| created_at | timestamp | DEFAULT now() | Sale timestamp |
| created_by | uuid | FK to users.id | User who created sale |

#### `lub_sales`
Lubricant sales.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Sale ID |
| sale_date | date | NOT NULL | Sale date |
| shift | text | | Shift identifier |
| employee_id | uuid | FK to employees.id | Employee who made sale |
| product | text | | Product name |
| sale_rate | numeric | | Selling rate |
| quantity | numeric | | Quantity sold |
| discount | numeric | | Discount amount |
| amount | numeric | | Total amount |
| description | text | | Sale description |
| sale_type | text | | Type of sale |
| gst | jsonb | | GST details |
| created_at | timestamp | DEFAULT now() | Sale timestamp |
| created_by | uuid | FK to users.id | User who created sale |

### 6. Financial Management

#### `recoveries`
Customer payment recoveries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Recovery ID |
| recovery_date | date | NOT NULL, DEFAULT CURRENT_DATE | Recovery date |
| credit_customer_id | uuid | NOT NULL, FK to credit_customers.id | Customer |
| received_amount | numeric | NOT NULL | Amount received |
| discount | numeric | DEFAULT 0 | Discount given |
| payment_mode | text | | Payment method |
| notes | text | | Recovery notes |
| created_at | timestamp | DEFAULT now() | Recovery timestamp |
| created_by | uuid | FK to users.id | User who recorded recovery |

#### `expenses`
Business expenses.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Expense ID |
| expense_date | date | NOT NULL, DEFAULT CURRENT_DATE | Expense date |
| expense_type_id | uuid | FK to expense_types.id | Expense type |
| flow_type | text | | Flow type (Inflow/Outflow) |
| payment_mode | text | | Payment method |
| amount | numeric | NOT NULL | Expense amount |
| description | text | | Expense description |
| employee_id | uuid | FK to employees.id | Employee who incurred expense |
| created_at | timestamp | DEFAULT now() | Expense timestamp |
| created_by | uuid | FK to users.id | User who created expense |

#### `expense_types`
Expense type categories.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Type ID |
| expense_type_name | text | NOT NULL | Type name |
| effect_for | text | | Effect category |
| options | text | | Additional options |
| is_active | boolean | DEFAULT true | Type status |
| created_at | timestamp | DEFAULT now() | Type creation date |

### 7. Operations Management

#### `employees`
Employee management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Employee ID |
| employee_name | text | NOT NULL | Employee name |
| designation | text | | Job designation |
| phone_number | text | | Phone number |
| mobile_number | text | | Mobile number |
| address | text | | Address |
| salary | numeric | | Salary amount |
| joining_date | date | | Joining date |
| join_date | date | | Alternative join date |
| employee_number | text | | Employee number |
| phone_no | text | | Alternative phone |
| id_proof_no | text | | ID proof number |
| salary_type | text | | Salary type |
| has_pf | boolean | DEFAULT false | PF enrollment |
| has_esi | boolean | DEFAULT false | ESI enrollment |
| has_income_tax | boolean | DEFAULT false | Income tax deduction |
| description | text | | Description |
| image_url | text | | Profile image URL |
| is_active | boolean | DEFAULT true | Employee status |
| status | text | DEFAULT 'Active' | Employment status |
| created_at | timestamp | DEFAULT now() | Employee creation date |

#### `vendors`
Vendor/supplier management.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Vendor ID |
| vendor_name | text | NOT NULL | Vendor name |
| vendor_type | text | | Vendor type |
| contact_person | text | | Contact person |
| phone_number | text | | Phone number |
| mobile_number | text | | Mobile number |
| email | text | | Email address |
| address | text | | Address |
| gst_number | text | | GST number |
| pan_number | text | | PAN number |
| opening_balance | numeric | | Opening balance |
| current_balance | numeric | | Current balance |
| opening_date | date | | Opening date |
| opening_type | text | | Opening type |
| description | text | | Description |
| is_active | boolean | DEFAULT true | Vendor status |
| created_at | timestamp | DEFAULT now() | Vendor creation date |
| updated_at | timestamp | DEFAULT now() | Last update date |

### 8. Inventory Management

#### `opening_stock`
Opening stock records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Record ID |
| product | text | NOT NULL | Product name |
| unit | text | | Unit of measurement |
| opening_stock | numeric | | Opening stock quantity |
| created_at | timestamp | DEFAULT now() | Record creation date |

#### `daily_sale_rates`
Daily fuel sale rates.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Rate ID |
| rate_date | date | NOT NULL | Rate date |
| fuel_product_id | uuid | NOT NULL, FK to fuel_products.id | Fuel product |
| open_rate | numeric | | Opening rate |
| close_rate | numeric | | Closing rate |
| variation_amount | numeric | | Rate variation |
| created_at | timestamp | DEFAULT now() | Rate creation date |

### 9. System Operations

#### `tank_transfers`
Tank-to-tank transfers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Transfer ID |
| transfer_date | date | NOT NULL | Transfer date |
| from_tank_id | uuid | FK to tanks.id | Source tank |
| to_tank_id | uuid | FK to tanks.id | Destination tank |
| amount | numeric | NOT NULL | Transfer amount |
| created_at | timestamp | DEFAULT now() | Transfer timestamp |

#### `tank_dips`
Tank dip measurements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | Dip ID |
| tank_id | uuid | FK to tanks.id | Tank |
| dip_value | numeric | NOT NULL | Dip measurement |
| dip_date | date | NOT NULL | Dip date |
| created_at | timestamp | DEFAULT now() | Dip timestamp |

## Database Triggers

### Critical Triggers

1. **`update_balance_after_recovery`** (on recoveries)
   - Updates customer balance when recovery is recorded
   - Reduces customer balance by received amount
   - Updates last payment date

2. **`trg_update_customer_balance_on_sale`** (on credit_sales)
   - Updates customer balance when credit sale is made
   - Increases customer balance by sale amount
   - Validates credit limit

3. **`trg_update_tank_stock_on_guest_sale`** (on guest_sales)
   - Updates tank stock when guest sale is made
   - Reduces tank stock by sale quantity

4. **`trg_update_tank_stock_on_credit_sale`** (on credit_sales)
   - Updates tank stock when credit sale is made
   - Reduces tank stock by sale quantity

5. **`trg_update_vendor_balance_on_transaction`** (on vendor_transactions)
   - Updates vendor balance based on transaction type
   - Handles debit/credit transactions

6. **`trg_update_lub_stock_on_loss`** (on lub_losses)
   - Updates lubricant stock when loss is recorded
   - Reduces stock by loss quantity

## API Endpoints

### Core Business APIs

- `GET /api/fuel-products` - List fuel products
- `GET /api/credit-customers` - List credit customers
- `GET /api/employees` - List employees
- `GET /api/tanks` - List tanks
- `GET /api/nozzles-list` - List nozzles

### Sales APIs

- `GET /api/guest-sales` - List guest sales
- `POST /api/guest-sales` - Create guest sale
- `GET /api/credit-sales` - List credit sales
- `POST /api/credit-sales` - Create credit sale
- `GET /api/lub-sales` - List lubricant sales
- `POST /api/lub-sales` - Create lubricant sale

### Financial APIs

- `GET /api/recoveries` - List recoveries
- `POST /api/recoveries` - Create recovery
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense

### Operations APIs

- `GET /api/daily-sale-rates` - List daily sale rates
- `POST /api/daily-sale-rates` - Create daily sale rates
- `GET /api/opening-stock` - List opening stock
- `POST /api/opening-stock` - Create opening stock
- `GET /api/tank-transfers` - List tank transfers
- `POST /api/tank-transfers` - Create tank transfer
- `GET /api/tank-dips` - List tank dips
- `POST /api/tank-dips` - Create tank dip

## Data Relationships

### Key Relationships

1. **Credit Sales → Credit Customers**
   - `credit_sales.credit_customer_id` → `credit_customers.id`

2. **Sales → Fuel Products**
   - `guest_sales.fuel_product_id` → `fuel_products.id`
   - `credit_sales.fuel_product_id` → `fuel_products.id`

3. **Nozzles → Tanks → Fuel Products**
   - `nozzles.tank_id` → `tanks.id`
   - `nozzles.fuel_product_id` → `fuel_products.id`
   - `tanks.fuel_product_id` → `fuel_products.id`

4. **Recoveries → Credit Customers**
   - `recoveries.credit_customer_id` → `credit_customers.id`

5. **Expenses → Expense Types**
   - `expenses.expense_type_id` → `expense_types.id`

## Performance Considerations

### Indexes
- Primary keys are automatically indexed
- Foreign keys should have indexes for performance
- Consider indexes on frequently queried columns

### Large Tables
- `credit_customers`: 440 records
- `employees`: 254 records
- `fuel_products`: 215 records
- `tanks`: 299 records
- `nozzles`: 547 records

### Maintenance
- Regular VACUUM and ANALYZE operations
- Monitor table sizes and growth
- Review query performance regularly

## Security Considerations

### Row Level Security (RLS)
- Implement RLS policies for data access control
- Ensure users can only access authorized data
- Regular security audits

### Data Validation
- UUID validation for all ID fields
- Numeric validation for amounts and quantities
- Date validation for temporal fields
- Required field validation

## Backup and Recovery

### Backup Strategy
- Regular full database backups
- Transaction log backups for point-in-time recovery
- Test restore procedures regularly

### Recovery Procedures
- Document recovery procedures
- Test disaster recovery scenarios
- Maintain backup verification processes

---

**Note:** This documentation is automatically generated from the database schema audit. For the most up-to-date information, run the database health check script.
