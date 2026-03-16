"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTags } from "@/lib/queries/tags"
import { TagBadge } from "./tag-badge"
import type { Tag } from "@/types/tasks"

interface TagSelectProps {
  value: string[]
  onChange: (ids: string[]) => void
  className?: string
}

export function TagSelect({ value, onChange, className }: TagSelectProps) {
  const [open, setOpen] = React.useState(false)
  const { data: tags = [] } = useTags()

  const selectedTags = tags.filter((t: Tag) => value.includes(t.id))

  function toggleTag(tagId: string) {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId))
    } else {
      onChange([...value, tagId])
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between font-normal",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selectedTags.length > 0 ? (
              selectedTags.map((tag: Tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  size="sm"
                  onRemove={() => toggleTag(tag.id)}
                />
              ))
            ) : (
              <span className="text-muted-foreground">Sélectionner des tags...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un tag..." />
          <CommandList>
            <CommandEmpty>Aucun tag trouvé.</CommandEmpty>
            <CommandGroup>
              {tags.map((tag: Tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.name}
                  onSelect={() => toggleTag(tag.id)}
                >
                  <div
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="flex-1">{tag.name}</span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value.includes(tag.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
