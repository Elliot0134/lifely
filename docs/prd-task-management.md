# PRD — Système de Gestion de Tâches Lifely

> **Objectif** : Recréer le système de gestion de tâches actuellement hébergé sur Notion, directement dans Lifely avec Supabase comme source de données. Éliminer la dépendance à Notion pour la gestion des tâches. Aller au-delà de Notion avec des features natives (time blocks, tâches récurrentes, stats, tags, commentaires, distinction code/non-code).

---

## 1. Contexte & Motivation

### Problème actuel
- Le système de tâches repose sur l'API Notion via MCP (notion-search, notion-fetch, notion-create-pages, etc.)
- Chaque interaction = multiples appels API externes (3-6 appels pour un simple briefing)
- Dépendance à un service tiers pour une fonctionnalité critique
- Latence des appels Notion, limitations de rate-limiting
- Pas de contrôle sur le schéma de données, les performances, ni l'UX

### Solution
- Migrer le modèle de données Entreprises → Projets → Tâches directement dans Supabase
- Créer une UI native dans Lifely avec les mêmes patterns que les features existantes (transactions, budgets, catégories)
- Ajouter une section "Organisation" dans la sidebar du dashboard
- Garder la possibilité d'interagir via Claude Code (briefing, création rapide) mais avec des Server Actions Supabase au lieu de l'API Notion
- Ajouter des features impossibles avec Notion : time blocks, tâches récurrentes, dashboard stats, tags custom, commentaires avec historique Claude

### Structure utilisateur
- **Entreprises fixes** : ESST Solutions, Aurentia, Kaelen Studio (rarement modifiées)
- **Projets perso** : projets sans entreprise (side projects, formations, perso)
- **Distinction code/non-code** : les tâches "code" sont faisables par Claude Code, les tâches "non-code" sont manuelles (appels, admin, réunions...)

---

## 2. Architecture de Données

### 2.1 Schéma de base de données (Supabase/PostgreSQL)

