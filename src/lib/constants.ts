import { TransactionType } from "@/types"

export const TRANSACTION_TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'revenue', label: 'Revenu', color: '#8b9a6b' },
  { value: 'variable_expense', label: 'Dépense variable', color: '#f26a4b' },
  { value: 'fixed_expense', label: 'Charge fixe', color: '#8e8a83' },
  { value: 'credit', label: 'Crédit', color: '#c45c5c' },
  { value: 'savings', label: 'Épargne', color: '#a89f8f' },
]

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export const RECURRENCE_FREQUENCIES = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
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

// ─── Task Management ─────────────────────────────────────────────────────────

export const COMPANY_STATUSES = [
  { value: 'not_started', label: 'Pas commencé', color: 'hsl(0 0% 63%)' },
  { value: 'active', label: 'Active', color: 'hsl(142 76% 36%)' },
  { value: 'completed', label: 'Terminée', color: 'hsl(217 91% 60%)' },
] as const

export const PROJECT_STATUSES = [
  { value: 'not_started', label: 'Pas commencé', color: 'hsl(0 0% 63%)' },
  { value: 'in_progress', label: 'En cours', color: 'hsl(45 93% 47%)' },
  { value: 'completed', label: 'Terminé', color: 'hsl(142 76% 36%)' },
] as const

export const TASK_URGENCIES = [
  { value: 'urgent', label: '🔥 Urgent', color: 'hsl(0 84% 60%)' },
  { value: 'important', label: '🚨 Important', color: 'hsl(24 95% 53%)' },
] as const

export const TASK_DUE_STATUS_COLORS = {
  overdue: 'hsl(0 84% 60%)',
  today: 'hsl(217 91% 60%)',
  upcoming: 'hsl(45 93% 47%)',
  future: 'hsl(0 0% 63%)',
  no_date: 'hsl(0 0% 63%)',
  completed: 'hsl(142 76% 36%)',
} as const

export const PROJECT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#f43f5e', '#64748b',
] as const

export const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
] as const

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lundi' },
  { value: 1, label: 'Mardi' },
  { value: 2, label: 'Mercredi' },
  { value: 3, label: 'Jeudi' },
  { value: 4, label: 'Vendredi' },
  { value: 5, label: 'Samedi' },
  { value: 6, label: 'Dimanche' },
] as const

export const TIME_ESTIMATION_PRESETS = [
  { value: 15, label: '15 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1h' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2h' },
  { value: 180, label: '3h' },
  { value: 240, label: '4h' },
] as const