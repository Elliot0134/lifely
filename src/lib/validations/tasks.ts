import { z } from "zod"

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

// ── Task schemas ────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(500),
  description: z.string().max(5000).optional(),
  project_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  is_code_task: z.boolean().optional().default(false),
  due_date: z.string().optional(),
  due_datetime: z.string().optional(),
  urgency: z.enum(["urgent", "important"]).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  scheduled_date: z.string().optional(),
  scheduled_start_time: z
    .string()
    .regex(timeRegex, "Format HH:MM attendu")
    .optional(),
  scheduled_end_time: z
    .string()
    .regex(timeRegex, "Format HH:MM attendu")
    .optional(),
  ai_instructions: z.string().max(10000).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
  is_completed: z.boolean().optional(),
  is_code_task: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
  due_datetime: z.string().nullable().optional(),
  urgency: z.enum(["urgent", "important"]).nullable().optional(),
  sort_order: z.number().int().optional(),
  estimated_minutes: z.number().int().min(1).max(480).nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  scheduled_start_time: z.string().regex(timeRegex).nullable().optional(),
  scheduled_end_time: z.string().regex(timeRegex).nullable().optional(),
  ai_instructions: z.string().max(10000).nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

// ── Project schemas ─────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  description: z.string().max(5000).optional(),
  company_id: z.string().uuid().optional(),
  color: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  status: z.enum(["not_started", "in_progress", "completed"]).optional(),
  color: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>

// ── Company schemas ─────────────────────────────────────────────

export const createCompanySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  status: z.enum(["not_started", "active", "completed"]).optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>

// ── Tag schema ──────────────────────────────────────────────────

export const createTagSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(50),
  color: z.string().optional().default("#64748b"),
})

export const updateTagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Le nom est obligatoire").max(50).optional(),
  color: z.string().optional(),
})

export type CreateTagInput = z.infer<typeof createTagSchema>
export type UpdateTagInput = z.infer<typeof updateTagSchema>

// ── Comment schema ──────────────────────────────────────────────

export const createCommentSchema = z.object({
  task_id: z.string().uuid(),
  content: z
    .string()
    .min(1, "Le commentaire ne peut pas être vide")
    .max(10000),
  author_type: z.enum(["user", "claude"]).optional().default("user"),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

// ── Recurring task schema ───────────────────────────────────────

export const createRecurringTaskSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(500),
  description: z.string().max(5000).optional(),
  project_id: z.string().uuid().optional(),
  is_code_task: z.boolean().optional().default(false),
  urgency: z.enum(["urgent", "important"]).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  ai_instructions: z.string().max(10000).optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  day_of_week: z.number().int().min(0).max(6).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
})

export type CreateRecurringTaskInput = z.infer<
  typeof createRecurringTaskSchema
>
