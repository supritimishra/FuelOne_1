-- Day Assignings: Lubs and Nozzles
create table if not exists daily_lub_assignings (
  id uuid primary key default gen_random_uuid(),
  assign_date date not null,
  recovery_date date,
  shift text check (shift in ('S-1','S-2')),
  employee_id uuid references employees(id),
  product text,
  product_rate numeric,
  assigned numeric,
  sold numeric,
  balance numeric,
  collected numeric,
  shortage numeric,
  created_by uuid,
  created_at timestamp default now()
);

create index if not exists idx_lub_assignings_date on daily_lub_assignings(assign_date);
create index if not exists idx_lub_assignings_employee on daily_lub_assignings(employee_id);

create table if not exists daily_nozzle_assignings (
  id uuid primary key default gen_random_uuid(),
  assign_date date not null,
  shift text check (shift in ('S-1','S-2')),
  employee_id uuid references employees(id),
  nozzle text,
  notes text,
  created_by uuid,
  created_at timestamp default now()
);

create index if not exists idx_nozzle_assignings_date on daily_nozzle_assignings(assign_date);
create index if not exists idx_nozzle_assignings_employee on daily_nozzle_assignings(employee_id);
