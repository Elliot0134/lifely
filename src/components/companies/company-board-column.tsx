'use client'

import { useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import { Plus, Edit, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompanyModal } from '@/components/companies/company-modal'
import { CompanyGroupModal } from '@/components/companies/company-group-modal'
import { CompanyBoardCard } from '@/components/companies/company-board-card'
import type { Company, CompanyGroup } from '@/types/tasks'
import type { CompanyGroupBy } from '@/hooks/use-companies-view'
import type { CompanySubGroup } from '@/components/companies/company-board'

// Draggable wrapper for company cards
function DraggableCompanyCard({
  company,
  onSelect,
  onDelete,
  hideGroup,
}: {
  company: Company
  onSelect: (company: Company) => void
  onDelete: (company: Company) => void
  hideGroup?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: company.id })

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(isDragging && 'opacity-40')}
    >
      <CompanyBoardCard
        company={company}
        onSelect={onSelect}
        onDelete={onDelete}
        hideGroup={hideGroup}
      />
    </div>
  )
}

// Column props
interface CompanyBoardColumnProps {
  columnKey: string
  label: string
  color: string
  icon: string | null
  companies: Company[]
  subGroups?: Map<string, CompanySubGroup>
  group?: CompanyGroup
  groupBy: CompanyGroupBy
  onSelectCompany: (company: Company) => void
  onDeleteCompany: (company: Company) => void
  onDeleteGroup: (group: CompanyGroup) => void
}

export function CompanyBoardColumn({
  columnKey,
  label,
  color,
  icon,
  companies,
  subGroups,
  group,
  groupBy,
  onSelectCompany,
  onDeleteCompany,
  onDeleteGroup,
}: CompanyBoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${columnKey}`,
  })

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border bg-muted/30 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b group/header">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {icon && <span className="text-sm">{icon}</span>}
        <span className="flex-1 truncate text-sm font-medium">{label}</span>
        <Badge variant="secondary" className="text-xs tabular-nums">
          {companies.length}
        </Badge>

        {/* Group actions */}
        {group && (
          <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
            <CompanyGroupModal
              group={group}
              trigger={
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={() => onDeleteGroup(group)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 overflow-y-auto p-2 min-h-[60px]',
          'max-h-[calc(100vh-250px)]'
        )}
      >
        {companies.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {isOver ? 'Déposer ici' : 'Aucune entreprise'}
          </p>
        ) : subGroups && subGroups.size > 0 ? (
          Array.from(subGroups.entries()).map(([subKey, subGroup]) => {
            if (subGroup.companies.length === 0) return null
            return (
              <div key={subKey}>
                <div className="flex items-center gap-1.5 px-1 py-1">
                  <span
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subGroup.color }}
                  />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {subGroup.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">
                    {subGroup.companies.length}
                  </span>
                </div>
                {subGroup.companies.map((company) => (
                  <div key={company.id} className="mb-2">
                    <DraggableCompanyCard
                      company={company}
                      onSelect={onSelectCompany}
                      onDelete={onDeleteCompany}
                      hideGroup={groupBy === 'group'}
                    />
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          companies.map((company) => (
            <DraggableCompanyCard
              key={company.id}
              company={company}
              onSelect={onSelectCompany}
              onDelete={onDeleteCompany}
              hideGroup={groupBy === 'group'}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <div className="border-t p-2">
        <CompanyModal
          defaultGroupId={groupBy === 'group' && group ? group.id : undefined}
          trigger={
            <button
              type="button"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-3 py-1.5',
                'text-sm text-muted-foreground cursor-pointer',
                'transition-colors hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Plus className="size-4" />
              Nouvelle entreprise
            </button>
          }
        />
      </div>
    </div>
  )
}
