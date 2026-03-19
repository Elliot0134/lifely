import { useCallback, useRef, useState, useEffect } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onClick: () => void
  duration?: number
  disabled?: boolean
}

interface UseLongPressReturn {
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void
    onMouseUp: () => void
    onMouseLeave: () => void
    onTouchStart: (e: React.TouchEvent) => void
    onTouchEnd: () => void
    onKeyDown: (e: React.KeyboardEvent) => void
    onKeyUp: (e: React.KeyboardEvent) => void
  }
  isPressed: boolean
  progress: number // 0 to 1
}

export function useLongPress({
  onLongPress,
  onClick,
  duration = 1000,
  disabled = false,
}: UseLongPressOptions): UseLongPressReturn {
  const [isPressed, setIsPressed] = useState(false)
  const [progress, setProgress] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)
  const startTimeRef = useRef<number>(0)
  const isLongPressRef = useRef(false)
  const isPressedRef = useRef(false)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    isPressedRef.current = false
    setIsPressed(false)
    setProgress(0)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return cleanup
  }, [cleanup])

  const animateProgress = useCallback(() => {
    if (!isPressedRef.current) return

    const elapsed = Date.now() - startTimeRef.current
    const currentProgress = Math.min(elapsed / duration, 1)
    setProgress(currentProgress)

    if (currentProgress < 1) {
      animationRef.current = requestAnimationFrame(animateProgress)
    }
  }, [duration])

  const startPress = useCallback(() => {
    if (disabled) return

    isLongPressRef.current = false
    isPressedRef.current = true
    startTimeRef.current = Date.now()
    setIsPressed(true)
    setProgress(0)

    // Start progress animation
    animationRef.current = requestAnimationFrame(animateProgress)

    // Set long press timer
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      isPressedRef.current = false
      setIsPressed(false)
      setProgress(0)
      onLongPress()
    }, duration)
  }, [disabled, duration, onLongPress, animateProgress])

  const endPress = useCallback(() => {
    if (disabled) return

    const wasLongPress = isLongPressRef.current
    cleanup()

    // Only fire click if it wasn't a long press
    if (!wasLongPress) {
      onClick()
    }
  }, [disabled, cleanup, onClick])

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      // Ignore right clicks
      if (e.button !== 0) return
      e.preventDefault()
      startPress()
    },
    onMouseUp: () => endPress(),
    onMouseLeave: () => cleanup(),
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault()
      startPress()
    },
    onTouchEnd: () => endPress(),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (disabled) return
      // Enter = click, Space held = long press
      if (e.key === 'Enter') {
        e.preventDefault()
        onClick()
      } else if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        startPress()
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault()
        endPress()
      }
    },
  }

  return { handlers, isPressed, progress }
}
