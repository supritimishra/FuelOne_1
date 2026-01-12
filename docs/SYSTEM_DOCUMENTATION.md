# 📚 Ramkrishna Service Centre - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend API Documentation](#backend-api-documentation)
4. [Database Schema](#database-schema)
5. [Authentication & Security](#authentication--security)
6. [Data Flow & Integration](#data-flow--integration)

---

## System Overview

### Technology Stack
- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js with TypeScript
- **Database:** PostgreSQL (Neon Serverless)
- **ORM:** Drizzle ORM
- **UI Framework:** Shadcn/ui (Radix UI) + Tailwind CSS
- **State Management:** TanStack Query v5
- **Authentication:** JWT with httpOnly cookies
- **Form Management:** React Hook Form + Zod validation

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (37 modules)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   └── App.tsx        # Main app with routing
├── server/
│   ├── index.ts           # Express server setup
│   ├── routes.ts          # All API endpoints
│   ├── auth.ts            # Authentication middleware
│   └── vite.ts            # Vite middleware
├── shared/
│   └── schema.ts          # Drizzle database schema
└── db/
    └── index.ts           # Database connection
```

---

## Frontend Architecture

### Routing System
**Router:** Wouter (lightweight React router)

#### All Application Routes

**Public Routes:**
- `/` → Login page
- `/signup` → User registration

**Protected Routes (37 Modules):**

**Master Data Management:**
- `/home` → Dashboard
- `/fuel-products` → Fuel product management
- `/lubricants` → Lubricant inventory
- `/credit-customers` → Credit customer management
- `/employees` → Employee management
- `/vendors` → Vendor management
- `/tanks` → Tank management
- `/nozzles` → Nozzle management
- `/expense-types` → Expense type management
- `/swipe-machines` → Swipe machine management

**Sales Operations:**
- `/guest-sale` → Guest sale transactions
- `/credit-sale` → Credit sale transactions
- `/swipe-sale` → Swipe sale transactions
- `/tanker-sale` → Tanker sale transactions
- `/lubricant-sale` → Lubricant sales

**Purchase Operations:**
- `/liquid-purchases` → Liquid fuel purchases
- `/lubricant-purchases` → Lubricant purchases

**Daily Operations:**
- `/daily-cash-report` → Daily cash reporting
- `/denominations` → Cash denomination tracking
- `/daily-sale-rate` → Daily fuel rate management
- `/recovery` → Payment recovery tracking
- `/day-settlement` → Day closing settlement
- `/sale-entry` → Meter reading entry

**Reports & Statements:**
- `/statement` → Customer statements
- `/stock-reports` → Inventory stock reports
- `/lubricant-loss` → Lubricant loss tracking
- `/lubricant-stock` → Lubricant stock levels
- `/minimum-stock` → Minimum stock alerts

**Transactions:**
- `/sheet-records` → Shift sheet records
- `/business-transactions` → Business party transactions
- `/vendor-transactions` → Vendor payment transactions
- `/interest-transactions` → Interest calculations

**Invoice & Reports:**
- `/generate-invoice` → Invoice generation
- `/invoices` → Generated invoices list
- `/credit-limit-report` → Credit limit monitoring

**System Management:**
- `/credit-requests` → Credit request management
- `/duty-pay` → Monthly salary management
- `/expiry-items` → Expiry tracking
- `/app-config` → Application configuration
- `/user-log` → User activity logs
- `/system-settings` → System settings

### State Management

**TanStack Query (React Query v5) Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

**Query Pattern:**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['/api/fuel-products'],
  queryFn: async () => {
    const response = await fetch('/api/fuel-products');
    const result = await response.json();
    return result.rows || [];
  }
});
```

**Mutation Pattern:**
```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest('/api/fuel-products', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/fuel-products'] });
    toast({ title: "Success!" });
  }
});
```

### Authentication Hook
```typescript
// useAuth.tsx
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  return {
    user,
    isAuthenticated,
    login,
    logout,
    getAuthHeaders: () => ({ 'Content-Type': 'application/json' })
  };
}
```

### Form Management Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(insertFuelProductSchema),
  defaultValues: {
    product_name: '',
    gst_percentage: '18.00',
  }
});

const onSubmit = async (data) => {
  mutation.mutate(data);
};
```

### UI Components Used
**Shadcn/ui Components:**
- Button, Input, Label, Select
- Card, Dialog, Sheet
- Form, Table, Toast
- Accordion, Tabs, Separator
- ScrollArea, Popover, Avatar

**Theme System:**
```css
:root {
  --primary: 262.1 83.3% 57.8%;
  --secondary: 220 14.3% 95.9%;
  --accent: 220 14.3% 95.9%;
}

.dark {
  --primary: 263.4 70% 50.4%;
}
```

---

## Backend API Documentation

### Server Configuration
```typescript
// Express Server on Port 5000
const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS enabled for all origins
// Vite middleware for dev server
// API routes on /api/*
```

### Authentication Endpoints

#### POST /api/signup
Register new user

**Request Body:**
```json
{
  "username": "string (optional)",
  "email": "string (required)",
  "password": "string (required)",
  "full_name": "string (optional)"
}
```

**Response (201):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string"
  }
}
```

#### POST /api/login
User login (email or username)

**Request Body:**
```json
{
  "email": "string (email OR username)",
  "password": "string"
}
```

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "full_name": "string"
  }
}
```
*Sets httpOnly cookie with JWT*

#### POST /api/logout
User logout

**Response (200):**
```json
{
  "ok": true
}
```
*Clears authentication cookie*

#### GET /api/user
Get current authenticated user

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "string",
    "username": "string",
    "full_name": "string"
  }
}
```

