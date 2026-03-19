'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useTasksView } from '@/hooks/use-tasks-view'
import { useTasks, useUpdateTaskStatus } from '@/lib/queries/tasks'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { TaskBoard, TaskBoardSkeleton } from '@/components/tasks/task-board'
import { TaskTable, TaskTableSkeleton } from '@/components/tasks/task-table'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { TaskModal } from '@/components/tasks/task-modal'
import type { Task, TaskStatus } from '@/types/tasks'

export default function TasksPage() {
  // ─── View state ───────────────────────────────────────
  const {
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    filters,
    setFilters,
    clearFilters,
    showCompleted,
    setShowCompleted,
    groupTasks,
    sortTasks,
  } = useTasksView()

  // ─── Data fetching ────────────────────────────────────
  const queryFilters = {
    ...filters,
    parent_task_id: null as string | null, // top-level tasks only
  }
  const { data: tasks, isLoading, error } = useTasks(queryFilters)

  // ─── Process tasks: filter → sort → group ─────────────
  const filteredTasks = useMemo(() => {
    if (!tasks) return []
    if (showCompleted) return tasks
    return tasks.filter((t) => t.status !== 'completed')
  }, [tasks, showCompleted])

  const sortedTasks = useMemo(
    () => sortTasks(filteredTasks),
    [sortTasks, filteredTasks]
  )

  const groupedTasks = useMemo(
    () => groupTasks(sortedTasks),
    [groupTasks, sortedTasks]
  )

  // ─── UI state ─────────────────────────────────────────
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)

  // ─── Handlers ─────────────────────────────────────────
  const updateStatus = useUpdateTaskStatus()
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatus.mutate({ id: taskId, status })
  }

  const handleEdit = (task: Task) => {
    setSelectedTask(null)
    setEditTask(task)
  }

  // ─── Derived state ────────────────────────────────────
  const hasFilters =
    !!filters.project_id ||
    !!filters.is_urgent ||
    !!filters.is_important ||
    filters.is_code_task !== undefined ||
    !!filters.status ||
    !!filters.search

  const isEmpty = !isLoading && !error && filteredTasks.length === 0

  return (
    <>
      {/* ─── Header ──────────────────────────────────────── */}
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
                <BreadcrumbPage>Taches</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Toolbar */}
        <TaskToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          toggleSortOrder={toggleSortOrder}
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          onCreateTask={() => setCreateModalOpen(true)}
        />

        {/* Loading */}
        {isLoading &&
          (viewMode === 'kanban' ? (
            <TaskBoardSkeleton />
          ) : (
            <TaskTableSkeleton />
          ))}

        {/* Error */}
        {error && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center text-muted-foreground">
                <p>Erreur lors du chargement des taches</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="size-4" />
                  Reessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {isEmpty && !hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <ClipboardList className="size-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Aucune tache</p>
                  <p className="text-sm text-muted-foreground">
                    Creez votre premiere tache pour commencer
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setCreateModalOpen(true)}
                >
                  Nouvelle tache
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isEmpty && hasFilters && (
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune tache ne correspond aux filtres
                </p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active view */}
        {!isLoading && !error && filteredTasks.length > 0 && (
          viewMode === 'kanban' ? (
            <TaskBoard
              groupedTasks={groupedTasks}
              groupBy={groupBy}
              onSelectTask={setSelectedTask}
              onStatusChange={handleStatusChange}
              showCompleted={showCompleted}
            />
          ) : (
            <TaskTable
              groupedTasks={groupedTasks}
              groupBy={groupBy}
              onSelectTask={setSelectedTask}
              onStatusChange={handleStatusChange}
              showCompleted={showCompleted}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortChange={setSortBy}
            />
          )
        )}
      </div>

      {/* ─── Detail panel (Sheet) ────────────────────────── */}
      <TaskDetailPanel
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
        onEdit={handleEdit}
      />

      {/* ─── Create modal ────────────────────────────────── */}
      <TaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* ─── Edit modal ──────────────────────────────────── */}
      <TaskModal
        open={!!editTask}
        onOpenChange={(open) => {
          if (!open) setEditTask(null)
        }}
        task={editTask}
      />
    </>
  )
}
