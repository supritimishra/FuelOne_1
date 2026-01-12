# Database Reference Guide

## Quick Database Overview

**Total Tables:** 48  
**Database:** PostgreSQL (Neon Serverless)  
**ORM:** Drizzle  
**Naming Convention:** snake_case in database, camelCase in Drizzle schema

---

## Table Categories

### 1. Master Data (10 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `fuel_products` | Fuel product definitions | product_name, short_name, gst_percentage |
| `lubricants` | Lubricant inventory | product_name, category, stock_quantity |
| `credit_customers` | Credit customer accounts | organization_name, credit_limit, current_balance |
| `employees` | Employee records | employee_name, designation, salary |
| `vendors` | Supplier information | vendor_name, vendor_type, current_balance |
| `expense_types` | Expense categories | type_name, description |
| `business_parties` | Business party accounts | party_name, party_type |
| `swipe_machines` | Card payment machines | machine_name, machine_id |
| `tanks` | Fuel storage tanks | tank_number, fuel_product_id, current_stock |
| `nozzles` | Pump nozzles | nozzle_number, tank_id, current_reading |

### 2. Sales Tables (7 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `guest_sales` | Cash/guest transactions | mobile_number, vehicle_number, total_amount |
| `credit_sales` | Credit customer sales | credit_customer_id, total_amount |
| `swipe_transactions` | Card payment sales | swipe_machine_id, total_amount |
| `tanker_sales` | Bulk tanker sales | customer_name, vehicle_number, quantity |
| `lubricant_sales` | Lubricant sales | lubricant_id, quantity, total_amount |
| `lub_sales` | Lubricant sale records | lubricant_id, customer_name |
| `sale_entries` | Meter reading entries | opening_reading, closing_reading, quantity |

### 3. Purchase Tables (3 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `liquid_purchases` | Fuel purchases | vendor_id, fuel_product_id, quantity, tank_id |
| `lub_purchases` | Lubricant purchases | vendor_id, lubricant_id, quantity |
| `vendor_invoices` | Invoice tracking | vendor_id, invoice_number, total_amount |

### 4. Financial Tables (6 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `recoveries` | Payment recovery | credit_customer_id, recovery_amount |
| `business_transactions` | Business party transactions | business_party_id, transaction_type, amount |
| `vendor_transactions` | Vendor payments | vendor_id, transaction_type, amount |
| `interest_transactions` | Interest calculations | credit_customer_id, interest_amount |
| `day_settlements` | Daily closing | settlement_date, total_sales, total_cash |
| `denominations` | Cash denominations | denomination_value, count |

### 5. Operational Tables (8 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `duty_pay` | Monthly salary | pay_month, total_salary, total_employees |
| `duty_shifts` | Shift definitions | shift_name, start_time, end_time |
| `employee_cash_recovery` | Employee cash tracking | employee_id, recovery_amount |
| `credit_requests` | Credit limit requests | credit_customer_id, ordered_quantity, status |
| `sheet_records` | Shift sheet entries | record_date, shift_id, employee_id |
| `daily_sale_rates` | Daily fuel pricing | rate_date, fuel_product_id, rate |
| `day_cash_movements` | Daily cash flow | movement_date, movement_type, amount |
| `expiry_items` | Expiry tracking | product_name, expiry_date |

### 6. Reporting Tables (5 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `print_templates` | Invoice templates | template_name, template_content |
| `sales_officer_inspections` | Inspection records | inspection_date, officer_name, remarks |
| `attendance` | Employee attendance | employee_id, attendance_date, status |
| `categories` | General categories | category_name, category_type |
| `feedback` | Customer feedback | customer_name, feedback_text, rating |

### 7. System Tables (9 tables)
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | User accounts | username, email, password_hash |
| `user_roles` | Role assignments | user_id, role (super_admin/manager/DSM) |
| `password_reset_tokens` | Password reset | user_id, token, expires_at |
| `activity_logs` | System activity | user_id, action, timestamp |
| `user_logs` | User actions | user_id, action, module, details |
| `app_config` | App configuration | config_key, config_value, config_type |
| `system_settings` | System settings | setting_key, setting_value, category |
| `organization_details` | Company info | organization_name, address, gst_number |
| `expenses` | Expense records | expense_date, expense_type_id, amount |

