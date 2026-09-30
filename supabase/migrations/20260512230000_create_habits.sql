-- =====================================================
-- LIFELY - Habit Tracker
-- US-001: Database migration — habits + habit_completions
-- =====================================================
--
-- MANUAL TEST — verify RLS works:
--
--   -- 1) As an authenticated user (replace <uuid> with a real auth.users.id):
--   BEGIN;
--   SET LOCAL ROLE authenticated;
--   SET LOCAL request.jwt.claim.sub = '<uuid>';
--   SELECT * FROM public.habits;            -- returns only rows where user_id = <uuid>
--   SELECT * FROM public.habit_completions; -- returns only rows where user_id = <uuid>
--   INSERT INTO public.habits (user_id, name) VALUES ('<uuid>', 'Test');         -- OK
--   INSERT INTO public.habits (user_id, name) VALUES (gen_random_uuid(), 'X');   -- DENIED
--   ROLLBACK;
--
--   -- 2) Anonymous role should see nothing:
--   BEGIN;
--   SET LOCAL ROLE anon;
--   SELECT * FROM public.habits;            -- 0 rows
--   ROLLBACK;
--
-- =====================================================

-- Trigger function for updated_at (idempotent, reused across tables)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Table: habits
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Table: habit_completions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT habit_completions_habit_date_unique UNIQUE (habit_id, completed_date)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_habits_user_archived
  ON public.habits(user_id, archived_at);

CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date
  ON public.habit_completions(user_id, completed_date);

CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date
  ON public.habit_completions(habit_id, completed_date);

-- =====================================================
-- Row Level Security — habits
-- =====================================================
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own habits" ON public.habits;
CREATE POLICY "Users can select their own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habits" ON public.habits;
CREATE POLICY "Users can insert their own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habits" ON public.habits;
CREATE POLICY "Users can update their own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habits" ON public.habits;
CREATE POLICY "Users can delete their own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Row Level Security — habit_completions
-- =====================================================
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can select their own habit_completions" ON public.habit_completions;
CREATE POLICY "Users can select their own habit_completions"
  ON public.habit_completions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own habit_completions" ON public.habit_completions;
CREATE POLICY "Users can insert their own habit_completions"
  ON public.habit_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own habit_completions" ON public.habit_completions;
CREATE POLICY "Users can update their own habit_completions"
  ON public.habit_completions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own habit_completions" ON public.habit_completions;
CREATE POLICY "Users can delete their own habit_completions"
  ON public.habit_completions FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers — auto-update updated_at on habits
-- =====================================================
DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
