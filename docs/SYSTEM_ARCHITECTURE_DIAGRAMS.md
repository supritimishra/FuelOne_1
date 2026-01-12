# 🏗️ System Architecture Diagram

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React 18 + TypeScript]
        Components[Shadcn/ui Components]
        State[TanStack Query v5]
        Forms[React Hook Form + Zod]
        Router[Wouter Router]
    end
    
    subgraph "Backend Layer"
        Express[Express.js + TypeScript]
        Auth[JWT Authentication]
        Routes[API Routes]
        Middleware[Auth Middleware]
    end
    
    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL<br/>Neon Serverless)]
        Schema[Drizzle Schema]
        Tables[48 Tables]
        Triggers[Database Triggers]
    end
    
    subgraph "Business Modules"
        Master[Master Data<br/>10 Modules]
        Sales[Sales<br/>5 Modules]
        Purchase[Purchase<br/>2 Modules]
        Operations[Daily Operations<br/>7 Modules]
        Reports[Reports<br/>8 Modules]
        System[System<br/>4 Modules]
    end
    
    UI --> Express
    Components --> UI
    State --> UI
    Forms --> UI
    Router --> UI
    
    Express --> Auth
    Express --> Routes
    Express --> Middleware
    
    Routes --> PostgreSQL
    Schema --> PostgreSQL
    Tables --> PostgreSQL
    Triggers --> PostgreSQL
    
    Master --> Tables
    Sales --> Tables
    Purchase --> Tables
    Operations --> Tables
    Reports --> Tables
    System --> Tables
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    participant Cache
    
    User->>Frontend: Login
    Frontend->>Backend: POST /api/login
    Backend->>Database: Validate credentials
    Database-->>Backend: User data
    Backend-->>Frontend: JWT + User data
    Frontend->>Cache: Store auth state
    
    User->>Frontend: Create Sale
    Frontend->>Frontend: Validate form (Zod)
    Frontend->>Backend: POST /api/guest-sales
    Backend->>Database: Insert sale record
    Database->>Database: Trigger updates
    Database-->>Backend: Success
    Backend-->>Frontend: Sale data
    Frontend->>Cache: Invalidate queries
    Cache-->>Frontend: Updated data
    Frontend-->>User: Success + Updated UI
```

## Database Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ USER_ROLES : has
    USERS ||--o{ USER_LOGS : creates
    USERS ||--o{ GUEST_SALES : created_by
    USERS ||--o{ CREDIT_SALES : created_by
    
    FUEL_PRODUCTS ||--o{ TANKS : contains
    FUEL_PRODUCTS ||--o{ NOZZLES : dispenses
    FUEL_PRODUCTS ||--o{ GUEST_SALES : sold_as
    FUEL_PRODUCTS ||--o{ CREDIT_SALES : sold_as
    FUEL_PRODUCTS ||--o{ LIQUID_PURCHASES : purchased_as
    
    TANKS ||--o{ NOZZLES : feeds
    TANKS ||--o{ LIQUID_PURCHASES : receives
    
    CREDIT_CUSTOMERS ||--o{ CREDIT_SALES : makes
    CREDIT_CUSTOMERS ||--o{ CREDIT_REQUESTS : requests
    CREDIT_CUSTOMERS ||--o{ RECOVERIES : pays
    
    VENDORS ||--o{ LIQUID_PURCHASES : supplies
    VENDORS ||--o{ LUB_PURCHASES : supplies
    VENDORS ||--o{ VENDOR_TRANSACTIONS : transacts
    
    EMPLOYEES ||--o{ CREDIT_SALES : handles
    EMPLOYEES ||--o{ SALE_ENTRIES : records
    EMPLOYEES ||--o{ SHEET_RECORDS : maintains
    
    LUBRICANTS ||--o{ LUB_SALES : sold_as
    LUBRICANTS ||--o{ LUB_PURCHASES : purchased_as
    
    USERS {
        uuid id PK
        text username
        text email UK
        text password_hash
        text full_name
        timestamp created_at
    }
    
    FUEL_PRODUCTS {
        uuid id PK
        text product_name
        text short_name
        numeric gst_percentage
        boolean is_active
    }
    
    CREDIT_CUSTOMERS {
        uuid id PK
        text organization_name
        numeric credit_limit
        numeric current_balance
        boolean is_active
    }
    
    GUEST_SALES {
        uuid id PK
        date sale_date
        uuid fuel_product_id FK
        numeric quantity
        numeric total_amount
        uuid created_by FK
    }
```

## Module Organization

```mermaid
graph TD
    subgraph "Master Data Management"
        A1[Fuel Products]
        A2[Lubricants]
        A3[Credit Customers]
        A4[Employees]
        A5[Vendors]
        A6[Tanks]
        A7[Nozzles]
        A8[Expense Types]
        A9[Swipe Machines]
        A10[Business Parties]
    end
    
    subgraph "Sales Operations"
        B1[Guest Sale]
        B2[Credit Sale]
        B3[Swipe Sale]
        B4[Tanker Sale]
        B5[Lubricant Sale]
    end
    
    subgraph "Purchase Operations"
        C1[Liquid Purchases]
        C2[Lubricant Purchases]
    end
    
    subgraph "Daily Operations"
        D1[Daily Cash Report]
        D2[Denominations]
        D3[Daily Sale Rate]
        D4[Recovery]
        D5[Day Settlement]
        D6[Sale Entry]
        D7[Credit Requests]
    end
    
    subgraph "Reports & Statements"
        E1[Statement]
        E2[Stock Reports]
        E3[Lubricant Loss]
        E4[Lubricant Stock]
        E5[Minimum Stock]
        E6[Generate Invoice]
        E7[Invoices]
        E8[Credit Limit Report]
    end
    
    subgraph "System Management"
        F1[Duty Pay]
        F2[Expiry Items]
        F3[App Config]
        F4[User Log]
        F5[System Settings]
    end
```

