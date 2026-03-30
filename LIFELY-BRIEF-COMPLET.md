# LifeLy — Brief Technique Complet

## 🎯 Vision Produit

### Résumé
LifeLy est une application web de suivi des finances personnelles. Elle remplace un fichier Excel par une interface moderne avec dashboard interactif, gestion de transactions, budgets par catégorie et graphiques analytiques.

### Modèle
- **Phase 1 (MVP)** : Application personnelle, un seul utilisateur
- **Phase 2** : SaaS multi-utilisateurs avec authentification, abonnement freemium
- **Devise** : EUR uniquement (MVP)

### Proposition de Valeur
- Suivi complet revenus / dépenses avec catégorisation fine
- Dashboard visuel avec graphiques interactifs (ligne, camembert, barres)
- Budgets mensuels avec comparaison Budget vs Réel
- Transactions récurrentes automatisées (loyer, salaire, abonnements)
- Catégories entièrement personnalisables

---

## 🏗️ Architecture Technique

### Stack

| Catégorie | Technologie |
|-----------|-------------|
| Framework | Next.js 14+ (App Router, TypeScript) |
| UI | shadcn/ui + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase Auth (Email + Password) |
| Charts | Recharts (via shadcn/ui charts) |
| Forms | React Hook Form + Zod |
| State / Fetching | TanStack Query + API Routes |
| Déploiement | Vercel |
| Thème | next-themes (dark/light) + tweakcn (thème custom fourni ultérieurement) |

### Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Structure des Fichiers

```
📁 src/
├── 📁 app/
│   ├── 📁 (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── 📁 (dashboard)/
│   │   ├── layout.tsx                # Layout avec sidebar
│   │   ├── page.tsx                  # Dashboard (page par défaut)
│   │   ├── 📁 transactions/
│   │   │   └── page.tsx
│   │   ├── 📁 budgets/
│   │   │   └── page.tsx
│   │   ├── 📁 categories/
│   │   │   └── page.tsx
│   │   └── 📁 settings/
│   │       └── page.tsx
│   ├── 📁 api/
│   │   ├── 📁 transactions/
│   │   │   ├── route.ts              # GET (list + filters), POST
│   │   │   └── [id]/route.ts         # GET, PATCH, DELETE
│   │   ├── 📁 budgets/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── 📁 categories/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── 📁 recurring/
│   │   │   └── route.ts              # GET, POST, PATCH, DELETE
│   │   ├── 📁 dashboard/
│   │   │   └── stats/route.ts        # GET — KPIs + données graphiques agrégées
│   │   └── 📁 cron/
│   │       └── generate-recurring/route.ts  # POST — génération mensuelle
│   ├── layout.tsx                    # Root layout (providers)
│   └── page.tsx                      # Redirect vers /login ou /dashboard
├── 📁 components/
│   ├── 📁 ui/                        # shadcn (auto-générés)
│   ├── 📁 layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── theme-toggle.tsx
│   │   └── mobile-nav.tsx
│   ├── 📁 dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── revenue-expense-line-chart.tsx
│   │   ├── category-pie-chart.tsx
│   │   ├── monthly-comparison-bar-chart.tsx
│   │   ├── net-balance-area-chart.tsx
│   │   └── period-selector.tsx
│   ├── 📁 transactions/
│   │   ├── transaction-form.tsx
│   │   ├── transaction-list.tsx
│   │   ├── transaction-filters.tsx
│   │   └── recurring-form.tsx
│   ├── 📁 budgets/
│   │   ├── budget-form.tsx
│   │   ├── budget-list.tsx
│   │   ├── budget-progress-bar.tsx
│   │   └── budget-vs-real-table.tsx
│   ├── 📁 categories/
│   │   ├── category-form.tsx
│   │   ├── category-list.tsx
│   │   └── category-icon-picker.tsx
│   └── 📁 shared/
│       ├── empty-state.tsx
│       ├── loading-skeleton.tsx
│       ├── confirm-dialog.tsx
│       └── currency-display.tsx
├── 📁 lib/
│   ├── 📁 supabase/
│   │   ├── client.ts                 # Client browser
│   │   ├── server.ts                 # Client serveur
│   │   └── middleware.ts             # Client middleware
│   ├── 📁 api/
│   │   └── client.ts                 # Fetch wrapper (GET, POST, PATCH, DELETE)
│   ├── 📁 queries/
│   │   ├── keys.ts                   # Query keys factory
│   │   ├── transactions.ts           # useTransactions, useCreateTransaction, etc.
│   │   ├── budgets.ts
│   │   ├── categories.ts
│   │   └── dashboard.ts              # useDashboardStats
│   ├── 📁 validations/
│   │   ├── transaction.ts            # Schémas Zod
│   │   ├── budget.ts
│   │   └── category.ts
│   ├── utils.ts                      # cn(), formatCurrency(), formatDate()
│   └── constants.ts                  # Couleurs, catégories par défaut, mois
├── 📁 types/
│   └── index.ts                      # Types TypeScript
└── 📁 hooks/
    └── use-period-filter.ts          # Hook pour le sélecteur de période
```

---

## 🗺️ Sitemap & Navigation

```
/                        → Redirect vers /dashboard (si auth) ou /login
/login                   → Page de connexion
/register                → Page d'inscription
/dashboard               → Dashboard avec KPIs et graphiques
/transactions            → Liste + CRUD des transactions
/budgets                 → Gestion des budgets par catégorie
/categories              → Gestion des catégories personnalisées
/settings                → Paramètres (profil, thème, préférences)
```

