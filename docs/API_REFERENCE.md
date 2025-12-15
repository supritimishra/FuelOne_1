# API Reference - Quick Guide

## Authentication APIs

### POST /api/signup
Register new user
```json
Request: { "email": "user@example.com", "password": "pass123", "username": "optional" }
Response: { "ok": true, "user": { "id": "...", "email": "..." } }
```

### POST /api/login
Login with email or username
```json
Request: { "email": "user@example.com", "password": "pass123" }
Response: { "ok": true, "user": { "id": "...", "email": "...", "username": "..." } }
```

### POST /api/logout
Logout current user
```json
Response: { "ok": true }
```

### GET /api/user
Get current authenticated user
```json
Response: { "ok": true, "user": { "id": "...", "email": "...", "username": "..." } }
```

---

## Master Data APIs

### Fuel Products
- `GET /api/fuel-products` - List all
- `POST /api/fuel-products` - Create
- `PUT /api/fuel-products/:id` - Update
- `DELETE /api/fuel-products/:id` - Delete

### Lubricants
- `GET /api/lubricants` - List all
- `POST /api/lubricants` - Create
- `PUT /api/lubricants/:id` - Update
- `DELETE /api/lubricants/:id` - Delete

### Credit Customers
- `GET /api/credit-customers` - List all
- `POST /api/credit-customers` - Create
- `PUT /api/credit-customers/:id` - Update
- `DELETE /api/credit-customers/:id` - Delete

### Employees
- `GET /api/employees` - List all
- `POST /api/employees` - Create
- `PUT /api/employees/:id` - Update
- `DELETE /api/employees/:id` - Delete

### Vendors
- `GET /api/vendors` - List all
- `POST /api/vendors` - Create
- `PUT /api/vendors/:id` - Update
- `DELETE /api/vendors/:id` - Delete

### Tanks
- `GET /api/tanks` - List all (returns array directly)
- `POST /api/tanks` - Create
- `PUT /api/tanks/:id` - Update
- `DELETE /api/tanks/:id` - Delete

### Nozzles
- `GET /api/nozzles` - List all (returns array directly)
- `POST /api/nozzles` - Create
- `PUT /api/nozzles/:id` - Update
- `DELETE /api/nozzles/:id` - Delete

### Expense Types
- `GET /api/expense-types` - List all
- `POST /api/expense-types` - Create
- `PUT /api/expense-types/:id` - Update
- `DELETE /api/expense-types/:id` - Delete

### Swipe Machines
- `GET /api/swipe-machines` - List all
- `POST /api/swipe-machines` - Create
- `PUT /api/swipe-machines/:id` - Update
- `DELETE /api/swipe-machines/:id` - Delete

### Business Parties
- `GET /api/business-parties` - List all
- `POST /api/business-parties` - Create
- `PUT /api/business-parties/:id` - Update
- `DELETE /api/business-parties/:id` - Delete

---

## Sales APIs

### Guest Sales
```
GET    /api/guest-sales
POST   /api/guest-sales
PUT    /api/guest-sales/:id
DELETE /api/guest-sales/:id
```

**POST Request:**
```json
{
  "sale_date": "2025-10-16",
  "mobile_number": "9876543210",
  "vehicle_number": "KA01AB1234",
  "fuel_product_id": "uuid",
  "quantity": 100,
  "price_per_unit": 95.50,
  "discount": 0,
  "payment_mode": "Cash",
  "total_amount": 9550
}
```

### Credit Sales
```
GET    /api/credit-sales
POST   /api/credit-sales
PUT    /api/credit-sales/:id
DELETE /api/credit-sales/:id
```

**POST Request:**
```json
{
  "sale_date": "2025-10-16",
  "credit_customer_id": "uuid",
  "vehicle_number": "KA01AB1234",
  "fuel_product_id": "uuid",
  "quantity": 200,
  "price_per_unit": 95.50,
  "total_amount": 19100,
  "employee_id": "uuid"
}
```

### Tanker Sales
```
GET    /api/tanker-sales?from=DATE&to=DATE
POST   /api/tanker-sales
PUT    /api/tanker-sales/:id
DELETE /api/tanker-sales/:id
```

### Swipe Sales (Swipe Transactions)
```
GET    /api/swipe-transactions
POST   /api/swipe-transactions
PUT    /api/swipe-transactions/:id
DELETE /api/swipe-transactions/:id
```

