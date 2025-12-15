-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create duty_pay table
CREATE TABLE IF NOT EXISTS public.duty_pay (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pay_month DATE NOT NULL,
  total_salary NUMERIC(12,2) DEFAULT 0,
  total_employees INT DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_duty_pay_month ON public.duty_pay(pay_month);
