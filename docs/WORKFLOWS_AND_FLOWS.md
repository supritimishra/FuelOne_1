# System Workflows & Data Flows

This document describes how data flows through the Ramkrishna Service Centre system for common business operations.

---

## 📊 Authentication Flow

### Login Process
```
User enters credentials
    ↓
Frontend validates form (Zod)
    ↓
POST /api/login
    ↓
Backend:
  - Validates email/username exists
  - Compares password hash (bcrypt)
  - Generates JWT token
  - Sets httpOnly cookie
    ↓
Returns user data
    ↓
Frontend:
  - Stores user in state
  - Stores in localStorage
  - Redirects to /home
```

### Protected Route Access
```
User navigates to protected route
    ↓
Frontend checks authentication
    ↓
If not authenticated → Redirect to login
    ↓
If authenticated:
  - Request sent with cookie
  - requireAuth middleware validates JWT
  - Extracts user from token
  - Attaches to req.user
  - Proceeds to route handler
```

---

## 💰 Sales Workflows

### Guest Sale Flow
```
1. User opens /guest-sale
    ↓
2. Fills form:
   - Mobile/Vehicle number
   - Fuel product (dropdown from /api/fuel-products)
   - Quantity & Price
   - Payment mode
    ↓
3. Frontend validates (Zod schema)
    ↓
4. POST /api/guest-sales
    ↓
5. Backend:
   - Validates fuel_product_id exists
   - Inserts to guest_sales table
   - Returns created record with joined fuel product data
    ↓
6. Frontend:
   - Invalidates queries: ['/api/guest-sales'], ['/api/dashboard']
   - Shows success toast
   - Form resets
    ↓
7. Dashboard auto-updates with new sale
```

### Credit Sale Flow
```
1. User opens /credit-sale
    ↓
2. Selects credit customer (from /api/credit-customers)
    ↓
3. System checks:
   - Customer's current balance
   - Customer's credit limit
   - Warns if approaching limit
    ↓
4. Fills sale details:
   - Fuel product
   - Quantity & Price
   - Vehicle number
   - Employee (optional)
    ↓
5. POST /api/credit-sales
    ↓
6. Backend:
   - Inserts credit_sales record
   - Database trigger updates:
     * credit_customers.current_balance += total_amount
   - Returns sale with customer & product details
    ↓
7. Frontend invalidates:
   - ['/api/credit-sales']
   - ['/api/credit-customers']
   - ['/api/dashboard']
    ↓
8. All affected views update automatically
```

### Tanker Sale Flow
```
1. User opens /tanker-sale
    ↓
2. Enters:
   - Customer name
   - Vehicle number
   - Fuel product & Quantity
   - Payment mode
    ↓
3. POST /api/tanker-sales
    ↓
4. Backend inserts record
    ↓
5. Cache invalidation:
   - ['/api/tanker-sales']
   - ['/api/dashboard']
    ↓
6. Dashboard shows updated totals
```

---

## 🛒 Purchase Workflows

### Liquid Purchase Flow
```
1. User opens /liquid-purchases
    ↓
2. Selects vendor (from /api/vendors)
    ↓
3. Fills form:
   - Fuel product
   - Quantity & Price
   - Invoice number
   - Tank (optional)
    ↓
4. POST /api/liquid-purchases
    ↓
5. Backend:
   - Inserts liquid_purchases record
   - If tank_id provided:
     * Database trigger updates tanks.current_stock += quantity
   - Updates vendor balance (if tracking)
    ↓
6. Frontend invalidates:
   - ['/api/liquid-purchases']
   - ['/api/tanks']
   - ['/api/dashboard']
    ↓
7. Stock reports auto-update
```

### Lubricant Purchase Flow
```
1. User opens /lubricant-purchases
    ↓
2. Selects vendor & lubricant
    ↓
3. Enters quantity & price
    ↓
4. POST /api/lub-purchases
    ↓
5. Backend:
   - Inserts lub_purchases record
   - Trigger updates lubricants.stock_quantity += quantity
    ↓
6. Invalidate caches:
   - ['/api/lub-purchases']
   - ['/api/lubricants']
   - ['/api/lubricant-stock']
    ↓
7. Stock levels update across system
```

---

## 📝 Daily Operations

