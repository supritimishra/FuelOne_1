# Duty Pay - Quick User Guide

## Overview
The Duty Pay page now has enhanced pagination controls, improved filtering, and is connected to a MongoDB database with sample data.

## New Features

### 1. Pagination Control
**Location:** Top-left of the data table

- **Show Dropdown:** Select how many records to display
  - All - Shows all records
  - 10 - Shows 10 records
  - 50 - Shows 50 records
  - 100 - Shows 100 records
  - 500 - Shows 500 records

### 2. Search/Filter
**Location:** Top-right of the data table

- Type any text to filter records in real-time
- Searches across:
  - Year
  - Month
  - Total Salary
  - Total Employees
  - Notes

### 3. Export Buttons
**Removed:** PDF and CSV buttons (as requested)
**Kept:** Copy and Print buttons

## How to Use

### View All Records
1. Open the Duty Pay page
2. All records are displayed by default
3. Use the "Show" dropdown to limit the number of records

### Filter by Text
1. Type in the "Filter: Type to filter..." input box
2. Records are filtered automatically as you type
3. Clear the input to show all records again

### Filter by Month
1. Select a month using the "Filter Month" dropdown
2. Click the "Search" button
3. Only records for that month will be displayed

### Add New Record
1. Click the "Add Salary +" button
2. Fill in:
   - Month (YYYY-MM format)
   - Total Salary
   - Total Employees
   - Notes (optional)
3. Click "Save"

### Edit Record
1. Find the record in the table
2. Click the "Edit" button
3. Modify the fields
4. Click "Update"

### Delete Record
1. Find the record in the table
2. Click the "Delete" button
3. Confirm deletion

## Sample Data
The database has been seeded with 30 records covering the past 12 months:
- Each record includes all required fields
- Realistic salary amounts (₹3.2L to ₹9.4L per record)
- Employee counts (7 to 20 per record)
- Detailed notes for context

## Technical Details

### Database Collection
- **Name:** duty_pay_records
- **Location:** MongoDB (fuelone database)
- **Fields:**
  - pay_month (Date)
  - total_salary (Number)
  - total_employees (Number)
  - notes (String)
  - created_at (Date)
  - created_by (String)

### API Endpoints
- GET /api/duty-pay - Fetch all records
- GET /api/duty-pay?month=YYYY-MM - Fetch filtered records
- POST /api/duty-pay - Create new record
- PUT /api/duty-pay/:id - Update record
- DELETE /api/duty-pay/:id - Delete record

## Troubleshooting

### No Data Showing
1. Check if the server is running
2. Run the seed script: `npx tsx scripts/seed_duty_pay_records.ts`
3. Refresh the page

### Filter Not Working
1. Clear any existing month filter
2. Check that you're typing in the correct input field
3. Try a different search term

### Records Not Saving
1. Check all required fields are filled
2. Ensure month is in correct format (YYYY-MM)
3. Check browser console for errors
4. Verify MongoDB connection

## Support Scripts

### Reseed Database
```bash
npx tsx scripts/seed_duty_pay_records.ts
```
This will clear existing data and add 30 fresh sample records.

### Test API
```bash
npx tsx scripts/test_duty_pay_api.ts
```
This will test all CRUD operations on the API endpoints.
