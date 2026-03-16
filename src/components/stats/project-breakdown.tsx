'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { TaskStats } from '@/types/tasks'

const FALLBACK_COLORS = [
  '#f26a4b',
  '#8e8a83',
  '#c45c5c',
  '#a89f8f',
  '#5c5a56',
  '#d4a76a',
  '#7a6b5d',
  '#8b9a6b',
]

interface ProjectBreakdownProps {
  byProject: TaskStats['by_project'] | undefined
  isLoading: boolean
}

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

interface ProjectDataEntry {
  name: string
  value: number
  color: string
}

function CustomTooltip({ active, payload }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: ProjectDataEntry }>
}) {
  if (!active || !payload?.length) return null

  const entry = payload[0]
  return (
    <div className="bg-background border rounded-lg shadow-md p-3 text-sm">
      <p className="flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        <span className="font-medium">{entry.name}</span>
      </p>
      <p className="text-muted-foreground mt-1">
        {entry.value} tache{entry.value > 1 ? 's' : ''}
      </p>
    </div>
  )
}

function CustomLegend({ payload }: {
  payload?: Array<{ value: string; color: string }>
}) {
  if (!payload?.length) return null

  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 text-xs">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function ProjectBreakdown({ byProject, isLoading }: ProjectBreakdownProps) {
  if (isLoading) return <ChartSkeleton />

  const data: ProjectDataEntry[] = (byProject ?? []).map((p, i) => ({
    name: p.project_name,
    value: p.total,
    color: p.project_color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }))

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-base">Repartition par projet</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">
              Aucun projet avec des taches
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
