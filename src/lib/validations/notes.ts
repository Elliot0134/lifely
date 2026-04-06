import { z } from "zod"

export const createNoteSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(500),
  content: z.record(z.string(), z.unknown()).optional(),
  entity_type: z.enum(["task", "project", "company", "personal"]).optional().default("personal"),
  entity_id: z.string().uuid().optional(),
  color: z.string().optional(),
  is_pinned: z.boolean().optional().default(false),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const updateNoteSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  entity_type: z.enum(["task", "project", "company", "personal"]).optional(),
  entity_id: z.string().uuid().nullable().optional(),
  color: z.string().nullable().optional(),
  is_pinned: z.boolean().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export type CreateNoteInput = z.infer<typeof createNoteSchema>
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>