### Sale Entry (Meter Reading) Flow
```
1. User opens /sale-entry
    ↓
2. Selects:
   - Date & Shift
   - Nozzle (from /api/nozzles)
   - Fuel product
   - Employee
    ↓
3. Enters:
   - Opening reading: 1000.000
   - Closing reading: 1500.000
   - Price per unit: 95.50
    ↓
4. POST /api/sale-entries
    ↓
5. Backend auto-calculates:
   - quantity = 1500.000 - 1000.000 = 500.000
   - net_sale_amount = 500.000 × 95.50 = 47,750.00
    ↓
6. Updates:
   - Inserts sale_entries record
   - Updates nozzle.current_reading = 1500.000
    ↓
7. Cache invalidation:
   - ['/api/sale-entries']
   - ['/api/nozzles']
   - ['/api/dashboard']
```

### Duty Pay Flow
```
1. User opens /duty-pay
    ↓
2. Selects month: "2025-10"
    ↓
3. Enters:
   - Total salary: 150,000
   - Total employees: 6
   - Notes
    ↓
4. Frontend converts:
   - "2025-10" → "2025-10-01"
    ↓
5. POST /api/duty-pay
    ↓
6. Backend inserts duty_pay record
    ↓
7. Cache invalidation:
   - ['/api/duty-pay']
```

### Day Settlement Flow
```
1. End of day, user opens /day-settlement
    ↓
2. System aggregates:
   - Total sales (all types)
   - Total cash collected
   - Total expenses
   - Credit sales (outstanding)
    ↓
3. User verifies and adjusts if needed
    ↓
4. POST /api/day-settlements
    ↓
5. Backend:
   - Records settlement
   - Locks day's transactions
   - Updates cash movements
    ↓
6. Financial reports update
```

---

## 💳 Credit Management

### Credit Request Flow
```
1. Customer requests credit increase
    ↓
2. User opens /credit-requests
    ↓
3. Selects customer & fuel product
    ↓
4. Enters ordered quantity
    ↓
5. POST /api/credit-requests
    ↓
6. Backend:
   - Creates request with status="Pending"
   - Notifies relevant users
    ↓
7. Manager reviews:
   - Checks customer history
   - Reviews current balance
   - Approves or rejects
    ↓
8. PUT /api/credit-requests/:id
   - Updates status
    ↓
9. If approved:
   - Customer's credit_limit increased
   - Email notification sent
```

### Recovery Flow
```
1. Customer makes payment
    ↓
2. User opens /recovery
    ↓
3. Selects credit customer
    ↓
4. Enters recovery amount
    ↓
5. POST /api/recoveries
    ↓
6. Backend:
   - Inserts recovery record
   - Trigger updates:
     * credit_customers.current_balance -= recovery_amount
    ↓
7. Cache invalidation:
   - ['/api/recoveries']
   - ['/api/credit-customers']
   - ['/api/dashboard']
    ↓
8. Customer balance reflects payment
```

---

## 📊 Dashboard Data Aggregation

### Dashboard Load Process
```
1. User opens /home
    ↓
2. useQuery({ queryKey: ['/api/dashboard'] })
    ↓
3. GET /api/dashboard
    ↓
4. Backend runs multiple queries in parallel:
   
   Query 1: Total Sales
   SELECT SUM(total_amount) FROM (
     SELECT total_amount FROM guest_sales WHERE sale_date = CURRENT_DATE
     UNION ALL
     SELECT total_amount FROM credit_sales WHERE sale_date = CURRENT_DATE
     UNION ALL
     SELECT total_amount FROM lub_sales WHERE sale_date = CURRENT_DATE
     UNION ALL
     SELECT total_amount FROM swipe_transactions WHERE sale_date = CURRENT_DATE
   )
   
   Query 2: Sales Breakdown
   SELECT 
     'guest_sales' as type,
     COUNT(*) as count,
     SUM(total_amount) as total_amount
   FROM guest_sales WHERE sale_date = CURRENT_DATE
   (repeated for each sale type)
   
   Query 3: Purchase Breakdown
   SELECT SUM(total_amount) FROM liquid_purchases WHERE purchase_date = CURRENT_DATE
   (similar for lubricant purchases)
   
   Query 4: Outstanding Credit
   SELECT 
     COUNT(*) as total_customers,
     SUM(current_balance) as total_outstanding
   FROM credit_customers WHERE current_balance > 0
   
   Query 5: Recent Transactions
   SELECT * FROM (
     SELECT 'guest_sale' as type, mobile_number as description, 
            total_amount, sale_date, created_at FROM guest_sales
     UNION ALL
     SELECT 'credit_sale', cc.organization_name, 
            cs.total_amount, cs.sale_date, cs.created_at 
     FROM credit_sales cs 
     JOIN credit_customers cc ON cs.credit_customer_id = cc.id
   ) ORDER BY created_at DESC LIMIT 10
   
   Query 6: Cash Flow
   SELECT 
     SUM(CASE WHEN movement_type='inflow' THEN amount ELSE 0 END) as inflows,
     SUM(CASE WHEN movement_type='outflow' THEN amount ELSE 0 END) as outflows
   FROM day_cash_movements WHERE movement_date = CURRENT_DATE
    ↓
5. Backend combines all results into single response
    ↓
6. Frontend receives data:
   {
     summary: { totalSales, totalPurchases, ... },
     salesBreakdown: [...],
     purchaseBreakdown: [...],
     recentTransactions: [...]
   }
    ↓
7. React components render cards with live data
    ↓
8. Any sale/purchase triggers cache invalidation → Dashboard auto-updates
```

