import { useEffect, useRef, useState } from 'react'

export type AutosaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error'

/**
 * Debounced autosave (800–1500ms). Never writes on every keystroke — a
 * change resets the timer, and only the LATEST value after the quiet
 * period is persisted.
 */
export function useAutosave<T>(value: T, onSave: (value: T) => Promise<void>, delayMs = 1000) {
  const [status, setStatus] = useState<AutosaveStatus>('idle')
  const savedValueRef = useRef(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (value === savedValueRef.current) return
    setStatus('unsaved')

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      const requestId = ++requestIdRef.current
      setStatus('saving')
      onSave(value)
        .then(() => {
          if (requestIdRef.current !== requestId) return // a newer save superseded this one
          savedValueRef.current = value
          setStatus('saved')
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return
          setStatus('error')
        })
    }, delayMs)

    return () => clearTimeout(timeoutRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onSave is expected to be stable per caller
  }, [value, delayMs])

  return status
}
