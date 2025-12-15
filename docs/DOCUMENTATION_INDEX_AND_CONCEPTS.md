# 📚 Documentation Index & System Concepts Guide

## 📑 Complete Documentation Index

### Core Documentation Files
| File | Purpose | Key Content |
|------|---------|-------------|
| **[README.md](./README.md)** | Main documentation hub | Quick navigation, system overview, quick start |
| **[SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md)** | Complete system guide | Architecture, APIs, database, workflows |
| **[API_REFERENCE.md](./API_REFERENCE.md)** | API quick reference | All endpoints, request/response examples |
| **[DATABASE_REFERENCE.md](./DATABASE_REFERENCE.md)** | Database schema guide | All 48 tables, relationships, queries |
| **[WORKFLOWS_AND_FLOWS.md](./WORKFLOWS_AND_FLOWS.md)** | Business process flows | Data flows, user journeys, integration patterns |

---

## 🏗️ System Architecture Overview

### Technology Stack
```
Frontend (React 18 + TypeScript)
├── UI Framework: Shadcn/ui + Tailwind CSS
├── State Management: TanStack Query v5
├── Routing: Wouter (lightweight)
├── Forms: React Hook Form + Zod validation
└── Build Tool: Vite

Backend (Express.js + TypeScript)
├── Database: PostgreSQL (Neon Serverless)
├── ORM: Drizzle
├── Authentication: JWT + httpOnly cookies
├── Security: bcrypt password hashing
└── Server: Express on port 5000

Database (PostgreSQL)
├── Total Tables: 48
├── Naming: snake_case (auto-mapped from camelCase)
├── IDs: UUID with gen_random_uuid()
└── Triggers: Auto-calculations for quantities/amounts
```

### Project Structure
```
PetroPal/
├── client/src/           # Frontend React application
│   ├── pages/           # 37 page components (modules)
│   ├── components/      # Reusable UI components
│   ├── hooks/          # Custom hooks (useAuth)
│   └── lib/            # Utilities and helpers
├── server/             # Backend Express application
│   ├── index.ts        # Server setup
│   ├── routes.ts      # All API endpoints
│   └── auth.ts         # Authentication middleware
├── shared/             # Shared code
│   └── schema.ts       # Drizzle database schema
├── db/                 # Database connection
│   └── index.ts        # Database setup
└── docs/               # Documentation
    ├── README.md       # Main index
    ├── SYSTEM_DOCUMENTATION.md
    ├── API_REFERENCE.md
    ├── DATABASE_REFERENCE.md
    └── WORKFLOWS_AND_FLOWS.md
```

---

## 🎯 Core System Concepts

### 1. Module-Based Architecture
The system is organized into **37 functional modules**:

**Master Data Management (10 modules):**
- Fuel Products, Lubricants, Credit Customers, Employees, Vendors
- Tanks, Nozzles, Expense Types, Swipe Machines, Business Parties

**Sales Operations (5 modules):**
- Guest Sale, Credit Sale, Swipe Sale, Tanker Sale, Lubricant Sale

**Purchase Operations (2 modules):**
- Liquid Purchases, Lubricant Purchases

**Daily Operations (7 modules):**
- Daily Cash Report, Denominations, Daily Sale Rate, Recovery
- Day Settlement, Sale Entry, Credit Requests

**Reports & Statements (8 modules):**
- Statement, Stock Reports, Lubricant Loss, Lubricant Stock
- Minimum Stock, Generate Invoice, Invoices, Credit Limit Report

**Transactions (3 modules):**
- Sheet Records, Business Transactions, Vendor Transactions, Interest Transactions

**System Management (4 modules):**
- Duty Pay, Expiry Items, App Config, User Log, System Settings

### 2. Database Design Principles

**Table Categories (48 total):**
- **Master Data (10):** Core business entities
- **Sales (7):** Transaction records
- **Purchase (3):** Procurement records
- **Financial (6):** Money flow tracking
- **Operational (8):** Daily operations
- **Reporting (5):** Analytics and reports
- **System (9):** Application infrastructure