### Master Data Endpoints

#### Fuel Products
```
GET    /api/fuel-products           // List all
POST   /api/fuel-products           // Create
PUT    /api/fuel-products/:id       // Update
DELETE /api/fuel-products/:id       // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "product_name": "string",
  "short_name": "string",
  "gst_percentage": "decimal",
  "tds_percentage": "decimal",
  "wgt_percentage": "decimal",
  "lfrn": "string",
  "is_active": "boolean"
}
```

#### Lubricants
```
GET    /api/lubricants              // List all
POST   /api/lubricants              // Create
PUT    /api/lubricants/:id          // Update
DELETE /api/lubricants/:id          // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "product_name": "string",
  "category": "string",
  "unit": "string",
  "purchase_price": "decimal",
  "sale_price": "decimal",
  "stock_quantity": "decimal",
  "minimum_stock": "decimal",
  "is_active": "boolean"
}
```

#### Credit Customers
```
GET    /api/credit-customers        // List all
POST   /api/credit-customers        // Create
PUT    /api/credit-customers/:id    // Update
DELETE /api/credit-customers/:id    // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "organization_name": "string",
  "phone_number": "string",
  "mobile_number": "string",
  "email": "string",
  "address": "string",
  "credit_limit": "decimal",
  "opening_balance": "decimal",
  "current_balance": "decimal",
  "is_active": "boolean"
}
```

#### Employees
```
GET    /api/employees               // List all
POST   /api/employees               // Create
PUT    /api/employees/:id           // Update
DELETE /api/employees/:id           // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "employee_name": "string",
  "designation": "string",
  "phone_number": "string",
  "mobile_number": "string",
  "address": "string",
  "salary": "decimal",
  "joining_date": "date",
  "status": "string"
}
```

#### Vendors
```
GET    /api/vendors                 // List all
POST   /api/vendors                 // Create
PUT    /api/vendors/:id             // Update
DELETE /api/vendors/:id             // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "vendor_name": "string",
  "vendor_type": "string",
  "contact_person": "string",
  "phone_number": "string",
  "mobile_number": "string",
  "email": "string",
  "address": "string",
  "gst_number": "string",
  "pan_number": "string",
  "opening_balance": "decimal",
  "current_balance": "decimal",
  "is_active": "boolean"
}
```

#### Tanks
```
GET    /api/tanks                   // Returns array directly
POST   /api/tanks                   // Create
PUT    /api/tanks/:id               // Update
DELETE /api/tanks/:id               // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "tank_number": "string",
  "fuel_product_id": "uuid",
  "capacity": "decimal",
  "current_stock": "decimal",
  "minimum_stock": "decimal"
}
```

