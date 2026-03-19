"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Terminal,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  TASK_STATUSES,
  TASK_DUE_STATUS_COLORS,
  TIME_ESTIMATION_PRESETS,
} from "@/lib/constants"
import { useUpdateTask, useDeleteTask } from "@/lib/queries/tasks"
import { useProjects } from "@/lib/queries/task-projects"
import type { Task, TaskStatus, TaskDueStatus } from "@/types/tasks"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { TaskStatusCheckbox } from "@/components/tasks/task-status-checkbox"
import { TagSelect } from "@/components/tags/tag-select"
import { SubtaskList } from "@/components/tasks/subtask-list"

// ─── Props ──────────────────────────────────────────────

interface TaskDetailSheetProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Helpers ────────────────────────────────────────────

function getDueStatusLabel(status: TaskDueStatus): string {
  const labels: Record<TaskDueStatus, string> = {
    overdue: "En retard",
    today: "Aujourd'hui",
    upcoming: "Bientot",
    future: "A venir",
    no_date: "Pas de date",
  }
  return labels[status] ?? status
}

// ─── Debounce hook ──────────────────────────────────────

function useDebouncedSave(
  value: string,
  delay: number,
  onSave: (val: string) => void,
  enabled: boolean
) {
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (!enabled) return

    const timer = setTimeout(() => {
      onSave(value)
    }, delay)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay, enabled])
}

