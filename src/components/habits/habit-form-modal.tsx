'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

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
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  createHabitSchema,
  type HabitFormInput,
} from '@/lib/validations/habit'
import { useCreateHabit, useUpdateHabit } from '@/lib/queries/habits'
import { cn } from '@/lib/utils'
import type { Habit } from '@/types/habit'

import { HabitEmojiPicker } from './habit-emoji-picker'
import { HabitColorPicker } from './habit-color-picker'

const DEFAULT_HABIT_COLOR = '#8b9a6b'
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]
// 0=Dimanche … 6=Samedi (matches Date.getDay())
const DAY_LABELS: { value: number; short: string; full: string }[] = [
  { value: 1, short: 'L', full: 'Lundi' },
  { value: 2, short: 'M', full: 'Mardi' },
  { value: 3, short: 'M', full: 'Mercredi' },
  { value: 4, short: 'J', full: 'Jeudi' },
  { value: 5, short: 'V', full: 'Vendredi' },
  { value: 6, short: 'S', full: 'Samedi' },
  { value: 0, short: 'D', full: 'Dimanche' },
]

const PRESETS: { label: string; days: number[] }[] = [
  { label: 'Tous les jours', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Lun → Ven', days: [1, 2, 3, 4, 5] },
  { label: 'Week-end', days: [0, 6] },
]

function arraysEqualUnordered(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false
  const sa = [...a].sort()
  const sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

interface HabitFormModalProps {
  mode: 'create' | 'edit'
  habit?: Habit
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function HabitFormModal({
  mode,
  habit,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: HabitFormModalProps) {
  // Controlled vs uncontrolled state
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChangeProp?.(next)
  }

  const createMutation = useCreateHabit()
  const updateMutation = useUpdateHabit()
  const isEditMode = mode === 'edit'
  const mutation = isEditMode ? updateMutation : createMutation

  const buildDefaults = (): HabitFormInput => {
    if (isEditMode && habit) {
      return {
        name: habit.name,
        emoji: habit.emoji ?? undefined,
        color: habit.color ?? DEFAULT_HABIT_COLOR,
        order_index: habit.order_index ?? undefined,
        active_days: habit.active_days ?? ALL_DAYS,
      }
    }
    return {
      name: '',
      emoji: undefined,
      color: DEFAULT_HABIT_COLOR,
      active_days: ALL_DAYS,
    }
  }

  const form = useForm<HabitFormInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: buildDefaults(),
  })

  // Reset on open to capture latest props (habit may change between edit clicks)
  useEffect(() => {
    if (open) {
      form.reset(buildDefaults())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habit?.id])

  const onSubmit = async (values: HabitFormInput) => {
    try {
      if (isEditMode && habit) {
        await updateMutation.mutateAsync({ id: habit.id, data: values })
      } else {
        await createMutation.mutateAsync(values)
      }
      setOpen(false)
    } catch {
      // Mutation hooks already toast on error
    }
  }

  const title = isEditMode ? "Modifier l'habitude" : 'Nouvelle habitude'
  const submitLabel = isEditMode ? 'Enregistrer' : 'Créer'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Nom de l'habitude (ex: Musculation...)"
                      aria-label="Nom de l'habitude"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-3">
              <FormField
                control={form.control}
                name="emoji"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <HabitEmojiPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <HabitColorPicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active_days"
              render={({ field }) => {
                const value: number[] = field.value ?? ALL_DAYS
                const toggleDay = (d: number) => {
                  const next = value.includes(d)
                    ? value.filter((v) => v !== d)
                    : [...value, d]
                  // Enforce min 1 day at UI level — if user tries to remove
                  // the last one, ignore the click (Zod will also catch it).
                  if (next.length === 0) return
                  field.onChange(next.sort((a, b) => a - b))
                }
                const applyPreset = (days: number[]) => {
                  field.onChange([...days].sort((a, b) => a - b))
                }

                return (
                  <FormItem>
                    <FormDescription className="text-xs text-muted-foreground mb-1">
                      Jours actifs
                    </FormDescription>

                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {PRESETS.map((p) => {
                        const active = arraysEqualUnordered(value, p.days)
                        return (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(p.days)}
                            aria-pressed={active}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors',
                              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-habit-done))]/50',
                              active
                                ? 'border-transparent bg-[hsl(var(--color-habit-done))] text-white'
                                : 'border-border bg-background text-muted-foreground hover:bg-muted',
                            )}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>

                    <FormControl>
                      <TooltipProvider delayDuration={200}>
                        <div
                          role="group"
                          aria-label="Jours actifs"
                          className="flex flex-wrap gap-1.5"
                        >
                          {DAY_LABELS.map((day) => {
                            const active = value.includes(day.value)
                            return (
                              <Tooltip key={day.value}>
                                <TooltipTrigger asChild>
                                  <button
                                    type="button"
                                    onClick={() => toggleDay(day.value)}
                                    aria-pressed={active}
                                    aria-label={day.full}
                                    className={cn(
                                      'inline-flex h-9 w-9 items-center justify-center rounded-md border text-sm font-semibold transition-colors',
                                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-habit-done))]/50',
                                      active
                                        ? 'border-transparent bg-[hsl(var(--color-habit-done))] text-white shadow-sm'
                                        : 'border-border bg-background text-muted-foreground hover:bg-muted',
                                    )}
                                  >
                                    {day.short}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  {day.full}
                                </TooltipContent>
                              </Tooltip>
                            )
                          })}
                        </div>
                      </TooltipProvider>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setOpen(false)}
                disabled={mutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {submitLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
