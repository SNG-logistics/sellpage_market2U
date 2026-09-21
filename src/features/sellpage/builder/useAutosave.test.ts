import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutosave } from './useAutosave'

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not save on every change — only after the quiet period', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(({ value }) => useAutosave(value, onSave, 1000), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'ab' })
    await act(async () => vi.advanceTimersByTime(400))
    rerender({ value: 'abc' })
    await act(async () => vi.advanceTimersByTime(400))
    expect(onSave).not.toHaveBeenCalled()

    await act(async () => vi.advanceTimersByTime(1000))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith('abc')
  })

  it('reports saving then saved', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(({ value }) => useAutosave(value, onSave, 1000), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    expect(result.current).toBe('unsaved')

    await act(async () => vi.advanceTimersByTime(1000))
    expect(result.current).toBe('saved')
  })

  it('reports error when the save rejects', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    const { result, rerender } = renderHook(({ value }) => useAutosave(value, onSave, 1000), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'b' })
    await act(async () => vi.advanceTimersByTime(1000))
    expect(result.current).toBe('error')
  })
})
