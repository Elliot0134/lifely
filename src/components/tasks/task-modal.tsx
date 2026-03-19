'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, CalendarIcon, Code2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
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

  const form = useForm<FormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: getDefaultValues(task, defaultProjectId),
  })

  // Reset form when task changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(task, defaultProjectId))
    }
  }, [open, task, defaultProjectId, form])

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Refactorer le composant..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Détails de la tâche..."
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Projet</FormLabel>
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? undefined : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun projet" />
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

            {/* Due date + Urgency row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Due date */}
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date limite</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? format(new Date(field.value), 'dd MMM yyyy', { locale: fr })
                              : 'Choisir...'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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

              {/* Urgency toggles */}
              <div className="flex items-center gap-4">
                <FormField
                  control={form.control}
                  name="is_urgent"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Urgent</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_important"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className="!mt-0">Important</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Code task switch */}
            <FormField
              control={form.control}
              name="is_code_task"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                    <FormLabel className="!mt-0 cursor-pointer">
                      Tâche de code
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Time estimation presets */}
            <FormField
              control={form.control}
              name="estimated_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimation</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {TIME_ESTIMATION_PRESETS.map((preset) => (
                      <Button
                        key={preset.value}
                        type="button"
                        variant={field.value === preset.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() =>
                          field.onChange(
                            field.value === preset.value ? undefined : preset.value
                          )
                        }
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
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

            {/* Actions */}
            <div className="flex gap-2 pt-4">
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
