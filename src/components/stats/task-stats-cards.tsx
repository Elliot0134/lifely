'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  CheckCircle2,
  History,
  Flame,
  Trophy,
} from 'lucide-react'
import type { TaskStats } from '@/types/tasks'

function StatsSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TrendBadge({ value }: { value: number }) {
  const isPositive = value > 0
  const isZero = value === 0
  const sign = isPositive ? '+' : ''
  const colorClass = isZero
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-[#8b9a6b]'
      : 'text-[#c45c5c]'

  return (
    <span className={`text-xs ${colorClass}`}>
      {sign}{value.toFixed(0)}% vs semaine derniere
    </span>
  )
}

interface TaskStatsCardsProps {
  stats: TaskStats | undefined
  isLoading: boolean
}

export function TaskStatsCards({ stats, isLoading }: TaskStatsCardsProps) {
  if (isLoading) return <StatsSkeleton />
  if (!stats) return null

  const cards = [
    {
      title: 'Completees cette semaine',
      value: stats.completed_this_week,
      subtitle: <TrendBadge value={stats.weekly_trend} />,
      icon: CheckCircle2,
      iconColor: 'text-[#8b9a6b]',
      valueColor: 'text-foreground',
    },
    {
      title: 'Semaine derniere',
      value: stats.completed_last_week,
      subtitle: (
        <span className="text-xs text-muted-foreground">
          taches completees
        </span>
      ),
      icon: History,
      iconColor: 'text-muted-foreground',
      valueColor: 'text-foreground',
    },
    {
      title: 'Streak actuel',
      value: stats.current_streak,
      subtitle: (
        <span className="text-xs text-muted-foreground">
          jours consecutifs
        </span>
      ),
      icon: Flame,
      iconColor: 'text-orange-500',
      valueColor: 'text-foreground',
    },
    {
      title: 'Meilleur streak',
      value: stats.longest_streak,
      subtitle: (
        <span className="text-xs text-muted-foreground">
          record personnel
        </span>
      ),
      icon: Trophy,
      iconColor: 'text-yellow-500',
      valueColor: 'text-foreground',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.title} className="bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <Icon className={`h-5 w-5 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.valueColor}`}>
                {card.value}
              </div>
              {card.subtitle}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