---

## Detailed Table Schemas

### users
```sql
CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username        text UNIQUE,
  email           text UNIQUE NOT NULL,
  password_hash   text NOT NULL,
  full_name       text,
  created_at      timestamp DEFAULT now()
);
```

### user_roles
```sql
CREATE TABLE user_roles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id),
  role            text NOT NULL,  -- 'super_admin', 'manager', 'DSM'
  created_at      timestamp DEFAULT now()
);
```

### fuel_products
```sql
CREATE TABLE fuel_products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name        text NOT NULL,
  short_name          text NOT NULL,
  gst_percentage      numeric(5,2) DEFAULT 18.00,
  tds_percentage      numeric(5,2) DEFAULT 1.00,
  wgt_percentage      numeric(5,2) DEFAULT 0.50,
  lfrn                text,
  is_active           boolean DEFAULT true,
  created_at          timestamp DEFAULT now()
);
```

### lubricants
```sql
CREATE TABLE lubricants (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name        text NOT NULL,
  category            text,
  unit                text DEFAULT 'Litre',
  purchase_price      numeric(10,2),
  sale_price          numeric(10,2),
  stock_quantity      numeric(10,2) DEFAULT 0,
  minimum_stock       numeric(10,2) DEFAULT 10,
  is_active           boolean DEFAULT true,
  created_at          timestamp DEFAULT now()
);
```

### credit_customers
```sql
CREATE TABLE credit_customers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name   text NOT NULL,
  phone_number        text,
  mobile_number       text,
  email               text,
  address             text,
  credit_limit        numeric(12,2) DEFAULT 50000,
  opening_balance     numeric(12,2),
  current_balance     numeric(12,2) DEFAULT 0,
  is_active           boolean DEFAULT true,
  created_at          timestamp DEFAULT now()
);
```

### employees
```sql
CREATE TABLE employees (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name       text NOT NULL,
  designation         text,
  phone_number        text,
  mobile_number       text,
  address             text,
  salary              numeric(10,2),
  joining_date        date,
  status              text DEFAULT 'Active',
  created_at          timestamp DEFAULT now()
);
```

### vendors
```sql
CREATE TABLE vendors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name         text NOT NULL,
  vendor_type         text,
  contact_person      text,
  phone_number        text,
  mobile_number       text,
  email               text,
  address             text,
  gst_number          text,
  pan_number          text,
  opening_balance     numeric(12,2),
  current_balance     numeric(12,2),
  is_active           boolean DEFAULT true,
  created_at          timestamp DEFAULT now()
);
```

### tanks
```sql
CREATE TABLE tanks (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_number         text NOT NULL,
  fuel_product_id     uuid REFERENCES fuel_products(id),
  capacity            numeric(12,2),
  current_stock       numeric(12,2) DEFAULT 0,
  minimum_stock       numeric(12,2),
  created_at          timestamp DEFAULT now()
);
```

### nozzles
```sql
CREATE TABLE nozzles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nozzle_number       text NOT NULL,
  tank_id             uuid REFERENCES tanks(id),
  fuel_product_id     uuid REFERENCES fuel_products(id),
  opening_reading     numeric(12,3),
  current_reading     numeric(12,3),
  created_at          timestamp DEFAULT now()
);
```

### guest_sales
```sql
CREATE TABLE guest_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date           date NOT NULL,
  mobile_number       text,
  vehicle_number      text,
  fuel_product_id     uuid REFERENCES fuel_products(id),
  quantity            numeric(10,3),
  price_per_unit      numeric(10,2),
  discount            numeric(10,2) DEFAULT 0,
  payment_mode        text DEFAULT 'cash',
  total_amount        numeric(12,2),
  created_at          timestamp DEFAULT now(),
  created_by          uuid REFERENCES users(id)
);
```

