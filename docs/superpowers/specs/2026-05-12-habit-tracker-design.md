# Habit Tracker — Design Spec

**Date** : 2026-05-12
**Branche** : `ralph/habit-tracker`
**Status** : Approuvé, prêt pour implémentation Ralph

---

## Contexte

LIFELY a évolué d'un tracker financier vers un OS perso (calendar, tasks, notes, projects, finance). Ajouter un module **Habit Tracker** s'inscrit dans cette ambition. Inspiration UI : dark theme avec accent vert, vue weekly par défaut + toggle monthly grid.

---

## Scope MVP

| Item | Choix |
|------|-------|
| Vue principale | Weekly dashboard (par défaut) + toggle Monthly grid |
| Type d'habitudes | Binaire (fait / pas fait) uniquement |
| Récurrence | Quotidienne uniquement |
| Tasks dans cards | Non — habits only |
| Position nav | Section principale, après Catégories |
| Vue mensuelle | Incluse au MVP avec panel Analyse + chart progression mensuelle |

**Hors scope V1** : streaks (jours consécutifs), reminders/push, jours spécifiques (lun/mer/ven), habits quantitatives (2L d'eau = compteur), habits temporelles (méditer 10min), tâches dans cards journalières, partage/social, vue archive.

---

## Architecture

### Data model Supabase

#### Table `habits`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid pk | `gen_random_uuid()` |
| `user_id` | uuid fk → `auth.users` | ON DELETE CASCADE |
| `name` | text NOT NULL | 1–60 chars |
| `emoji` | text | optionnel, ex: `💪` |
| `color` | text | hex ou hsl, default vert |
| `order_index` | int NOT NULL | tri d'affichage |
| `archived_at` | timestamptz NULL | soft delete |
| `created_at` | timestamptz NOT NULL | default `now()` |
| `updated_at` | timestamptz NOT NULL | trigger auto-update |

#### Table `habit_completions`

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | uuid pk | `gen_random_uuid()` |
| `habit_id` | uuid fk → `habits(id)` | ON DELETE CASCADE |
| `user_id` | uuid fk → `auth.users` | ON DELETE CASCADE |
| `completed_date` | date NOT NULL | jour de complétion |
| `created_at` | timestamptz NOT NULL | default `now()` |
| UNIQUE | `(habit_id, completed_date)` | empêche double-check |

#### RLS

Sur les deux tables, 4 policies (SELECT/INSERT/UPDATE/DELETE) scopées `user_id = auth.uid()`.

#### Indexes

- `habit_completions(user_id, completed_date)` — requêtes weekly/monthly
- `habit_completions(habit_id, completed_date)` — calcul progression par habit
- `habits(user_id, archived_at)` — list filtrée

---

### Composants

```
src/
├── app/(dashboard)/dashboard/habits/page.tsx
├── components/habits/
│   ├── habits-view-toggle.tsx          # Weekly ↔ Monthly (query param)
│   ├── habit-form-modal.tsx            # Add / Edit habit
│   ├── habit-emoji-picker.tsx          # popover emoji selector
│   ├── habit-color-picker.tsx          # preset colors
│   ├── habit-completion-checkbox.tsx   # rond vert custom
│   ├── habits-empty-state.tsx          # zéro habitude
│   ├── weekly/
│   │   ├── weekly-overview.tsx         # barchart + donut hebdo
│   │   ├── weekly-habits-table.tsx     # habits × 7 jours
│   │   └── weekly-day-cards.tsx        # 7 cards journalières
│   └── monthly/
│       ├── monthly-stats-cards.tsx     # 4 KPI top
│       ├── monthly-grid.tsx            # habits × 31 jours
│       ├── monthly-analyse-panel.tsx   # side panel
│       └── monthly-progress-chart.tsx  # area chart
├── lib/
│   ├── actions/habits.ts               # Server Actions
│   ├── queries/habits.ts               # React Query hooks
│   └── validations/habit.ts            # Zod schemas
├── hooks/
│   └── use-week-range.ts               # helper semaine en cours
└── types/habit.ts                      # types app-level
```

---

### API & State

**Server Actions** (`lib/actions/habits.ts`)
- `createHabit(input)`
- `updateHabit(id, input)`
- `archiveHabit(id)` — set `archived_at = now()`
- `reorderHabits(ids[])`
- `toggleCompletion(habitId, date)` — insert si absent, delete si présent

**React Query** (`lib/queries/habits.ts`)
- `queryKeys.habits.list()` — habits actifs
- `queryKeys.habits.week(weekStart)` — completions de la semaine
- `queryKeys.habits.month(monthStart)` — completions du mois
- Stale time 60s
- **Optimistic update obligatoire sur `toggleCompletion`** (zéro latence perçue au tap)

**Validations Zod** (`lib/validations/habit.ts`)
- `habitSchema` : `name` 1–60 chars, `emoji` optional string, `color` hex/hsl

---

### Styling

- Dark theme existant + accent vert (`--color-revenue` = `hsl(142 76% 36%)` réutilisé)
- Nouveau CSS var `--color-habit-done` aliasé sur revenue green
- Checkbox custom (`habit-completion-checkbox.tsx`) : rond plein vert + ✓ blanc quand checked, rond vide bordé sinon
- shadcn Recharts pour barchart / donut / area chart
- Respect des règles modales existantes : pas de `FormLabel`, nom du champ dans le placeholder, margin auto mobile (déjà géré par Dialog)

---

### Responsive

- **Weekly view**
  - Desktop ≥ 1024px : layout 2 cols (overview + table) puis 7 cards en grid
  - Tablet 768–1024 : stack vertical, cards 2 par row
  - Mobile < 768 : stack, cards full width, scroll horizontal sur la table habits×7
- **Monthly view**
  - Desktop : grille + side panel à droite
  - Mobile : grille scrollable horizontalement, side panel en bas (collapsible)

---

### Navigation

Ajout dans `src/config/navigation.ts` après Catégories :

```ts
{
  title: "Habitudes",
  href: "/dashboard/habits",
  icon: Sparkles, // lucide
  description: "Suivre vos habitudes quotidiennes",
}
```

---

## Découpage en User Stories (Ralph)

Le PRD `ralph/prd.json` découpe l'implémentation en US par couche :

1. **Data** : migration SQL, types Supabase régénérés
2. **Validation** : Zod schemas, types app
3. **Server** : Server Actions
4. **Query** : React Query hooks + optimistic updates
5. **UI primitives** : checkbox custom, emoji/color picker, modal form
6. **Routing** : page shell, sidebar entry, empty state
7. **Weekly view** : overview, table, day cards
8. **Monthly view** : stats, grid, analyse panel, progress chart
9. **Polish** : responsive, error handling, toasts, a11y

Chaque US doit :
- Avoir des critères d'acceptation testables
- Faire passer `npx tsc --noEmit`
- Être committée avec footer `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`

---

## Critères de succès du MVP

- ✅ User peut créer / éditer / archiver une habitude (avec emoji + couleur)
- ✅ User peut check/uncheck une habitude pour un jour donné (week + month views)
- ✅ Optimistic update : tap d'un check = instantané
- ✅ Weekly view affiche barchart, donut % global, table habits × 7 jours, 7 cards journalières avec % par jour
- ✅ Monthly view affiche 4 stats top, grille habits × 31 jours, panel Analyse, area chart progression
- ✅ Toggle Weekly ↔ Monthly fluide (query param)
- ✅ Responsive desktop / tablet / mobile
- ✅ RLS testé : un user ne peut pas voir/modifier les habits d'un autre user
- ✅ `npx tsc --noEmit` passe
- ✅ `npm run lint` passe
