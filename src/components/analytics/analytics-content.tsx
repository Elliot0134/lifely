"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { AnalyticsOverview, type PeriodType } from "./analytics-overview"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function ChartSkeleton() {
  return (
    <Card className="bg-[#f7f8fa] border-0 shadow-none dark:bg-[#363634]">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
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
    </div>
  )
}
