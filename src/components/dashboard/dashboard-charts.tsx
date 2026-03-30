'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function ChartSkeleton() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

const RevenueExpenseChart = dynamic(
  () =>
    import('./revenue-expense-chart').then((mod) => ({
      default: mod.RevenueExpenseChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

const CategoryBreakdownChart = dynamic(
  () =>
    import('./category-breakdown-chart').then((mod) => ({
      default: mod.CategoryBreakdownChart,
    })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
)

export function DashboardCharts() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RevenueExpenseChart />
      <CategoryBreakdownChart />
    </div>
  )
}