### credit_sales
```sql
CREATE TABLE credit_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date           date NOT NULL,
  credit_customer_id  uuid REFERENCES credit_customers(id),
  vehicle_number      text,
  fuel_product_id     uuid REFERENCES fuel_products(id),
  quantity            numeric(10,3),
  price_per_unit      numeric(10,2),
  total_amount        numeric(12,2),
  employee_id         uuid REFERENCES employees(id),
  created_at          timestamp DEFAULT now(),
  created_by          uuid REFERENCES users(id)
);
```

### tanker_sales
```sql
CREATE TABLE tanker_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date           date NOT NULL,
  customer_name       text,
  vehicle_number      text,
  fuel_product_id     uuid REFERENCES fuel_products(id),
  quantity            numeric(10,3),
  price_per_unit      numeric(10,2),
  total_amount        numeric(12,2),
  payment_mode        text,
  created_at          timestamp DEFAULT now()
);
```

### liquid_purchases
```sql
CREATE TABLE liquid_purchases (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date       date NOT NULL,
  vendor_id           uuid REFERENCES vendors(id),
  fuel_product_id     uuid REFERENCES fuel_products(id),
  quantity            numeric(12,3),
  price_per_unit      numeric(10,2),
  total_amount        numeric(15,2),
  invoice_number      text,
  tank_id             uuid REFERENCES tanks(id),
  created_at          timestamp DEFAULT now()
);
```

### lub_purchases
```sql
CREATE TABLE lub_purchases (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date       date NOT NULL,
  vendor_id           uuid REFERENCES vendors(id),
  lubricant_id        uuid REFERENCES lubricants(id),
  quantity            numeric(10,2),
  price_per_unit      numeric(10,2),
  total_amount        numeric(12,2),
  invoice_number      text,
  created_at          timestamp DEFAULT now()
);
```

### lub_sales
```sql
CREATE TABLE lub_sales (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date           date NOT NULL,
  lubricant_id        uuid REFERENCES lubricants(id),
  quantity            numeric(10,2),
  price_per_unit      numeric(10,2),
  total_amount        numeric(12,2),
  customer_name       text,
  payment_mode        text DEFAULT 'cash',
  created_at          timestamp DEFAULT now()
);
```

### sale_entries
```sql
CREATE TABLE sale_entries (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date           date NOT NULL,
  shift_id            uuid REFERENCES duty_shifts(id),
  pump_station        text,
  nozzle_id           uuid REFERENCES nozzles(id),
  fuel_product_id     uuid REFERENCES fuel_products(id),
  opening_reading     numeric(12,3),
  closing_reading     numeric(12,3),
  quantity            numeric(12,3),  -- Auto-calculated: closing - opening
  price_per_unit      numeric(10,2),
  net_sale_amount     numeric(12,2),  -- Auto-calculated: quantity * price
  employee_id         uuid REFERENCES employees(id),
  created_at          timestamp DEFAULT now(),
  created_by          uuid REFERENCES users(id)
);
```

### duty_pay
```sql
CREATE TABLE duty_pay (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_month           date NOT NULL,
  total_salary        numeric(12,2),
  total_employees     integer,
  notes               text,
  created_at          timestamp DEFAULT now()
);
```

### credit_requests
```sql
CREATE TABLE credit_requests (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_date            date DEFAULT CURRENT_DATE,
  credit_customer_id      uuid REFERENCES credit_customers(id),
  fuel_product_id         uuid REFERENCES fuel_products(id),
  ordered_quantity        numeric(10,2),
  status                  text DEFAULT 'Pending',
  notes                   text,
  created_at              timestamp DEFAULT now(),
  created_by              uuid REFERENCES users(id)
);
```

### sheet_records
```sql
CREATE TABLE sheet_records (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_date         date NOT NULL,
  shift_id            uuid REFERENCES duty_shifts(id),
  employee_id         uuid REFERENCES employees(id),
  opening_cash        numeric(12,2),
  closing_cash        numeric(12,2),
  total_sales         numeric(12,2),
  expenses            numeric(12,2),
  remarks             text,
  created_at          timestamp DEFAULT now()
);
```