### Sidebar Navigation

```
┌──────────────────────┐
│  💰 LifeLy           │
│                      │
│  📊 Dashboard        │
│  💳 Transactions     │
│  🎯 Budgets          │
│  🏷️ Catégories       │
│                      │
│  ──────────────────  │
│  ⚙️ Paramètres       │
│  🌙 Theme toggle     │
│  🚪 Déconnexion      │
└──────────────────────┘
```

---

## 🗄️ Base de Données Supabase

### Diagramme Entité-Relation

```
[profiles] 1────< [transactions]
    │                    │
    │                    └──── belongs to ────> [categories]
    │
    ├───< [budgets] ────────── belongs to ────> [categories]
    │
    ├───< [recurring_transactions] ── belongs to ──> [categories]
    │
    └───< [categories]
```

### Types ENUM

```sql
-- Types de transaction (5 types inspirés de la structure Excel)
CREATE TYPE public.transaction_type AS ENUM (
  'revenue',            -- Revenus (salaire, extras, freelance)
  'variable_expense',   -- Dépenses variables (courses, carburant, sorties)
  'fixed_expense',      -- Charges fixes / factures (électricité, Netflix, téléphone)
  'credit',             -- Crédits / remboursements (maison, voiture)
  'savings'             -- Épargne (livret A, investissements)
);

-- Fréquence des transactions récurrentes
CREATE TYPE public.recurrence_frequency AS ENUM (
  'monthly',
  'weekly',
  'yearly'
);
```