## Authentication Flow

```mermaid
flowchart TD
    A[User Login] --> B{Valid Credentials?}
    B -->|Yes| C[Generate JWT]
    B -->|No| D[Return Error]
    C --> E[Set httpOnly Cookie]
    E --> F[Return User Data]
    F --> G[Store in Frontend State]
    
    H[Protected Route Access] --> I{Cookie Present?}
    I -->|No| J[Redirect to Login]
    I -->|Yes| K[Validate JWT]
    K --> L{Valid Token?}
    L -->|No| M[Return 401]
    L -->|Yes| N[Attach User to Request]
    N --> O[Proceed to Route Handler]
```

## Cache Invalidation Strategy

```mermaid
graph LR
    A[User Action] --> B[Mutation]
    B --> C[API Call]
    C --> D[Database Update]
    D --> E[Response]
    E --> F[Cache Invalidation]
    F --> G[Query Refetch]
    G --> H[UI Update]
    
    subgraph "Cache Keys"
        I[/api/fuel-products]
        J[/api/credit-sales]
        K[/api/dashboard]
        L[/api/credit-customers]
    end
    
    F --> I
    F --> J
    F --> K
    F --> L
```

## Business Process Flow

```mermaid
flowchart TD
    A[Customer Arrives] --> B{Sale Type?}
    B -->|Cash| C[Guest Sale]
    B -->|Credit| D[Credit Sale]
    B -->|Card| E[Swipe Sale]
    B -->|Bulk| F[Tanker Sale]
    B -->|Lubricant| G[Lubricant Sale]
    
    C --> H[Record Transaction]
    D --> H
    E --> H
    F --> H
    G --> H
    
    H --> I[Update Inventory]
    I --> J[Update Customer Balance]
    J --> K[Generate Receipt]
    K --> L[Update Dashboard]
    
    M[End of Day] --> N[Record Meter Readings]
    N --> O[Calculate Totals]
    O --> P[Day Settlement]
    P --> Q[Generate Reports]
```

## Technology Stack Details

```mermaid
graph TB
    subgraph "Frontend Technologies"
        React[React 18]
        TS[TypeScript]
        Vite[Vite Build Tool]
        Tailwind[Tailwind CSS]
        Shadcn[Shadcn/ui Components]
        TanStack[TanStack Query v5]
        Wouter[Wouter Router]
        RHF[React Hook Form]
        Zod[Zod Validation]
    end
    
    subgraph "Backend Technologies"
        Express[Express.js]
        NodeTS[Node.js + TypeScript]
        JWT[JWT Authentication]
        Bcrypt[Bcrypt Password Hashing]
        CookieParser[Cookie Parser]
        CORS[CORS Middleware]
    end
    
    subgraph "Database Technologies"
        PostgreSQL[PostgreSQL 15+]
        Neon[Neon Serverless]
        Drizzle[Drizzle ORM]
        UUID[UUID Primary Keys]
        Triggers[Database Triggers]
        Indexes[Performance Indexes]
    end
    
    subgraph "Development Tools"
        NPM[NPM Package Manager]
        ESLint[ESLint]
        Prettier[Prettier]
        Vitest[Vitest Testing]
        DrizzleStudio[Drizzle Studio]
    end
```

## API Endpoint Organization

```mermaid
graph TD
    subgraph "Authentication APIs"
        A1[POST /api/signup]
        A2[POST /api/login]
        A3[POST /api/logout]
        A4[GET /api/user]
    end
    
    subgraph "Master Data APIs"
        B1[GET/POST/PUT/DELETE /api/fuel-products]
        B2[GET/POST/PUT/DELETE /api/lubricants]
        B3[GET/POST/PUT/DELETE /api/credit-customers]
        B4[GET/POST/PUT/DELETE /api/employees]
        B5[GET/POST/PUT/DELETE /api/vendors]
        B6[GET/POST/PUT/DELETE /api/tanks]
        B7[GET/POST/PUT/DELETE /api/nozzles]
    end
    
    subgraph "Sales APIs"
        C1[GET/POST/PUT/DELETE /api/guest-sales]
        C2[GET/POST/PUT/DELETE /api/credit-sales]
        C3[GET/POST/PUT/DELETE /api/swipe-transactions]
        C4[GET/POST/PUT/DELETE /api/tanker-sales]
        C5[GET/POST/PUT/DELETE /api/lub-sales]
    end
    
    subgraph "Purchase APIs"
        D1[GET/POST/PUT/DELETE /api/liquid-purchases]
        D2[GET/POST/PUT/DELETE /api/lub-purchases]
    end
    
    subgraph "Operations APIs"
        E1[GET/POST/PUT/DELETE /api/sale-entries]
        E2[GET/POST/PUT/DELETE /api/duty-pay]
        E3[GET/POST/PUT/DELETE /api/credit-requests]
        E4[GET/POST/PUT/DELETE /api/sheet-records]
    end
    
    subgraph "Dashboard & Reports"
        F1[GET /api/dashboard]
        F2[GET /api/statement]
        F3[GET /api/stock-reports]
        F4[POST /api/generate-invoice]
    end
```

---

**These diagrams provide a comprehensive visual understanding of the PetroPal system architecture, data flows, and business processes.**