### app_config
```sql
CREATE TABLE app_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key          text NOT NULL,
  config_value        text,
  config_type         text DEFAULT 'string',
  description         text,
  is_active           boolean DEFAULT true,
  created_at          timestamp DEFAULT now(),
  updated_at          timestamp DEFAULT now()
);
```

### user_logs
```sql
CREATE TABLE user_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES users(id),
  action              text NOT NULL,
  module              text,
  details             text,
  ip_address          text,
  created_at          timestamp DEFAULT now()
);
```

### system_settings
```sql
CREATE TABLE system_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key         text NOT NULL,
  setting_value       text,
  category            text,
  description         text,
  is_editable         boolean DEFAULT true,
  created_at          timestamp DEFAULT now(),
  updated_at          timestamp DEFAULT now()
);
```

### day_cash_movements
```sql
CREATE TABLE day_cash_movements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movement_date       date NOT NULL,
  movement_type       text,  -- 'inflow' or 'outflow'
  amount              numeric(12,2),
  description         text,
  created_at          timestamp DEFAULT now()
);
```

---

## Foreign Key Relationships

### Hierarchical Relationships
```
users
  ├── user_roles
  ├── user_logs
  ├── guest_sales (created_by)
  ├── credit_sales (created_by)
  └── sale_entries (created_by)

fuel_products
  ├── tanks
  │   └── nozzles
  ├── guest_sales
  ├── credit_sales
  ├── tanker_sales
  ├── liquid_purchases
  └── sale_entries

credit_customers
  ├── credit_sales
  ├── credit_requests
  ├── recoveries
  └── interest_transactions

vendors
  ├── liquid_purchases
  ├── lub_purchases
  ├── vendor_transactions
  └── vendor_invoices

lubricants
  ├── lub_sales
  └── lub_purchases

employees
  ├── sale_entries
  ├── credit_sales
  ├── sheet_records
  └── employee_cash_recovery
```

---

## Data Types & Precision

### Numeric Precision
| Type | Format | Example Use |
|------|--------|-------------|
| `numeric(5,2)` | 5 digits, 2 decimals | Percentages (18.50%) |
| `numeric(10,2)` | 10 digits, 2 decimals | Prices, salaries |
| `numeric(10,3)` | 10 digits, 3 decimals | Fuel quantities |
| `numeric(12,2)` | 12 digits, 2 decimals | Amounts, balances |
| `numeric(12,3)` | 12 digits, 3 decimals | Meter readings |
| `numeric(15,2)` | 15 digits, 2 decimals | Large purchase amounts |

### Common Column Types
- **IDs:** `uuid` with `DEFAULT gen_random_uuid()`
- **Names/Text:** `text`
- **Booleans:** `boolean` with `DEFAULT true/false`
- **Dates:** `date`
- **Timestamps:** `timestamp` with `DEFAULT now()`
- **Status:** `text` with specific values

---

## Indexes & Performance

### Recommended Indexes
```sql
-- Sales performance
CREATE INDEX idx_guest_sales_date ON guest_sales(sale_date);
CREATE INDEX idx_credit_sales_customer ON credit_sales(credit_customer_id);
CREATE INDEX idx_credit_sales_date ON credit_sales(sale_date);

-- Purchase lookups
CREATE INDEX idx_liquid_purchases_date ON liquid_purchases(purchase_date);
CREATE INDEX idx_liquid_purchases_vendor ON liquid_purchases(vendor_id);

-- Customer queries
CREATE INDEX idx_credit_customers_active ON credit_customers(is_active);

-- Operational queries
CREATE INDEX idx_sale_entries_date ON sale_entries(sale_date);
CREATE INDEX idx_sheet_records_date ON sheet_records(record_date);

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

---

## Database Triggers

### Auto-Calculations
1. **sale_entries.quantity**
   - Trigger: ON INSERT/UPDATE
   - Calculation: `closing_reading - opening_reading`

2. **sale_entries.net_sale_amount**
   - Trigger: ON INSERT/UPDATE
   - Calculation: `quantity * price_per_unit`

3. **credit_customers.current_balance**
   - Trigger: ON credit_sales INSERT
   - Updates: Adds sale total_amount to current_balance

4. **tanks.current_stock**
   - Trigger: ON liquid_purchases INSERT
   - Updates: Adds purchased quantity to current_stock

5. **lubricants.stock_quantity**
   - Trigger: ON lub_purchases INSERT → Add quantity
   - Trigger: ON lub_sales INSERT → Subtract quantity

---

## Common Queries

### Get Dashboard Summary
```sql
SELECT 
  COALESCE(SUM(total_amount), 0) as total_sales,
  COUNT(*) as sales_count
