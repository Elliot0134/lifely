import { z } from "zod"

export const budgetSchema = z.object({
  category_id: z.string().uuid("Catégorie invalide"),
  account_id: z.string().uuid("Compte invalide"),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  period_start: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date de début invalide",
  }),
  period_end: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date de fin invalide",
  }),
}).refine((data) => new Date(data.period_start) < new Date(data.period_end), {
  message: "La date de fin doit être après la date de début",
  path: ["period_end"],
})

export type BudgetInput = z.infer<typeof budgetSchema>