'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Loader2, Repeat } from 'lucide-react'
import type { z } from 'zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from '@/components/ui/textarea'

import { createRecurringTaskSchema } from '@/lib/validations/tasks'
import {
  useCreateRecurringTask,
  useUpdateRecurringTask,
} from '@/lib/queries/recurring-tasks'
import { useProjects } from '@/lib/queries/task-projects'
import {
  RECURRENCE_FREQUENCIES,
  DAYS_OF_WEEK,
  TIME_ESTIMATION_PRESETS,
  TASK_URGENCIES,
  MONTHS,
} from '@/lib/constants'
import type { RecurringTask, TaskRecurrenceFrequency } from '@/types/tasks'

// Use zod-inferred input type to match resolver exactly
type FormValues = z.input<typeof createRecurringTaskSchema>

interface RecurringTaskModalProps {
  trigger?: React.ReactNode
  recurringTask?: RecurringTask | null
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
}

export function RecurringTaskModal({
  trigger,
  recurringTask,
  onOpenChange,
  defaultOpen,
}: RecurringTaskModalProps) {
  const [open, setOpen] = useState(defaultOpen ?? false)
  const createMutation = useCreateRecurringTask()
  const updateMutation = useUpdateRecurringTask()
  const { data: projects } = useProjects()

  const isEditMode = !!recurringTask

  const form = useForm<FormValues>({
    resolver: zodResolver(createRecurringTaskSchema),
    defaultValues: {
      title: recurringTask?.title ?? '',
      description: recurringTask?.description ?? '',
      project_id: recurringTask?.project_id ?? undefined,
      frequency: recurringTask?.frequency ?? 'daily',
      day_of_week: recurringTask?.day_of_week ?? undefined,
      day_of_month: recurringTask?.day_of_month ?? undefined,
      month_of_year: recurringTask?.month_of_year ?? undefined,
      is_code_task: recurringTask?.is_code_task ?? false,
      urgency: recurringTask?.urgency ?? undefined,
      estimated_minutes: recurringTask?.estimated_minutes ?? undefined,
      start_date: recurringTask?.start_date ?? new Date().toISOString().split('T')[0],
      end_date: recurringTask?.end_date ?? undefined,
      ai_instructions: recurringTask?.ai_instructions ?? '',
    },
  })

  const frequency = form.watch('frequency')

  // Sync open state with parent
  useEffect(() => {
    if (defaultOpen !== undefined) {
      setOpen(defaultOpen)
    }
  }, [defaultOpen])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        title: recurringTask?.title ?? '',
        description: recurringTask?.description ?? '',
        project_id: recurringTask?.project_id ?? undefined,
        frequency: recurringTask?.frequency ?? 'daily',
        day_of_week: recurringTask?.day_of_week ?? undefined,
        day_of_month: recurringTask?.day_of_month ?? undefined,
        month_of_year: recurringTask?.month_of_year ?? undefined,
        is_code_task: recurringTask?.is_code_task ?? false,
        urgency: recurringTask?.urgency ?? undefined,
        estimated_minutes: recurringTask?.estimated_minutes ?? undefined,
        start_date: recurringTask?.start_date ?? new Date().toISOString().split('T')[0],
        end_date: recurringTask?.end_date ?? undefined,
        ai_instructions: recurringTask?.ai_instructions ?? '',
      })
    }
  }, [open, recurringTask, form])

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  const onSubmit = async (data: FormValues) => {
    try {
      // Clean up frequency-specific fields
      const cleaned = { ...data }
      if (cleaned.frequency !== 'weekly') {
        cleaned.day_of_week = undefined
      }
      if (cleaned.frequency !== 'monthly' && cleaned.frequency !== 'yearly') {
        cleaned.day_of_month = undefined
      }
      if (cleaned.frequency !== 'yearly') {
        cleaned.month_of_year = undefined
      }

      if (isEditMode && recurringTask) {
        await updateMutation.mutateAsync({
          id: recurringTask.id,
          title: cleaned.title,
          description: cleaned.description || null,
          project_id: cleaned.project_id || null,
          frequency: cleaned.frequency,
          day_of_week: cleaned.day_of_week ?? null,
          day_of_month: cleaned.day_of_month ?? null,
          month_of_year: cleaned.month_of_year ?? null,
          is_code_task: cleaned.is_code_task,
          urgency: cleaned.urgency ?? null,
          estimated_minutes: cleaned.estimated_minutes ?? null,
          start_date: cleaned.start_date,
          end_date: cleaned.end_date || null,
          ai_instructions: cleaned.ai_instructions || null,
        })
      } else {
        await createMutation.mutateAsync({
          title: cleaned.title,
          description: cleaned.description || undefined,
          project_id: cleaned.project_id || undefined,
          frequency: cleaned.frequency,
          day_of_week: cleaned.day_of_week ?? undefined,
          day_of_month: cleaned.day_of_month ?? undefined,
          month_of_year: cleaned.month_of_year ?? undefined,
          is_code_task: cleaned.is_code_task,
          urgency: cleaned.urgency ?? undefined,
          estimated_minutes: cleaned.estimated_minutes ?? undefined,
          start_date: cleaned.start_date || undefined,
          end_date: cleaned.end_date ?? undefined,
        })
      }
      handleOpenChange(false)
    } catch {
      // Error handled by mutation onError (toast)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const defaultTrigger = (
    <Button size="sm" variant="outline">
      <Plus className="mr-2 h-4 w-4" />
      Nouvelle tache recurrente
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>{defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            {isEditMode ? 'Modifier la tache recurrente' : 'Nouvelle tache recurrente'}
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
                    <Input placeholder="Ex: Stand-up quotidien..." {...field} />
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
                      placeholder="Description optionnelle..."
                      className="resize-none"
                      rows={2}
                      {...field}
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
                    value={field.value ?? '_none'}
                    onValueChange={(v) => field.onChange(v === '_none' ? undefined : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Aucun projet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="_none">Aucun projet</SelectItem>
                      {projects?.map((p) => (
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

            {/* Frequency */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequence</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => field.onChange(v as TaskRecurrenceFrequency)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {RECURRENCE_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Weekly: day of week */}
            {frequency === 'weekly' && (
              <FormField
                control={form.control}
                name="day_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jour de la semaine</FormLabel>
                    <Select
                      value={field.value?.toString() ?? ''}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un jour" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((d) => (
                          <SelectItem key={d.value} value={d.value.toString()}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Monthly / Yearly: day of month */}
            {(frequency === 'monthly' || frequency === 'yearly') && (
              <FormField
                control={form.control}
                name="day_of_month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jour du mois</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="1-31"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Yearly: month */}
            {frequency === 'yearly' && (
              <FormField
                control={form.control}
                name="month_of_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mois</FormLabel>
                    <Select
                      value={field.value?.toString() ?? ''}
                      onValueChange={(v) => field.onChange(parseInt(v))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un mois" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTHS.map((m, idx) => (
                          <SelectItem key={idx + 1} value={(idx + 1).toString()}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Urgency + Estimated time row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgence</FormLabel>
                    <Select
                      value={field.value ?? '_none'}
                      onValueChange={(v) => field.onChange(v === '_none' ? undefined : v)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucune</SelectItem>
                        {TASK_URGENCIES.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimated_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duree estimee</FormLabel>
                    <Select
                      value={field.value?.toString() ?? '_none'}
                      onValueChange={(v) =>
                        field.onChange(v === '_none' ? undefined : parseInt(v))
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_none">Aucune</SelectItem>
                        {TIME_ESTIMATION_PRESETS.map((t) => (
                          <SelectItem key={t.value} value={t.value.toString()}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Code task toggle */}
            <FormField
              control={form.control}
              name="is_code_task"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm font-medium">Tache de code</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Marquer comme tache de developpement
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de debut</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value || undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditMode ? 'Modification...' : 'Creation...'}
                  </>
                ) : isEditMode ? (
                  'Modifier'
                ) : (
                  'Creer'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
