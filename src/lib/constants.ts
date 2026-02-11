import { TransactionType } from "@/types"

export const TRANSACTION_TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'revenue', label: 'Revenu', color: 'hsl(142 76% 36%)' },
  { value: 'variable_expense', label: 'Dépense variable', color: 'hsl(24 95% 53%)' },
  { value: 'fixed_expense', label: 'Charge fixe', color: 'hsl(217 91% 60%)' },
  { value: 'credit', label: 'Crédit', color: 'hsl(0 84% 60%)' },
  { value: 'savings', label: 'Épargne', color: 'hsl(187 85% 53%)' },
]

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export const RECURRENCE_FREQUENCIES = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'yearly', label: 'Annuel' },
] as const

export const ACCOUNT_TYPES = [
  { value: 'personal', label: 'Personnel' },
  { value: 'business', label: 'Professionnel' },
] as const

// Couleurs des variables CSS pour les types de transaction
export const TRANSACTION_TYPE_COLORS = {
  revenue: 'var(--color-revenue)',
  variable_expense: 'var(--color-variable-expense)',
  fixed_expense: 'var(--color-fixed-expense)',
  credit: 'var(--color-credit)',
  savings: 'var(--color-savings)',
} as const

// Couleurs d'état budget
export const BUDGET_STATUS_COLORS = {
  ok: 'var(--color-budget-ok)',
  warning: 'var(--color-budget-warning)',
  exceeded: 'var(--color-budget-exceeded)',
} as const