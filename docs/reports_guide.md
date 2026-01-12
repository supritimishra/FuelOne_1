# Beginner's Guide to the Reports Section

This document explains how the Reports section in FuelOne works, where the data comes from, and how it is displayed.

## 1. Overview
The Reports section allows you to view various business data (sales, purchases, attendance, etc.) by selecting a report type and applying filters like Date Range or Party.

## 2. How it Works (Frontend)

### Selection and Filtering
- **Report List**: On the left side, you see a list of available reports (e.g., "Vendor Transactions", "Daily Rate History").
- **Fields**: When you select a report, the right side displays specific filtering fields (like "From Date", "To Date", "Vendor").
- **Dynamic UI**: The fields are defined in `src/pages/Reports.tsx` in the `reportFields` object. This makes it easy to add new filters for any report.

### Data Fetching
When you click **SUBMIT**:
1. The app gathers all the filter values you entered.
2. It sends a request to a matching backend API (e.g., `/api/reports/vendor-transactions`).
3. The backend returns a list of data rows.
4. The app displays these rows in a table below the filters.

### Smooth Experience
- **Auto-Clear**: Whenever you change a report type or a filter value, the current results are cleared. This prevents confusion by ensuring you don't look at old data that doesn't match your new filters.

## 3. How it Works (Backend)

The backend logic is primarily located in `server/routes/reports.ts`.

### Endpoint Structure
Each report typically has its own "GET" endpoint under `/api/reports/`. Examples:
- `/api/reports/all-credit-customers`
- `/api/reports/vendor-transactions`
- `/api/reports/product-purchases`

### Data Sources
- **Database (MongoDB)**: Data is fetched from various collections using Mongoose models:
    - `VendorTransaction`: Used for payment and purchase reports.
    - `BusinessTransaction`: Used for cash/bank flow reports.
    - `CreditCustomer`: Used for party balance reports.
    - `Employee`: Used for attendance.
    - `DailySaleRate`: Used for fuel rate history.

### Filtering Logic
The backend looks at the "Query Parameters" sent by the frontend (like `?from=2024-01-01&vendor_id=...`). 
It uses these parameters to create a MongoDB query. 
For example, it filters transactions by `tenantId` (to keep data private to your company) and the selected date range.

## 4. Key Files for Developers
- **[Reports.tsx](file:///c:/Users/Supriti%20Mishra/OneDrive/Documents/GitHub/FuelOne_1/src/pages/Reports.tsx)**: Manages the UI, filters, and table display.
- **[reports.ts](file:///c:/Users/Supriti%20Mishra/OneDrive/Documents/GitHub/FuelOne_1/server/routes/reports.ts)**: Handles the API requests and database queries.
- **[VendorTransaction.ts](file:///c:/Users/Supriti%20Mishra/OneDrive/Documents/GitHub/FuelOne_1/server/models/VendorTransaction.ts)**: The data structure for vendor-related entries.
