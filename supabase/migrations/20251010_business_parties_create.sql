-- Create table for Business Credit/Debit Parties
create table if not exists business_parties (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  party_type text not null check (party_type in ('Bank','Capital','Cash','Creditor','Owner','Tanker')),
  party_name text not null,
  phone_number text,
  email text,
  address text,
  opening_balance numeric(12,2) default 0,
  opening_date date,
  opening_type text check (opening_type in ('Payable','Receivable')),
  description text,
  is_active boolean default true,
  created_at timestamp default now()
);

create index if not exists idx_business_parties_date on business_parties(date);
create index if not exists idx_business_parties_party on business_parties(party_name);