---

## 🔄 Cache Invalidation Strategy

### Single Resource Update
```
User creates/updates a fuel product
    ↓
mutation.mutate(data)
    ↓
onSuccess: () => {
  queryClient.invalidateQueries({ 
    queryKey: ['/api/fuel-products'] 
  });
}
    ↓
All components using fuel products refetch
```

### Cascading Updates
```
User creates credit sale
    ↓
POST /api/credit-sales succeeds
    ↓
Backend updates credit_customers.current_balance
    ↓
Frontend invalidates multiple caches:
  - ['/api/credit-sales'] → Sales list updates
  - ['/api/credit-customers'] → Customer list updates
  - ['/api/dashboard'] → Dashboard totals update
    ↓
All affected components refetch automatically
```

### Hierarchical Keys
```
// Parent-child relationship
queryKey: ['/api/credit-sales', customerId]

// Invalidate all sales for a customer:
queryClient.invalidateQueries({ 
  queryKey: ['/api/credit-sales', customerId] 
});

// Invalidate ALL credit sales:
queryClient.invalidateQueries({ 
  queryKey: ['/api/credit-sales'] 
});
```

---

## 🔐 Authorization Flow

### Role-Based Access
```
1. User logs in
    ↓
2. Backend queries user_roles table
    ↓
3. Returns user object with role:
   { id, email, username, role: 'super_admin' }
    ↓
4. Frontend stores role in auth context
    ↓
5. When accessing restricted features:
   
   if (user.role !== 'super_admin') {
     return <UnauthorizedMessage />;
   }
    ↓
6. Backend also validates:
   
   if (req.user.role !== 'super_admin') {
     return res.status(403).json({ 
       ok: false, 
       error: 'Insufficient permissions' 
     });
   }
```

### Protected Route Pattern
```
<Route path="/admin-panel">
  <AdminRoute>
    <AdminPanel />
  </AdminRoute>
</Route>

// AdminRoute component
function AdminRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  if (user.role !== 'super_admin') {
    return <UnauthorizedMessage />;
  }
  
  return children;
}
```

---

## 📈 Report Generation

### Customer Statement Flow
```
1. User opens /statement
    ↓
2. Selects:
   - Credit customer
   - Date range (from/to)
    ↓
3. GET /api/statement?customer_id=UUID&from=DATE&to=DATE
    ↓
4. Backend queries:
   - Credit sales in date range
   - Recoveries in date range
   - Joins with fuel products
   - Calculates running balance
    ↓
5. Returns structured data:
   [
     {
       date: '2025-10-01',
       type: 'Sale',
       description: '100L Petrol',
       debit: 9550,
       credit: 0,
       balance: 9550
     },
     {
       date: '2025-10-05',
       type: 'Payment',
       description: 'Cash Recovery',
       debit: 0,
       credit: 5000,
       balance: 4550
     }
   ]
    ↓
6. Frontend displays in table
    ↓
7. User can:
   - Print
   - Export to PDF/CSV
   - Email to customer
```

### Stock Report Flow
```
1. User opens /stock-reports
    ↓
2. GET /api/stock-reports
    ↓
3. Backend queries:
   SELECT 
     t.tank_number,
     fp.product_name,
     t.capacity,
     t.current_stock,
     t.minimum_stock,
     (t.capacity - t.current_stock) as available,
     CASE 
       WHEN t.current_stock <= t.minimum_stock 
       THEN 'Low Stock' 
       ELSE 'OK' 
     END as status
   FROM tanks t
   JOIN fuel_products fp ON t.fuel_product_id = fp.id
    ↓
4. Returns tank data with stock levels
    ↓
5. Frontend:
   - Displays in table
   - Highlights low stock in red
   - Shows capacity charts
   - Allows filtering by product
```

---

## 🔔 Real-Time Updates

