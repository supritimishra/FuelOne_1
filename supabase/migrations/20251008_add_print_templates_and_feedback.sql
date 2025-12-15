-- Enable required extensions for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create print_templates and feedback tables

-- Print Templates Table
CREATE TABLE public.print_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.print_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view print templates"
  ON public.print_templates FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage print templates"
  ON public.print_templates FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));

-- Feedback Table
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view feedback"
  ON public.feedback FOR SELECT
  USING (true);

CREATE POLICY "Admins and Manager can manage feedback"
  ON public.feedback FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'manager'));
