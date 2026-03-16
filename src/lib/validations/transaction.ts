import { z } from "zod"

export const transactionSchema = z.object({
  description: z.string().min(1, "La description est requise").max(255),
  amount: z.number().min(0.01, "Le montant doit être supérieur à 0"),
  type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings'], {
    message: "Le type est requis",
  }),
  category_id: z.string().uuid("Catégorie invalide"),
  account_id: z.string().uuid("Compte invalide"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date invalide",
  }),
})

export type TransactionInput = z.infer<typeof transactionSchema>