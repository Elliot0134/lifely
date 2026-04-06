# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LifeLy is a personal finance tracking application built with Next.js 14+, TypeScript, and Supabase. It replaces Excel spreadsheets with a modern web interface featuring interactive dashboards, transaction management, category-based budgeting, and analytical charts.

## Key Architecture

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts (via shadcn/ui charts)
- **State Management**: TanStack Query + React Hook Form
- **Authentication**: Supabase Auth

### Core Data Model
```
User → Accounts → Categories → Transactions
                            → Budgets
                            → RecurringTransactions
```

**Important**: This implementation extends the original brief by adding `Accounts` concept, allowing users to manage multiple accounts (personal/business) - this is a SaaS evolution beyond the single-user MVP.

### Transaction Types (Central to the app)
1. `revenue` - Income (salary, freelance)
2. `variable_expense` - Variable expenses (groceries, gas, entertainment)
3. `fixed_expense` - Fixed charges (rent, utilities, subscriptions)
4. `credit` - Credits/loans (mortgage, car loans)
5. `savings` - Savings (bank accounts, investments)

## Development Commands

```bash
# Development
npm run dev                 # Start development server (http://localhost:3000)
npm run build              # Build production bundle
npm run start              # Start production server
npm run lint               # Run ESLint

# Database (via Supabase CLI - if configured)
npx supabase start         # Start local Supabase
npx supabase stop          # Stop local Supabase
npx supabase db reset      # Reset local database
npx supabase gen types typescript --local > src/types/database.types.ts

# Dependencies management
npm install                # Install dependencies
npx shadcn@latest add [component]  # Add shadcn/ui components
```

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth routes group
│   ├── (dashboard)/             # Protected dashboard routes
│   ├── api/                     # API routes & Server Actions
│   └── globals.css              # Global styles + CSS variables
├── components/
│   ├── ui/                      # shadcn/ui components (auto-generated)
│   ├── layout/                  # Header, Sidebar, Navigation
│   ├── dashboard/               # Dashboard-specific components
│   ├── transactions/            # Transaction management
│   ├── budgets/                 # Budget tracking components
│   ├── categories/              # Category management
│   ├── shared/                  # Reusable components
│   └── providers/               # React providers (Query, Theme)
├── lib/
│   ├── supabase/               # Supabase client configuration
│   ├── queries/                # TanStack Query hooks
│   ├── validations/            # Zod schemas
│   ├── utils.ts                # Utilities (cn, formatCurrency)
│   └── constants.ts            # App constants & enums
├── hooks/                       # Custom React hooks
├── types/                       # TypeScript type definitions
└── config/                      # Site config, navigation
```

## Key Conventions

### File Naming
- **Components**: PascalCase (`TransactionForm.tsx`)
- **Hooks**: camelCase with `use` prefix (`use-period-filter.ts`)
- **API Routes**: lowercase (`route.ts`)
- **Types**: PascalCase for interfaces/types

### TypeScript Patterns
- Always use strict TypeScript (no `any`)
- Generate types from Supabase: `types/database.types.ts`
- Import types from `@/types` for app-specific interfaces
- Use Zod for runtime validation (`lib/validations/`)

### Component Architecture
- Use shadcn/ui components as base building blocks
- Server Components by default, Client Components when needed
- React Hook Form + Zod for form validation
- TanStack Query for data fetching with optimistic updates

### Modal Design Rules (CRITICAL)
**Les modales sont automatiquement responsives :**
```tsx
<DialogContent>
  {/* Contenu de la modale */}
</DialogContent>
```
- **Mobile** : 90vw de largeur avec marges automatiques (16px)
- **Desktop** : largeur max 448px (max-w-md)
- **Centrage** : Automatique - horizontal ET vertical au milieu de l'écran
- **JAMAIS** de modal qui touche les bords sur mobile
- **Responsive géré par le composant Dialog de base** - pas besoin de classes additionnelles

### Form Fields in Modals (CRITICAL)
**Pas de labels au-dessus des champs. Le titre du champ va dans le placeholder.**
```tsx
// ✅ Correct — label dans le placeholder
<Input placeholder="Nom de l'entreprise (ex: ESST Solutions...)" />

