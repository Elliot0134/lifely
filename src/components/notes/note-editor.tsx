'use client'

import '@/styles/tiptap-editor.css'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Link as LinkIcon,
  Highlighter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
import { SlashCommand } from '@/components/notes/slash-command'
import { useCallback, useEffect } from 'react'

const lowlight = createLowlight(common)

interface NoteEditorProps {
  content?: Record<string, unknown> | null
  onChange?: (content: Record<string, unknown>) => void
  editable?: boolean
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function NoteEditor({
  content,
  onChange,
  editable = true,
  placeholder = "Tapez '/' pour les commandes...",
  className,
  autoFocus = false,
}: NoteEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Typography,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      SlashCommand,
    ],
    content: content && Object.keys(content).length > 0 ? content : undefined,
    editable,
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  })

  useEffect(() => {
    if (editor && content && JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
      editor.commands.setContent(content)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn('rounded-lg border bg-background', className)}>
      {/* Bubble menu - appears on text selection (Notion-like) */}
      {editable && (
        <BubbleMenu
          editor={editor}
          className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 shadow-md"
        >
          <Toggle
            size="sm"
            pressed={editor.isActive('bold')}
            onPressedChange={() => editor.chain().focus().toggleBold().run()}
            aria-label="Gras"
          >
            <Bold className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('italic')}
            onPressedChange={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italique"
          >
            <Italic className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('underline')}
            onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Souligné"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('strike')}
            onPressedChange={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Barré"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Toggle>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <Toggle
            size="sm"
            pressed={editor.isActive('code')}
            onPressedChange={() => editor.chain().focus().toggleCode().run()}
            aria-label="Code"
          >
            <Code className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
            aria-label="Surligné"
          >
            <Highlighter className="h-3.5 w-3.5" />
          </Toggle>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 1 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            aria-label="Titre 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Toggle>
          <Toggle
            size="sm"
            pressed={editor.isActive('heading', { level: 2 })}
            onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            aria-label="Titre 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Toggle>

          <Separator orientation="vertical" className="mx-0.5 h-5" />

          <Toggle
            size="sm"
            pressed={editor.isActive('link')}
            onPressedChange={setLink}
            aria-label="Lien"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Toggle>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