// ─── Component ──────────────────────────────────────────

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const { data: projects = [] } = useProjects()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subtasksExpanded, setSubtasksExpanded] = useState(false)

  // ─── Local state for debounced fields ──────────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [body, setBody] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setBody(task.body ?? "")
      setAiInstructions(task.ai_instructions ?? "")
      setSubtasksExpanded(false)
    }
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Save helpers ──────────────────────────────────────

  const saveField = useCallback(
    (field: string, value: unknown) => {
      if (!task) return
      updateTask.mutate({ id: task.id, [field]: value })
    },
    [task, updateTask]
  )

  // Debounced saves for text fields
  useDebouncedSave(
    title,
    500,
    (val) => saveField("title", val),
    !!task && title !== task.title
  )
  useDebouncedSave(
    description,
    500,
    (val) => saveField("description", val || null),
    !!task && description !== (task.description ?? "")
  )
  useDebouncedSave(
    body,
    500,
    (val) => saveField("body", val || null),
    !!task && body !== (task.body ?? "")
  )
  useDebouncedSave(
    aiInstructions,
    500,
    (val) => saveField("ai_instructions", val || null),
    !!task && aiInstructions !== (task.ai_instructions ?? "")
  )

  // ─── Handlers ──────────────────────────────────────────

  const handleStatusChange = (status: TaskStatus) => {
    saveField("status", status)
  }

  const handleProjectChange = (projectId: string) => {
    saveField("project_id", projectId === "none" ? null : projectId)
  }

  const handleDueDateChange = (date: Date | undefined) => {
    saveField(
      "due_date",
      date ? format(date, "yyyy-MM-dd") : null
    )
  }

  const handleEstimationChange = (minutes: number) => {
    saveField(
      "estimated_minutes",
      task?.estimated_minutes === minutes ? null : minutes
    )
  }

  const handleTagsChange = (tagIds: string[]) => {
    if (!task) return
    updateTask.mutate({ id: task.id, tag_ids: tagIds })
  }

  const handleDelete = () => {
    if (!task) return
    deleteTask.mutate(task.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        onOpenChange(false)
      },
    })
  }

  if (!task) return null

  const hasSubtasks = (task.subtask_count ?? 0) > 0
  const dueStatusColor = task.due_status
    ? TASK_DUE_STATUS_COLORS[task.due_status as keyof typeof TASK_DUE_STATUS_COLORS]
    : undefined

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] overflow-y-auto p-0"
        showCloseButton
      >
        {/* ─── Header ─────────────────────────────────────── */}
        <SheetHeader className="p-4 pb-0 pr-10">
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              <TaskStatusCheckbox
                status={task.status}
                onChange={handleStatusChange}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="sr-only">
                Details de la tache
              </SheetTitle>
              <SheetDescription className="sr-only">
                Modifier les proprietes de la tache
              </SheetDescription>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={cn(
                  "border-none bg-transparent px-0 text-lg font-semibold shadow-none",
                  "focus-visible:ring-0 focus-visible:ring-offset-0",
                  "placeholder:text-muted-foreground/50",
                  task.status === "completed" &&
                    "line-through text-muted-foreground"
                )}
                placeholder="Titre de la tache..."
              />
            </div>
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        {/* ─── Properties Grid ────────────────────────────── */}
        <div className="px-4 space-y-1">
          <div className="grid grid-cols-[120px_1fr] gap-y-3 gap-x-4 items-center text-sm">
            {/* Statut */}
            <span className="text-muted-foreground">Statut</span>
            <Select
              value={task.status}
              onValueChange={(v) => handleStatusChange(v as TaskStatus)}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Projet */}
            <span className="text-muted-foreground">Projet</span>
            <Select
              value={task.project_id ?? "none"}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="h-8 w-full">
                <SelectValue placeholder="Aucun projet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Aucun projet</span>
                </SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.color ?? "#64748b",
                        }}
                      />
                      {p.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Entreprise (read-only) */}
            <span className="text-muted-foreground">Entreprise</span>
            <span className="text-sm">
              {task.company_name ?? "Personnel"}
            </span>

            {/* Sous-taches */}
            <span className="text-muted-foreground">Sous-taches</span>
            <div>
              <button
                type="button"
                onClick={() => setSubtasksExpanded(!subtasksExpanded)}
                className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors"
              >
                {subtasksExpanded ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                <Badge variant="secondary" className="text-xs font-normal">
                  {task.subtask_completed_count ?? 0}/{task.subtask_count ?? 0}
                </Badge>
              </button>
            </div>

            {/* Statut delai */}
            {task.due_status && (
              <>
                <span className="text-muted-foreground">Delai</span>
                <Badge
                  variant="outline"
                  className="w-fit text-xs"
                  style={{
                    borderColor: dueStatusColor
                      ? `${dueStatusColor}50`
                      : undefined,
                    color: dueStatusColor,
                  }}
                >
                  {getDueStatusLabel(task.due_status as TaskDueStatus)}
                </Badge>
              </>
            )}

            {/* Urgence toggles */}
            <span className="text-muted-foreground">Urgence</span>
            <div className="flex items-center gap-2">
              <Button
                variant={task.is_urgent ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1",
                  task.is_urgent &&
                    "bg-red-500 hover:bg-red-600 text-white"
                )}
                onClick={() => saveField("is_urgent", !task.is_urgent)}
              >
                <span aria-hidden>&#128293;</span> Urgent
              </Button>
              <Button
                variant={task.is_important ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 text-xs gap-1",
                  task.is_important &&
                    "bg-amber-500 hover:bg-amber-600 text-white"
                )}
                onClick={() => saveField("is_important", !task.is_important)}
              >
                <span aria-hidden>&#128680;</span> Important
              </Button>
            </div>

            {/* Echeance */}
            <span className="text-muted-foreground">Echeance</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 w-full justify-start gap-2 text-left font-normal",
                    !task.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="size-3.5" />
                  {task.due_date
                    ? format(new Date(task.due_date), "d MMM yyyy", {
                        locale: fr,
                      })
                    : "Pas de date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    task.due_date ? new Date(task.due_date) : undefined
                  }
                  onSelect={handleDueDateChange}
                  locale={fr}
                  initialFocus
                />
                {task.due_date && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={() => handleDueDateChange(undefined)}
                    >
                      Supprimer la date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Estimation */}
            <span className="text-muted-foreground">Estimation</span>
            <div className="flex flex-wrap gap-1">
              {TIME_ESTIMATION_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={
                    task.estimated_minutes === preset.value
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleEstimationChange(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Tags */}
            <span className="text-muted-foreground">Tags</span>
            <TagSelect
              value={task.tags?.map((t) => t.id) ?? []}
              onChange={handleTagsChange}
            />

            {/* Code task */}
            <span className="text-muted-foreground">Tache code</span>
            <div className="flex items-center gap-2">
              <Switch
                checked={task.is_code_task}
                onCheckedChange={(checked) =>
                  saveField("is_code_task", checked)
                }
              />
              {task.is_code_task && (
                <Code className="size-3.5 text-blue-500" />
              )}
            </div>
          </div>

          {/* Subtask list (expandable) */}
          {subtasksExpanded && (
            <div className="pt-2">
              <SubtaskList parentTaskId={task.id} />
            </div>
          )}
        </div>

        {/* ─── Claude Code Section ────────────────────────── */}
        {task.is_code_task && (
          <>
            <Separator className="my-3" />
            <div className="px-4 space-y-2">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-blue-500" />
                <span className="text-sm font-medium">
                  Instructions pour Claude Code
                </span>
              </div>
              <Textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Decrivez le contexte, les fichiers concernes, les contraintes..."
                rows={4}
                className="text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Ce contexte sera transmis a Claude Code via MCP
              </p>
            </div>
          </>
        )}

        <Separator className="my-3" />

        {/* ─── Description ────────────────────────────────── */}
        <div className="px-4 space-y-2">
          <span className="text-sm font-medium">Description</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ajoutez une description..."
            rows={3}
            className="text-sm resize-none"
          />
        </div>

        {/* ─── Body / Notes ───────────────────────────────── */}
        <div className="px-4 pt-3 space-y-2">
          <span className="text-sm font-medium">Notes</span>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Prenez des notes..."
            rows={6}
            className="text-sm resize-none"
          />
        </div>

        <Separator className="my-3" />

        {/* ─── Delete ─────────────────────────────────────── */}
        <div className="px-4 pb-6">
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer la tache</AlertDialogTitle>
                <AlertDialogDescription>
                  Etes-vous sur de vouloir supprimer &quot;{task.title}
                  &quot; ?
                  {hasSubtasks &&
                    " Toutes les sous-taches seront egalement supprimees."}
                  {" "}Cette action est irreversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  )
}