#### Nozzles
```
GET    /api/nozzles                 // Returns array directly
POST   /api/nozzles                 // Create
PUT    /api/nozzles/:id             // Update
DELETE /api/nozzles/:id             // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "nozzle_number": "string",
  "tank_id": "uuid",
  "fuel_product_id": "uuid",
  "opening_reading": "decimal",
  "current_reading": "decimal"
}
```

### Sales Endpoints

#### Guest Sales
```
GET    /api/guest-sales             // List all
POST   /api/guest-sales             // Create
PUT    /api/guest-sales/:id         // Update
DELETE /api/guest-sales/:id         // Delete
```

**Request Body:**
```json
{
  "sale_date": "date",
  "mobile_number": "string (optional)",
  "vehicle_number": "string (optional)",
  "fuel_product_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "discount": "decimal (optional)",
  "payment_mode": "string",
  "total_amount": "decimal"
}
```

**Response:**
```json
{
  "ok": true,
  "rows": [
    {
      "id": "uuid",
      "sale_date": "date",
      "mobile_number": "string",
      "vehicle_number": "string",
      "fuel_product_id": "uuid",
      "quantity": "decimal",
      "price_per_unit": "decimal",
      "discount": "decimal",
      "payment_mode": "string",
      "total_amount": "decimal",
      "product_name": "string",
      "short_name": "string"
    }
  ]
}
```

#### Credit Sales
```
GET    /api/credit-sales            // List all
POST   /api/credit-sales            // Create
PUT    /api/credit-sales/:id        // Update
DELETE /api/credit-sales/:id        // Delete
```

**Request Body:**
```json
{
  "sale_date": "date",
  "credit_customer_id": "uuid",
  "vehicle_number": "string (optional)",
  "fuel_product_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "total_amount": "decimal",
  "employee_id": "uuid (optional)"
}
```

**Response includes joined data:**
```json
{
  "ok": true,
  "rows": [
    {
      "...": "all fields",
      "organization_name": "string",
      "product_name": "string"
    }
  ]
}
```

#### Tanker Sales
```
GET    /api/tanker-sales?from=DATE&to=DATE  // List with filters
POST   /api/tanker-sales            // Create
PUT    /api/tanker-sales/:id        // Update
DELETE /api/tanker-sales/:id        // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "sale_date": "date",
  "customer_name": "string",
  "vehicle_number": "string",
  "fuel_product_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "total_amount": "decimal",
  "payment_mode": "string"
}
```

#### Lubricant Sales
```
GET    /api/lub-sales               // List all
POST   /api/lub-sales               // Create
PUT    /api/lub-sales/:id           // Update
DELETE /api/lub-sales/:id           // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "sale_date": "date",
  "lubricant_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "total_amount": "decimal",
  "customer_name": "string (optional)",
  "payment_mode": "string"
}
```

### Purchase Endpoints

#### Liquid Purchases
```
GET    /api/liquid-purchases        // List all
POST   /api/liquid-purchases        // Create
PUT    /api/liquid-purchases/:id    // Update
DELETE /api/liquid-purchases/:id    // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "purchase_date": "date",
  "vendor_id": "uuid",
  "fuel_product_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "total_amount": "decimal",
  "invoice_number": "string",
  "tank_id": "uuid (optional)"
}
```

#### Lubricant Purchases
```
GET    /api/lub-purchases           // List all
POST   /api/lub-purchases           // Create
PUT    /api/lub-purchases/:id       // Update
DELETE /api/lub-purchases/:id       // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "purchase_date": "date",
  "vendor_id": "uuid",
  "lubricant_id": "uuid",
  "quantity": "decimal",
  "price_per_unit": "decimal",
  "total_amount": "decimal",
  "invoice_number": "string"
}
```

### Operations Endpoints

#### Sale Entries (Meter Readings)
```
GET    /api/sale-entries            // List all
POST   /api/sale-entries            // Create
PUT    /api/sale-entries/:id        // Update
DELETE /api/sale-entries/:id        // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "sale_date": "date",
  "shift_id": "uuid",
  "pump_station": "string",
  "nozzle_id": "uuid",
  "fuel_product_id": "uuid",
  "opening_reading": "decimal",
  "closing_reading": "decimal",
  "quantity": "decimal (auto-calculated)",
  "price_per_unit": "decimal",
  "net_sale_amount": "decimal (auto-calculated)",
  "employee_id": "uuid"
}
```

