-- =====================================================
-- LIFELY - Company Detail Fields + Custom Links
-- =====================================================

-- ============================================
-- 1. Add detail columns to companies
-- ============================================

-- Legal identity
ALTER TABLE companies ADD COLUMN IF NOT EXISTS legal_form TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siren TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS share_capital NUMERIC;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS founded_at DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT;

-- Participation
ALTER TABLE companies ADD COLUMN IF NOT EXISTS ownership_share NUMERIC;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS joined_at DATE;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS amount_invested NUMERIC;

-- Contact
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT;

-- Text
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;

-- ============================================
-- 2. Company Links table (custom links)
-- ============================================
CREATE TABLE company_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_links_company_id ON company_links(company_id);

-- RLS
ALTER TABLE company_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company_links"
  ON company_links FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
