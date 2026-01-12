-- Create a simple purchases table used by tanker/purchase flows
create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  purchase_date date,
  fuel_product_id uuid references fuel_products(id),
  quantity numeric,
  vendor_id uuid references vendors(id),
  created_at timestamp default now()
);

create index if not exists idx_purchases_date on purchases(purchase_date);
