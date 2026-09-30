import { z } from "zod"

export const habitSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom est requis")
    .max(60, "Le nom ne doit pas dépasser 60 caractères"),
  emoji: z
    .string()
    .max(8, "L'emoji ne doit pas dépasser 8 caractères")
    .optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$|^hsl\(/i, "Couleur invalide")
    .optional(),
  order_index: z
    .number()
    .int("L'ordre doit être un entier")
    .min(0, "L'ordre doit être positif")
    .optional(),
  active_days: z
    .array(z.number().int().min(0).max(6))
    .min(1, "Au moins un jour doit être sélectionné")
    .max(7),
})

export const createHabitSchema = habitSchema

export const updateHabitSchema = habitSchema.partial()

export const reorderHabitsSchema = z
  .array(z.string().uuid({ message: "ID d'habitude invalide" }))
  .min(1, "Au moins une habitude est requise")

export type HabitFormInput = z.infer<typeof habitSchema>
