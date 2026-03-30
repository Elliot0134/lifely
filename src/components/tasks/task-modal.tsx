'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CalendarIcon, ChevronDown, Code2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { TagSelect } from '@/components/tags/tag-select'

import { createTaskSchema } from '@/lib/validations/tasks'
import { useCreateTask, useUpdateTask } from '@/lib/queries/tasks'
import { useProjects } from '@/lib/queries/task-projects'
import { TIME_ESTIMATION_PRESETS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/types/tasks'

// Use zod-inferred type for form to match resolver exactly
type FormValues = z.input<typeof createTaskSchema>

interface TaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultProjectId?: string
}

export function TaskModal({
  open,
  onOpenChange,
  task,
  defaultProjectId,
}: TaskModalProps) {
  const isEditMode = !!task
  const createMutation = useCreateTask()
  const updateMutation = useUpdateTask()
  const { data: projects = [] } = useProjects()
  const [showMore, setShowMore] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: getDefaultValues(task, defaultProjectId),
  })

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(task, defaultProjectId))
      setShowMore(isEditMode)
    }
  }, [open, task, defaultProjectId, form, isEditMode])

  const onSubmit = async (data: FormValues) => {
    try {
      const payload: CreateTaskInput = { ...data }

      if (isEditMode && task) {
        const updateData: UpdateTaskInput = {
          id: task.id,
          ...payload,
        }
        await updateMutation.mutateAsync(updateData)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
    } catch {
      // Error handled by mutation onError (toast)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Titre de la tâche..."
                      className="text-base"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Compact row: Project + Due date */}
            <div className="flex gap-2">
              {/* Project */}
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      value={field.value ?? 'none'}
                      onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                    >
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Projet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun projet</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <div className="flex items-center gap-2">
                              {p.color && (
                                <div
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: p.color }}
                                />
                              )}
                              {p.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Due date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'h-9 px-3 font-normal gap-2',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="size-4" />
                            {field.value
                              ? format(new Date(field.value), 'dd MMM', { locale: fr })
                              : 'Date'}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) =>
                            field.onChange(date ? format(date, 'yyyy-MM-dd') : undefined)
                          }
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Urgency row: inline toggle buttons */}
            <div className="flex items-center gap-2">
              <FormField
                control={form.control}
                name="is_urgent"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant={field.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-8 text-xs',
                      field.value && 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                    )}
                    onClick={() => field.onChange(!field.value)}
                  >
                    Urgent
                  </Button>
                )}
              />
              <FormField
                control={form.control}
                name="is_important"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant={field.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-8 text-xs',
                      field.value && 'bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-500 dark:hover:bg-orange-600'
                    )}
                    onClick={() => field.onChange(!field.value)}
                  >
                    Important
                  </Button>
                )}
              />
              <FormField
                control={form.control}
                name="is_code_task"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant={field.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      'h-8 text-xs gap-1',
                      field.value && 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600'
                    )}
                    onClick={() => field.onChange(!field.value)}
                  >
                    <Code2 className="size-3.5" />
                    Code
                  </Button>
                )}
              />
            </div>

            {/* Expandable section for less common fields */}
            <Collapsible open={showMore} onOpenChange={setShowMore}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground gap-1"
                >
                  <ChevronDown className={cn(
                    'size-3.5 transition-transform',
                    showMore && 'rotate-180'
                  )} />
                  {showMore ? 'Moins d\'options' : 'Plus d\'options'}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Description courte..."
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Time estimation presets */}
                <FormField
                  control={form.control}
                  name="estimated_minutes"
                  render={({ field }) => {
                    const [expanded, setExpanded] = useState(!field.value)
                    return (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Estimation</FormLabel>
                        {!expanded && field.value ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 w-fit px-3 text-xs"
                            onClick={() => setExpanded(true)}
                          >
                            {TIME_ESTIMATION_PRESETS.find((p) => p.value === field.value)?.label ?? `${field.value} min`}
                          </Button>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {TIME_ESTIMATION_PRESETS.map((preset) => (
                              <Button
                                key={preset.value}
                                type="button"
                                variant={field.value === preset.value ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 px-2.5 text-xs"
                                onClick={() => {
                                  field.onChange(
                                    field.value === preset.value ? undefined : preset.value
                                  )
                                  setExpanded(false)
                                }}
                              >
                                {preset.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tag_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">Tags</FormLabel>
                      <FormControl>
                        <TagSelect
                          value={field.value ?? []}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Modification...' : 'Création...'}
                  </>
                ) : isEditMode ? (
                  'Modifier'
                ) : (
                  'Créer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Helpers ──────────────────────────────────────────

function getDefaultValues(
  task?: Task | null,
  defaultProjectId?: string
): FormValues {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? undefined,
      project_id: task.project_id ?? undefined,
      is_code_task: task.is_code_task,
      due_date: task.due_date ?? undefined,
      is_urgent: task.is_urgent,
      is_important: task.is_important,
      estimated_minutes: task.estimated_minutes ?? undefined,
      tag_ids: task.tags?.map((t) => t.id) ?? [],
    }
  }

  return {
    title: '',
    description: undefined,
    project_id: defaultProjectId,
    is_code_task: false,
    due_date: undefined,
    is_urgent: undefined,
    is_important: undefined,
    estimated_minutes: undefined,
    tag_ids: [],
  }
}
