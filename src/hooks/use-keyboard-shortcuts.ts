"use client"

import { useEffect } from "react"

export interface ShortcutBinding {
  /** Key to match (e.g. "d", "?", "Escape", "ArrowLeft"). Case-insensitive for letters. */
  key: string
  /** Require meta/cmd (mac) or ctrl (win) */
  mod?: boolean
  /** Require shift */
  shift?: boolean
  handler: (e: KeyboardEvent) => void
  /** Disable when focus is in an editable element (default: true) */
  ignoreInEditable?: boolean
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (target.isContentEditable) return true
  return false
}

function matches(e: KeyboardEvent, binding: ShortcutBinding): boolean {
  const keyMatches =
    e.key.toLowerCase() === binding.key.toLowerCase() ||
    e.code.toLowerCase() === binding.key.toLowerCase()
  if (!keyMatches) return false
  const modRequired = binding.mod ?? false
  const modPressed = e.metaKey || e.ctrlKey
  if (modRequired !== modPressed) return false
  const shiftRequired = binding.shift ?? false
  if (shiftRequired !== e.shiftKey) return false
  return true
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[], enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      for (const b of bindings) {
        const ignoreEditable = b.ignoreInEditable ?? true
        if (ignoreEditable && isEditableTarget(e.target)) continue
        if (matches(e, b)) {
          b.handler(e)
          return
        }
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [bindings, enabled])
}
