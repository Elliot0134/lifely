'use client'

import { useState, useMemo } from 'react'
import { ClipboardList, RefreshCw } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { useTasksView } from '@/hooks/use-tasks-view'
import { useTasks, useUpdateTask, useUpdateTaskStatus } from '@/lib/queries/tasks'
import { TaskToolbar } from '@/components/tasks/task-toolbar'
import { TaskBoard, TaskBoardSkeleton } from '@/components/tasks/task-board'
import { TaskTable, TaskTableSkeleton } from '@/components/tasks/task-table'
import { TaskDetailSheet } from '@/components/tasks/task-detail-sheet'
import { TaskModal } from '@/components/tasks/task-modal'
import type { Task, TaskStatus } from '@/types/tasks'

export default function TasksPage() {
  // ─── View state ───────────────────────────────────────
  const {
    viewMode,
    setViewMode,
    groupBy,
    setGroupBy,
    subGroupBy,
    setSubGroupBy,
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
    // When grouped by status, always include completed tasks so the column isn't empty
    if (showCompleted || groupBy === 'status') return tasks
    return tasks.filter((t) => t.status !== 'completed')
  }, [tasks, showCompleted, groupBy])

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
  const [createDefaultProjectId, setCreateDefaultProjectId] = useState<string | undefined>()

  // ─── Handlers ─────────────────────────────────────────
  const handleCreateTask = (defaultProjectId?: string) => {
    setCreateDefaultProjectId(defaultProjectId)
    setCreateModalOpen(true)
  }

  const updateStatus = useUpdateTaskStatus()
  const updateTask = useUpdateTask()
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatus.mutate({ id: taskId, status })
  }

  // Drag & drop between columns
  const handleMoveTask = (taskId: string, targetColumnKey: string) => {
    switch (groupBy) {
      case 'status':
        updateStatus.mutate({ id: taskId, status: targetColumnKey as TaskStatus })
        break
      case 'project':
        updateTask.mutate({
          id: taskId,
          project_id: targetColumnKey === 'no_project' ? null : targetColumnKey,
        })
        break
      case 'urgency':
        updateTask.mutate({
          id: taskId,
          is_urgent: targetColumnKey === 'urgent_important' || targetColumnKey === 'urgent',
          is_important: targetColumnKey === 'urgent_important' || targetColumnKey === 'important',
        })
        break
      default:
        break
    }
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
                <BreadcrumbPage>Taches</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      {/* ─── Content ─────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 overflow-hidden">
        {/* Toolbar */}
        <TaskToolbar
          viewMode={viewMode}
          setViewMode={setViewMode}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          subGroupBy={subGroupBy}
          setSubGroupBy={setSubGroupBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          toggleSortOrder={toggleSortOrder}
          filters={filters}
          setFilters={setFilters}
          clearFilters={clearFilters}
          showCompleted={showCompleted}
          setShowCompleted={setShowCompleted}
          onCreateTask={() => handleCreateTask()}
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
                  onClick={() => handleCreateTask()}
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
              onMoveTask={handleMoveTask}
              onCreateTask={handleCreateTask}
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
      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null)
        }}
      />

      {/* ─── Create modal ────────────────────────────────── */}
      <TaskModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        defaultProjectId={createDefaultProjectId}
      />

    </>
  )
}
