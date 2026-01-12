-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Sale Entries Table (Daily Fuel Sales)
CREATE TABLE public.sale_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  shift_id UUID REFERENCES public.duty_shifts(id),
  pump_station TEXT,
  nozzle_id UUID REFERENCES public.nozzles(id),
  fuel_product_id UUID REFERENCES public.fuel_products(id),
  opening_reading NUMERIC(12,3),
  closing_reading NUMERIC(12,3),
  quantity NUMERIC(12,3) GENERATED ALWAYS AS (closing_reading - opening_reading) STORED,
  price_per_unit NUMERIC(10,2),
  net_sale_amount NUMERIC(12,2) GENERATED ALWAYS AS ((closing_reading - opening_reading) * price_per_unit) STORED,
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.sale_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view sale entries"
  ON public.sale_entries FOR SELECT
  USING (true);

CREATE POLICY "Admins and DSM can manage sale entries"
  ON public.sale_entries FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dsm'));

-- Lubricant Sales Table
CREATE TABLE public.lubricant_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  lubricant_id UUID REFERENCES public.lubricants(id),
  sale_rate NUMERIC(10,2),
  quantity INTEGER NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  sale_type TEXT CHECK (sale_type IN ('Cash', 'Credit')),
  credit_customer_id UUID REFERENCES public.credit_customers(id),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS ((sale_rate * quantity) - discount) STORED,
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.lubricant_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view lubricant sales"
  ON public.lubricant_sales FOR SELECT
  USING (true);

CREATE POLICY "Admins and DSM can manage lubricant sales"
  ON public.lubricant_sales FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dsm'));

-- Credit Sales Table
CREATE TABLE public.credit_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_customer_id UUID REFERENCES public.credit_customers(id) NOT NULL,
  vehicle_number TEXT,
  fuel_product_id UUID REFERENCES public.fuel_products(id),
  quantity NUMERIC(12,3) NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (quantity * price_per_unit) STORED,
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.credit_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view credit sales"
  ON public.credit_sales FOR SELECT
  USING (true);

CREATE POLICY "Admins and DSM can manage credit sales"
  ON public.credit_sales FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dsm'));

-- Swipe Transactions Table
CREATE TABLE public.swipe_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employee_id UUID REFERENCES public.employees(id),
  swipe_type TEXT,
  swipe_mode TEXT,
  amount NUMERIC(12,2) NOT NULL,
  batch_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.swipe_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view swipe transactions"
  ON public.swipe_transactions FOR SELECT
  USING (true);

CREATE POLICY "Admins and DSM can manage swipe transactions"
  ON public.swipe_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dsm'));

-- Expenses Table
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_type_id UUID REFERENCES public.expense_types(id),
  flow_type TEXT CHECK (flow_type IN ('Inflow', 'Outflow')),
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Bank', 'UPI')),
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  employee_id UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view expenses"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage expenses"
  ON public.expenses FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Recoveries Table (Cash Recovery from Credit Customers)
CREATE TABLE public.recoveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recovery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_customer_id UUID REFERENCES public.credit_customers(id) NOT NULL,
  received_amount NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) DEFAULT 0,
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Bank', 'UPI')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.recoveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view recoveries"
  ON public.recoveries FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage recoveries"
  ON public.recoveries FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Employee Cash Recovery Table
CREATE TABLE public.employee_cash_recovery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recovery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  balance_amount NUMERIC(12,2),
  collection_amount NUMERIC(12,2) NOT NULL,
  shortage_amount NUMERIC(12,2) DEFAULT 0,
  total_recovery_cash NUMERIC(12,2) GENERATED ALWAYS AS (collection_amount - shortage_amount) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.employee_cash_recovery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view employee cash recovery"
  ON public.employee_cash_recovery FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage employee cash recovery"
  ON public.employee_cash_recovery FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Day Settlements Table
CREATE TABLE public.day_settlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  opening_balance NUMERIC(12,2),
  meter_sale NUMERIC(12,2),
  lubricant_sale NUMERIC(12,2),
  total_sale NUMERIC(12,2) GENERATED ALWAYS AS (COALESCE(meter_sale, 0) + COALESCE(lubricant_sale, 0)) STORED,
  credit_amount NUMERIC(12,2),
  expenses NUMERIC(12,2),
  shortage NUMERIC(12,2) DEFAULT 0,
  closing_balance NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.day_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view day settlements"
  ON public.day_settlements FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage day settlements"
  ON public.day_settlements FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Daily Sale Rates Table
