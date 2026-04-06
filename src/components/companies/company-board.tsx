'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'

import { Skeleton } from '@/components/ui/skeleton'
import { CompanyBoardColumn } from '@/components/companies/company-board-column'
import { CompanyBoardCard } from '@/components/companies/company-board-card'
import type { Company, CompanyGroup } from '@/types/tasks'
import type { CompanyGroupBy } from '@/hooks/use-companies-view'

export interface CompanySubGroup {
  label: string
  color: string
  companies: Company[]
}

export interface CompanyColumn {
  key: string
  label: string
  color: string
  icon: string | null
  companies: Company[]
  group?: CompanyGroup
  subGroups?: Map<string, CompanySubGroup>
}

interface CompanyBoardProps {
  columns: CompanyColumn[]
  groupBy: CompanyGroupBy
  onSelectCompany: (company: Company) => void
  onDeleteCompany: (company: Company) => void
  onDeleteGroup: (group: CompanyGroup) => void
  onMoveCompany: (companyId: string, targetColumnKey: string) => void
}

export function CompanyBoard({
  columns,
  groupBy,
  onSelectCompany,
  onDeleteCompany,
  onDeleteGroup,
  onMoveCompany,
}: CompanyBoardProps) {
  const [activeCompany, setActiveCompany] = useState<Company | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const findCompany = useCallback(
    (id: string): Company | undefined => {
      for (const col of columns) {
        const found = col.companies.find((c) => c.id === id)
        if (found) return found
      }
      return undefined
    },
    [columns]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const company = findCompany(event.active.id as string)
      if (company) setActiveCompany(company)
    },
    [findCompany]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveCompany(null)

      const { active, over } = event
      if (!over || active.id === over.id) return

      const companyId = active.id as string

      let targetColumnKey: string | null = null

      // Dropped on a column
      for (const col of columns) {
        if (over.id === `column-${col.key}`) {
          targetColumnKey = col.key
          break
        }
      }

      // Dropped on a company card — find its column
      if (!targetColumnKey) {
        for (const col of columns) {
          if (col.companies.some((c) => c.id === over.id)) {
            targetColumnKey = col.key
            break
          }
        }
      }

      if (!targetColumnKey) return

      // Check not already in this column
      const currentCol = columns.find((col) =>
        col.companies.some((c) => c.id === companyId)
      )
      if (currentCol && currentCol.key === targetColumnKey) return

      onMoveCompany(companyId, targetColumnKey)
    },
    [columns, onMoveCompany]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.key}
            className="w-[280px] shrink-0 md:min-w-[250px] md:max-w-[350px] md:flex-1 md:w-auto"
          >
            <CompanyBoardColumn
              columnKey={col.key}
              label={col.label}
              color={col.color}
              icon={col.icon}
              companies={col.companies}
              subGroups={col.subGroups}
              group={col.group}
              groupBy={groupBy}
              onSelectCompany={onSelectCompany}
              onDeleteCompany={onDeleteCompany}
              onDeleteGroup={onDeleteGroup}
            />
          </div>
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCompany ? (
          <div className="w-[260px] rotate-2 opacity-90">
            <CompanyBoardCard
              company={activeCompany}
              onSelect={() => {}}
              onDelete={() => {}}
              className="shadow-lg ring-2 ring-primary/20"
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// Skeleton
export function CompanyBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 3 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="w-[280px] shrink-0 md:min-w-[250px] md:max-w-[350px] md:flex-1 md:w-auto"
        >
          <div className="flex flex-col rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b">
              <Skeleton className="size-2 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="ml-auto h-5 w-6 rounded-full" />
            </div>
            <div className="flex flex-col gap-2 p-2">
              {Array.from({ length: 3 - colIdx }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-lg border bg-card p-3 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-20 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-2">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
