'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLongPress } from '@/hooks/use-long-press'
import type { TaskStatus } from '@/types/tasks'

interface TaskStatusCheckboxProps {
  status: TaskStatus
  onChange: (newStatus: TaskStatus) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeConfig = {
  sm: { box: 'h-4 w-4', icon: 'h-2.5 w-2.5', dot: 'h-1.5 w-1.5', ring: 16 },
  md: { box: 'h-5 w-5', icon: 'h-3 w-3', dot: 'h-2 w-2', ring: 20 },
  lg: { box: 'h-6 w-6', icon: 'h-3.5 w-3.5', dot: 'h-2.5 w-2.5', ring: 24 },
} as const

const statusLabels: Record<TaskStatus, string> = {
  todo: 'A faire. Cliquer pour terminer, maintenir pour en cours',
  in_progress: 'En cours. Cliquer pour terminer, maintenir pour a faire',
  completed: 'Terminee. Cliquer pour remettre a faire',
}

export function TaskStatusCheckbox({
  status,
  onChange,
  disabled = false,
  size = 'md',
}: TaskStatusCheckboxProps) {
  const config = sizeConfig[size]

  const handleClick = () => {
    if (status === 'completed') {
      onChange('todo')
    } else {
      onChange('completed')
    }
  }

  const handleLongPress = () => {
    if (status === 'in_progress') {
      onChange('todo')
    } else {
      onChange('in_progress')
    }
  }

  const { handlers, isPressed, progress } = useLongPress({
    onLongPress: handleLongPress,
    onClick: handleClick,
    duration: 1000,
    disabled,
  })

  // SVG ring for progress indicator
  const ringSize = config.ring
  const strokeWidth = 2
  const radius = (ringSize - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={status === 'completed'}
      aria-label={statusLabels[status]}
      disabled={disabled}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full',
        'transition-transform duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        config.box,
        // Scale on press
        isPressed && 'scale-90',
        // Click scale animation
        !isPressed && 'active:scale-95',
      )}
      {...handlers}
    >
      {/* Progress ring (visible during long press) */}
      {isPressed && progress > 0 && (
        <svg
          className="absolute inset-0"
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            strokeLinecap="round"
            className="text-blue-500 -rotate-90 origin-center"
            style={{ transition: 'stroke-dashoffset 50ms linear' }}
          />
        </svg>
      )}

      {/* Todo state: empty circle */}
      {status === 'todo' && (
        <span
          className={cn(
            'rounded-full border-2 transition-colors duration-200',
            config.box,
            isPressed
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-muted-foreground/40 hover:border-muted-foreground/60',
          )}
        />
      )}

      {/* In progress state: circle with inner dot */}
      {status === 'in_progress' && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full border-2 transition-colors duration-200',
            config.box,
            'border-blue-500 bg-blue-500/10',
          )}
        >
          <span
            className={cn(
              'rounded-full bg-blue-500 transition-transform duration-200',
              config.dot,
            )}
          />
        </span>
      )}

      {/* Completed state: filled circle with check */}
      {status === 'completed' && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full transition-colors duration-200',
            config.box,
            'bg-green-500 text-white',
          )}
        >
          <Check className={config.icon} strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
