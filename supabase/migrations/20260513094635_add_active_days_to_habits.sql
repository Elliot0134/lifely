-- =====================================================
-- LIFELY - Habit Tracker
-- Phase 2: active_days per habit
-- =====================================================
--
-- Day convention (matches JS Date.prototype.getDay()):
--   0 = Dimanche (Sunday)
--   1 = Lundi    (Monday)
--   2 = Mardi    (Tuesday)
--   3 = Mercredi (Wednesday)
--   4 = Jeudi    (Thursday)
--   5 = Vendredi (Friday)
--   6 = Samedi   (Saturday)
--
-- active_days is a SMALLINT[] containing the days on which the habit
-- is "active" (i.e. tracked). Off-days don't count against progress.
-- Default = all 7 days, so existing habits keep current behavior.
-- =====================================================

-- Column add (idempotent)
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS active_days SMALLINT[]
    NOT NULL
    DEFAULT '{0,1,2,3,4,5,6}'::SMALLINT[];

-- Check constraint: values must be in [0,6] and at least one day selected.
-- Drop-then-create for idempotency.
ALTER TABLE public.habits
  DROP CONSTRAINT IF EXISTS habits_active_days_valid;

ALTER TABLE public.habits
  ADD CONSTRAINT habits_active_days_valid CHECK (
    active_days <@ '{0,1,2,3,4,5,6}'::SMALLINT[]
    AND array_length(active_days, 1) >= 1
  );
