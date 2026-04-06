'use client'

import { Edit, Trash2 } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { COMPANY_STATUSES, OWNERSHIP_TYPES } from '@/lib/constants'
import { CompanyModal } from '@/components/companies/company-modal'
import type { Company } from '@/types/tasks'

const STATUS_BADGE_CLASSES: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  active: 'bg-green-500/15 text-green-600',
  completed: 'bg-blue-500/15 text-blue-600',
}

interface CompanyCardProps {
  company: Company
  onDelete: (company: Company) => void
  variant?: 'grid' | 'list'
}

export function CompanyCard({ company, onDelete, variant = 'grid' }: CompanyCardProps) {
  const statusBadgeClass =
    STATUS_BADGE_CLASSES[company.status] ?? STATUS_BADGE_CLASSES.not_started
  const statusLabel =
    COMPANY_STATUSES.find((s) => s.value === company.status)?.label ?? company.status
  const statusColor =
    COMPANY_STATUSES.find((s) => s.value === company.status)?.color ?? 'hsl(0 0% 63%)'
  const ownershipInfo =
    OWNERSHIP_TYPES.find((t) => t.value === company.ownership_type) ?? OWNERSHIP_TYPES[0]

  if (variant === 'list') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 group hover:bg-muted/50 transition-colors">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
          style={{
            backgroundColor: (company.color || '#64748b') + '20',
            color: company.color || '#64748b',
          }}
        >
          {company.icon || company.name.charAt(0).toUpperCase()}
        </div>

        {/* Name */}
        <p className="font-medium truncate flex-1 min-w-0">{company.name}</p>

        {/* Ownership badge */}
        <Badge variant="outline" className="text-[10px] px-2 py-0 shrink-0 gap-1" style={{ borderColor: ownershipInfo.color, color: ownershipInfo.color }}>
          <span className="size-1.5 rounded-full" style={{ backgroundColor: ownershipInfo.color }} />
          {ownershipInfo.label}
        </Badge>

        {/* Status badge */}
        <Badge
          variant="secondary"
          className={`text-[10px] px-2 py-0 font-medium shrink-0 ${statusBadgeClass}`}
        >
          <div
            className="h-1.5 w-1.5 rounded-full mr-1"
            style={{ backgroundColor: statusColor }}
          />
          {statusLabel}
        </Badge>

        {/* Project count */}
        <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
          {company.project_count ?? 0} projet{(company.project_count ?? 0) !== 1 ? 's' : ''}
        </span>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <CompanyModal
            company={company}
            trigger={
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Edit className="h-3.5 w-3.5" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
            onClick={() => onDelete(company)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-card group relative overflow-hidden">
      {/* Color indicator bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: company.color || '#64748b' }}
      />

      <CardContent className="p-5 pt-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              backgroundColor: (company.color || '#64748b') + '20',
              color: company.color || '#64748b',
            }}
          >
            {company.icon || company.name.charAt(0).toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{company.name}</p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge
                variant="secondary"
                className={`text-[10px] px-2 py-0 font-medium ${statusBadgeClass}`}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full mr-1"
                  style={{ backgroundColor: statusColor }}
                />
                {statusLabel}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-2 py-0 gap-1" style={{ borderColor: ownershipInfo.color, color: ownershipInfo.color }}>
                <span className="size-1.5 rounded-full" style={{ backgroundColor: ownershipInfo.color }} />
                {ownershipInfo.label}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              {company.project_count ?? 0} projet{(company.project_count ?? 0) !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <CompanyModal
              company={company}
              trigger={
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(company)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