FROM (
  SELECT total_amount FROM guest_sales WHERE sale_date = CURRENT_DATE
  UNION ALL
  SELECT total_amount FROM credit_sales WHERE sale_date = CURRENT_DATE
  UNION ALL
  SELECT total_amount FROM lub_sales WHERE sale_date = CURRENT_DATE
) AS all_sales;
```

### Get Credit Customer Statement
```sql
SELECT 
  cs.sale_date,
  fp.product_name,
  cs.quantity,
  cs.price_per_unit,
  cs.total_amount,
  cc.current_balance
FROM credit_sales cs
JOIN fuel_products fp ON cs.fuel_product_id = fp.id
JOIN credit_customers cc ON cs.credit_customer_id = cc.id
WHERE cs.credit_customer_id = $1
  AND cs.sale_date BETWEEN $2 AND $3
ORDER BY cs.sale_date DESC;
```

### Get Stock Report
```sql
SELECT 
  t.tank_number,
  fp.product_name,
  t.capacity,
  t.current_stock,
  t.minimum_stock,
  (t.capacity - t.current_stock) as available_capacity,
  CASE 
    WHEN t.current_stock <= t.minimum_stock THEN 'Low Stock'
    ELSE 'OK'
  END as status
FROM tanks t
JOIN fuel_products fp ON t.fuel_product_id = fp.id
ORDER BY t.tank_number;
```

### Get Employee Sales Performance
```sql
SELECT 
  e.employee_name,
  COUNT(cs.id) as sales_count,
  SUM(cs.total_amount) as total_sales_amount
FROM employees e
LEFT JOIN credit_sales cs ON e.id = cs.employee_id
WHERE cs.sale_date BETWEEN $1 AND $2
GROUP BY e.id, e.employee_name
ORDER BY total_sales_amount DESC;
```

---

## Naming Conventions

### Database (snake_case)
- Tables: `credit_customers`, `fuel_products`
- Columns: `credit_limit`, `price_per_unit`
- Foreign keys: `fuel_product_id`, `credit_customer_id`

### Drizzle Schema (camelCase)
```typescript
export const creditCustomers = pgTable('credit_customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationName: text('organization_name').notNull(),
  creditLimit: numeric('credit_limit', { precision: 12, scale: 2 }),
});
```

### Important Rules
1. **All SQL queries must use snake_case**
2. **Drizzle schema uses camelCase, auto-maps to snake_case**
3. **Never mix conventions in same query**

---

## Backup & Maintenance

### Daily Operations
```sql
-- Backup command (run daily)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

-- Vacuum for performance (weekly)
VACUUM ANALYZE;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Migration Notes

### Using Drizzle
```bash
# Generate migration
npm run db:generate

# Push schema to database
npm run db:push

# Force push (careful!)
npm run db:push --force

# Open Drizzle Studio
npm run db:studio
```

### Important
- Never change primary key types
- Always backup before migrations
- Test migrations on dev database first
- Use `db:push` for schema sync

---

**Last Updated:** October 16, 2025  
**Database Version:** PostgreSQL 15+ (Neon)  
**Total Tables:** 48  
**Total Records:** Growing with daily operations