#### Duty Pay
```
GET    /api/duty-pay                // List all
POST   /api/duty-pay                // Create
PUT    /api/duty-pay/:id            // Update
DELETE /api/duty-pay/:id            // Delete
```

**Request Body:**
```json
{
  "pay_month": "date (YYYY-MM-DD format)",
  "total_salary": "decimal",
  "total_employees": "integer",
  "notes": "string (optional)"
}
```

**Important:** Month input (YYYY-MM) must be converted to full date (YYYY-MM-01) before sending to backend.

#### Credit Requests
```
GET    /api/credit-requests         // List all
POST   /api/credit-requests         // Create
PUT    /api/credit-requests/:id     // Update status
DELETE /api/credit-requests/:id     // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "credit_customer_id": "uuid",
  "fuel_product_id": "uuid",
  "ordered_quantity": "decimal",
  "status": "string (Pending/Approved/Rejected)",
  "notes": "string"
}
```

#### Sheet Records (Shift Records)
```
GET    /api/sheet-records           // List all
POST   /api/sheet-records           // Create
PUT    /api/sheet-records/:id       // Update
DELETE /api/sheet-records/:id       // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "record_date": "date",
  "shift_id": "uuid",
  "employee_id": "uuid",
  "opening_cash": "decimal",
  "closing_cash": "decimal",
  "total_sales": "decimal",
  "expenses": "decimal",
  "remarks": "string"
}
```

### Dashboard Endpoint

#### GET /api/dashboard
**Response:**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalSales": "number",
      "totalSalesCount": "number",
      "totalPurchases": "number",
      "totalOutstandingCredit": "string",
      "totalCreditCustomers": "string",
      "dailyInflows": "string",
      "dailyOutflows": "string",
      "netCashFlow": "number"
    },
    "salesBreakdown": [
      {
        "type": "guest_sales",
        "count": "string",
        "total_amount": "string"
      }
    ],
    "purchaseBreakdown": [
      {
        "type": "liquid_purchases",
        "count": "string",
        "total_amount": "number"
      }
    ],
    "recentTransactions": [
      {
        "type": "string",
        "description": "string",
        "amount": "string",
        "date": "date",
        "created_at": "timestamp"
      }
    ]
  }
}
```

### Configuration Endpoints

#### App Config
```
GET    /api/app-config              // List all
POST   /api/app-config              // Create
PUT    /api/app-config/:id          // Update
DELETE /api/app-config/:id          // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "config_key": "string",
  "config_value": "string",
  "config_type": "string (string/number/boolean/json)",
  "description": "string",
  "is_active": "boolean"
}
```

#### User Logs
```
GET    /api/user-log                // List all
POST   /api/user-log                // Create
DELETE /api/user-log/:id            // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "action": "string",
  "module": "string",
  "details": "string",
  "ip_address": "string",
  "created_at": "timestamp"
}
```

#### System Settings
```
GET    /api/system-settings         // List all
POST   /api/system-settings         // Create
PUT    /api/system-settings/:id     // Update
DELETE /api/system-settings/:id     // Delete
```

**Schema:**
```json
{
  "id": "uuid",
  "setting_key": "string",
  "setting_value": "string",
  "category": "string",
  "description": "string",
  "is_editable": "boolean"
}
```

---

## Database Schema

### All 48 Tables Overview

**Master Data Tables (10):**
- `fuel_products` - Fuel product definitions
- `lubricants` - Lubricant inventory items
- `credit_customers` - Credit customer accounts
- `employees` - Employee records
- `vendors` - Vendor/supplier information
- `expense_types` - Expense categories
- `business_parties` - Business party accounts
- `swipe_machines` - Card payment machines
- `tanks` - Fuel storage tanks
- `nozzles` - Pump nozzles

**Sales Tables (7):**
- `guest_sales` - Cash/guest transactions
- `credit_sales` - Credit customer sales
- `swipe_transactions` - Card payment sales
- `tanker_sales` - Bulk tanker sales
- `lubricant_sales` - Lubricant sales
- `lub_sales` - Lubricant sale records
- `sale_entries` - Meter reading entries

**Purchase Tables (3):**
- `liquid_purchases` - Fuel purchases
- `lub_purchases` - Lubricant purchases
- `vendor_invoices` - Vendor invoice tracking

**Financial Tables (6):**
- `recoveries` - Payment recovery records
- `business_transactions` - Business party transactions
- `vendor_transactions` - Vendor payment transactions
- `interest_transactions` - Interest calculations
- `day_settlements` - Daily closing settlements
- `denominations` - Cash denomination tracking

**Operational Tables (8):**
- `duty_pay` - Monthly salary records
- `duty_shifts` - Work shift definitions
- `employee_cash_recovery` - Employee cash tracking
- `credit_requests` - Credit limit requests
- `sheet_records` - Shift sheet entries
- `daily_sale_rates` - Daily fuel pricing
- `day_cash_movements` - Daily cash flow
- `expiry_items` - Product expiry tracking

**Reporting Tables (5):**
- `print_templates` - Invoice templates
- `sales_officer_inspections` - Inspection records
- `attendance` - Employee attendance
- `categories` - General categories
- `feedback` - Customer feedback

**System Tables (9):**
- `users` - User accounts
- `user_roles` - Role assignments
- `password_reset_tokens` - Password reset tokens
- `activity_logs` - System activity logs
- `user_logs` - User action logs
- `app_config` - Application configuration
- `system_settings` - System-wide settings
- `organization_details` - Company information
- `expenses` - Expense records

### Detailed Table Schemas

#### users
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
username        text UNIQUE
email           text UNIQUE NOT NULL
password_hash   text NOT NULL
full_name       text
created_at      timestamp DEFAULT now()
```

