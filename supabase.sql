-- SQL Schema for Wekulo Credit Officer Portal
-- Paste this into your Supabase SQL Editor

-- 1. Reset everything to ensure a clean state
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS loan_requests CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create Profiles table for RBAC
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'officer' CHECK (role IN ('developer', 'admin', 'officer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-authorized emails for role assignment
CREATE TABLE pre_authorized_emails (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('admin', 'officer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. Create Leads Table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'converted', 'rejected')),
  officer_id UUID REFERENCES auth.users(id)
);

-- 4. Create Customers Table
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
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL, -- Prevent FK errors if lead is deleted
  officer_id UUID REFERENCES auth.users(id)
);

-- 5. Create Loans Table
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

-- 6. Create Repeat Loan Requests Table
CREATE TABLE loan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  tenure_months INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  officer_id UUID REFERENCES auth.users(id)
);

-- 7. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_authorized_emails ENABLE ROW LEVEL SECURITY;

-- 8. Policies
-- Profile Policies: Publicly readable for authenticated users (to check roles)
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'developer'))
);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pre-authorized emails policies
CREATE POLICY "Admins can manage pre-authorizations" ON pre_authorized_emails FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'developer'))
);
CREATE POLICY "Authenticated users can see pre-authorizations" ON pre_authorized_emails FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated Users can perform all actions for simplicity in this portal
CREATE POLICY "Allow All Authenticated Leads" ON leads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All Authenticated Customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All Authenticated Loans" ON loans FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow All Authenticated Loan Requests" ON loan_requests FOR ALL USING (auth.role() = 'authenticated');

-- 9. Functions & Triggers
-- Create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  -- Check if email is pre-authorized
  SELECT role INTO assigned_role FROM public.pre_authorized_emails WHERE email = new.email;
  
  -- Default logic if not pre-authorized
  IF assigned_role IS NULL THEN
    IF new.email = 'mic1dev.me@gmail.com' THEN
      assigned_role := 'developer';
    ELSE
      assigned_role := 'officer';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, assigned_role)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Backfill existing users (Crucial to prevent 404s for users created before the trigger)
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'officer' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Special developer assignment
UPDATE public.profiles SET role = 'developer' WHERE email = 'mic1dev.me@gmail.com';

