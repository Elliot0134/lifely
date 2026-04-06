'use client'

import { Edit, Trash2, FolderOpen } from 'lucide-react'

import { cn } from '@/lib/utils'
import { COMPANY_STATUSES, OWNERSHIP_TYPES } from '@/lib/constants'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CompanyModal } from '@/components/companies/company-modal'
import type { Company } from '@/types/tasks'

interface CompanyBoardCardProps {
  company: Company
  onSelect: (company: Company) => void
  onDelete: (company: Company) => void
  hideGroup?: boolean
  className?: string
}

export function CompanyBoardCard({
  company,
  onSelect,
  onDelete,
  hideGroup = false,
  className,
}: CompanyBoardCardProps) {
  const ownershipInfo =
    OWNERSHIP_TYPES.find((t) => t.value === company.ownership_type) ?? OWNERSHIP_TYPES[0]
  const statusInfo =
    COMPANY_STATUSES.find((s) => s.value === company.status)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(company)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(company)
        }
      }}
      className={cn(
        'rounded-lg border bg-card p-3 transition-shadow cursor-pointer group/card',
        'hover:shadow-sm',
        className
      )}
    >
      {/* Row 1: Icon + Name + Actions */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            backgroundColor: (company.color || '#64748b') + '20',
            color: company.color || '#64748b',
          }}
        >
          {company.icon || company.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <span className="block truncate text-sm font-medium leading-tight">
            {company.name}
          </span>
        </div>

        {/* Actions on hover */}
        <div
          className="flex gap-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <CompanyModal
            company={company}
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
            onClick={() => onDelete(company)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Row 2: Metadata */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {/* Ownership badge */}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 gap-1" style={{ borderColor: ownershipInfo.color, color: ownershipInfo.color }}>
          <span className="size-1.5 rounded-full" style={{ backgroundColor: ownershipInfo.color }} />
          {ownershipInfo.label}
        </Badge>

        {/* Status dot + label */}
        {statusInfo && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: statusInfo.color }}
            />
            {statusInfo.label}
          </span>
        )}

        {/* Group name (when not grouped by group) */}
        {!hideGroup && company.group && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <FolderOpen className="size-3" />
            {company.group.name}
          </span>
        )}

        {/* Project count */}
        {(company.project_count ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            {company.project_count} projet{(company.project_count ?? 0) !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
