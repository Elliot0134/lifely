-- =====================================================
-- LIFELY - Company Groups & Ownership Types
-- Adds grouping and ownership classification to companies
-- =====================================================

-- ============================================
-- 1. Company Groups table
-- ============================================
CREATE TABLE company_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_groups_user_id ON company_groups(user_id);

-- RLS
ALTER TABLE company_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company_groups"
  ON company_groups FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_company_groups_updated_at
  BEFORE UPDATE ON company_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. Alter companies table
-- ============================================

-- Add group_id FK (nullable — ungrouped companies allowed)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES company_groups(id) ON DELETE SET NULL;

-- Add ownership_type classification
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS ownership_type TEXT NOT NULL DEFAULT 'owner'
  CHECK (ownership_type IN ('owner', 'shareholder', 'client', 'partner', 'other'));

-- Index for group queries
CREATE INDEX idx_companies_group_id ON companies(group_id);
CREATE INDEX idx_companies_ownership_type ON companies(ownership_type);

-- ============================================
-- 3. Update task_details view (add group info)
-- ============================================
CREATE OR REPLACE VIEW task_details AS
SELECT
  t.*,
  p.name AS project_name,
  p.color AS project_color,
  p.status AS project_status,
  c.name AS company_name,
  c.color AS company_color,
  c.is_personal AS company_is_personal,
  cg.name AS company_group_name,
  cg.color AS company_group_color,
  CASE
    WHEN t.status = 'completed' THEN 'completed'
    WHEN t.due_date IS NULL THEN 'no_date'
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE THEN 'today'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'upcoming'
    ELSE 'future'
  END AS due_status,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) AS subtask_count,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.status = 'completed') AS subtask_completed_count,
  (SELECT COALESCE(json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)), '[]'::json)
   FROM task_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) AS tags
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN company_groups cg ON c.group_id = cg.id;
