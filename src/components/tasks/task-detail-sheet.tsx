"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  CalendarIcon,
  ChevronDown,
  ChevronRight,
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
  const [estimationExpanded, setEstimationExpanded] = useState(false)

  // ─── Local state for all editable fields ───────────────
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [body, setBody] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [localIsUrgent, setLocalIsUrgent] = useState(false)
  const [localIsImportant, setLocalIsImportant] = useState(false)
  const [localIsCodeTask, setLocalIsCodeTask] = useState(false)
  const [localStatus, setLocalStatus] = useState<TaskStatus>("todo")
  const [localEstimatedMinutes, setLocalEstimatedMinutes] = useState<number | null>(null)
  const [localProjectId, setLocalProjectId] = useState<string | null>(null)
  const [localDueDate, setLocalDueDate] = useState<string | null>(null)
  const [localTagIds, setLocalTagIds] = useState<string[]>([])

  // Sync local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? "")
      setBody(task.body ?? "")
      setAiInstructions(task.ai_instructions ?? "")
      setLocalIsUrgent(task.is_urgent)
      setLocalIsImportant(task.is_important)
      setLocalIsCodeTask(task.is_code_task)
      setLocalStatus(task.status)
      setLocalEstimatedMinutes(task.estimated_minutes ?? null)
      setLocalProjectId(task.project_id ?? null)
      setLocalDueDate(task.due_date ?? null)
      setLocalTagIds(task.tags?.map((t) => t.id) ?? [])
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

  // ─── Handlers (optimistic local state + server save) ────

  const handleStatusChange = (status: TaskStatus) => {
    setLocalStatus(status)
    saveField("status", status)
  }

  const handleProjectChange = (projectId: string) => {
    const value = projectId === "none" ? null : projectId
    setLocalProjectId(value)
    saveField("project_id", value)
  }

  const handleDueDateChange = (date: Date | undefined) => {
    const value = date ? format(date, "yyyy-MM-dd") : null
    setLocalDueDate(value)
    saveField("due_date", value)
  }

  const handleEstimationChange = (minutes: number) => {
    const value = localEstimatedMinutes === minutes ? null : minutes
    setLocalEstimatedMinutes(value)
    saveField("estimated_minutes", value)
  }

  const handleTagsChange = (tagIds: string[]) => {
    if (!task) return
    setLocalTagIds(tagIds)
    updateTask.mutate({ id: task.id, tag_ids: tagIds })
  }

  const toggleUrgent = () => {
    const value = !localIsUrgent
    setLocalIsUrgent(value)
    saveField("is_urgent", value)
  }

  const toggleImportant = () => {
    const value = !localIsImportant
    setLocalIsImportant(value)
    saveField("is_important", value)
  }

  const toggleCodeTask = (checked: boolean) => {
    setLocalIsCodeTask(checked)
    saveField("is_code_task", checked)
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
        <SheetHeader className="px-4 pt-4 pb-0 pr-10">
          <div className="flex items-start gap-3">
            <div className="pt-0.5">
              <TaskStatusCheckbox
                status={localStatus}
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
                  localStatus === "completed" &&
                    "line-through text-muted-foreground"
                )}
                placeholder="Titre de la tache..."
              />
            </div>
          </div>

          {/* Quick toggles under title */}
          <div className="flex items-center gap-1.5 pl-9 pt-1">
            <Button
              variant={localIsUrgent ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-6 px-2 text-[11px]",
                localIsUrgent &&
                  "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              )}
              onClick={toggleUrgent}
            >
              Urgent
            </Button>
            <Button
              variant={localIsImportant ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-6 px-2 text-[11px]",
                localIsImportant &&
                  "bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600"
              )}
              onClick={toggleImportant}
            >
              Important
            </Button>
            <Button
              variant={localIsCodeTask ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-6 px-2 text-[11px] gap-1",
                localIsCodeTask &&
                  "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
              )}
              onClick={() => toggleCodeTask(!localIsCodeTask)}
            >
              <Code className="size-3" />
              Code
            </Button>
            {task.due_status && task.due_status !== "no_date" && (
              <Badge
                variant="outline"
                className="h-6 text-[11px] font-normal"
                style={{
                  borderColor: dueStatusColor
                    ? `${dueStatusColor}50`
                    : undefined,
                  color: dueStatusColor,
                }}
              >
                {getDueStatusLabel(task.due_status as TaskDueStatus)}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Separator className="my-3" />

        {/* ─── Properties ─────────────────────────────────── */}
        <div className="px-4 space-y-2">
          <div className="grid grid-cols-[100px_1fr] gap-y-2 gap-x-3 items-center text-sm">
            {/* Statut */}
            <span className="text-xs text-muted-foreground">Statut</span>
            <Select
              value={localStatus}
              onValueChange={(v) => handleStatusChange(v as TaskStatus)}
            >
              <SelectTrigger className="h-7 text-xs">
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
            <span className="text-xs text-muted-foreground">Projet</span>
            <Select
              value={localProjectId ?? "none"}
              onValueChange={handleProjectChange}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Aucun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">Aucun</span>
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

            {/* Echeance */}
            <span className="text-xs text-muted-foreground">Echeance</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-7 w-full justify-start gap-2 text-left text-xs font-normal",
                    !localDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="size-3" />
                  {localDueDate
                    ? format(new Date(localDueDate), "d MMM yyyy", {
                        locale: fr,
                      })
                    : "Aucune"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    localDueDate ? new Date(localDueDate) : undefined
                  }
                  onSelect={handleDueDateChange}
                  locale={fr}
                  initialFocus
                />
                {localDueDate && (
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
            <span className="text-xs text-muted-foreground">Estimation</span>
            {!estimationExpanded && localEstimatedMinutes ? (
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-fit px-3 text-xs"
                onClick={() => setEstimationExpanded(true)}
              >
                {TIME_ESTIMATION_PRESETS.find((p) => p.value === localEstimatedMinutes)?.label ?? `${localEstimatedMinutes} min`}
              </Button>
            ) : (
              <div className="flex flex-wrap gap-1">
                {TIME_ESTIMATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={
                      localEstimatedMinutes === preset.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    onClick={() => {
                      handleEstimationChange(preset.value)
                      setEstimationExpanded(false)
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Tags */}
            <span className="text-xs text-muted-foreground">Tags</span>
            <TagSelect
              value={localTagIds}
              onChange={handleTagsChange}
            />
          </div>
        </div>

        {/* ─── Sous-taches (inline) ───────────────────────── */}
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => setSubtasksExpanded(!subtasksExpanded)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {subtasksExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Sous-taches
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
              {task.subtask_completed_count ?? 0}/{task.subtask_count ?? 0}
            </Badge>
          </button>
          {subtasksExpanded && (
            <div className="pt-2">
              <SubtaskList parentTaskId={task.id} className="pl-0" />
            </div>
          )}
        </div>

        <Separator className="my-3" />

        {/* ─── Description ────────────────────────────────── */}
        <div className="px-4 space-y-1.5">
          <span className="text-xs text-muted-foreground">Description</span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ajouter une description..."
            rows={2}
            className="text-sm resize-none border-none bg-muted/50 shadow-none focus-visible:ring-1"
          />
        </div>

        {/* ─── Notes ──────────────────────────────────────── */}
        <div className="px-4 pt-2 space-y-1.5">
          <span className="text-xs text-muted-foreground">Notes</span>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Prendre des notes..."
            rows={4}
            className="text-sm resize-none border-none bg-muted/50 shadow-none focus-visible:ring-1"
          />
        </div>

        {/* ─── Claude Code Section ────────────────────────── */}
        {localIsCodeTask && (
          <div className="px-4 pt-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Instructions Claude Code
              </span>
            </div>
            <Textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="Contexte, fichiers, contraintes..."
              rows={3}
              className="text-sm resize-none border-none bg-muted/50 shadow-none focus-visible:ring-1"
            />
          </div>
        )}

        <Separator className="my-3" />

        {/* ─── Footer ─────────────────────────────────────── */}
        <div className="px-4 pb-4 flex items-center justify-between">
          {task.company_name && (
            <span className="text-[11px] text-muted-foreground">
              {task.company_name}
            </span>
          )}
          <AlertDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-auto"
              >
                <Trash2 className="size-3" />
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
