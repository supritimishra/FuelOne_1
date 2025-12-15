-- Create sheet_records table
CREATE TABLE IF NOT EXISTS public.sheet_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  sheet_name text,
  open_reading numeric DEFAULT 0,
  close_reading numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_sheet_records_date ON public.sheet_records(date);

-- Create day_cash_movements table (minimal)
CREATE TABLE IF NOT EXISTS public.day_cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  inflows numeric DEFAULT 0,
  outflows numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  created_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_day_cash_movements_date ON public.day_cash_movements(date);
