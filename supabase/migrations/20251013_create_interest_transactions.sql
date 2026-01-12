-- Create interest_transactions table
CREATE TABLE IF NOT EXISTS public.interest_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL,
  credit_from uuid NULL,
  debit_to uuid NULL,
  description text,
  amount numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_interest_transactions_date ON public.interest_transactions(transaction_date);
