'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { createPortal } from 'react-dom'
import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import type { Editor, Range } from '@tiptap/core'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  FileCode,
  Type,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Command items ──────────────────────────────────

interface SlashCommandItem {
  title: string
  description: string
  icon: LucideIcon
  command: (props: { editor: Editor; range: Range }) => void
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Texte',
    description: 'Paragraphe de texte',
    icon: Type,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run()
    },
  },
  {
    title: 'Titre 1',
    description: 'Grand titre de section',
    icon: Heading1,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run()
    },
  },
  {
    title: 'Titre 2',
    description: 'Titre moyen',
    icon: Heading2,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run()
    },
  },
  {
    title: 'Titre 3',
    description: 'Petit titre',
    icon: Heading3,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run()
    },
  },
  {
    title: 'Liste à puces',
    description: 'Liste non ordonnée',
    icon: List,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Liste numérotée',
    description: 'Liste ordonnée',
    icon: ListOrdered,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Liste de tâches',
    description: 'Checklist avec cases à cocher',
    icon: ListTodo,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Citation',
    description: 'Bloc de citation',
    icon: Quote,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code',
    description: 'Bloc de code avec coloration',
    icon: FileCode,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Séparateur',
    description: 'Ligne horizontale',
    icon: Minus,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
]

// ─── Command List component ─────────────────────────

interface CommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  clientRect: (() => DOMRect | null) | null
}

interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, clientRect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState<{ top: number; left: number } | null>(null)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    // Position the dropdown
    useEffect(() => {
      if (!clientRect) return
      const rect = clientRect()
      if (!rect) return
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }, [clientRect])

    // Scroll selected item into view
    useLayoutEffect(() => {
      const container = containerRef.current
      if (!container) return
      const selected = container.children[selectedIndex] as HTMLElement
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' })
      }
    }, [selectedIndex])

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) {
          command(item)
        }
      },
      [items, command]
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          event.preventDefault()
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          event.preventDefault()
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (!position) return null

    const content = (
      <div
        ref={containerRef}
        className="fixed z-[9999] w-64 overflow-y-auto overscroll-contain rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95"
        style={{
          top: position.top,
          left: position.left,
          maxHeight: 'min(300px, 40vh)',
        }}
      >
        {items.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted-foreground">Aucun résultat</p>
        ) : (
          items.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                type="button"
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                  index === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
                onClick={() => selectItem(index)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </button>
            )
          })
        )}
      </div>
    )

    return createPortal(content, document.body)
  }
)
CommandList.displayName = 'CommandList'

// ─── Slash Command Extension ────────────────────────

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: Range
          props: SlashCommandItem
        }) => {
          props.command({ editor, range })
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return SLASH_COMMANDS.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        render: () => {
          let component: ReactRenderer<CommandListRef> | null = null

          return {
            onStart: (props: Record<string, unknown>) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor as Editor,
              })
            },

            onUpdate: (props: Record<string, unknown>) => {
              component?.updateProps(props)
            },

            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === 'Escape') {
                component?.destroy()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },

            onExit: () => {
              component?.destroy()
            },
          }
        },
      }),
    ]
  },
})