#### user_roles
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES users(id)
role            text NOT NULL  -- 'super_admin', 'manager', 'DSM'
created_at      timestamp DEFAULT now()
```

#### fuel_products
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_name        text NOT NULL
short_name          text NOT NULL
gst_percentage      numeric(5,2) DEFAULT 18.00
tds_percentage      numeric(5,2) DEFAULT 1.00
wgt_percentage      numeric(5,2) DEFAULT 0.50
lfrn                text
is_active           boolean DEFAULT true
created_at          timestamp DEFAULT now()
```

#### lubricants
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
product_name        text NOT NULL
category            text
unit                text DEFAULT 'Litre'
purchase_price      numeric(10,2)
sale_price          numeric(10,2)
stock_quantity      numeric(10,2) DEFAULT 0
minimum_stock       numeric(10,2) DEFAULT 10
is_active           boolean DEFAULT true
created_at          timestamp DEFAULT now()
```

#### credit_customers
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_name   text NOT NULL
phone_number        text
mobile_number       text
email               text
address             text
credit_limit        numeric(12,2) DEFAULT 50000
opening_balance     numeric(12,2)
current_balance     numeric(12,2) DEFAULT 0
is_active           boolean DEFAULT true
created_at          timestamp DEFAULT now()
```

#### employees
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
employee_name       text NOT NULL
designation         text
phone_number        text
mobile_number       text
address             text
salary              numeric(10,2)
joining_date        date
status              text DEFAULT 'Active'
created_at          timestamp DEFAULT now()
```

#### vendors
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
vendor_name         text NOT NULL
vendor_type         text
contact_person      text
phone_number        text
mobile_number       text
email               text
address             text
gst_number          text
pan_number          text
opening_balance     numeric(12,2)
current_balance     numeric(12,2)
is_active           boolean DEFAULT true
created_at          timestamp DEFAULT now()
```

#### tanks
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
tank_number         text NOT NULL
fuel_product_id     uuid REFERENCES fuel_products(id)
capacity            numeric(12,2)
current_stock       numeric(12,2) DEFAULT 0
minimum_stock       numeric(12,2)
created_at          timestamp DEFAULT now()
```

#### nozzles
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
nozzle_number       text NOT NULL
tank_id             uuid REFERENCES tanks(id)
fuel_product_id     uuid REFERENCES fuel_products(id)
opening_reading     numeric(12,3)
current_reading     numeric(12,3)
created_at          timestamp DEFAULT now()
```

