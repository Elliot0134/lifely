import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { TransactionType } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Toujours utiliser cette fonction pour formater les montants
export function formatCurrency(amount: number, type?: TransactionType): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount))

  // Ajouter le signe selon le type
  if (type === 'revenue') return `+${formatted}`
  if (type) return `-${formatted}`
  return formatted
}

export function formatDate(date: string | Date, formatString: string = 'dd/MM/yyyy'): string {
  return format(new Date(date), formatString, { locale: fr })
}

export function formatDateRelative(date: string | Date): string {
  const now = new Date()
  const targetDate = new Date(date)
  const diffInDays = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Aujourd'hui"
  if (diffInDays === 1) return "Hier"
  if (diffInDays < 7) return `Il y a ${diffInDays} jours`

  return formatDate(date)
}

export function getTransactionTypeColor(type: TransactionType): string {
  const colors = {
    revenue: '#8b9a6b',          // Olive sage - revenus
    variable_expense: '#f26a4b', // Terracotta - depenses variables
    fixed_expense: '#8e8a83',    // Warm gray - charges fixes
    credit: '#c45c5c',           // Muted red - credits
    savings: '#a89f8f',          // Warm beige - epargne
  }
  return colors[type]
}

export function getTransactionTypeLabel(type: TransactionType): string {
  const labels = {
    revenue: 'Revenu',
    variable_expense: 'Dépense variable',
    fixed_expense: 'Charge fixe',
    credit: 'Crédit',
    savings: 'Épargne',
  }
  return labels[type]
}

export function getBudgetStatusColor(percentageUsed: number): string {
  if (percentageUsed < 80) return '#8b9a6b'    // Olive sage
  if (percentageUsed < 100) return '#d4a76a'   // Warm amber
  return '#c45c5c'                              // Muted red
}
