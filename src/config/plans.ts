// config/plans.ts
// Billing architecture placeholder for future Stripe integration

// TODO: Install @stripe/stripe-js and stripe packages when ready for integration
// TODO: Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to .env.local
// TODO: Create Stripe products/prices matching these plan IDs

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BillingPeriod = 'monthly' | 'yearly'

export type PlanId = 'free' | 'pro' | 'business'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'

export interface PlanPrice {
  monthly: number  // EUR per month
  yearly: number   // EUR per year (discounted)
}

export interface PlanLimits {
  accounts: number         // Max accounts (-1 = unlimited)
  transactionsPerMonth: number  // Max transactions per month (-1 = unlimited)
  categories: number       // Max categories per account (-1 = unlimited)
  budgets: number          // Max budgets (-1 = unlimited)
  csvExport: boolean
  apiAccess: boolean
  prioritySupport: boolean
}

export interface Plan {
  id: PlanId
  name: string
  description: string
  price: PlanPrice
  features: string[]
  limits: PlanLimits
  // TODO: Add stripePriceId: { monthly: string; yearly: string } when Stripe products are created
  popular?: boolean
}

export interface Subscription {
  id: string
  userId: string
  planId: PlanId
  status: SubscriptionStatus
  billingPeriod: BillingPeriod
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  // TODO: Add stripeSubscriptionId: string
  // TODO: Add stripeCustomerId: string
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Plans definition
// ---------------------------------------------------------------------------

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Pour commencer à suivre vos finances personnelles.',
    price: { monthly: 0, yearly: 0 },
    features: [
      '1 compte',
      '50 transactions / mois',
      '25 catégories',
      '5 budgets',
      'Export CSV',
      'Dashboard de base',
    ],
    limits: {
      accounts: 1,
      transactionsPerMonth: 50,
      categories: 25,
      budgets: 5,
      csvExport: true,
      apiAccess: false,
      prioritySupport: false,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour une gestion avancee de vos finances.',
    price: { monthly: 6.99, yearly: 59.88 },
    features: [
      '5 comptes',
      'Transactions illimitees',
      'Categories illimitees',
      'Budgets illimites',
      'Export CSV',
      'Graphiques avances',
      'Transactions recurrentes',
    ],
    limits: {
      accounts: 5,
      transactionsPerMonth: -1,
      categories: -1,
      budgets: -1,
      csvExport: true,
      apiAccess: false,
      prioritySupport: false,
    },
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les independants et petites entreprises.',
    price: { monthly: 14.99, yearly: 119.88 },
    features: [
      'Comptes illimites',
      'Transactions illimitees',
      'Categories illimitees',
      'Budgets illimites',
      'Export CSV',
      'Acces API',
      'Support prioritaire',
      'Rapports personnalises',
    ],
    limits: {
      accounts: -1,
      transactionsPerMonth: -1,
      categories: -1,
      budgets: -1,
      csvExport: true,
      apiAccess: true,
      prioritySupport: true,
    },
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a plan by its ID */
export function getPlanById(planId: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Plan not found: ${planId}`)
  return plan
}

/** Get the default free plan */
export function getFreePlan(): Plan {
  return getPlanById('free')
}

/** Format plan price for display */
export function formatPlanPrice(plan: Plan, period: BillingPeriod = 'monthly'): string {
  if (plan.price.monthly === 0) return 'Gratuit'
  const price = period === 'monthly' ? plan.price.monthly : plan.price.yearly / 12
  return `${price.toFixed(2).replace('.', ',')} \u20AC / mois`
}

// TODO: Add createCheckoutSession(planId, billingPeriod) server action
// TODO: Add createCustomerPortalSession() server action
// TODO: Add webhook handler for subscription lifecycle events
// TODO: Add middleware to check plan limits before allowing actions
