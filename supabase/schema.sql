-- ==============================================================================
-- جمعية عطاء الخيرية (Ataa Association) - مصفوفة قواعد البيانات والأمان (PostgreSQL + RLS)
-- ==============================================================================

-- تفعيل الامتدادات الضرورية
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. جدول حسابات الموظفين والإدارة (Profiles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login_at TIMESTAMPTZ
);

-- 2. جدول المستفيدين (Beneficiaries)
CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  national_id VARCHAR(14) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  family_size INT NOT NULL DEFAULT 1 CHECK (family_size >= 1),
  points_balance INT NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. جدول المنتجات والسلع التموينية (Products)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  points_cost INT NOT NULL CHECK (points_cost >= 1),
  unit TEXT NOT NULL DEFAULT 'قطعة',
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. جدول الأكواد الشهرية الأحادية (Monthly One-Time Codes)
CREATE TABLE IF NOT EXISTS monthly_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  month_key VARCHAR(7) NOT NULL, -- صيغة: YYYY-MM مثل 2026-10
  code VARCHAR(6) NOT NULL,      -- كود عشوائي مكون من 6 أرقام
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  used_at TIMESTAMPTZ,
  used_by_staff_id UUID REFERENCES profiles(id),
  delivery_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  -- قيد فريد صارم: كود واحد فقط لكل مستفيد في الشهر
  CONSTRAINT unique_beneficiary_month UNIQUE (beneficiary_id, month_key)
);

-- 5. جدول عمليات التسليم والصرف (Deliveries)
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES monthly_codes(id),
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id),
  staff_id UUID NOT NULL REFERENCES profiles(id),
  total_points INT NOT NULL CHECK (total_points > 0),
  balance_before INT NOT NULL CHECK (balance_before >= 0),
  balance_after INT NOT NULL CHECK (balance_after >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. تفاصيل أصناف عملية التسليم (Delivery Items)
CREATE TABLE IF NOT EXISTS delivery_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  unit_points INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal_points INT NOT NULL CHECK (subtotal_points > 0)
);

-- 7. سجل التدقيق الأمني (Audit Logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  target_id TEXT,
  target_name TEXT,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- تفعيل سياسات الأمان على مستوى الصف (Row Level Security - RLS)
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق من صلاحية المدير (Admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- سياسات Profiles: الجميع يمكنه قراءة حسابه، المدير يدير كل الحسابات
CREATE POLICY "Users can view active staff profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage staff profiles" ON profiles
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- سياسات Beneficiaries: الموظفون والمدراء يقرأون ويسجلون
CREATE POLICY "Staff and Admins can view beneficiaries" ON beneficiaries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and Admins can insert/update beneficiaries" ON beneficiaries
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- سياسات Products: قراءة للجميع، تعديل للمدير فقط
CREATE POLICY "Staff and Admins can view products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- سياسات Monthly Codes: قراءة للجميع، توليد وصرف للموظفين والمدراء
CREATE POLICY "Staff and Admins can view codes" ON monthly_codes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and Admins can manage codes" ON monthly_codes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- سياسات Deliveries و Delivery Items: قراءة وإضافة للجميع
CREATE POLICY "Staff and Admins can view deliveries" ON deliveries
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and Admins can insert deliveries" ON deliveries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff and Admins can view delivery items" ON delivery_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff and Admins can insert delivery items" ON delivery_items
  FOR INSERT TO authenticated WITH CHECK (true);

-- سياسات Audit Logs: الإضافة للجميع عبر النظام، القراءة للمدير فقط
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (is_admin());

CREATE POLICY "System and staff can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
