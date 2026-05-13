-- SQL script to setup Supabase tables for BioCapsule

-- 1. Create Orders table
CREATE TABLE public.orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  address text NOT NULL,
  status text DEFAULT 'Pending',
  source text DEFAULT 'website',
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  "confirmedBy" text
);

-- 2. Create Users table
CREATE TABLE public.users (
  username text PRIMARY KEY,
  password text NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  "commissionRate" numeric DEFAULT 0
);

-- Seed default admin user
INSERT INTO public.users (username, password, name, role, "commissionRate")
VALUES ('admin', 'biocapsuleadmin02', 'Admin', 'admin', 0)
ON CONFLICT (username) DO NOTHING;

-- 3. Create Views table (for analytics)
CREATE TABLE public.views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Metadata table (for settings and fast counters)
CREATE TABLE public.metadata (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Enable Row Level Security (RLS) but allow anon access for API operations (since we handle logic in Next.js backend)
-- Alternatively, keep RLS disabled if using service_role key, or enable it and use service_role.
-- Since the Next.js API uses the SUPABASE_SERVICE_ROLE_KEY or handles its own auth, we can just allow everything for service_role and disable anon if we want, but let's just make it easy for the Next.js backend to access.
-- By default, new tables have RLS disabled in Supabase, meaning anon has full access. 
-- It is recommended to use the SUPABASE_SERVICE_ROLE_KEY in your Next.js environment variables.