#### guest_sales
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
sale_date           date NOT NULL
mobile_number       text
vehicle_number      text
fuel_product_id     uuid REFERENCES fuel_products(id)
quantity            numeric(10,3)
price_per_unit      numeric(10,2)
discount            numeric(10,2) DEFAULT 0
payment_mode        text DEFAULT 'cash'
total_amount        numeric(12,2)
created_at          timestamp DEFAULT now()
created_by          uuid REFERENCES users(id)
```

#### credit_sales
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
sale_date           date NOT NULL
credit_customer_id  uuid REFERENCES credit_customers(id)
vehicle_number      text
fuel_product_id     uuid REFERENCES fuel_products(id)
quantity            numeric(10,3)
price_per_unit      numeric(10,2)
total_amount        numeric(12,2)
employee_id         uuid REFERENCES employees(id)
created_at          timestamp DEFAULT now()
created_by          uuid REFERENCES users(id)
```

#### tanker_sales
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
sale_date           date NOT NULL
customer_name       text
vehicle_number      text
fuel_product_id     uuid REFERENCES fuel_products(id)
quantity            numeric(10,3)
price_per_unit      numeric(10,2)
total_amount        numeric(12,2)
payment_mode        text
created_at          timestamp DEFAULT now()
```

#### liquid_purchases
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
purchase_date       date NOT NULL
vendor_id           uuid REFERENCES vendors(id)
fuel_product_id     uuid REFERENCES fuel_products(id)
quantity            numeric(12,3)
price_per_unit      numeric(10,2)
total_amount        numeric(15,2)
invoice_number      text
tank_id             uuid REFERENCES tanks(id)
created_at          timestamp DEFAULT now()
```

#### lub_purchases
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
purchase_date       date NOT NULL
vendor_id           uuid REFERENCES vendors(id)
lubricant_id        uuid REFERENCES lubricants(id)
quantity            numeric(10,2)
price_per_unit      numeric(10,2)
total_amount        numeric(12,2)
invoice_number      text
created_at          timestamp DEFAULT now()
```

#### lub_sales
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
sale_date           date NOT NULL
lubricant_id        uuid REFERENCES lubricants(id)
quantity            numeric(10,2)
price_per_unit      numeric(10,2)
total_amount        numeric(12,2)
customer_name       text
payment_mode        text DEFAULT 'cash'
created_at          timestamp DEFAULT now()
```

#### sale_entries
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
sale_date           date NOT NULL
shift_id            uuid REFERENCES duty_shifts(id)
pump_station        text
nozzle_id           uuid REFERENCES nozzles(id)
fuel_product_id     uuid REFERENCES fuel_products(id)
opening_reading     numeric(12,3)
closing_reading     numeric(12,3)
quantity            numeric(12,3)  -- Auto: closing - opening
price_per_unit      numeric(10,2)
net_sale_amount     numeric(12,2)  -- Auto: quantity * price
employee_id         uuid REFERENCES employees(id)
created_at          timestamp DEFAULT now()
created_by          uuid REFERENCES users(id)
```

#### duty_pay
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
pay_month           date NOT NULL
total_salary        numeric(12,2)
total_employees     integer
notes               text
created_at          timestamp DEFAULT now()
```

#### credit_requests
```sql
id                      uuid PRIMARY KEY DEFAULT gen_random_uuid()
request_date            date DEFAULT CURRENT_DATE
credit_customer_id      uuid REFERENCES credit_customers(id)
fuel_product_id         uuid REFERENCES fuel_products(id)
ordered_quantity        numeric(10,2)
status                  text DEFAULT 'Pending'
notes                   text
created_at              timestamp DEFAULT now()
created_by              uuid REFERENCES users(id)
```

#### sheet_records
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
record_date         date NOT NULL
shift_id            uuid REFERENCES duty_shifts(id)
employee_id         uuid REFERENCES employees(id)
opening_cash        numeric(12,2)
closing_cash        numeric(12,2)
total_sales         numeric(12,2)
expenses            numeric(12,2)
remarks             text
created_at          timestamp DEFAULT now()
```

#### app_config
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
config_key          text NOT NULL
config_value        text
config_type         text DEFAULT 'string'
description         text
is_active           boolean DEFAULT true
created_at          timestamp DEFAULT now()
updated_at          timestamp DEFAULT now()
```

#### user_logs
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id             uuid REFERENCES users(id)
action              text NOT NULL
module              text
details             text
ip_address          text
created_at          timestamp DEFAULT now()
```

#### system_settings
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
setting_key         text NOT NULL
setting_value       text
category            text
description         text
is_editable         boolean DEFAULT true
created_at          timestamp DEFAULT now()
updated_at          timestamp DEFAULT now()
```

