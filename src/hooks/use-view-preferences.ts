'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────

export interface ViewPreferences {
  viewMode?: string
  groupBy?: string
  subGroupBy?: string
  sortBy?: string
  sortOrder?: string
  showCompleted?: boolean
  [key: string]: unknown
}

interface UseViewPreferencesOptions {
  pageKey: string // 'tasks' | 'projects' | 'companies' etc.
  defaults: ViewPreferences
}

const LS_PREFIX = 'lifely-view-prefs-'

// ─── Hook ────────────────────────────────────────────

export function useViewPreferences({ pageKey, defaults }: UseViewPreferencesOptions) {
  const [preferences, setPreferencesState] = useState<ViewPreferences>(() => {
    // Try localStorage first for instant loading
    if (typeof window === 'undefined') return defaults
    try {
      const stored = localStorage.getItem(`${LS_PREFIX}${pageKey}`)
      if (stored) {
        const parsed = JSON.parse(stored) as ViewPreferences
        return { ...defaults, ...parsed }
      }
    } catch { /* ignore */ }
    return defaults
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from DB on mount
  useEffect(() => {
    let cancelled = false

    async function loadFromDB() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || cancelled) return

        const { data } = await supabase
          .from('user_view_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .eq('page_key', pageKey)
          .single()

        if (data?.preferences && !cancelled) {
          const merged = { ...defaults, ...(data.preferences as ViewPreferences) }
          setPreferencesState(merged)
          // Sync to localStorage
          try {
            localStorage.setItem(`${LS_PREFIX}${pageKey}`, JSON.stringify(merged))
          } catch { /* ignore */ }
        }
      } catch {
        // No saved preferences yet, use defaults/localStorage
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    loadFromDB()
    return () => { cancelled = true }
  }, [pageKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Save to DB (debounced)
  const saveToDB = useCallback(
    (prefs: ViewPreferences) => {
      // Save to localStorage immediately
      try {
        localStorage.setItem(`${LS_PREFIX}${pageKey}`, JSON.stringify(prefs))
      } catch { /* ignore */ }

      // Debounce DB save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          await supabase
            .from('user_view_preferences')
            .upsert(
              {
                user_id: user.id,
                page_key: pageKey,
                preferences: prefs,
              },
              { onConflict: 'user_id,page_key' }
            )
        } catch {
          // Silent fail — localStorage still has the data
        }
      }, 1000) // 1s debounce
    },
    [pageKey]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const updatePreferences = useCallback(
    (updates: Partial<ViewPreferences>) => {
      setPreferencesState((prev) => {
        const next = { ...prev, ...updates }
        saveToDB(next)
        return next
      })
    },
    [saveToDB]
  )

  return {
    preferences,
    updatePreferences,
    isLoaded,
  }
}
