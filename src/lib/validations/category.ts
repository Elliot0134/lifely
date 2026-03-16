import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100),
  icon: z.string().min(1, "L'icône est requise"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Couleur invalide"),
  type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings'], {
    message: "Le type est requis",
  }),
})

export type CategoryInput = z.infer<typeof categorySchema>