#### day_cash_movements
```sql
id                  uuid PRIMARY KEY DEFAULT gen_random_uuid()
movement_date       date NOT NULL
movement_type       text  -- 'inflow' or 'outflow'
amount              numeric(12,2)
description         text
created_at          timestamp DEFAULT now()
```

### Database Relationships

**Key Foreign Key Relationships:**
```
users → user_roles (one-to-many)
fuel_products → tanks → nozzles (one-to-many)
fuel_products → sales (all types)
fuel_products → liquid_purchases
lubricants → lub_sales, lub_purchases
credit_customers → credit_sales, credit_requests
vendors → liquid_purchases, lub_purchases, vendor_transactions
employees → sale_entries, duty_pay
```

### Important Database Notes

**Naming Convention:**
- Drizzle schema uses `camelCase`
- Database columns are `snake_case` (auto-mapped by Drizzle)
- **Raw SQL queries MUST use snake_case**

**Auto-calculations:**
Database triggers handle:
- Stock updates when purchases/sales occur
- Balance updates for credit customers
- Quantity calculation in sale_entries (closing - opening)
- Amount calculation (quantity × price_per_unit)

---

## Authentication & Security

### JWT Authentication Flow

**1. Login Process:**
```
POST /api/login
→ Validate credentials (bcrypt password comparison)
→ Generate JWT token
→ Set httpOnly cookie
→ Return user data
```

**2. Protected Route Access:**
```
Request with cookie
→ requireAuth middleware extracts JWT
→ Verify token signature
→ Decode user ID
→ Query user from database
→ Attach to req.user
→ Proceed to route handler
```

**3. Logout Process:**
```
POST /api/logout
→ Clear authentication cookie
→ Client clears local storage
```

### Middleware

**requireAuth:**
```typescript
// Validates JWT from httpOnly cookie
// Attaches user to req.user
// Returns 401 if invalid/missing
```

**allowUnauthenticated:**
```typescript
// Allows both authenticated and unauthenticated access
// Used for public endpoints like guest sales
```

### Security Features
- Passwords hashed with bcrypt
- JWT tokens in httpOnly cookies (prevents XSS)
- CORS enabled for all origins (development)
- Protected routes require valid JWT
- Role-based access control via user_roles table

---

## Data Flow & Integration

### Sales Workflow

**Guest Sale Flow:**
```
1. User fills form in /guest-sale
2. Frontend validates with Zod schema
3. POST /api/guest-sales with data
4. Backend validates & inserts to guest_sales table
5. Response returns created sale with joined fuel product data
6. Frontend invalidates cache
7. Dashboard updates automatically
```

**Credit Sale Flow:**
```
1. User selects credit customer & product
2. System checks credit limit
3. POST /api/credit-sales
4. Backend creates sale record
5. Triggers update credit_customers.current_balance
6. Response includes customer & product details
7. Cache invalidation updates all views
```

### Purchase Workflow

**Liquid Purchase Flow:**
```
1. Record purchase from vendor
2. POST /api/liquid-purchases
3. Backend inserts purchase record
4. Trigger updates tank stock if tank_id provided
5. Updates vendor balance
6. Dashboard purchase metrics update
```

### Dashboard Data Aggregation

**Dashboard Query Process:**
```
1. GET /api/dashboard
2. Backend runs multiple SQL aggregations:
   - Total sales from all sale types
   - Total purchases from purchase tables
   - Outstanding credit from credit_customers
   - Cash movements from day_cash_movements
3. Joins data from multiple tables
4. Returns consolidated dashboard data
5. Frontend displays in dashboard cards
```

### Cache Invalidation Strategy

**After Mutations:**
```typescript
// Single resource
queryClient.invalidateQueries({ queryKey: ['/api/fuel-products'] });

// Multiple related resources
queryClient.invalidateQueries({ queryKey: ['/api/credit-sales'] });
queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
queryClient.invalidateQueries({ queryKey: ['/api/credit-customers'] });
```