**Key Design Patterns:**
- **UUID Primary Keys:** All tables use UUID with `gen_random_uuid()`
- **Foreign Key Relationships:** Proper referential integrity
- **Auto-calculations:** Database triggers for computed fields
- **Audit Trail:** `created_at`, `created_by` fields
- **Soft Deletes:** `is_active` flags instead of hard deletes

### 3. Authentication & Security Model

**JWT-Based Authentication:**
```
Login Flow:
1. User submits credentials
2. Backend validates (bcrypt comparison)
3. JWT token generated
4. httpOnly cookie set
5. User data returned

Protected Access:
1. Request includes cookie
2. requireAuth middleware validates JWT
3. User attached to req.user
4. Route handler proceeds
```

**Role-Based Access Control:**
- **super_admin:** Full system access
- **manager:** Operational access
- **DSM:** Limited access

**Security Features:**
- Passwords hashed with bcrypt
- JWT in httpOnly cookies (XSS protection)
- Protected routes require valid JWT
- Input validation with Zod schemas

### 4. State Management Strategy

**TanStack Query (React Query v5) Pattern:**
```typescript
// Query Pattern
const { data, isLoading } = useQuery({
  queryKey: ['/api/fuel-products'],
  queryFn: async () => {
    const response = await fetch('/api/fuel-products');
    const result = await response.json();
    return result.rows || [];
  }
});

// Mutation Pattern
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

**Cache Invalidation Strategy:**
- **Single Resource:** Invalidate specific endpoint
- **Cascading Updates:** Invalidate related resources
- **Hierarchical Keys:** Parent-child relationships

### 5. Data Flow Patterns

**Sales Workflow Example:**
```
1. User fills form → Frontend validation (Zod)
2. POST to API → Backend validation
3. Database insert → Triggers fire
4. Response returned → Cache invalidation
5. UI updates → Dashboard refreshes
```

**Dashboard Aggregation:**
- Multiple parallel queries
- Real-time data combination
- Automatic cache updates
- Live UI refresh

---

## 🔄 Business Process Flows

### Sales Process Flow
```
Customer Arrives
    ↓
Select Sale Type:
├── Guest Sale (Cash)
├── Credit Sale (Account)
├── Swipe Sale (Card)
├── Tanker Sale (Bulk)
└── Lubricant Sale
    ↓
Record Transaction
    ↓
Update Inventory
    ↓
Update Customer Balance (if credit)
    ↓
Generate Receipt
    ↓
Update Dashboard
```

### Purchase Process Flow
```
Vendor Delivery
    ↓
Record Purchase:
├── Liquid Purchase (Fuel)
└── Lubricant Purchase
    ↓
Update Stock Levels
    ↓
Update Vendor Balance
    ↓
Generate Invoice
    ↓
Update Reports
```

### Daily Operations Flow
```
Start of Day:
├── Check Tank Levels
├── Record Opening Readings
└── Set Daily Rates

During Day:
├── Process Sales
├── Record Meter Readings
├── Handle Credit Requests
└── Track Expenses

End of Day:
├── Record Closing Readings
├── Calculate Totals
├── Day Settlement
└── Generate Reports
```

---

## 📊 Data Relationships

### Core Entity Relationships
```
Users
├── User Roles (1:many)
├── User Logs (1:many)
└── Created Records (1:many)

Fuel Products
├── Tanks (1:many)
│   └── Nozzles (1:many)
├── Sales (all types) (1:many)
├── Purchases (1:many)
└── Sale Entries (1:many)

Credit Customers
├── Credit Sales (1:many)
├── Credit Requests (1:many)
├── Recoveries (1:many)
└── Interest Transactions (1:many)

Vendors
├── Liquid Purchases (1:many)
├── Lubricant Purchases (1:many)
├── Vendor Transactions (1:many)
└── Vendor Invoices (1:many)