### Table : profiles

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'EUR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : créer un profil automatiquement à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Table : categories

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',              -- Emoji ou nom d'icône Lucide
  color TEXT DEFAULT '#6B7280',        -- Couleur HEX
  transaction_type transaction_type NOT NULL, -- À quel type de transaction elle appartient
  is_default BOOLEAN DEFAULT FALSE,    -- Catégorie pré-créée
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, name, transaction_type)
);
```

#### Catégories par défaut (seed)

À insérer automatiquement lors de la création d'un compte utilisateur :

```
TYPE: revenue
  - Salaire (#22c55e, 💰)
  - Freelance (#16a34a, 💻)
  - Autres revenus (#15803d, 📥)

TYPE: variable_expense
  - Alimentation (#f97316, 🛒)
  - Transport (#ef4444, 🚗)
  - Loisirs (#8b5cf6, 🎮)
  - Shopping (#ec4899, 🛍️)
  - Restaurants (#f59e0b, 🍽️)
  - Santé (#14b8a6, 🏥)

TYPE: fixed_expense
  - Loyer (#3b82f6, 🏠)
  - Électricité (#eab308, ⚡)
  - Internet (#6366f1, 📡)
  - Téléphone (#a855f7, 📱)
  - Assurance (#64748b, 🛡️)
  - Abonnements (#0ea5e9, 📺)

TYPE: credit
  - Crédit immobilier (#dc2626, 🏘️)
  - Crédit auto (#b91c1c, 🚘)
  - Crédit conso (#991b1b, 💳)

TYPE: savings
  - Livret A (#22d3ee, 🏦)
  - Investissements (#06b6d4, 📈)
  - Épargne projet (#0891b2, 🎯)
```

### Table : transactions

```sql
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0), -- Toujours positif, le type détermine le signe
  description TEXT,                                  -- Note / commentaire
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT FALSE,                -- Générée par une récurrence ?
  recurring_id UUID REFERENCES public.recurring_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table : recurring_transactions

```sql
CREATE TABLE public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  type transaction_type NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  description TEXT,
  frequency recurrence_frequency NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- Jour du mois pour la génération
  start_date DATE NOT NULL,
  end_date DATE,                      -- NULL = pas de fin
  is_active BOOLEAN DEFAULT TRUE,
  last_generated_at DATE,             -- Dernière date de génération
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table : budgets

```sql
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),  -- Plafond mensuel en EUR
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, category_id, month, year)
);
```

### Row Level Security (RLS)

```sql
-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Profiles : l'utilisateur ne voit que son profil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Categories : CRUD sur ses propres catégories
CREATE POLICY "Users can view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions : CRUD sur ses propres transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- Recurring : CRUD sur ses propres récurrences
CREATE POLICY "Users can view own recurring" ON public.recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recurring" ON public.recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recurring" ON public.recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own recurring" ON public.recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- Budgets : CRUD sur ses propres budgets
CREATE POLICY "Users can view own budgets" ON public.budgets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own budgets" ON public.budgets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own budgets" ON public.budgets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own budgets" ON public.budgets FOR DELETE USING (auth.uid() = user_id);
```

### Index

```sql
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date);
CREATE INDEX idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX idx_budgets_user_month_year ON public.budgets(user_id, month, year);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);
CREATE INDEX idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX idx_recurring_active ON public.recurring_transactions(is_active, last_generated_at);
```

### Vues agrégées pour le Dashboard

```sql
-- Vue : résumé mensuel par type
CREATE VIEW public.v_monthly_summary AS
SELECT
  user_id,
  EXTRACT(YEAR FROM date)::INTEGER AS year,
  EXTRACT(MONTH FROM date)::INTEGER AS month,
  type,
  SUM(amount) AS total,
  COUNT(*) AS transaction_count
FROM public.transactions
GROUP BY user_id, year, month, type;

-- Vue : dépenses par catégorie pour un mois
CREATE VIEW public.v_category_breakdown AS
SELECT
  user_id,
  category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  t.type,
  EXTRACT(YEAR FROM t.date)::INTEGER AS year,
  EXTRACT(MONTH FROM t.date)::INTEGER AS month,
  SUM(t.amount) AS total,
  COUNT(*) AS transaction_count
FROM public.transactions t
JOIN public.categories c ON c.id = t.category_id
GROUP BY user_id, category_id, c.name, c.icon, c.color, t.type, year, month;

-- Vue : budget vs réel
CREATE VIEW public.v_budget_vs_real AS
SELECT
  b.user_id,
  b.category_id,
  c.name AS category_name,
  c.icon AS category_icon,
  c.color AS category_color,
  c.transaction_type,
  b.month,
  b.year,
  b.amount AS budget_amount,
  COALESCE(SUM(t.amount), 0) AS real_amount,
  b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
  CASE
    WHEN b.amount > 0
    THEN ROUND((COALESCE(SUM(t.amount), 0) / b.amount) * 100, 1)
    ELSE 0
  END AS percentage_used
FROM public.budgets b
JOIN public.categories c ON c.id = b.category_id
LEFT JOIN public.transactions t
  ON t.category_id = b.category_id
  AND t.user_id = b.user_id
  AND EXTRACT(MONTH FROM t.date) = b.month
  AND EXTRACT(YEAR FROM t.date) = b.year
GROUP BY b.user_id, b.category_id, c.name, c.icon, c.color, c.transaction_type, b.month, b.year, b.amount;
```

### Fonctions utilitaires

```sql
-- Fonction : updated_at automatique
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer à toutes les tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_updated_at BEFORE UPDATE ON public.recurring_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON public.budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction : créer les catégories par défaut pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION public.create_default_categories()
RETURNS TRIGGER AS $$
BEGIN
  -- Revenus
  INSERT INTO public.categories (user_id, name, icon, color, transaction_type, is_default, sort_order) VALUES
    (NEW.id, 'Salaire', '💰', '#22c55e', 'revenue', true, 1),
    (NEW.id, 'Freelance', '💻', '#16a34a', 'revenue', true, 2),
    (NEW.id, 'Autres revenus', '📥', '#15803d', 'revenue', true, 3);

  -- Dépenses variables
  INSERT INTO public.categories (user_id, name, icon, color, transaction_type, is_default, sort_order) VALUES
    (NEW.id, 'Alimentation', '🛒', '#f97316', 'variable_expense', true, 1),
    (NEW.id, 'Transport', '🚗', '#ef4444', 'variable_expense', true, 2),
    (NEW.id, 'Loisirs', '🎮', '#8b5cf6', 'variable_expense', true, 3),
    (NEW.id, 'Shopping', '🛍️', '#ec4899', 'variable_expense', true, 4),
    (NEW.id, 'Restaurants', '🍽️', '#f59e0b', 'variable_expense', true, 5),
    (NEW.id, 'Santé', '🏥', '#14b8a6', 'variable_expense', true, 6);

  -- Charges fixes
  INSERT INTO public.categories (user_id, name, icon, color, transaction_type, is_default, sort_order) VALUES
    (NEW.id, 'Loyer', '🏠', '#3b82f6', 'fixed_expense', true, 1),
    (NEW.id, 'Électricité', '⚡', '#eab308', 'fixed_expense', true, 2),
    (NEW.id, 'Internet', '📡', '#6366f1', 'fixed_expense', true, 3),
    (NEW.id, 'Téléphone', '📱', '#a855f7', 'fixed_expense', true, 4),
    (NEW.id, 'Assurance', '🛡️', '#64748b', 'fixed_expense', true, 5),
    (NEW.id, 'Abonnements', '📺', '#0ea5e9', 'fixed_expense', true, 6);

  -- Crédits
  INSERT INTO public.categories (user_id, name, icon, color, transaction_type, is_default, sort_order) VALUES
    (NEW.id, 'Crédit immobilier', '🏘️', '#dc2626', 'credit', true, 1),
    (NEW.id, 'Crédit auto', '🚘', '#b91c1c', 'credit', true, 2),
    (NEW.id, 'Crédit conso', '💳', '#991b1b', 'credit', true, 3);

  -- Épargne
  INSERT INTO public.categories (user_id, name, icon, color, transaction_type, is_default, sort_order) VALUES
    (NEW.id, 'Livret A', '🏦', '#22d3ee', 'savings', true, 1),
    (NEW.id, 'Investissements', '📈', '#06b6d4', 'savings', true, 2),
    (NEW.id, 'Épargne projet', '🎯', '#0891b2', 'savings', true, 3);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_add_categories
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_categories();
```

### Script d'initialisation — Ordre d'exécution

```
1. Types ENUM (transaction_type, recurrence_frequency)
2. Tables (profiles, categories, transactions, recurring_transactions, budgets)
3. Triggers (handle_new_user, create_default_categories, updated_at)
4. RLS Policies
5. Index
6. Vues (v_monthly_summary, v_category_breakdown, v_budget_vs_real)
```

---

## 📦 Composants shadcn/ui à Installer

```bash
npx shadcn@latest add button card dialog form input select table tabs toast sidebar sheet skeleton avatar badge calendar checkbox command dropdown-menu popover scroll-area separator switch textarea tooltip chart alert-dialog progress label
```

---

## 📐 Wireframes par Page

### Page : Dashboard (`/dashboard`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [💰 LifeLy]   Dashboard                            👤 Profil  🌙   │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ 📊 Dash  │  ┌─── Sélecteur de période ──────────────────────────┐  │
│ 💳 Trans │  │  [Janvier ▼]  [2025 ▼]    ou   [Année complète]  │  │
│ 🎯 Budg  │  └──────────────────────────────────────────────────┘  │
│ 🏷️ Categ │                                                          │
│          │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│ ──────── │  │ Revenus  │ │ Dépenses │ │ Épargne  │ │ Solde    │  │
│ ⚙️ Param │  │ 3 200 €  │ │ 2 100 €  │ │  500 €   │ │  Net     │  │
│          │  │ ↑ +5.2%  │ │ ↓ -3.1%  │ │ ↑ +10%   │ │  600 €   │  │
│          │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│          │                                                          │
│          │  ┌─────────────────────────┐ ┌─────────────────────────┐│
│          │  │ 📈 Revenus vs Dépenses  │ │ 🥧 Répartition dépenses ││
│          │  │                         │ │                         ││
│          │  │  (Line chart)           │ │  (Pie/Donut chart)      ││
│          │  │  - Ligne revenus (vert) │ │  - Alimentaion 35%      ││
│          │  │  - Ligne dépenses (red) │ │  - Transport 20%        ││
│          │  │  Axe X: mois           │ │  - Loisirs 15%          ││
│          │  │                         │ │  - ...                  ││
│          │  └─────────────────────────┘ └─────────────────────────┘│
│          │                                                          │
│          │  ┌─────────────────────────┐ ┌─────────────────────────┐│
│          │  │ 📊 Comparaison mensuelle│ │ 📈 Solde net            ││
│          │  │                         │ │                         ││
│          │  │  (Stacked Bar chart)    │ │  (Area chart)           ││
│          │  │  Charges fixes          │ │  Évolution du solde     ││
│          │  │  Charges variables      │ │  net sur 12 mois        ││
│          │  │  Épargne                │ │                         ││
│          │  └─────────────────────────┘ └─────────────────────────┘│
│          │                                                          │
│          │  ┌───────────────────────────────────────────────────┐  │
│          │  │ 🏆 Taux d'épargne : 15.6%                         │  │
│          │  │ ████████████████░░░░░░░░░░░░░░░░  (progress bar)  │  │
│          │  └───────────────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────────────────┘
```

### KPIs du Dashboard

| KPI | Calcul | Icône |
|-----|--------|-------|
| **Revenus** | SUM(transactions WHERE type = 'revenue') pour la période | TrendingUp (vert) |
| **Dépenses** | SUM(transactions WHERE type IN ('variable_expense', 'fixed_expense', 'credit')) | TrendingDown (rouge) |
| **Épargne** | SUM(transactions WHERE type = 'savings') | PiggyBank (bleu) |
| **Solde net** | Revenus - Dépenses - Épargne | Wallet (selon +/-) |
| **Taux d'épargne** | (Épargne / Revenus) × 100 | Percent |

Chaque KPI affiche aussi la **variation par rapport au mois/période précédente** en pourcentage.

### Page : Transactions (`/transactions`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [💰 LifeLy]   Transactions                         👤 Profil  🌙   │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ Sidebar  │  Transactions              [+ Nouvelle transaction]      │
│          │                            [🔄 Gérer les récurrences]    │
│          │                                                          │
│          │  ┌─── Filtres ───────────────────────────────────────┐  │
│          │  │ [Type ▼] [Catégorie ▼] [Du: __] [Au: __] [🔍 ]  │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌──────────────────────────────────────────────────┐  │
│          │  │ Date       │ Catégorie    │ Type     │ Montant   │  │
│          │  ├────────────┼──────────────┼──────────┼───────────│  │
│          │  │ 15/01/2025 │ 🛒 Courses  │ Variable │  -85.30 € │  │
│          │  │ 14/01/2025 │ 💰 Salaire  │ Revenu   │ +3200.00€ │  │
│          │  │ 13/01/2025 │ ⚡ Électr.  │ Fixe     │ -120.00 € │  │
│          │  │ 12/01/2025 │ 🎮 Loisirs  │ Variable │  -45.99 € │  │
│          │  │ ...        │ ...          │ ...      │ ...       │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ◀ Page 1 sur 5 ▶                                       │
└──────────┴───────────────────────────────────────────────────────────┘
```

### Dialog : Nouvelle Transaction

```
┌──────────────────────────────────────────┐
│  Nouvelle transaction               [X]  │
│                                          │
│  Type *                                  │
│  [Dépense variable ▼]                   │
│                                          │
│  Catégorie *                             │
│  [🛒 Alimentation ▼]                    │
│  (filtrée selon le type sélectionné)     │
│                                          │
│  Montant (€) *                           │
│  [85.30]                                 │
│                                          │
│  Date *                                  │
│  [📅 15/01/2025]                         │
│                                          │
│  Description                             │
│  [Courses Carrefour              ]       │
│                                          │
│  [Annuler]              [💾 Enregistrer] │
└──────────────────────────────────────────┘
```

### Dialog : Gérer les Récurrences

```
┌───────────────────────────────────────────────────────────┐
│  Transactions récurrentes                            [X]  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 💰 Salaire     │ +3200€ │ Mensuel, le 28  │ [✏️][🗑]│ │
│  │ 🏠 Loyer       │  -850€ │ Mensuel, le 5   │ [✏️][🗑]│ │
│  │ 📡 Internet    │   -40€ │ Mensuel, le 15  │ [✏️][🗑]│ │
│  │ 📺 Netflix     │   -14€ │ Mensuel, le 1   │ [✏️][🗑]│ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  [+ Ajouter une récurrence]                               │
└───────────────────────────────────────────────────────────┘
```

### Page : Budgets (`/budgets`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [💰 LifeLy]   Budgets                              👤 Profil  🌙   │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ Sidebar  │  Budgets — Janvier 2025     [Mois ▼] [Année ▼]         │
│          │                                                          │
│          │  ┌─── Vue : Budget vs Réel ──────────────────────────┐  │
│          │  │                                                    │  │
│          │  │  🛒 Alimentation          280€ / 350€              │  │
│          │  │  ████████████████████░░░░░░  80%                   │  │
│          │  │                                                    │  │
│          │  │  🚗 Transport             120€ / 150€              │  │
│          │  │  ████████████████░░░░░░░░░  80%                   │  │
│          │  │                                                    │  │
│          │  │  🎮 Loisirs               190€ / 100€  ⚠️ DÉPASSÉ │  │
│          │  │  ██████████████████████████████  190%  (rouge)     │  │
│          │  │                                                    │  │
│          │  │  🍽️ Restaurants            45€ / 100€              │  │
│          │  │  █████████░░░░░░░░░░░░░░░░  45%                   │  │
│          │  │                                                    │  │
│          │  └────────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Tableau comparatif détaillé ────────────────────┐  │
│          │  │ Catégorie      │ Budget │ Réel   │ Restant │   %   │  │
│          │  ├────────────────┼────────┼────────┼─────────┼───────│  │
│          │  │ 🛒 Alimentation│ 350 €  │ 280 €  │   70 €  │  80% │  │
│          │  │ 🚗 Transport   │ 150 €  │ 120 €  │   30 €  │  80% │  │
│          │  │ 🎮 Loisirs     │ 100 €  │ 190 €  │  -90 €  │ 190% │  │
│          │  │ 🍽️ Restaurants │ 100 €  │  45 €  │   55 €  │  45% │  │
│          │  ├────────────────┼────────┼────────┼─────────┼───────│  │
│          │  │ TOTAL          │ 700 €  │ 635 €  │   65 €  │  91% │  │
│          │  └────────────────┴────────┴────────┴─────────┴───────┘  │
│          │                                                          │
│          │  [+ Définir un budget]   [📋 Copier le mois précédent]  │
└──────────┴───────────────────────────────────────────────────────────┘
```

### Page : Catégories (`/categories`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [💰 LifeLy]   Catégories                           👤 Profil  🌙   │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ Sidebar  │  Catégories              [+ Nouvelle catégorie]          │
│          │                                                          │
│          │  ┌─── Revenus ───────────────────────────────────────┐  │
│          │  │ 💰 Salaire       │ ● #22c55e │ défaut  │ [✏️][🗑]│  │
│          │  │ 💻 Freelance     │ ● #16a34a │ défaut  │ [✏️][🗑]│  │
│          │  │ 📥 Autres rev.   │ ● #15803d │ défaut  │ [✏️][🗑]│  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Dépenses variables ────────────────────────────┐  │
│          │  │ 🛒 Alimentation  │ ● #f97316 │ défaut  │ [✏️][🗑]│  │
│          │  │ 🚗 Transport     │ ● #ef4444 │ défaut  │ [✏️][🗑]│  │
│          │  │ 🎮 Loisirs       │ ● #8b5cf6 │ défaut  │ [✏️][🗑]│  │
│          │  │ ...                                               │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Charges fixes ─────────────────────────────────┐  │
│          │  │ ...                                               │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Crédits ───────────────────────────────────────┐  │
│          │  │ ...                                               │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Épargne ───────────────────────────────────────┐  │
│          │  │ ...                                               │  │
│          │  └──────────────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────────────────┘
```

### Page : Paramètres (`/settings`)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [💰 LifeLy]   Paramètres                           👤 Profil  🌙   │
├──────────┬───────────────────────────────────────────────────────────┤
│          │                                                          │
│ Sidebar  │  Paramètres                                              │
│          │                                                          │
│          │  ┌─── Profil ────────────────────────────────────────┐  │
│          │  │ Nom complet    [Elliot                    ]       │  │
│          │  │ Email          [elliot@example.com] (readonly)    │  │
│          │  │ Avatar         [📷 Changer]                       │  │
│          │  │                            [💾 Sauvegarder]       │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Préférences ───────────────────────────────────┐  │
│          │  │ Thème          [Système ▼] (Clair / Sombre / Sys) │  │
│          │  │ Devise         EUR (non modifiable MVP)           │  │
│          │  └──────────────────────────────────────────────────┘  │
│          │                                                          │
│          │  ┌─── Compte ────────────────────────────────────────┐  │
│          │  │ [🔑 Changer le mot de passe]                      │  │
│          │  │ [🗑️ Supprimer mon compte]  (danger zone)          │  │
│          │  └──────────────────────────────────────────────────┘  │
└──────────┴───────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design

| Composant | Mobile (<640px) | Tablet (640-1024px) | Desktop (>1024px) |
|-----------|----------------|---------------------|-------------------|
| Sidebar | Sheet (hamburger menu) | Icônes uniquement (collapsed) | Complète avec labels |
| KPI Grid | 2 colonnes empilées | 2 colonnes | 4 colonnes |
| Charts | 1 par ligne, pleine largeur | 2 par ligne | 2 par ligne |
| Table transactions | Vue en cards | Table compacte | Table complète |
| Dialog formulaire | Fullscreen (Sheet) | Dialog centré | Dialog centré |
| Budget progress | Liste empilée | 2 colonnes | Liste complète |

---

## 🔐 Authentification

### Méthodes supportées
- Email + Password (MVP)
- Google OAuth (V2)

### Middleware de protection

```
Routes protégées : /dashboard/*, /transactions/*, /budgets/*, /categories/*, /settings/*
Routes publiques : /login, /register
Redirection : non-auth → /login, auth + /login → /dashboard
```

---

## 📋 Spécifications Fonctionnelles

### Module : Authentification

#### F-AUTH-01 : Inscription
- **User Story** : En tant que visiteur, je veux créer un compte pour accéder à l'application
- **Critères d'acceptation** :
  - Formulaire avec email + mot de passe + nom complet
  - Validation email format
  - Mot de passe : 8 caractères minimum
  - Confirmation email envoyée
  - Redirection vers /dashboard après confirmation
  - Catégories par défaut créées automatiquement
- **Schéma Zod** :
  ```typescript
  const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    password: z.string().min(8, "8 caractères minimum"),
    full_name: z.string().min(2, "Nom requis"),
  })
  ```
- **Erreurs** :
  - Email déjà utilisé → "Cette adresse email est déjà utilisée"
  - Mot de passe trop court → "Le mot de passe doit contenir au moins 8 caractères"

#### F-AUTH-02 : Connexion
- **User Story** : En tant qu'utilisateur, je veux me connecter pour retrouver mes données
- **Critères d'acceptation** :
  - Formulaire email + mot de passe
  - Bouton "Mot de passe oublié" (envoi magic link)
  - Redirection vers /dashboard
- **Erreurs** :
  - Identifiants incorrects → "Email ou mot de passe incorrect"

#### F-AUTH-03 : Déconnexion
- Bouton dans la sidebar
- Suppression de la session
- Redirection vers /login

---

### Module : Transactions

#### F-TRANS-01 : Lister les transactions
- **User Story** : En tant qu'utilisateur, je veux voir toutes mes transactions pour suivre mes finances
- **Critères** :
  - Liste paginée (20 par page)
  - Triée par date décroissante (plus récente en premier)
  - Affiche : date, catégorie (icône + nom), type, montant (coloré : vert revenu, rouge dépense, bleu épargne)
  - Montant affiché avec signe : +3 200,00 € ou -85,30 €
- **Filtres** :
  - Par type (dropdown multi-select)
  - Par catégorie (dropdown filtré par type)
  - Par plage de dates (date picker range)
  - Recherche texte sur la description
- **Mobile** : Vue en cards au lieu de table

#### F-TRANS-02 : Ajouter une transaction
- **User Story** : En tant qu'utilisateur, je veux ajouter une dépense ou un revenu rapidement
- **Critères** :
  - Dialog/modal avec formulaire
  - Champs : Type (select) → Catégorie (select filtré selon type) → Montant → Date → Description (optionnel)
  - Le select Catégorie se met à jour dynamiquement quand on change le Type
  - Date par défaut = aujourd'hui
  - Après ajout, la liste se rafraîchit et un toast confirme
- **Schéma Zod** :
  ```typescript
  const transactionSchema = z.object({
    type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']),
    category_id: z.string().uuid("Catégorie requise"),
    amount: z.number().positive("Le montant doit être positif"),
    date: z.string().or(z.date()),
    description: z.string().max(255).optional(),
  })
  ```
- **Erreurs** :
  - Montant négatif ou nul → "Le montant doit être supérieur à 0"
  - Catégorie manquante → "Veuillez sélectionner une catégorie"

#### F-TRANS-03 : Modifier une transaction
- **Critères** : Même formulaire pré-rempli, même validations
- Click sur la ligne ou bouton edit → ouvre le dialog en mode édition

#### F-TRANS-04 : Supprimer une transaction
- **Critères** : Confirmation dialog avant suppression
- Message : "Êtes-vous sûr de vouloir supprimer cette transaction ?"
- Suppression définitive (hard delete)

#### F-TRANS-05 : Transactions récurrentes
- **User Story** : En tant qu'utilisateur, je veux automatiser mes dépenses/revenus fixes pour ne pas les saisir chaque mois
- **Critères** :
  - CRUD de récurrences (type, catégorie, montant, description, fréquence, jour du mois)
  - Bouton "Gérer les récurrences" sur la page transactions
  - Les transactions récurrentes sont générées automatiquement le jour configuré
  - Badge "🔄" sur les transactions générées automatiquement
  - Possibilité de modifier/supprimer une transaction générée sans affecter la récurrence
- **Schéma Zod** :
  ```typescript
  const recurringSchema = z.object({
    type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']),
    category_id: z.string().uuid(),
    amount: z.number().positive(),
    description: z.string().max(255).optional(),
    frequency: z.enum(['monthly', 'weekly', 'yearly']),
    day_of_month: z.number().min(1).max(31),
    start_date: z.string().or(z.date()),
    end_date: z.string().or(z.date()).optional(),
  })
  ```
- **Génération automatique** : API route `/api/cron/generate-recurring` appelée quotidiennement (via Vercel Cron ou n8n) qui :
  1. Récupère toutes les recurring_transactions actives
  2. Vérifie si la date du jour correspond au jour configuré
  3. Vérifie que la transaction n'a pas déjà été générée pour ce mois
  4. Crée les transactions correspondantes avec `is_recurring = true`
  5. Met à jour `last_generated_at`

---

### Module : Budgets

#### F-BUDG-01 : Voir les budgets du mois
- **User Story** : En tant qu'utilisateur, je veux voir où j'en suis par rapport à mes objectifs de dépenses
- **Critères** :
  - Sélecteur mois/année en haut
  - Pour chaque catégorie budgétée : barre de progression colorée (vert < 80%, orange 80-100%, rouge > 100%)
  - Affichage : Réel / Budget + montant restant + pourcentage
  - Tableau récapitulatif en dessous avec totaux

#### F-BUDG-02 : Définir un budget
- **User Story** : En tant qu'utilisateur, je veux fixer un plafond mensuel par catégorie
- **Critères** :
  - Dialog avec select catégorie + montant + mois + année
  - Ne peut pas avoir 2 budgets pour la même catégorie/mois/année
  - Si existant, propose de modifier
- **Schéma Zod** :
  ```typescript
  const budgetSchema = z.object({
    category_id: z.string().uuid(),
    amount: z.number().min(0, "Le montant ne peut pas être négatif"),
    month: z.number().min(1).max(12),
    year: z.number().min(2020),
  })
  ```

#### F-BUDG-03 : Copier les budgets du mois précédent
- **User Story** : En tant qu'utilisateur, je veux reporter mes budgets d'un mois à l'autre sans tout ressaisir
- **Critères** :
  - Bouton "Copier le mois précédent"
  - Copie tous les budgets du mois M-1 vers le mois sélectionné
  - Ne remplace pas les budgets existants (skip ceux déjà définis)
  - Toast de confirmation : "X budgets copiés"

---

### Module : Catégories

#### F-CAT-01 : Voir les catégories
- **Critères** :
  - Groupées par type de transaction (5 sections)
  - Chaque catégorie affiche : icône, nom, pastille de couleur, badge "défaut" si applicable

#### F-CAT-02 : Ajouter une catégorie
- **Critères** :
  - Dialog : nom, icône (emoji picker ou texte), couleur (color picker), type de transaction
  - Vérifier unicité nom+type pour l'utilisateur
- **Schéma Zod** :
  ```typescript
  const categorySchema = z.object({
    name: z.string().min(1, "Nom requis").max(50),
    icon: z.string().default('📁'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur HEX invalide"),
    transaction_type: z.enum(['revenue', 'variable_expense', 'fixed_expense', 'credit', 'savings']),
  })
  ```

#### F-CAT-03 : Modifier une catégorie
- Même formulaire, pré-rempli

#### F-CAT-04 : Supprimer une catégorie
- **Contrainte** : Impossible de supprimer une catégorie qui a des transactions associées
- Message d'erreur : "Cette catégorie est utilisée par X transactions et ne peut pas être supprimée"
- Alternative proposée : "Voulez-vous la renommer à la place ?"

---

### Module : Dashboard

#### F-DASH-01 : KPIs
- 4 cards en haut du dashboard
- Chaque card affiche : icône, label, montant formaté (€), variation vs période précédente (%, ↑ ou ↓)
- **Revenus totaux** : somme des transactions type `revenue`
- **Dépenses totales** : somme des transactions type `variable_expense` + `fixed_expense` + `credit`
- **Épargne** : somme des transactions type `savings`
- **Solde net** : Revenus - Dépenses - Épargne

#### F-DASH-02 : Graphique Revenus vs Dépenses (Line Chart)
- 2 lignes sur le même graphique
- Axe X : mois (12 mois de l'année sélectionnée)
- Axe Y : montant en €
- Ligne verte : total revenus par mois
- Ligne rouge : total dépenses par mois
- Tooltip au hover avec montants détaillés

#### F-DASH-03 : Camembert dépenses par catégorie (Donut Chart)
- Affiche la répartition des dépenses (variable_expense + fixed_expense + credit) par catégorie
- Chaque segment utilise la couleur de la catégorie
- Légende à côté avec nom + montant + pourcentage
- Centre du donut : montant total

#### F-DASH-04 : Barres comparatives (Stacked Bar Chart)
- Barres empilées par mois
- 3 segments par barre : Charges fixes, Charges variables, Épargne
- Permet de visualiser la structure des dépenses mois par mois

#### F-DASH-05 : Évolution du solde net (Area Chart)
- Area chart montrant le solde net cumulé mois par mois
- Vert quand positif, rouge quand négatif
- Axe X : mois, Axe Y : solde cumulé en €

#### F-DASH-06 : Taux d'épargne
- Progress bar en bas du dashboard
- Calcul : (Épargne / Revenus) × 100
- Couleur selon le taux : rouge < 10%, orange 10-20%, vert > 20%

#### F-DASH-07 : Sélecteur de période
- Dropdown mois (Janvier → Décembre) + Dropdown année (2024, 2025, ...)
- Option "Année complète" qui affiche les données sur 12 mois
- Tous les graphiques et KPIs se mettent à jour quand on change la période
- Persister la sélection dans l'URL (query params) pour le partage/refresh

---

### Module : Paramètres

#### F-SET-01 : Modifier le profil
- Nom complet éditable
- Email readonly
- Upload avatar (Supabase Storage)

#### F-SET-02 : Changer le thème
- Toggle clair / sombre / système
- Persister en localStorage + next-themes

#### F-SET-03 : Changer le mot de passe
- Formulaire : ancien mot de passe + nouveau + confirmation
- Validation : 8 caractères minimum

#### F-SET-04 : Supprimer le compte
- Danger zone avec double confirmation
- Dialog : "Tapez SUPPRIMER pour confirmer"
- Supprime toutes les données (cascade)

---

## 🎨 Design System

### Thème
Le thème sera fourni ultérieurement via **tweakcn**. En attendant, utiliser le thème par défaut de shadcn/ui.

Quand le thème tweakcn sera fourni, il suffira de remplacer les variables CSS dans `globals.css`.

### Couleurs métier (sémantiques)

```css
:root {
  /* Couleurs des types de transaction */
  --color-revenue: 142 76% 36%;          /* Vert - revenus */
  --color-variable-expense: 24 95% 53%;  /* Orange - dépenses variables */
  --color-fixed-expense: 217 91% 60%;    /* Bleu - charges fixes */
  --color-credit: 0 84% 60%;             /* Rouge - crédits */
  --color-savings: 187 85% 53%;          /* Cyan - épargne */

  /* Couleurs d'état budget */
  --color-budget-ok: 142 76% 36%;        /* Vert < 80% */
  --color-budget-warning: 38 92% 50%;    /* Orange 80-100% */
  --color-budget-exceeded: 0 84% 60%;    /* Rouge > 100% */

  /* Couleurs KPI variation */
  --color-positive: 142 76% 36%;         /* Vert - hausse */
  --color-negative: 0 84% 60%;           /* Rouge - baisse */
  --color-neutral: 215 16% 47%;          /* Gris - stable */
}
```

### Typographie
- **Police principale** : Inter (Google Fonts)
- H1 : `text-3xl font-bold` — Titre de page
- H2 : `text-2xl font-semibold` — Titre de section
- H3 : `text-xl font-semibold` — Titre de card
- Body : `text-base` — Texte courant
- Small : `text-sm text-muted-foreground` — Labels, descriptions
- Caption : `text-xs` — Métadonnées

### Formatage des montants

```typescript
// Toujours utiliser cette fonction pour formater les montants
function formatCurrency(amount: number, type?: TransactionType): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount))

  // Ajouter le signe selon le type
  if (type === 'revenue') return `+${formatted}`
  if (type && type !== 'revenue') return `-${formatted}`
  return formatted
}
```

### Animations
- Transitions hover : `transition-colors duration-150`
- Apparition cards : `animate-in fade-in duration-300`
- Loading : `Skeleton` components de shadcn
- Boutons : feedback loading avec `<Loader2 className="animate-spin" />`
- Charts : animation d'entrée native Recharts

---

## 🧩 Types TypeScript

```typescript
// types/index.ts

export type TransactionType = 'revenue' | 'variable_expense' | 'fixed_expense' | 'credit' | 'savings'
export type RecurrenceFrequency = 'monthly' | 'weekly' | 'yearly'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  currency: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  user_id: string
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
}

export interface RecurringTransaction {
  id: string
  user_id: string
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
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  updated_at: string
  // Joined
  category?: Category
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
  date_from?: string
  date_to?: string
  search?: string
  page?: number
  limit?: number
}
```

---

## ⚡ Commandes d'Initialisation

```bash
# 1. Créer le projet Next.js
npx create-next-app@latest lifely --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd lifely

# 2. Initialiser shadcn/ui
npx shadcn@latest init

# 3. Installer les composants shadcn
npx shadcn@latest add button card dialog form input select table tabs toast sidebar sheet skeleton avatar badge calendar checkbox command dropdown-menu popover scroll-area separator switch textarea tooltip chart alert-dialog progress label

# 4. Dépendances
npm install @supabase/supabase-js @supabase/ssr next-themes lucide-react date-fns @tanstack/react-query @tanstack/react-query-devtools react-hook-form @hookform/resolvers zod

# 5. Dev dependencies
npm install -D @types/node
```

---

## 📝 Instructions pour Claude Code

Voici le brief complet pour créer **LifeLy**, une application de suivi des finances personnelles.

1. Lis ce fichier en entier pour comprendre l'architecture complète.
2. Initialise le projet Next.js avec les commandes ci-dessus.
3. Configure Supabase : crée les tables, types enum, triggers, RLS, index et vues dans l'ordre indiqué.
4. Mets en place l'authentification (Supabase Auth + middleware).
5. Crée le layout dashboard avec sidebar responsive.
6. Implémente les API routes et les query hooks TanStack Query.
7. Construis les pages dans cet ordre : Catégories → Transactions → Budgets → Dashboard.
8. Ajoute la gestion des récurrences.
9. Implémente la page Paramètres.
10. Respecte le design system (couleurs métier, formatage montants, responsive).
11. Le thème tweakcn sera intégré plus tard — utilise le thème shadcn par défaut pour l'instant.

**Priorité** : Un dashboard fonctionnel avec de vraies données agrégées. L'utilisateur doit pouvoir ajouter des transactions et voir immédiatement les graphiques se mettre à jour.