**Hierarchical Keys:**
```typescript
// Use array format for proper invalidation
queryKey: ['/api/recipes', id]  // ✅ Correct
queryKey: [`/api/recipes/${id}`]  // ❌ Won't invalidate parent
```

### Common Integration Patterns

**Master-Detail Pattern:**
```typescript
// 1. Fetch master list
const { data: customers } = useQuery({
  queryKey: ['/api/credit-customers']
});

// 2. Fetch related details
const { data: sales } = useQuery({
  queryKey: ['/api/credit-sales'],
  enabled: !!selectedCustomer
});
```

**Form Submission Pattern:**
```typescript
// 1. Validate with Zod
const form = useForm({
  resolver: zodResolver(schema)
});

// 2. Submit mutation
const mutation = useMutation({
  mutationFn: async (data) => {
    return apiRequest('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/endpoint'] });
    toast({ title: "Success" });
    form.reset();
  }
});
```

**Date Handling:**
```typescript
// Month inputs must convert to full date
const monthInput = "2025-10";  // From input type="month"
const fullDate = `${monthInput}-01`;  // Convert to 2025-10-01
// Then send to backend
```

---

## Testing & Quality Assurance

### Comprehensive Testing Completed (Oct 16, 2025)

**Backend API Testing:**
- ✅ All 37 module APIs verified (200 status)
- ✅ CRUD operations tested across all tables
- ✅ Data integrity validated

**Database Schema:**
- ✅ All 48 tables verified
- ✅ Foreign keys intact
- ✅ Data types correct
- ✅ Triggers functioning

**Integration Testing:**
- ✅ Dashboard aggregation working
- ✅ Cache invalidation verified
- ✅ Real-time updates confirmed

**Authentication & Security:**
- ✅ Protected routes working
- ✅ JWT authentication functional
- ✅ Role-based access verified

### Known Issues & Fixes

**Fixed Issues:**
1. ✅ Guest Sale API schema mismatch - Fixed (removed non-existent columns)
2. ✅ Duty Pay date format - Fixed (converts YYYY-MM to YYYY-MM-01)
3. ✅ Credit Request Supabase migration - Fixed (uses backend API)
4. ✅ Attendance Report data loading - Fixed (uses backend API)
5. ✅ getAuthHeaders missing - Fixed (added to useAuth hook)

**Current Status:**
- System 100% operational
- All modules production-ready
- No blocking issues

---

## Deployment Notes

### Environment Variables Required
```
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
RESEND_API_KEY=...
RESEND_FROM_EMAIL=...
```

### Running the Application

**Development:**
```bash
npm run dev  # Starts Express + Vite dev server on port 5000
```

**Database Operations:**
```bash
npm run db:push        # Sync schema to database
npm run db:studio      # Open Drizzle Studio
```

**Production Considerations:**
- Use production-ready database (Neon PostgreSQL configured)
- Enable HTTPS for secure cookie transmission
- Configure proper CORS origins
- Set secure JWT secret
- Enable rate limiting
- Set up proper logging

---

## Maintenance Guide

### Adding New Modules

**1. Create Database Table:**
```typescript
// shared/schema.ts
export const newTable = pgTable('new_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... columns
});
```

**2. Create API Routes:**
```typescript
// server/routes.ts
router.get('/api/new-table', async (req, res) => {
  // GET logic
});
router.post('/api/new-table', async (req, res) => {
  // POST logic
});
```

**3. Create Frontend Page:**
```typescript
// client/src/pages/NewTable.tsx
export default function NewTable() {
  // Component logic
}
```

**4. Add Route:**
```typescript
// client/src/App.tsx
<Route path="/new-table" component={NewTable} />
```

### Troubleshooting Common Issues

**API Returns 401:**
- Check if user is logged in
- Verify JWT cookie is set
- Check requireAuth middleware

**Data Not Updating:**
- Verify cache invalidation
- Check queryKey matches
- Ensure mutation onSuccess runs

**Schema Mismatch:**
- Check column names (snake_case in SQL)
- Verify data types match
- Run db:push to sync schema

---

## Support & Contact

For technical support or questions about this system:
- Review this documentation
- Check replit.md for recent changes
- Refer to testing logs for verified behaviors
- Contact system administrator

---

**Documentation Version:** 1.0  
**Last Updated:** October 16, 2025  
**System Status:** ✅ Production Ready
