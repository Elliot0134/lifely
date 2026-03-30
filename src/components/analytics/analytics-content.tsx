"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { AnalyticsOverview, type PeriodType } from "./analytics-overview"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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

function TrendsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function ChartsSkeleton() {
  return (
    <div className="space-y-4">
      <ChartSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    </div>
  )
}

const AnalyticsTrends = dynamic(
  () =>
    import("./analytics-trends").then((mod) => ({
      default: mod.AnalyticsTrends,
    })),
  {
    loading: () => <TrendsSkeleton />,
    ssr: false,
  }
)

const AnalyticsCharts = dynamic(
  () =>
    import("./analytics-charts").then((mod) => ({
      default: mod.AnalyticsCharts,
    })),
  {
    loading: () => <ChartsSkeleton />,
    ssr: false,
  }
)

export function AnalyticsContent() {
  const [period, setPeriod] = useState<PeriodType>("month")

  return (
    <div className="space-y-6">
      <AnalyticsOverview period={period} onPeriodChange={setPeriod} />
      <AnalyticsCharts period={period} />
      <AnalyticsTrends period={period} />
    </div>
  )
}