CREATE TABLE public.daily_sale_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rate_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_product_id UUID REFERENCES public.fuel_products(id) NOT NULL,
  open_rate NUMERIC(10,2),
  close_rate NUMERIC(10,2),
  variation_amount NUMERIC(10,2) GENERATED ALWAYS AS (close_rate - open_rate) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(rate_date, fuel_product_id)
);

ALTER TABLE public.daily_sale_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view daily sale rates"
  ON public.daily_sale_rates FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage daily sale rates"
  ON public.daily_sale_rates FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Vendor Invoices Table
CREATE TABLE public.vendor_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  invoice_type TEXT CHECK (invoice_type IN ('Liquid', 'Lubricant')),
  amount NUMERIC(12,2) NOT NULL,
  gst_amount NUMERIC(12,2),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (amount + COALESCE(gst_amount, 0)) STORED,
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partial')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view vendor invoices"
  ON public.vendor_invoices FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage vendor invoices"
  ON public.vendor_invoices FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Tanker Sales Table
CREATE TABLE public.tanker_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_product_id UUID REFERENCES public.fuel_products(id) NOT NULL,
  before_dip_stock NUMERIC(12,3),
  gross_stock NUMERIC(12,3),
  tanker_sale_quantity NUMERIC(12,3) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.tanker_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view tanker sales"
  ON public.tanker_sales FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage tanker sales"
  ON public.tanker_sales FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Guest Sales Table
CREATE TABLE public.guest_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mobile_number TEXT,
  vehicle_number TEXT,
  fuel_product_id UUID REFERENCES public.fuel_products(id) NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  price_per_unit NUMERIC(10,2) NOT NULL,
  discount NUMERIC(10,2) DEFAULT 0,
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'UPI', 'Card')),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS ((quantity * price_per_unit) - discount) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.guest_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view guest sales"
  ON public.guest_sales FOR SELECT
  USING (true);

CREATE POLICY "Admins and DSM can manage guest sales"
  ON public.guest_sales FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'dsm'));

-- Interest Transactions Table
CREATE TABLE public.interest_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT CHECK (transaction_type IN ('Loan Taken', 'Loan Given', 'Interest Paid', 'Interest Received')),
  party_name TEXT NOT NULL,
  loan_amount NUMERIC(12,2),
  interest_amount NUMERIC(12,2),
  principal_paid NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.interest_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view interest transactions"
  ON public.interest_transactions FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage interest transactions"
  ON public.interest_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'));

-- Vendor Transactions Table (Payments to Vendors)
CREATE TABLE public.vendor_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor_id UUID REFERENCES public.vendors(id) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('Credit', 'Debit')),
  amount NUMERIC(12,2) NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('Cash', 'Bank', 'UPI')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.vendor_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view vendor transactions"
  ON public.vendor_transactions FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage vendor transactions"
  ON public.vendor_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Business Credit/Debit Transactions Table
CREATE TABLE public.business_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_type TEXT CHECK (transaction_type IN ('Credit', 'Debit')),
  party_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.business_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view business transactions"
  ON public.business_transactions FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage business transactions"
  ON public.business_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Credit Requests Table
CREATE TABLE public.credit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_date DATE NOT NULL DEFAULT CURRENT_DATE,
  credit_customer_id UUID REFERENCES public.credit_customers(id) NOT NULL,
  fuel_product_id UUID REFERENCES public.fuel_products(id),
  ordered_quantity NUMERIC(12,3),
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.credit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view credit requests"
  ON public.credit_requests FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage credit requests"
  ON public.credit_requests FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Attendance Table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employee_id UUID REFERENCES public.employees(id) NOT NULL,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Half Day', 'Leave')),
  shift_id UUID REFERENCES public.duty_shifts(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(attendance_date, employee_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view attendance"
  ON public.attendance FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage attendance"
  ON public.attendance FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Sales Officer Inspections Table
CREATE TABLE public.sales_officer_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  fuel_product_id UUID REFERENCES public.fuel_products(id) NOT NULL,
  dip_value NUMERIC(12,3),
  total_sale_liters NUMERIC(12,3),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.sales_officer_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view sales officer inspections"
  ON public.sales_officer_inspections FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage sales officer inspections"
  ON public.sales_officer_inspections FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));