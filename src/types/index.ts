// types/index.ts

export type TransactionType = 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
export type RecurrenceFrequency = 'monthly' | 'weekly' | 'yearly'
export type AccountType = 'personal' | 'business'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
  account_id: string
  name: string
  icon: string
  color: string
  transaction_type: TransactionType
  is_default: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string
  type: TransactionType
  amount: number
  description: string | null
  date: string
  is_recurring: boolean
  recurring_id: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: Category
  account?: Account
}

export interface RecurringTransaction {
  id: string
  user_id: string
  account_id: string
  category_id: string
  type: TransactionType
  amount: number
  description: string | null
  frequency: RecurrenceFrequency
  day_of_month: number
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_at: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: Category
  account?: Account
}

export interface Budget {
  id: string
  user_id: string
  account_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
  // Joined
  category?: Category
  account?: Account
}

export interface BudgetVsReal {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  transaction_type: TransactionType
  month: number
  year: number
  budget_amount: number
  real_amount: number
  remaining: number
  percentage_used: number
}

export interface DashboardStats {
  revenue: number
  expenses: number
  savings: number
  net_balance: number
  savings_rate: number
  revenue_variation: number      // % vs période précédente
  expenses_variation: number
  savings_variation: number
  net_balance_variation: number
}

export interface MonthlyData {
  month: number
  year: number
  revenue: number
  variable_expense: number
  fixed_expense: number
  credit: number
  savings: number
  total_expenses: number
  net_balance: number
}

export interface CategoryBreakdown {
  category_id: string
  category_name: string
  category_icon: string
  category_color: string
  total: number
  percentage: number
  transaction_count: number
}

export interface PeriodFilter {
  month: number | null   // null = année complète
  year: number
}

export interface TransactionTemplate {
  id: string
  user_id: string
  account_id: string
  name: string
  category_id: string
  type: TransactionType
  amount: number
  description: string | null
  created_at: string
  updated_at: string
  // Joined
  category?: Category
  account?: Account
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface TransactionFilters {
  type?: TransactionType | TransactionType[]
  category_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  limit?: number
}