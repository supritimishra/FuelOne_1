-- Lubricant sales table
create table if not exists lub_sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  shift text check (shift in ('S-1','S-2')),
  employee_id uuid references employees(id),
  product text,
  sale_rate numeric,
  quantity numeric,
  discount numeric,
  amount numeric,
  description text,
  sale_type text check (sale_type in ('Cash','Credit')),
  gst jsonb,
  created_by uuid,
  created_at timestamp default now()
);
create index if not exists idx_lub_sales_date on lub_sales(sale_date);

-- Extend swipe_transactions to store UI fields
alter table if exists swipe_transactions
  add column if not exists sale_date date,
  add column if not exists shift text check (shift in ('S-1','S-2')),
  add column if not exists employee_id uuid references employees(id),
  add column if not exists note text;

-- Credit sales new table for UI
create table if not exists credit_sales_new (
  id uuid primary key default gen_random_uuid(),
  sale_date date not null,
  shift text check (shift in ('S-1','S-2')),
  org_name text,
  vehicle_no text,
  product text,
  price numeric,
  credit_amount numeric,
  discount numeric,
  qty_lts numeric,
  misc_charges numeric,
  bill_no text,
  image_url text,
  employee_id uuid references employees(id),
  effect text,
  description text,
  meter_read numeric,
  mileage numeric,
  created_by uuid,
  created_at timestamp default now()
);
create index if not exists idx_credit_sales_new_date on credit_sales_new(sale_date);