### Lubricant Sales
```
GET    /api/lub-sales
POST   /api/lub-sales
PUT    /api/lub-sales/:id
DELETE /api/lub-sales/:id
```

---

## Purchase APIs

### Liquid Purchases
```
GET    /api/liquid-purchases
POST   /api/liquid-purchases
PUT    /api/liquid-purchases/:id
DELETE /api/liquid-purchases/:id
```

**POST Request:**
```json
{
  "purchase_date": "2025-10-16",
  "vendor_id": "uuid",
  "fuel_product_id": "uuid",
  "quantity": 5000,
  "price_per_unit": 90,
  "total_amount": 450000,
  "invoice_number": "INV-001",
  "tank_id": "uuid"
}
```

### Lubricant Purchases
```
GET    /api/lub-purchases
POST   /api/lub-purchases
PUT    /api/lub-purchases/:id
DELETE /api/lub-purchases/:id
```

---

## Operations APIs

### Sale Entries (Meter Readings)
```
GET    /api/sale-entries
POST   /api/sale-entries
PUT    /api/sale-entries/:id
DELETE /api/sale-entries/:id
```

**POST Request:**
```json
{
  "sale_date": "2025-10-16",
  "shift_id": "uuid",
  "pump_station": "Pump 1",
  "nozzle_id": "uuid",
  "fuel_product_id": "uuid",
  "opening_reading": 1000,
  "closing_reading": 1500,
  "price_per_unit": 95,
  "employee_id": "uuid"
}
```
*quantity and net_sale_amount are auto-calculated*

### Duty Pay
```
GET    /api/duty-pay
POST   /api/duty-pay
PUT    /api/duty-pay/:id
DELETE /api/duty-pay/:id
```

**POST Request:**
```json
{
  "pay_month": "2025-10-01",
  "total_salary": 150000,
  "total_employees": 6,
  "notes": "Monthly salary for October 2025"
}
```
**Important:** Frontend must convert YYYY-MM to YYYY-MM-01

### Credit Requests
```
GET    /api/credit-requests
POST   /api/credit-requests
PUT    /api/credit-requests/:id
DELETE /api/credit-requests/:id
```

**POST Request:**
```json
{
  "credit_customer_id": "uuid",
  "fuel_product_id": "uuid",
  "ordered_quantity": 5000,
  "status": "Pending",
  "notes": "Request for 5000L petrol"
}
```

### Sheet Records
```
GET    /api/sheet-records
POST   /api/sheet-records
PUT    /api/sheet-records/:id
DELETE /api/sheet-records/:id
```

### Daily Sale Rates
```
GET    /api/daily-sale-rates
POST   /api/daily-sale-rates
PUT    /api/daily-sale-rates/:id
DELETE /api/daily-sale-rates/:id
```

### Day Settlements
```
GET    /api/day-settlements
POST   /api/day-settlements
PUT    /api/day-settlements/:id
DELETE /api/day-settlements/:id
```-

### Denominations
```
GET    /api/denominations
POST   /api/denominations
PUT    /api/denominations/:id
DELETE /api/denominations/:id
```_

### Recoveries
```
GET    /api/recoveries
POST   /api/recoveries
PUT    /api/recoveries/:id
DELETE /api/recoveries/:id
```

---

## Transaction APIs

### Business Transactions
```
GET    /api/business-transactions
POST   /api/business-transactions
PUT    /api/business-transactions/:id
DELETE /api/business-transactions/:id
```

### Vendor Transactions
```
GET    /api/vendor-transactions
POST   /api/vendor-transactions
PUT    /api/vendor-transactions/:id
DELETE /api/vendor-transactions/:id
```

### Interest Transactions
```
GET    /api/interest-transactions
POST   /api/interest-transactions
PUT    /api/interest-transactions/:id
DELETE /api/interest-transactions/:id
```

---

## Dashboard API

### GET /api/dashboard
Returns comprehensive dashboard data