### Event Flow
```
User A creates a sale
    ↓
POST /api/guest-sales
    ↓
Database updated
    ↓
Response sent to User A
    ↓
User A's cache invalidated
    ↓
User A's UI updates
    ↓
User B (on dashboard) has stale cache
    ↓
User B clicks refresh or waits for staleTime
    ↓
React Query refetches data
    ↓
User B sees updated dashboard
```

### Stale-While-Revalidate Pattern
```
User opens dashboard
    ↓
React Query checks cache:
  - Fresh (< 5 min old) → Use cache, show data
  - Stale (> 5 min old) → Use cache, show data, refetch in background
  - Missing → Show loading, fetch data
    ↓
If stale, refetches in background
    ↓
When new data arrives:
  - Silently updates UI
  - No loading spinner
  - Smooth user experience
```

---

## 🛠️ Error Handling Flow

### API Error Flow
```
User submits form
    ↓
Frontend validates (Zod)
    ↓
If validation fails:
  - Show field errors
  - Highlight invalid fields
  - Don't send request
    ↓
If validation passes:
  - POST to backend
    ↓
Backend validates:
  - Check required fields
  - Validate UUIDs
  - Check business rules
    ↓
If backend validation fails:
  - Returns { ok: false, error: "message" }
    ↓
Frontend:
  - Shows error toast
  - Logs to console
  - Keeps form data (doesn't reset)
    ↓
If database error:
  - Backend catches error
  - Logs to server
  - Returns generic error to client
  - { ok: false, error: "Database error" }
    ↓
Frontend:
  - Shows user-friendly message
  - Suggests retry
  - Logs technical details
```

### Network Error Flow
```
User submits form
    ↓
Network request fails (timeout/offline)
    ↓
React Query retry logic:
  - Retry 1 (after 1 second)
  - Retry 2 (after 2 seconds)
  - Retry 3 (after 4 seconds)
    ↓
If all retries fail:
  - mutation.isError = true
    ↓
Frontend:
  - Shows "Network error" toast
  - "Please check your connection"
  - Keeps form data
  - Enables retry button
```

---

## 📊 Data Consistency

### Transaction Pattern
```
User creates credit sale for ₹10,000
    ↓
Backend starts transaction:
  BEGIN;
    ↓
    1. INSERT into credit_sales
       VALUES (..., total_amount: 10000)
    ↓
    2. UPDATE credit_customers
       SET current_balance = current_balance + 10000
       WHERE id = customer_id
    ↓
    If both succeed: COMMIT;
    If either fails: ROLLBACK;
    ↓
Response sent to frontend
```

### Optimistic Update Pattern
```
User deletes a fuel product
    ↓
Frontend immediately:
  - Removes from UI
  - Shows as deleted
    ↓
Sends DELETE request
    ↓
If request succeeds:
  - Keep UI as is
  - Show success toast
    ↓
If request fails:
  - Restore item to UI
  - Show error toast
  - Roll back optimistic update
```

---

## 🔍 Search & Filter Flow

### Dynamic Filtering
```
User on /credit-sales page
    ↓
Filters displayed:
  - Date range picker
  - Customer dropdown
  - Fuel product dropdown
    ↓
User selects filters:
  - From: 2025-10-01
  - To: 2025-10-31
  - Customer: ABC Company
    ↓
Query params built:
  /api/credit-sales?from=2025-10-01&to=2025-10-31&customer_id=UUID
    ↓
Backend applies WHERE clauses:
  WHERE sale_date BETWEEN $1 AND $2
    AND credit_customer_id = $3
    ↓
Returns filtered results
    ↓
Frontend displays filtered table
    ↓
User clears filter:
  - Query params removed
  - Fetches all records again
```

---

## 🎯 Key Takeaways

### Data Flow Principles
1. **Frontend validates first** - Catch errors early
2. **Backend validates always** - Never trust client
3. **Cache invalidation** - Keep UI in sync
4. **Optimistic updates** - Instant feedback
5. **Error handling** - Graceful degradation

### Performance Patterns
1. **Parallel queries** - Fetch independent data together
2. **Stale-while-revalidate** - Show cached data, update in background
3. **Hierarchical keys** - Efficient cache invalidation
4. **Database indexes** - Fast queries on large tables

### Security Patterns
1. **JWT in httpOnly cookies** - XSS protection
2. **Role-based checks** - Frontend + Backend
3. **Input validation** - Zod schemas
4. **SQL injection prevention** - Parameterized queries

---

**Last Updated:** October 16, 2025  
**System Status:** ✅ All flows operational