Employees
├── Sale Entries (1:many)
├── Credit Sales (1:many)
├── Sheet Records (1:many)
└── Employee Cash Recovery (1:many)
```

### Database Triggers
1. **sale_entries.quantity** = closing_reading - opening_reading
2. **sale_entries.net_sale_amount** = quantity × price_per_unit
3. **credit_customers.current_balance** += credit_sales.total_amount
4. **tanks.current_stock** += liquid_purchases.quantity
5. **lubricants.stock_quantity** += lub_purchases.quantity - lub_sales.quantity

---

## 🛠️ Development Patterns

### API Design Patterns
**RESTful Endpoints:**
```
GET    /api/resource           # List all
POST   /api/resource           # Create new
PUT    /api/resource/:id       # Update existing
DELETE /api/resource/:id       # Delete
```

**Response Format:**
```json
{
  "ok": true,
  "rows": [...],        // For list endpoints
  "row": {...}          // For single item endpoints
}
```

### Frontend Component Patterns
**Form Management:**
```typescript
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

const onSubmit = async (data) => {
  mutation.mutate(data);
};
```

**Data Fetching:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/endpoint'],
  queryFn: fetchData,
  staleTime: 1000 * 60 * 5  // 5 minutes
});
```

### Error Handling Patterns
**Frontend Validation:**
- Zod schema validation
- Field-level error display
- Form submission prevention

**Backend Validation:**
- Input sanitization
- Business rule validation
- Database constraint checking

**Error Response:**
```json
{
  "ok": false,
  "error": "Descriptive error message"
}
```

---

## 📈 Performance Considerations

### Database Optimization
**Indexes:**
- Date-based queries (sale_date, purchase_date)
- Foreign key lookups
- Active record filtering

**Query Optimization:**
- Parallel queries for dashboard
- Proper JOIN usage
- LIMIT clauses for large datasets

### Frontend Optimization
**Caching Strategy:**
- TanStack Query caching
- Stale-while-revalidate pattern
- Hierarchical cache invalidation

**Component Optimization:**
- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers

---

## 🔧 Maintenance & Extensibility

### Adding New Modules
1. **Database:** Create table in schema.ts
2. **Backend:** Add API routes in routes.ts
3. **Frontend:** Create page component
4. **Routing:** Add route in App.tsx
5. **Testing:** Verify CRUD operations

### Configuration Management
**App Config Table:**
- Key-value configuration
- Type-safe config values
- Runtime configuration changes

**System Settings:**
- System-wide settings
- Category-based organization
- Editable/non-editable flags

---

## 🎯 Key Takeaways

### System Strengths
1. **Modular Design:** 37 focused modules
2. **Type Safety:** TypeScript throughout
3. **Real-time Updates:** TanStack Query caching
4. **Security:** JWT + role-based access
5. **Scalability:** PostgreSQL + proper indexing
6. **Maintainability:** Clear separation of concerns

### Best Practices Implemented
1. **Database:** Proper normalization, foreign keys, triggers
2. **API:** RESTful design, consistent response format
3. **Frontend:** Component-based, reusable patterns
4. **Security:** Authentication, authorization, input validation
5. **Performance:** Caching, indexing, parallel queries

### Development Guidelines
1. **Naming:** snake_case in database, camelCase in Drizzle
2. **Dates:** YYYY-MM-DD format, convert YYYY-MM to YYYY-MM-01
3. **UUIDs:** Use gen_random_uuid() for all IDs
4. **Validation:** Frontend (Zod) + Backend validation
5. **Error Handling:** Graceful degradation, user-friendly messages

---

## 📚 Quick Reference Links

### For Developers
- **Getting Started:** [README.md](./README.md#quick-start)
- **System Architecture:** [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#system-overview)
- **API Endpoints:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Database Schema:** [DATABASE_REFERENCE.md](./DATABASE_REFERENCE.md#detailed-table-schemas)

### For Business Users
- **Module Overview:** [README.md](./README.md#application-modules-37-total)
- **Workflows:** [WORKFLOWS_AND_FLOWS.md](./WORKFLOWS_AND_FLOWS.md)
- **Dashboard:** [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#dashboard-endpoint)

### For Administrators
- **Security:** [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#authentication--security)
- **Deployment:** [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#deployment-notes)
- **Maintenance:** [SYSTEM_DOCUMENTATION.md](./SYSTEM_DOCUMENTATION.md#maintenance-guide)

---

**Documentation Version:** 1.0  
**Last Updated:** October 16, 2025  
**System Status:** ✅ Production Ready  
**Total Modules:** 37  
**Total Tables:** 48  
**API Endpoints:** 60+