**Response:**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "totalSales": 28650,
      "totalSalesCount": 2,
      "totalPurchases": 0,
      "totalOutstandingCredit": "0",
      "totalCreditCustomers": "0",
      "dailyInflows": "0",
      "dailyOutflows": "0",
      "netCashFlow": 0
    },
    "salesBreakdown": [
      { "type": "guest_sales", "count": "1", "total_amount": "9550.00" },
      { "type": "credit_sales", "count": "1", "total_amount": "19100.00" }
    ],
    "purchaseBreakdown": [
      { "type": "liquid_purchases", "count": "0", "total_amount": 0 }
    ],
    "recentTransactions": [
      {
        "type": "guest_sale",
        "description": "9876543210",
        "amount": "9550.00",
        "date": "2025-10-16",
        "created_at": "2025-10-16T15:47:15.782Z"
      }
    ]
  }
}
```

---

## Reports APIs

### Generate Invoice
```
POST   /api/generate-invoice
```

### Get Invoices
```
GET    /api/invoices
GET    /api/invoices/:id
DELETE /api/invoices/:id
```

### Credit Limit Reports
```
GET    /api/credit-limit-report
```

### Statement Generation
```
GET    /api/statement?customer_id=UUID&from=DATE&to=DATE
```

### Stock Reports
```
GET    /api/stock-reports
```

### Lubricant Stock
```
GET    /api/lubricant-stock
```

### Minimum Stock
```
GET    /api/minimum-stock
```

### Lubricant Loss
```
GET    /api/lubricant-loss
```

---

## Configuration APIs

### App Config
```
GET    /api/app-config
POST   /api/app-config
PUT    /api/app-config/:id
DELETE /api/app-config/:id
```

**POST Request:**
```json
{
  "config_key": "max_credit_days",
  "config_value": "30",
  "config_type": "number",
  "description": "Maximum credit days allowed",
  "is_active": true
}
```

### User Logs
```
GET    /api/user-log
POST   /api/user-log
DELETE /api/user-log/:id
```

**POST Request:**
```json
{
  "user_id": "uuid",
  "action": "Created sale",
  "module": "Guest Sale",
  "details": "Sale of ₹9,550",
  "ip_address": "192.168.1.1"
}
```

### System Settings
```
GET    /api/system-settings
POST   /api/system-settings
PUT    /api/system-settings/:id
DELETE /api/system-settings/:id
```

**POST Request:**
```json
{
  "setting_key": "company_name",
  "setting_value": "Ramkrishna Service Centre",
  "category": "General",
  "description": "Company display name",
  "is_editable": false
}
```

### Expiry Items
```
GET    /api/expiry-items
POST   /api/expiry-items
PUT    /api/expiry-items/:id
DELETE /api/expiry-items/:id
```

---

## Response Format Standards

### Success Response
```json
{
  "ok": true,
  "rows": [...],        // For list endpoints
  "row": {...}          // For single item endpoints
}
```

### Error Response
```json
{
  "ok": false,
  "error": "Error message here"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `404` - Not Found
- `500` - Server Error

---

## Authentication Headers

For protected endpoints, authentication is handled via httpOnly cookies set during login. No manual headers required for authenticated requests.

For endpoints requiring explicit headers (rare cases):
```javascript
const headers = {
  'Content-Type': 'application/json'
};
```

---

## Query Parameters

### Date Filtering
```
GET /api/tanker-sales?from=2025-10-01&to=2025-10-31
```

### Pagination (if implemented)
```
GET /api/credit-sales?page=1&limit=50
```

### Filtering
```
GET /api/sale-entries?shift_id=UUID&fuel_product_id=UUID
```

---

## Important Notes

1. **Date Format:** All dates should be in `YYYY-MM-DD` format
2. **UUID Format:** All IDs are UUIDs (e.g., `550e8400-e29b-41d4-a716-446655440000`)
3. **Decimal Precision:** 
   - Prices: 2 decimal places (10,2)
   - Quantities: 3 decimal places (10,3)
   - Amounts: 2 decimal places (12,2)
4. **Column Names:** Backend uses snake_case, Drizzle schema uses camelCase
5. **Response Structure:** Some endpoints return `{ ok, rows }`, others return arrays directly (tanks, nozzles)

---

## Testing Examples

### Create Guest Sale
```bash
curl -X POST http://localhost:5000/api/guest-sales \
  -H "Content-Type: application/json" \
  -d '{
    "sale_date": "2025-10-16",
    "fuel_product_id": "UUID",
    "quantity": 100,
    "price_per_unit": 95.5,
    "total_amount": 9550,
    "payment_mode": "Cash",
    "mobile_number": "9876543210"
  }'
```

### Get Dashboard Data
```bash
curl http://localhost:5000/api/dashboard
```

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@pump.com", "password": "password123"}'
```

---

**Last Updated:** October 16, 2025
