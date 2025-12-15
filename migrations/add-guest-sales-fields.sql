-- Migration to add missing fields to guest_sales table
-- Run this SQL in your database to add the missing fields

ALTER TABLE guest_sales 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS bill_no TEXT,
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS shift TEXT,
ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'S-1';

-- Update the GET endpoint to include these fields
-- The backend will need to be updated to join with employees table
