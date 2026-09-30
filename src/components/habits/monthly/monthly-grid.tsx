'use client'

import { useState } from 'react'
import { eachDayOfInterval, endOfMonth, format, isToday } from 'date-fns'
import { fr } from 'date-fns/locale'
import { GripVertical } from 'lucide-react'

import { HabitCompletionCheckbox } from '@/components/habits/habit-completion-checkbox'
import { HabitDeleteDialog } from '@/components/habits/habit-delete-dialog'
import { HabitFormModal } from '@/components/habits/habit-form-modal'
import { HabitRowActions } from '@/components/habits/habit-row-actions'
import { SortableHabitRows } from '@/components/habits/sortable-habit-rows'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToggleCompletion } from '@/lib/queries/habits'
import {
  activeHabitsCount,
  habitActiveDaysCount,
  isHabitActiveOnDate,
} from '@/lib/habits'
import { cn } from '@/lib/utils'
import type { Habit, HabitCompletion } from '@/types/habit'

interface MonthlyGridProps {
  habits: Habit[]
  completions: HabitCompletion[]
  monthStart: string
}

export function MonthlyGrid({
  habits,
  completions,
  monthStart,
}: MonthlyGridProps) {
  const toggle = useToggleCompletion()
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)

  if (habits.length === 0) {
    return null
  }

  const monthStartDate = new Date(monthStart)
  const days = eachDayOfInterval({
    start: monthStartDate,
    end: endOfMonth(monthStartDate),
  })

  const completedSet = new Set(
    completions.map((c) => `${c.habit_id}|${c.completed_date}`),
  )

  const isCompleted = (habitId: string, isoDate: string) =>
    completedSet.has(`${habitId}|${isoDate}`)

  const habitProgress = (habit: Habit) => {
    const activeDays = habitActiveDaysCount(habit, days)
    if (activeDays === 0) return 0
    const done = days.reduce((acc, d) => {
      if (!isHabitActiveOnDate(habit, d)) return acc
      const iso = format(d, 'yyyy-MM-dd')
      return acc + (isCompleted(habit.id, iso) ? 1 : 0)
    }, 0)
    return Math.round((done / activeDays) * 100)
  }

  const dayStats = days.map((d) => {
    const iso = format(d, 'yyyy-MM-dd')
    const activeCount = activeHabitsCount(habits, d)
    const done = habits.reduce((acc, h) => {
      if (!isHabitActiveOnDate(h, d)) return acc
      return acc + (isCompleted(h.id, iso) ? 1 : 0)
    }, 0)
    const missed = Math.max(0, activeCount - done)
    const percent = activeCount > 0 ? Math.round((done / activeCount) * 100) : 0
    return { iso, done, missed, percent }
  })

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Suivi mensuel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-background min-w-[200px] py-2">
                  Mes habitudes
                </TableHead>
                {days.map((d) => {
                  const today = isToday(d)
                  return (
                    <TableHead
                      key={d.toISOString()}
                      className={cn(
                        'text-center px-1 py-2',
                        today && 'bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'mx-auto flex w-8 flex-col items-center rounded-md py-1',
                          today &&
                            'ring-1 ring-[hsl(var(--color-habit-done))]/40',
                        )}
                      >
                        <span className="text-xs font-semibold leading-none tabular-nums">
                          {format(d, 'd')}
                        </span>
                        <span className="mt-0.5 text-[10px] text-muted-foreground leading-none capitalize">
                          {format(d, 'EEEEE', { locale: fr })}
                        </span>
                      </div>
                    </TableHead>
                  )
                })}
                <TableHead className="min-w-[80px] py-2 text-right">
                  Progression
                </TableHead>
                <TableHead className="w-10 py-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableHabitRows habits={habits}>
                {({ habit, setNodeRef, style, dragHandleProps, isDragging }) => {
                  const progress = habitProgress(habit)
                  return (
                    <TableRow
                      key={habit.id}
                      ref={setNodeRef}
                      style={style}
                      className="group"
                    >
                      <TableCell className="sticky left-0 z-10 bg-background min-w-[200px] max-w-[200px] py-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <button
                            type="button"
                            className={cn(
                              'flex h-6 w-4 shrink-0 items-center justify-center text-muted-foreground touch-none',
                              'opacity-0 group-hover:opacity-100 transition-opacity',
                              isDragging ? 'cursor-grabbing opacity-100' : 'cursor-grab',
                            )}
                            aria-label={`Réordonner ${habit.name}`}
                            {...dragHandleProps.attributes}
                            {...dragHandleProps.listeners}
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          {habit.emoji && (
                            <span
                              className="text-base leading-none"
                              aria-hidden="true"
                            >
                              {habit.emoji}
                            </span>
                          )}
                          <span className="truncate text-sm font-medium">
                            {habit.name}
                          </span>
                        </div>
                      </TableCell>
                      {days.map((d) => {
                        const iso = format(d, 'yyyy-MM-dd')
                        const today = isToday(d)
                        const active = isHabitActiveOnDate(habit, d)
                        if (!active) {
                          return (
                            <TableCell
                              key={iso}
                              className={cn(
                                'text-center px-1 py-2',
                                today && 'bg-muted/30',
                              )}
                              aria-label={`Inactif pour ${habit.name}`}
                            >
                              <span
                                className="text-[10px] text-muted-foreground/40 select-none"
                                aria-hidden="true"
                              >
                                —
                              </span>
                            </TableCell>
                          )
                        }
                        const checked = isCompleted(habit.id, iso)
                        return (
                          <TableCell
                            key={iso}
                            className={cn(
                              'text-center px-1 py-2',
                              today && 'bg-muted/30',
                            )}
                          >
                            <div className="flex items-center justify-center">
                              <HabitCompletionCheckbox
                                size="sm"
                                checked={checked}
                                onChange={() =>
                                  toggle.mutate({ habitId: habit.id, date: iso })
                                }
                                aria-label={`${habit.name} — ${format(d, 'EEEE d MMMM', { locale: fr })}`}
                              />
                            </div>
                          </TableCell>
                        )
                      })}
                      <TableCell className="min-w-[80px] py-2 text-right">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {progress}%
                        </span>
                      </TableCell>
                      <TableCell className="w-10 py-2 text-right">
                        <HabitRowActions
                          habit={habit}
                          onEdit={setEditingHabit}
                          onDelete={setDeletingHabit}
                        />
                      </TableCell>
                    </TableRow>
                  )
                }}
              </SortableHabitRows>

              {/* Footer: Progression */}
              <TableRow>
                <TableCell className="sticky left-0 z-10 bg-background min-w-[200px] py-2 text-xs font-medium text-muted-foreground">
                  Progression
                </TableCell>
                {dayStats.map((s) => {
                  const today = isToday(new Date(s.iso))
                  return (
                    <TableCell
                      key={`progress-${s.iso}`}
                      className={cn(
                        'text-center px-1 py-2',
                        today && 'bg-muted/30',
                      )}
                    >
                      <span className="text-[10px] tabular-nums text-[hsl(var(--color-habit-done))] font-semibold">
                        {s.percent}%
                      </span>
                    </TableCell>
                  )
                })}
                <TableCell className="py-2" />
                <TableCell className="py-2" />
              </TableRow>

              {/* Footer: Fait */}
              <TableRow>
                <TableCell className="sticky left-0 z-10 bg-background min-w-[200px] py-2 text-xs font-medium text-muted-foreground">
                  Fait
                </TableCell>
                {dayStats.map((s) => {
                  const today = isToday(new Date(s.iso))
                  return (
                    <TableCell
                      key={`done-${s.iso}`}
                      className={cn(
                        'text-center px-1 py-2',
                        today && 'bg-muted/30',
                      )}
                    >
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {s.done}
                      </span>
                    </TableCell>
                  )
                })}
                <TableCell className="py-2" />
                <TableCell className="py-2" />
              </TableRow>

              {/* Footer: Non fait */}
              <TableRow>
                <TableCell className="sticky left-0 z-10 bg-background min-w-[200px] py-2 text-xs font-medium text-muted-foreground">
                  Non fait
                </TableCell>
                {dayStats.map((s) => {
                  const today = isToday(new Date(s.iso))
                  return (
                    <TableCell
                      key={`missed-${s.iso}`}
                      className={cn(
                        'text-center px-1 py-2',
                        today && 'bg-muted/30',
                      )}
                    >
                      <span className="text-[10px] tabular-nums text-muted-foreground">
                        {s.missed}
                      </span>
                    </TableCell>
                  )
                })}
                <TableCell className="py-2" />
                <TableCell className="py-2" />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {editingHabit && (
        <HabitFormModal
          mode="edit"
          habit={editingHabit}
          open={editingHabit !== null}
          onOpenChange={(o) => !o && setEditingHabit(null)}
        />
      )}

      <HabitDeleteDialog
        habit={deletingHabit}
        onOpenChange={(o) => !o && setDeletingHabit(null)}
      />
    </Card>
  )
}
