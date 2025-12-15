-- Create tables for liquid and lubricant purchases
create table if not exists liquid_purchases (
  id uuid primary key default gen_random_uuid(),
  date date,
  invoice_date date,
  invoice_no text not null,
  description text,
  vendor_id uuid references vendors(id),
  image_url text,
  created_at timestamp default now()
);

create table if not exists lub_purchases (
  id uuid primary key default gen_random_uuid(),
  date date,
  invoice_date date,
  invoice_no text not null,
  description text,
  vendor_id uuid references vendors(id),
  image_url text,
  amount numeric(12,2),
  created_at timestamp default now()
);

create index if not exists idx_liquid_purchases_date on liquid_purchases(date);
create index if not exists idx_lub_purchases_date on lub_purchases(date);
