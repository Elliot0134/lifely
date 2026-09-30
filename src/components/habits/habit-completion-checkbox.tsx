'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

type Size = 'sm' | 'md' | 'lg'

interface HabitCompletionCheckboxProps {
  checked: boolean
  onChange: () => void
  disabled?: boolean
  size?: Size
  className?: string
  'aria-label'?: string
}

const SIZE_MAP: Record<Size, { wrapper: string; icon: number }> = {
  sm: { wrapper: 'h-5 w-5', icon: 12 },
  md: { wrapper: 'h-6 w-6', icon: 14 },
  lg: { wrapper: 'h-8 w-8', icon: 18 },
}

export function HabitCompletionCheckbox({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  className,
  'aria-label': ariaLabel = 'Toggle habitude',
}: HabitCompletionCheckboxProps) {
  const { wrapper, icon } = SIZE_MAP[size]

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-pressed={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'inline-flex items-center justify-center rounded-full border-2 transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-habit-done))] focus-visible:ring-offset-2',
        wrapper,
        checked
          ? 'border-transparent bg-[hsl(var(--color-habit-done))] text-white shadow-sm'
          : 'border-border bg-transparent hover:border-[hsl(var(--color-habit-done))] hover:ring-2 hover:ring-[hsl(var(--color-habit-done))]/30',
        !disabled && 'cursor-pointer hover:scale-110',
        disabled && 'cursor-not-allowed opacity-50 hover:scale-100 hover:border-border hover:ring-0',
        className,
      )}
    >
      {checked && <Check size={icon} strokeWidth={3} aria-hidden="true" />}
    </button>
  )
}