// ❌ Interdit — label séparé au-dessus
<FormLabel>Nom de l'entreprise</FormLabel>
<Input placeholder="Ex: ESST Solutions..." />
```
- **JAMAIS** de `FormLabel` dans les modales — ça fait trop de texte
- Le placeholder doit inclure le nom du champ + un exemple si pertinent
- Pour les selects, utiliser `<SelectValue placeholder="Groupe..." />`
- Objectif : UI épurée, moins de bruit visuel

### Styling System
```css
/* Transaction type colors (defined in globals.css) */
--color-revenue: 142 76% 36%;           /* Green */
--color-variable-expense: 24 95% 53%;   /* Orange */
--color-fixed-expense: 217 91% 60%;     /* Blue */
--color-credit: 0 84% 60%;              /* Red */
--color-savings: 187 85% 53%;           /* Cyan */
```

### Currency Formatting
Always use `formatCurrency()` utility from `lib/utils.ts`:
```typescript
formatCurrency(1234.56, 'revenue') // "+1 234,56 €"
formatCurrency(1234.56, 'variable_expense') // "-1 234,56 €"
```

## Database Architecture

### Supabase Configuration
- **Environment**: `.env.local` contains Supabase credentials
- **RLS**: All tables have Row Level Security enabled
- **Auth**: Supabase Auth with automatic profile creation
- **Storage**: For user avatars and future file attachments

### Critical Database Concepts
- **Profiles**: Auto-created on user signup with default categories
- **Categories**: User-specific, grouped by transaction type, with colors and icons
- **Transactions**: Core entity with foreign keys to categories and accounts
- **Budgets**: Monthly spending limits per category
- **Recurring**: Auto-generate transactions (salary, rent, subscriptions)

### Default Categories
Upon user registration, 25 default categories are automatically created across all transaction types (see `lib/constants.ts` for the complete list).

## API Patterns

### API Routes Structure
```
/api/
├── transactions/
│   ├── route.ts              # GET (list + filters), POST
│   └── [id]/route.ts         # GET, PATCH, DELETE
├── budgets/
├── categories/
├── recurring/
├── dashboard/stats/          # Aggregated KPIs and chart data
└── cron/generate-recurring/  # Auto-generate recurring transactions
```

### Query Key Factory
Use consistent query keys from `lib/queries/keys.ts`:
```typescript
// ✅ Correct
queryKey: queryKeys.transactions.filtered({ type: 'revenue', date_from: '2025-01-01' })

// ❌ Avoid
queryKey: ['transactions', 'list', filters]
```

## UI/UX Patterns

### Responsive Design
- **Mobile**: Sheet (hamburger menu), stacked layouts, full-width cards
- **Tablet**: Collapsed sidebar, 2-column grids
- **Desktop**: Full sidebar, multi-column layouts, data tables

### Form Patterns
- Use React Hook Form + Zod validation
- Optimistic updates with TanStack Query
- Toast notifications for success/error states
- Loading states with Skeleton components

### Color-Coded Data
- **Green**: Revenue, positive variations, budget under 80%
- **Orange**: Variable expenses, budget 80-100%
- **Blue**: Fixed expenses, neutral states
- **Red**: Credits, overspending, negative variations
- **Cyan**: Savings

## Common Development Tasks

### Adding a New Transaction Type
1. Update `TransactionType` in `types/index.ts`
2. Add to `TRANSACTION_TYPES` in `lib/constants.ts`
3. Define CSS color variable in `app/globals.css`
4. Update validation schemas in `lib/validations/`

### Adding a New Chart Component
1. Create in `components/dashboard/`
2. Use Recharts with consistent color scheme
3. Implement responsive sizing
4. Add to dashboard page with proper data fetching

### Database Schema Changes
1. Create migration in Supabase Dashboard or CLI
2. Update RLS policies if needed
3. Regenerate TypeScript types
4. Update related API routes and queries

## Performance Considerations

### Data Fetching
- Use TanStack Query for caching and deduplication
- Implement pagination for transaction lists
- Use Supabase views for complex aggregations (`v_monthly_summary`, `v_budget_vs_real`)

### Bundle Size
- shadcn/ui components are tree-shakable
- Use dynamic imports for heavy chart components
- Optimize images with Next.js Image component

### Database Optimization
- Leverage database indexes (see LIFELY-BRIEF-COMPLET.md)
- Use Supabase Edge Functions for complex operations
- Implement proper RLS for multi-tenant security

## Common Patterns to Follow

### Error Handling
```typescript
// API Routes
try {
  // Operation
  return NextResponse.json({ data: result })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json({ error: 'Operation failed' }, { status: 500 })
}

// React Query
const { data, error, isLoading } = useQuery({
  queryKey: queryKeys.transactions.all,
  queryFn: fetchTransactions,
})

if (error) return <ErrorState error={error} />
if (isLoading) return <TransactionsSkeleton />
```

### Form Validation
```typescript
// Use Zod schemas from lib/validations/
const form = useForm<TransactionInput>({
  resolver: zodResolver(transactionSchema),
  defaultValues: { /* ... */ }
})
```

## Important Notes

### Security
- All database access goes through RLS policies
- User can only see/modify their own data
- API routes validate user authentication
- No sensitive data in client-side code

### Internationalization
- App is primarily in French (target market)
- Currency is EUR only for MVP
- Use French date formats (DD/MM/YYYY)

### Future Considerations
This codebase is designed for SaaS evolution:
- Multi-account support is already implemented
- User profiles support multiple preferences
- RLS policies are multi-tenant ready
- Authentication supports multiple providers

## MCP Integration

The project uses Model Context Protocol with:
- **Supabase MCP**: Database operations, type generation, migrations
- **shadcn MCP**: Component installation and management

Access via:
```bash
# Supabase operations
# (Available through Claude Code's Supabase MCP integration)

# shadcn components
npx shadcn@latest add [component-name]
```

## For Claude: Key Implementation Priorities

When working on this codebase:

1. **Always check existing types** in `types/index.ts` before creating new ones
2. **Use the established patterns** for API routes, queries, and components
3. **Follow the color scheme** defined in constants and CSS variables
4. **Implement proper error handling** and loading states
5. **Ensure responsive design** for all new components
6. **Test with realistic financial data** (transactions, budgets, categories)
7. **Maintain consistency** with the existing dashboard and navigation patterns

The app should feel like a professional financial management tool with clear visual hierarchy and intuitive user flows.