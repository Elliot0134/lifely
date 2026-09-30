'use client'

import { useState, useCallback, type CSSProperties } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'

import { useReorderHabits } from '@/lib/queries/habits'
import type { Habit } from '@/types/habit'

// ─── Types ──────────────────────────────────────────────

export interface SortableRowRenderProps {
  habit: Habit
  setNodeRef: (node: HTMLElement | null) => void
  style: CSSProperties
  dragHandleProps: {
    listeners: DraggableSyntheticListeners
    attributes: ReturnType<typeof useSortable>['attributes']
  }
  isDragging: boolean
}

interface SortableHabitRowsProps {
  habits: Habit[]
  children: (props: SortableRowRenderProps) => React.ReactNode
}

// ─── Single row hook wrapper ────────────────────────────

function SortableRow({
  habit,
  children,
}: {
  habit: Habit
  children: (props: SortableRowRenderProps) => React.ReactNode
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    listeners,
    attributes,
  } = useSortable({ id: habit.id })

  // Vertical-only constraint: zero out X translation
  const verticalTransform = transform
    ? { ...transform, x: 0, scaleX: 1, scaleY: 1 }
    : null

  const style: CSSProperties = {
    transform: CSS.Transform.toString(verticalTransform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: 'relative',
    zIndex: isDragging ? 20 : undefined,
    boxShadow: isDragging
      ? '0 4px 12px rgba(0, 0, 0, 0.08)'
      : undefined,
  }

  return (
    <>
      {children({
        habit,
        setNodeRef,
        style,
        dragHandleProps: { listeners, attributes },
        isDragging,
      })}
    </>
  )
}

// ─── Wrapper ────────────────────────────────────────────

export function SortableHabitRows({ habits, children }: SortableHabitRowsProps) {
  const reorder = useReorderHabits()
  const [items, setItems] = useState<string[]>(() => habits.map((h) => h.id))

  // Keep local items in sync if the parent list changes (e.g. add/remove habit)
  // We only resync when the set of ids changes, not their order — otherwise
  // we'd fight optimistic updates during drag.
  if (
    items.length !== habits.length ||
    habits.some((h) => !items.includes(h.id))
  ) {
    setItems(habits.map((h) => h.id))
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = items.indexOf(active.id as string)
      const newIndex = items.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      const newItems = arrayMove(items, oldIndex, newIndex)
      setItems(newItems)
      reorder.mutate(newItems)
    },
    [items, reorder],
  )

  const habitsById = new Map(habits.map((h) => [h.id, h]))

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((id) => {
          const habit = habitsById.get(id)
          if (!habit) return null
          return (
            <SortableRow key={id} habit={habit}>
              {children}
            </SortableRow>
          )
        })}
      </SortableContext>
    </DndContext>
  )
}
