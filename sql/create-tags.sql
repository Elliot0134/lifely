-- =====================================================
-- LIFELY - Tags table (Task Management)
-- US-006: Database migration — tags table
-- =====================================================

-- Tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index on user_id for query performance
CREATE INDEX idx_tags_user_id ON tags(user_id);

-- Unique index on (user_id, name) to prevent duplicate tag names per user
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);

-- Row Level Security
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
