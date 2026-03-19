"use client"

import { useState } from "react"
import { format, addDays, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

import { TaskScheduleView } from "@/components/tasks/task-schedule-view"
import { TaskDetailSheet } from "@/components/tasks/task-detail-sheet"
import type { Task } from "@/types/tasks"

// ─── Helpers ────────────────────────────────────────────

function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

// ─── Page ───────────────────────────────────────────────

export default function TaskSchedulePage() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const dateString = toDateString(currentDate)
  const formattedDate = format(currentDate, "EEEE d MMMM yyyy", { locale: fr })
  const todayLabel = isToday(currentDate)

  const goToPrevious = () => setCurrentDate((d) => subDays(d, 1))
  const goToNext = () => setCurrentDate((d) => addDays(d, 1))
  const goToToday = () => setCurrentDate(new Date())

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/20 backdrop-blur-md rounded-xl p-1.5 md:rounded-b-none md:p-0 md:border-b flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard/tasks">Tâches</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Planning</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 md:p-8">
        {/* Page title + day navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalendarClock className="size-6" />
              Planning
            </h1>
            <p className="text-muted-foreground capitalize">{formattedDate}</p>
          </div>

          {/* Day navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrevious}
              aria-label="Jour précédent"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              variant={todayLabel ? "default" : "outline"}
              size="sm"
              onClick={goToToday}
              className="min-w-[90px]"
            >
              {"Aujourd'hui"}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              aria-label="Jour suivant"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Schedule view */}
        <TaskScheduleView
          date={dateString}
          onTaskSelect={handleTaskSelect}
        />
      </div>

      {/* Detail panel (Sheet) */}
      <TaskDetailSheet
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
