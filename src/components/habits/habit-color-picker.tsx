'use client'

import { cn } from '@/lib/utils'

interface HabitColorPickerProps {
  value: string | undefined
  onChange: (color: string) => void
  className?: string
}

interface ColorPreset {
  value: string
  name: string
}

// ─── Preset palette ─────────────────────────────────────────
// Hex matching LIFELY business token style (cf. globals.css / utils.ts).

const COLOR_PRESETS: ColorPreset[] = [
  { value: '#8b9a6b', name: 'Vert' },
  { value: '#6b8ba4', name: 'Bleu' },
  { value: '#d97757', name: 'Orange' },
  { value: '#c45a4f', name: 'Rouge' },
  { value: '#9a7bb5', name: 'Violet' },
  { value: '#5fa8a8', name: 'Cyan' },
]

// ─── Component ──────────────────────────────────────────────

export function HabitColorPicker({
  value,
  onChange,
  className,
}: HabitColorPickerProps) {
  return (
    <div className={cn('flex flex-row items-center gap-2', className)}>
      {COLOR_PRESETS.map((color) => {
        const isSelected = value === color.value
        return (
          <button
            key={color.value}
            type="button"
            aria-label={color.name}
            aria-pressed={isSelected}
            onClick={() => onChange(color.value)}
            style={{ backgroundColor: color.value }}
            className={cn(
              'h-8 w-8 rounded-full transition focus:outline-none focus:ring-2 focus:ring-ring',
              isSelected && 'ring-2 ring-offset-2 ring-foreground',
            )}
          />
        )
      })}
    </div>
  )
}
