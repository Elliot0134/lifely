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

// ─── Default Categories ─────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES: {
  name: string
  icon: string
  color: string
  transaction_type: TransactionType
}[] = [
  // Revenue
  { name: 'Salaire', icon: '💰', color: '#22c55e', transaction_type: 'revenue' },
  { name: 'Freelance', icon: '💻', color: '#16a34a', transaction_type: 'revenue' },
  { name: 'Autres revenus', icon: '📥', color: '#15803d', transaction_type: 'revenue' },
  // Variable expenses
  { name: 'Alimentation', icon: '🛒', color: '#f97316', transaction_type: 'variable_expense' },
  { name: 'Transport', icon: '🚗', color: '#ef4444', transaction_type: 'variable_expense' },
  { name: 'Loisirs', icon: '🎮', color: '#8b5cf6', transaction_type: 'variable_expense' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', transaction_type: 'variable_expense' },
  { name: 'Restaurants', icon: '🍽️', color: '#f59e0b', transaction_type: 'variable_expense' },
  { name: 'Santé', icon: '🏥', color: '#14b8a6', transaction_type: 'variable_expense' },
  // Fixed expenses
  { name: 'Loyer', icon: '🏠', color: '#3b82f6', transaction_type: 'fixed_expense' },
  { name: 'Électricité', icon: '⚡', color: '#eab308', transaction_type: 'fixed_expense' },
  { name: 'Internet', icon: '📡', color: '#6366f1', transaction_type: 'fixed_expense' },
  { name: 'Téléphone', icon: '📱', color: '#a855f7', transaction_type: 'fixed_expense' },
  { name: 'Assurance', icon: '🛡️', color: '#64748b', transaction_type: 'fixed_expense' },
  { name: 'Abonnements', icon: '📺', color: '#0ea5e9', transaction_type: 'fixed_expense' },
  // Credits
  { name: 'Crédit immobilier', icon: '🏘️', color: '#dc2626', transaction_type: 'credit' },
  { name: 'Crédit auto', icon: '🚘', color: '#b91c1c', transaction_type: 'credit' },
  { name: 'Crédit conso', icon: '💳', color: '#991b1b', transaction_type: 'credit' },
  // Savings
  { name: 'Livret A', icon: '🏦', color: '#22d3ee', transaction_type: 'savings' },
  { name: 'Investissements', icon: '📈', color: '#06b6d4', transaction_type: 'savings' },
  { name: 'Épargne projet', icon: '🎯', color: '#0891b2', transaction_type: 'savings' },
]

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

export const TASK_STATUSES = [
  { value: 'todo', label: 'À faire', color: 'hsl(0 0% 63%)' },
  { value: 'in_progress', label: 'En cours', color: 'hsl(217 91% 60%)' },
  { value: 'completed', label: 'Terminé', color: 'hsl(142 76% 36%)' },
] as const

export const EISENHOWER_QUADRANTS = [
  { key: 'urgent_important', label: 'Urgent & Important', color: 'hsl(0 84% 60%)' },
  { key: 'urgent', label: 'Urgent', color: 'hsl(24 95% 53%)' },
  { key: 'important', label: 'Important', color: 'hsl(45 93% 47%)' },
  { key: 'none', label: 'Aucune urgence', color: 'hsl(0 0% 63%)' },
] as const

export const TASK_URGENCIES = [
  { value: 'urgent_important', label: 'Urgent & Important', color: 'hsl(0 84% 60%)' },
  { value: 'urgent', label: 'Urgent', color: 'hsl(24 95% 53%)' },
  { value: 'important', label: 'Important', color: 'hsl(45 93% 47%)' },
] as const

export const TASK_DUE_STATUS_COLORS = {
  overdue: 'hsl(0 84% 60%)',
  today: 'hsl(217 91% 60%)',
  upcoming: 'hsl(45 93% 47%)',
  future: 'hsl(0 0% 63%)',
  no_date: 'hsl(0 0% 63%)',
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