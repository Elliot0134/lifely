-- US-009: Database view — task_details
-- Joins tasks with projects and companies, computes due_status,
-- subtask counts, and aggregates tags as JSON array.

CREATE OR REPLACE VIEW task_details AS
SELECT
  t.*,
  p.name AS project_name,
  p.color AS project_color,
  p.status AS project_status,
  c.name AS company_name,
  c.color AS company_color,
  CASE
    WHEN t.is_completed THEN 'completed'
    WHEN t.due_date IS NULL THEN 'no_date'
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE THEN 'today'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'upcoming'
    ELSE 'future'
  END AS due_status,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) AS subtask_count,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.is_completed = true) AS subtask_completed_count,
  (SELECT COALESCE(json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)), '[]'::json)
   FROM task_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) AS tags
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN companies c ON p.company_id = c.id;
