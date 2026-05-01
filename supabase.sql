-- SQL Schema for Wekulo Credit Officer Portal
-- Paste this into your Supabase SQL Editor

-- 1. Create Tables

-- Profiles table for RBAC
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'officer' CHECK (role IN ('developer', 'admin', 'officer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT, -- Now optional
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'converted', 'rejected')),
  officer_id UUID REFERENCES auth.users(id)
);

-- Customers Table
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loan_requests CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  photo_url TEXT,
  address TEXT,
  lead_id UUID REFERENCES leads(id),
  officer_id UUID REFERENCES auth.users(id)
);

-- Loans Table
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  interest_rate NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'disbursed', 'active', 'overdue', 'closed')),
  disbursement_date DATE,
  due_date DATE,
  repayment_amount NUMERIC NOT NULL,
  officer_id UUID REFERENCES auth.users(id)
);

-- Repeat Loan Requests Table
CREATE TABLE loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  officer_id UUID REFERENCES auth.users(id)
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;

-- Profile Policies
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Leads/Customers/Loans Policies
CREATE POLICY "Allow authenticated access to leads" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to loans" ON loans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated access to loan_requests" ON loan_requests FOR ALL USING (auth.role() = 'authenticated');

-- 3. Functions & Triggers
-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email,
    CASE 
      WHEN new.email = 'mic1dev.me@gmail.com' THEN 'developer'
      ELSE 'officer'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

