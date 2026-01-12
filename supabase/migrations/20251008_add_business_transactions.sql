-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create business_transactions table

CREATE TABLE public.business_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_date DATE NOT NULL DEFAULT now()::date,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('Credit','Debit')),
  party_name TEXT,
  amount NUMERIC DEFAULT 0,
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