#### Table `companies` (Entreprises)

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('not_started', 'active', 'completed')),
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_user_id ON companies(user_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own companies"
  ON companies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Table `projects` (Projets)

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  color TEXT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_status ON projects(status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Table `tags` (Labels/Tags personnalisés)

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#64748b',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE UNIQUE INDEX idx_tags_user_name ON tags(user_id, name);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tags"
  ON tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Table `tasks` (Tâches)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_code_task BOOLEAN NOT NULL DEFAULT false, -- true = tâche dev faisable par Claude Code
  due_date DATE,
  due_datetime TIMESTAMPTZ,
  urgency TEXT CHECK (urgency IN ('urgent', 'important')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  estimated_minutes INTEGER, -- estimation de durée en minutes (pour time blocks)
  scheduled_date DATE, -- jour planifié (peut différer de due_date)
  scheduled_start_time TIME, -- heure de début planifiée (time block)
  scheduled_end_time TIME, -- heure de fin planifiée (time block)
  ai_instructions TEXT, -- "Claude Corwork" : instructions pour l'IA
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_is_completed ON tasks(is_completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_urgency ON tasks(urgency);
CREATE INDEX idx_tasks_is_code_task ON tasks(is_code_task);
CREATE INDEX idx_tasks_scheduled ON tasks(user_id, scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_tasks_briefing ON tasks(user_id, is_completed, due_date) WHERE is_completed = false;

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Table `task_tags` (Pivot tâches ↔ tags)

```sql
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);

ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own task_tags"
  ON task_tags FOR ALL
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_tags.task_id AND t.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_tags.task_id AND t.user_id = auth.uid())
  );
```

#### Table `task_comments` (Notes/Commentaires)

```sql
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_type TEXT NOT NULL DEFAULT 'user' CHECK (author_type IN ('user', 'claude')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own task_comments"
  ON task_comments FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Table `recurring_tasks` (Tâches récurrentes)

```sql
CREATE TABLE recurring_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_code_task BOOLEAN NOT NULL DEFAULT false,
  urgency TEXT CHECK (urgency IN ('urgent', 'important')),
  estimated_minutes INTEGER,
  ai_instructions TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=lundi, pour weekly
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31), -- pour monthly
  month_of_year INTEGER CHECK (month_of_year BETWEEN 1 AND 12), -- pour yearly
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE, -- null = pas de fin
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_at TIMESTAMPTZ,
  next_due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_recurring_tasks_user_id ON recurring_tasks(user_id);
CREATE INDEX idx_recurring_tasks_next_due ON recurring_tasks(next_due_date) WHERE is_active = true;

ALTER TABLE recurring_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own recurring_tasks"
  ON recurring_tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

#### Triggers updated_at automatiques

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at
  BEFORE UPDATE ON task_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_tasks_updated_at
  BEFORE UPDATE ON recurring_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Trigger auto-complete : quand on coche une tâche, mettre completed_at

```sql
CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completed_at_trigger
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();
```

#### Vue `task_details` (jointures pré-calculées)

```sql
CREATE VIEW task_details AS
SELECT
  t.*,
  p.name AS project_name,
  p.color AS project_color,
  p.status AS project_status,
  c.name AS company_name,
  c.color AS company_color,
  CASE
    WHEN t.is_completed THEN 'completed'
    WHEN t.due_date IS NULL THEN 'no_date'
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE THEN 'today'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'upcoming'
    ELSE 'future'
  END AS due_status,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id) AS subtask_count,
  (SELECT COUNT(*) FROM tasks st WHERE st.parent_task_id = t.id AND st.is_completed = true) AS subtask_completed_count,
  (SELECT COALESCE(json_agg(json_build_object('id', tg.id, 'name', tg.name, 'color', tg.color)), '[]'::json)
   FROM task_tags tt JOIN tags tg ON tt.tag_id = tg.id WHERE tt.task_id = t.id) AS tags
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN companies c ON p.company_id = c.id;
```

### 2.2 Relations

```
companies ──(1:N)──> projects ──(1:N)──> tasks ──(M:N)──> tags
                                           │
                                           ├──> tasks (sous-tâches via parent_task_id)
                                           ├──> task_comments (fil de discussion)
                                           └──< recurring_tasks (template de récurrence)
```

---

## 3. Types TypeScript

```typescript
// types/tasks.ts

export type CompanyStatus = 'not_started' | 'active' | 'completed'
export type ProjectStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskUrgency = 'urgent' | 'important'
export type TaskDueStatus = 'completed' | 'no_date' | 'overdue' | 'today' | 'upcoming' | 'future'
export type CommentAuthorType = 'user' | 'claude'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Company {
  id: string
  user_id: string
  name: string
  status: CompanyStatus
  color: string | null
  icon: string | null
  created_at: string
  updated_at: string
  // Computed
  projects?: Project[]
  project_count?: number
}

export interface Project {
  id: string
  user_id: string
  company_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  color: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  // Joined
  company?: Company
  tasks?: Task[]
  // Computed
  task_count?: number
  completed_task_count?: number
  progress?: number // 0-100
}

export interface Tag {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  project_id: string | null
  parent_task_id: string | null
  title: string
  description: string | null
  is_completed: boolean
  is_code_task: boolean
  due_date: string | null
  due_datetime: string | null
  urgency: TaskUrgency | null
  sort_order: number
  estimated_minutes: number | null
  scheduled_date: string | null
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  ai_instructions: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined (from view)
  project_name?: string
  project_color?: string
  project_status?: string
  company_name?: string
  company_color?: string
  due_status?: TaskDueStatus
  subtask_count?: number
  subtask_completed_count?: number
  tags?: Tag[]
  // Nested
  subtasks?: Task[]
  project?: Project
  comments?: TaskComment[]
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  content: string
  author_type: CommentAuthorType
  created_at: string
  updated_at: string
}

export interface RecurringTask {
  id: string
  user_id: string
  project_id: string | null
  title: string
  description: string | null
  is_code_task: boolean
  urgency: TaskUrgency | null
  estimated_minutes: number | null
  ai_instructions: string | null
  frequency: RecurrenceFrequency
  day_of_week: number | null
  day_of_month: number | null
  month_of_year: number | null
  start_date: string
  end_date: string | null
  is_active: boolean
  last_generated_at: string | null
  next_due_date: string
  created_at: string
  updated_at: string
  // Joined
  project?: Project
}

// ─── Forms ────────────────────────────────────────────

export interface CreateTaskInput {
  title: string
  description?: string
  project_id?: string
  parent_task_id?: string
  is_code_task?: boolean
  due_date?: string
  due_datetime?: string
  urgency?: TaskUrgency
  estimated_minutes?: number
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  ai_instructions?: string
  tag_ids?: string[]
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  project_id?: string | null
  parent_task_id?: string | null
  is_completed?: boolean
  is_code_task?: boolean
  due_date?: string | null
  due_datetime?: string | null
  urgency?: TaskUrgency | null
  sort_order?: number
  estimated_minutes?: number | null
  scheduled_date?: string | null
  scheduled_start_time?: string | null
  scheduled_end_time?: string | null
  ai_instructions?: string | null
  tag_ids?: string[]
}

export interface CreateProjectInput {
  name: string
  description?: string
  company_id?: string
  color?: string
  start_date?: string
  end_date?: string
}

export interface UpdateProjectInput {
  id: string
  name?: string
  description?: string
  company_id?: string | null
  status?: ProjectStatus
  color?: string | null
  start_date?: string | null
  end_date?: string | null
}

export interface CreateCompanyInput {
  name: string
  color?: string
  icon?: string
}

export interface UpdateCompanyInput {
  id: string
  name?: string
  status?: CompanyStatus
  color?: string | null
  icon?: string | null
}

export interface CreateTagInput {
  name: string
  color?: string
}

export interface CreateCommentInput {
  task_id: string
  content: string
  author_type?: CommentAuthorType
}

export interface CreateRecurringTaskInput {
  title: string
  description?: string
  project_id?: string
  is_code_task?: boolean
  urgency?: TaskUrgency
  estimated_minutes?: number
  ai_instructions?: string
  frequency: RecurrenceFrequency
  day_of_week?: number
  day_of_month?: number
  month_of_year?: number
  start_date?: string
  end_date?: string
}

// ─── Filters ──────────────────────────────────────────

export interface TaskFilters {
  project_id?: string
  company_id?: string
  is_completed?: boolean
  is_code_task?: boolean
  urgency?: TaskUrgency
  due_status?: TaskDueStatus
  tag_ids?: string[]
  search?: string
  parent_task_id?: string | null // null = top-level only
  scheduled_date?: string // for time blocks view
}

// ─── Briefing ─────────────────────────────────────────

export interface DailyBriefing {
  date: string
  overdue: Task[]
  today: Task[]
  upcoming: Task[] // 3 prochains jours
  no_date: Task[]
  active_projects: (Project & { remaining_tasks: number })[]
  stats: {
    total_open: number
    completed_today: number
    overdue_count: number
    code_tasks_open: number
    non_code_tasks_open: number
  }
  // Briefing intelligent : suggestion de planning
  suggested_schedule?: TimeBlock[]
}

export interface TimeBlock {
  task_id: string
  task: Task
  start_time: string // "09:00"
  end_time: string   // "10:30"
  is_locked: boolean // true = manuellement planifié, false = suggestion auto
}

// ─── Stats ────────────────────────────────────────────

export interface TaskStats {
  // Productivité
  completed_this_week: number
  completed_last_week: number
  weekly_trend: number // % variation
  // Streak
  current_streak: number // jours consécutifs avec au moins 1 tâche complétée
  longest_streak: number
  // Par projet
  by_project: {
    project_id: string
    project_name: string
    project_color: string | null
    total: number
    completed: number
    open: number
  }[]
  // Par type
  code_tasks_completed: number
  non_code_tasks_completed: number
  // Par période (4 dernières semaines)
  weekly_data: {
    week_start: string
    completed: number
    created: number
  }[]
}
```

---

## 4. Zod Validation Schemas

```typescript
// lib/validations/tasks.ts

import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

export const createTaskSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(500),
  description: z.string().max(5000).optional(),
  project_id: z.string().uuid().optional(),
  parent_task_id: z.string().uuid().optional(),
  is_code_task: z.boolean().optional().default(false),
  due_date: z.string().optional(),
  due_datetime: z.string().optional(),
  urgency: z.enum(['urgent', 'important']).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  scheduled_date: z.string().optional(),
  scheduled_start_time: z.string().regex(timeRegex, "Format HH:MM attendu").optional(),
  scheduled_end_time: z.string().regex(timeRegex, "Format HH:MM attendu").optional(),
  ai_instructions: z.string().max(10000).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const updateTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  project_id: z.string().uuid().nullable().optional(),
  parent_task_id: z.string().uuid().nullable().optional(),
  is_completed: z.boolean().optional(),
  is_code_task: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
  due_datetime: z.string().nullable().optional(),
  urgency: z.enum(['urgent', 'important']).nullable().optional(),
  sort_order: z.number().int().optional(),
  estimated_minutes: z.number().int().min(1).max(480).nullable().optional(),
  scheduled_date: z.string().nullable().optional(),
  scheduled_start_time: z.string().regex(timeRegex).nullable().optional(),
  scheduled_end_time: z.string().regex(timeRegex).nullable().optional(),
  ai_instructions: z.string().max(10000).nullable().optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
})

export const createProjectSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  description: z.string().max(5000).optional(),
  company_id: z.string().uuid().optional(),
  color: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  color: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
})

export const createCompanySchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(200),
  color: z.string().optional(),
  icon: z.string().optional(),
})

export const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['not_started', 'active', 'completed']).optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
})

export const createTagSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire").max(50),
  color: z.string().optional().default('#64748b'),
})

export const createCommentSchema = z.object({
  task_id: z.string().uuid(),
  content: z.string().min(1, "Le commentaire ne peut pas être vide").max(10000),
  author_type: z.enum(['user', 'claude']).optional().default('user'),
})

export const createRecurringTaskSchema = z.object({
  title: z.string().min(1, "Le titre est obligatoire").max(500),
  description: z.string().max(5000).optional(),
  project_id: z.string().uuid().optional(),
  is_code_task: z.boolean().optional().default(false),
  urgency: z.enum(['urgent', 'important']).nullable().optional(),
  estimated_minutes: z.number().int().min(1).max(480).optional(),
  ai_instructions: z.string().max(10000).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  day_of_week: z.number().int().min(0).max(6).optional(),
  day_of_month: z.number().int().min(1).max(31).optional(),
  month_of_year: z.number().int().min(1).max(12).optional(),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
})
```

---

## 5. Server Actions

### 5.1 Tasks (`lib/actions/tasks.ts`)

| Action | Description | Input |
|--------|-------------|-------|
| `createTask` | Créer une tâche (+ associer tags) | `CreateTaskInput` |
| `updateTask` | Modifier une tâche (+ sync tags) | `UpdateTaskInput` |
| `deleteTask` | Supprimer une tâche (cascade sous-tâches) | `{ id }` |
| `toggleTask` | Cocher/décocher (optimistic-ready) | `{ id }` |
| `reorderTasks` | Réordonner (drag & drop) | `{ tasks: { id, sort_order }[] }` |
| `bulkCreateTasks` | Créer en lot | `CreateTaskInput[]` |
| `bulkDeleteTasks` | Supprimer en lot | `{ ids }` |
| `bulkToggleTasks` | Toggle en lot | `{ ids, is_completed }` |
| `scheduleTask` | Planifier un time block | `{ id, scheduled_date, start_time, end_time }` |
| `unscheduleTask` | Retirer du planning | `{ id }` |

### 5.2 Projects (`lib/actions/projects.ts`)

| Action | Description |
|--------|-------------|
| `createProject` | Créer un projet |
| `updateProject` | Modifier un projet |
| `deleteProject` | Supprimer un projet |

### 5.3 Companies (`lib/actions/companies.ts`)

| Action | Description |
|--------|-------------|
| `createCompany` | Créer une entreprise |
| `updateCompany` | Modifier une entreprise |
| `deleteCompany` | Supprimer une entreprise |

### 5.4 Tags (`lib/actions/tags.ts`)

| Action | Description |
|--------|-------------|
| `createTag` | Créer un tag |
| `updateTag` | Modifier un tag |
| `deleteTag` | Supprimer un tag |

### 5.5 Comments (`lib/actions/comments.ts`)

| Action | Description |
|--------|-------------|
| `createComment` | Ajouter un commentaire (user ou claude) |
| `updateComment` | Modifier un commentaire |
| `deleteComment` | Supprimer un commentaire |
| `getComments` | Lister les commentaires d'une tâche |

### 5.6 Recurring Tasks (`lib/actions/recurring-tasks.ts`)

| Action | Description |
|--------|-------------|
| `createRecurringTask` | Créer une tâche récurrente |
| `updateRecurringTask` | Modifier une récurrence |
| `deleteRecurringTask` | Supprimer une récurrence |
| `generateDueTasks` | Générer les tâches dont la date est arrivée |

### 5.7 Briefing & Stats (`lib/actions/briefing.ts`)

| Action | Description |
|--------|-------------|
| `getDailyBriefing` | Briefing structuré du jour + suggestions planning |
| `getTaskStats` | Stats de productivité (semaine, streak, par projet) |

---

## 6. React Query Hooks

```typescript
// lib/queries/tasks.ts
useTasks(filters?: TaskFilters)
useTask(id: string)
useSubtasks(parentId: string)
useScheduledTasks(date: string) // time blocks d'un jour

// lib/queries/projects.ts
useProjects(filters?)
useProject(id: string)

// lib/queries/companies.ts
useCompanies(filters?)
useCompany(id: string)

// lib/queries/tags.ts
useTags()

// lib/queries/comments.ts
useTaskComments(taskId: string)

// lib/queries/recurring-tasks.ts
useRecurringTasks()

// lib/queries/briefing.ts
useDailyBriefing()
useTaskStats()
```

---

## 7. Structure des Pages & Routes

```
src/app/(dashboard)/dashboard/
├── tasks/                      # Page tâches
│   ├── page.tsx               # Liste groupée par statut d'échéance
│   └── schedule/
│       └── page.tsx           # Vue time blocks / planning journée
├── projects/                   # Page projets
│   ├── page.tsx               # Grille de cards
│   └── [id]/
│       └── page.tsx           # Détail projet + tâches
├── companies/                  # Page entreprises
│   └── page.tsx               # Liste entreprises
└── stats/                      # Dashboard productivité (P1)
    └── page.tsx               # Graphiques et stats
```

### Navigation Sidebar

2 sections distinctes dans le NavMain :

```
📊 FINANCES
├── Dashboard
├── Transactions
├── Budgets
└── Catégories

✅ ORGANISATION
├── Tâches
├── Planning (time blocks)
├── Projets
└── Entreprises
```

---

## 8. Composants UI

### 8.1 Structure complète

```
src/components/
├── tasks/
│   ├── task-list.tsx              # Liste principale groupée
│   ├── task-item.tsx              # Ligne de tâche
│   ├── task-modal.tsx             # Modal création/édition
│   ├── task-detail-panel.tsx      # Panel latéral (description, comments, AI)
│   ├── task-filters.tsx           # Barre filtres + recherche
│   ├── task-quick-add.tsx         # Input inline rapide
│   ├── subtask-list.tsx           # Sous-tâches d'une tâche
│   ├── task-schedule-view.tsx     # Vue time blocks (planning journée)
│   └── task-time-block.tsx        # Un bloc horaire dans le planning
├── projects/
│   ├── project-list.tsx
│   ├── project-card.tsx
│   ├── project-modal.tsx
│   └── project-select.tsx         # Combobox sélection projet
├── companies/
│   ├── company-list.tsx
│   ├── company-card.tsx
│   ├── company-modal.tsx
│   └── company-select.tsx
├── tags/
│   ├── tag-badge.tsx              # Badge affichage tag
│   ├── tag-select.tsx             # Multi-select tags
│   └── tag-manager.tsx            # CRUD tags (dans settings ou inline)
├── comments/
│   ├── comment-list.tsx           # Fil de discussion
│   └── comment-input.tsx          # Input nouveau commentaire
├── briefing/
│   └── daily-briefing.tsx         # Widget briefing
└── stats/
    ├── task-stats-cards.tsx       # KPIs (complétées, streak, etc.)
    ├── weekly-chart.tsx           # Graphique tâches/semaine
    └── project-breakdown.tsx      # Répartition par projet
```

### 8.2 TaskItem — Détail UX

```
┌──────────────────────────────────────────────────────────────────────┐
│ ☐  Titre de la tâche               💻  🔥  #marketing  📅 15 mars  │
│     Projet: Mon Projet • ~45min                              •••    │
│     2/5 sous-tâches                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

- **💻 Badge code** (bleu) si `is_code_task` / pas de badge si non-code
- **🔥 Badge urgence** rouge (urgent) ou orange (important)
- **Tags** en petits badges colorés
- **Estimation** affichée (ex: ~45min)
- **Checkbox** pour toggle rapide
- **Barré + opacité** quand complétée
- **Menu •••** : Modifier, Planifier, Sous-tâche, Dupliquer, Supprimer

### 8.3 TaskScheduleView — Vue Time Blocks

```
┌──────────────────────────────────────────────────────────────────┐
│  Planning du lundi 16 mars                    [← Hier] [Demain →]│
│                                                                    │
│  08:00 ┃                                                          │
│  09:00 ┃ ┌──────────────────────────────────┐                     │
│        ┃ │ 💻 Fix bug auth           ~90min │  🔥                 │
│  10:30 ┃ └──────────────────────────────────┘                     │
│  11:00 ┃ ┌──────────────────────────────────┐                     │
│        ┃ │ 📞 Call client Aurentia    ~30min│                     │
│  11:30 ┃ └──────────────────────────────────┘                     │
│  12:00 ┃ ░░░░░░░░░░░ PAUSE ░░░░░░░░░░░░░░░                      │
│  13:00 ┃                                                          │
│  14:00 ┃ ┌──────────────────────────────────┐                     │
│        ┃ │ 💻 Feature dashboard      ~120min│                     │
│  16:00 ┃ └──────────────────────────────────┘                     │
│                                                                    │
│  ─── NON PLANIFIÉES ──────────────────────────────────────────    │
│  ☐ Tâche sans créneau 1                                           │
│  ☐ Tâche sans créneau 2                                           │
└──────────────────────────────────────────────────────────────────┘
```

- Timeline verticale type Google Calendar
- Blocs colorés selon type (bleu=code, gris=non-code)
- Drag & drop pour déplacer/redimensionner les blocs (V2)
- Liste des tâches non planifiées en bas
- Navigation jour par jour

### 8.4 CommentList — Fil de discussion

```
┌──────────────────────────────────────────────────────────┐
│  💬 Commentaires (3)                                      │
│                                                           │
│  👤 Elliot — il y a 2h                                    │
│  "Checker la doc Stripe avant d'implémenter"             │
│                                                           │
│  🤖 Claude — il y a 1h                                   │
│  "Migration créée, types régénérés. Webhook endpoint     │
│   ajouté dans /api/webhooks/stripe."                     │
│                                                           │
│  👤 Elliot — il y a 30min                                │
│  "Parfait, reste à tester en staging"                    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │ Ajouter un commentaire...                   [Envoyer]│ │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

---

## 9. Fonctionnalités Détaillées

### 9.1 CRUD Tâches — MVP (P0)
- Créer (modal + quick-add inline)
- Modifier (modal ou panel latéral)
- Supprimer (confirmation, cascade sous-tâches)
- Toggle complété (checkbox, animation, optimistic update)
- Sous-tâches (création inline, toggle, compteur)
- Recherche textuelle
- Filtres : projet, urgence, statut, code/non-code, tags
- Distinction **code task** (💻) vs **non-code task**

### 9.2 CRUD Projets — MVP (P0)
- Créer, modifier, supprimer
- Barre de progression
- Statut (Pas commencé → En cours → Terminé)
- Association entreprise (optionnel)
- Vue détail avec tâches filtrées

### 9.3 CRUD Entreprises — MVP (P0)
- Créer, modifier, supprimer
- Projets par entreprise
- Compteurs projets/tâches

### 9.4 Tags personnalisés — MVP (P0)
- Créer/modifier/supprimer des tags
- Associer N tags à une tâche
- Filtrer par tag
- Badges colorés sur les tâches

### 9.5 Commentaires — P1
- Fil de discussion par tâche
- Auteur : user ou claude
- Claude peut logger automatiquement ce qu'il a fait sur une tâche
- Modifier/supprimer ses propres commentaires

### 9.6 Briefing Quotidien — P1
- Widget sur la page Tâches
- Tâches en retard / aujourd'hui / à venir / sans date
- Stats : ouvertes, complétées aujourd'hui, en retard, code vs non-code
- Projets actifs avec progression
- **Suggestion de planning** : propose un ordre de tâches basé sur urgence + estimation

### 9.7 Time Blocks / Planning — P1
- Vue planning journalier (timeline verticale)
- Assigner un créneau horaire à une tâche
- Navigation jour par jour
- Distinction visuelle code vs non-code
- Tâches non planifiées listées en bas

### 9.8 Tâches Récurrentes — P1
- Créer un template récurrent (daily, weekly, monthly, yearly)
- Génération automatique des tâches à la date prévue
- Gestion du cycle (jour de la semaine, du mois, etc.)
- Activer/désactiver une récurrence

### 9.9 Dashboard Stats — P2
- Tâches complétées cette semaine vs semaine dernière
- Streak (jours consécutifs productifs)
- Graphique tâches/semaine (4 dernières semaines)
- Répartition par projet (donut chart)
- Ratio code vs non-code

### 9.10 Actions en lot — P1
- Sélection multiple de tâches
- Actions groupées : compléter, supprimer, changer projet, ajouter tag

### 9.11 Claude Corwork — P1
- Champ `ai_instructions` sur chaque tâche
- Toggle "Claude Corwork" dans le panel détail
- Claude Code peut lire/exécuter/logger via Server Actions + commentaires

### 9.12 Drag & Drop — P2
- Réordonner les tâches dans la liste
- Déplacer les time blocks dans le planning

---

## 10. Constants & Configuration

```typescript
// lib/constants.ts — ajouts

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

export const RECURRENCE_FREQUENCIES = [
  { value: 'daily', label: 'Quotidien' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
  { value: 'yearly', label: 'Annuel' },
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
```

---

## 11. User Stories (P0 = MVP, P1 = V1.1, P2 = V2)

### P0 — MVP

| # | Story |
|---|-------|
| 1 | Section "Organisation" dans la sidebar (Tâches, Planning, Projets, Entreprises) |
| 2 | CRUD entreprise |
| 3 | CRUD projet (avec/sans entreprise) |
| 4 | Créer tâche via quick-add inline |
| 5 | Créer tâche via modal (titre, description, projet, échéance, urgence, code/non-code, tags, estimation) |
| 6 | Modifier / supprimer tâche |
| 7 | Toggle tâche (checkbox, optimistic update) |
| 8 | Vue tâches groupées par statut d'échéance |
| 9 | Filtres (projet, urgence, code/non-code, tags, statut) |
| 10 | Recherche textuelle |
| 11 | Sous-tâches |
| 12 | Progression projet (barre) |
| 13 | Vue tâches d'un projet |
| 14 | CRUD tags personnalisés |
| 15 | Badge 💻 sur les code tasks |

### P1 — V1.1

| # | Story |
|---|-------|
| 16 | Briefing quotidien (widget) |
| 17 | Commentaires par tâche (user + claude) |
| 18 | Time blocks / vue planning journalier |
| 19 | Tâches récurrentes |
| 20 | Actions en lot (compléter/supprimer/tagger) |
| 21 | Claude Corwork (AI instructions + exécution) |
| 22 | Résumé tâches sur Dashboard principal |

### P2 — V2

| # | Story |
|---|-------|
| 23 | Dashboard stats productivité (graphiques, streak) |
| 24 | Drag & drop réordonnancement |
| 25 | Drag & drop time blocks |
| 26 | Vue Kanban |
| 27 | Notifications/rappels tâches en retard |
| 28 | Suggestion de planning intelligent (AI-based) |

---

## 12. Fichiers à créer / modifier

### Nouveaux fichiers

```
src/
├── types/tasks.ts
├── lib/
│   ├── validations/tasks.ts
│   ├── actions/tasks.ts
│   ├── actions/projects.ts
│   ├── actions/companies.ts
│   ├── actions/tags.ts
│   ├── actions/comments.ts
│   ├── actions/recurring-tasks.ts
│   ├── actions/briefing.ts
│   ├── queries/tasks.ts
│   ├── queries/projects.ts
│   ├── queries/companies.ts
│   ├── queries/tags.ts
│   ├── queries/comments.ts
│   ├── queries/recurring-tasks.ts
│   └── queries/briefing.ts
├── components/
│   ├── tasks/
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   ├── task-modal.tsx
│   │   ├── task-detail-panel.tsx
│   │   ├── task-filters.tsx
│   │   ├── task-quick-add.tsx
│   │   ├── subtask-list.tsx
│   │   ├── task-schedule-view.tsx
│   │   └── task-time-block.tsx
│   ├── projects/
│   │   ├── project-list.tsx
│   │   ├── project-card.tsx
│   │   ├── project-modal.tsx
│   │   └── project-select.tsx
│   ├── companies/
│   │   ├── company-list.tsx
│   │   ├── company-card.tsx
│   │   ├── company-modal.tsx
│   │   └── company-select.tsx
│   ├── tags/
│   │   ├── tag-badge.tsx
│   │   ├── tag-select.tsx
│   │   └── tag-manager.tsx
│   ├── comments/
│   │   ├── comment-list.tsx
│   │   └── comment-input.tsx
│   ├── briefing/
│   │   └── daily-briefing.tsx
│   └── stats/
│       ├── task-stats-cards.tsx
│       ├── weekly-chart.tsx
│       └── project-breakdown.tsx
├── app/(dashboard)/dashboard/
│   ├── tasks/
│   │   ├── page.tsx
│   │   └── schedule/
│   │       └── page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── companies/
│   │   └── page.tsx
│   └── stats/
│       └── page.tsx
```

### Fichiers à modifier

```
src/config/navigation.ts           # Ajouter section Organisation
src/components/app-sidebar.tsx     # Ajouter NavMain Organisation
src/types/index.ts                 # Re-exporter types/tasks.ts
src/lib/constants.ts               # Ajouter constantes
```

---

## 13. Migration Supabase

Nom : `create_task_management_system`

Contient :
1. Tables : `companies`, `projects`, `tags`, `tasks`, `task_tags`, `task_comments`, `recurring_tasks`
2. Index de performance (briefing, scheduled, code_task)
3. RLS policies sur toutes les tables
4. Vue `task_details`
5. Triggers : `updated_at` + `set_task_completed_at`
6. Seed optionnel : entreprises ESST Solutions, Aurentia, Kaelen Studio

---

## 14. Considérations Techniques

### Performance
- Index composé pour le briefing (user_id + is_completed + due_date)
- Index sur scheduled_date pour la vue planning
- React Query `staleTime: 30s` listes, `staleTime: 0` détails
- Optimistic updates pour toggle tâche et commentaires
- Vue `task_details` évite les jointures N+1

### Responsive
- Mobile-first pour la liste de tâches
- Quick-add simplifié sur mobile
- Modals avec min 16px de marge
- Cards projets : 1 col mobile, 2 tablette, 3 desktop
- Touch targets ≥ 44px checkboxes
- Planning timeline scrollable horizontalement sur mobile

### Accessibilité
- Checkboxes avec labels accessibles
- Navigation clavier dans la liste
- Focus trap dans les modals
- ARIA labels pour badges et statuts
- role="list" / role="listitem"

### Sécurité
- RLS sur toutes les tables (user_id = auth.uid())
- RLS task_tags via sous-requête sur tasks.user_id
- Validation Zod côté serveur dans toutes les actions
- Pas de `any` TypeScript

---

## 15. Prompt d'implémentation

> Utiliser ce prompt dans une conversation Claude Code avec accès au MCP Supabase.

```
Tu vas implémenter le système complet de gestion de tâches de Lifely.

## Contexte
- Projet Next.js 14 (App Router) + TypeScript + Supabase + shadcn/ui + React Query
- Dashboard finances existant (transactions, budgets, catégories)
- PRD complet : `docs/prd-task-management.md`

## Ordre d'implémentation (MVP P0 d'abord)

### Phase 1 — Foundation
1. Migration Supabase via MCP `apply_migration` (toutes les tables, index, RLS, triggers, vue)
2. Régénérer les types TypeScript via MCP `generate_typescript_types`
3. Créer `src/types/tasks.ts` (interfaces et types)
4. Créer `src/lib/validations/tasks.ts` (schémas Zod)
5. Ajouter constantes dans `src/lib/constants.ts`

### Phase 2 — Backend
6. Server Actions : tasks.ts, projects.ts, companies.ts, tags.ts
7. React Query hooks : tasks.ts, projects.ts, companies.ts, tags.ts

### Phase 3 — Navigation
8. Mettre à jour `src/config/navigation.ts` (section Organisation)
9. Mettre à jour `src/components/app-sidebar.tsx`

### Phase 4 — UI (bottom-up)
10. Composants tags : tag-badge, tag-select, tag-manager
11. Composants companies : company-list, company-card, company-modal, company-select
12. Composants projects : project-list, project-card, project-modal, project-select
13. Composants tasks : task-item, task-list, task-modal, task-quick-add, task-filters, subtask-list, task-detail-panel

### Phase 5 — Pages
14. Page entreprises : dashboard/companies/page.tsx
15. Page projets : dashboard/projects/page.tsx + [id]/page.tsx
16. Page tâches : dashboard/tasks/page.tsx

### Phase 6 — P1 Features (après MVP stable)
17. Commentaires : comment-list, comment-input + actions + hooks
18. Time blocks : task-schedule-view, task-time-block + page schedule
19. Tâches récurrentes : actions + hooks + UI dans task-modal
20. Briefing : daily-briefing widget
21. Actions en lot

## Règles
- Suivre les mêmes patterns que les features existantes
- Mobile-first, responsive, accessible
- Optimistic updates pour toggle et comments
- Error handling avec toast (sonner)
- Modals avec marges min 16px
- Pas de `any` TypeScript
- React Hook Form + Zod pour les formulaires
- Composants shadcn/ui existants
- Distinction visuelle claire code tasks (💻 bleu) vs non-code
- Seed les 3 entreprises (ESST Solutions, Aurentia, Kaelen Studio) dans la migration
```
