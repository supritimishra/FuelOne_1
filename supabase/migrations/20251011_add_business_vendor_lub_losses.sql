-- Create extensions if not exists (for UUIDs)
create extension if not exists pgcrypto;

-- Business CR/DR Transactions
create table if not exists public.business_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  transaction_type text not null check (transaction_type in ('Credit','Debit')),
  party_name text not null,
  amount numeric(12,2) not null default 0,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_business_transactions_date on public.business_transactions(transaction_date);

-- Vendors
create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Vendor Transactions
create table if not exists public.vendor_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_date date not null default current_date,
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('Credit','Debit')),
  payment_mode text not null check (payment_mode in ('Cash','Bank','UPI')),
  amount numeric(12,2) not null default 0,
  description text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_vendor_transactions_date on public.vendor_transactions(transaction_date);
create index if not exists idx_vendor_transactions_vendor on public.vendor_transactions(vendor_id);

-- Lubricant Losses (for LubricantLoss page)
create table if not exists public.lub_losses (
  id uuid primary key default gen_random_uuid(),
  loss_date date not null default current_date,
  lubricant_id uuid not null references public.lubricants(id) on delete restrict,
  quantity numeric(12,3) not null default 0,
  note text,
  created_by uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_lub_losses_date on public.lub_losses(loss_date);
create index if not exists idx_lub_losses_lubricant on public.lub_losses(lubricant_id);

-- Optional: Minimum stock thresholds for lubricants
create table if not exists public.lub_min_stock (
  id uuid primary key default gen_random_uuid(),
  lubricant_id uuid not null references public.lubricants(id) on delete cascade,
  min_qty numeric(12,3) not null default 0,
  created_at timestamptz not null default now(),
  unique(lubricant_id)
);

-- Simple RLS enabling (optional: keep disabled if not using row level security policies yet)
-- alter table public.business_transactions enable row level security;
-- alter table public.vendor_transactions enable row level security;
-- alter table public.lub_losses enable row level security;
-- alter table public.lub_min_stock enable row level security;

-- Note: Add detailed RLS policies later if required by your auth model.
