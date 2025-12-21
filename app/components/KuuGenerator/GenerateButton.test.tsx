/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let formPending = false

vi.mock('react-dom', () => ({
  useFormStatus: () => ({ pending: formPending }),
}))

import { GenerateButton } from './GenerateButton'

describe('GenerateButton', () => {
  beforeEach(() => {
    formPending = false
  })

  it('UT-040: 非pending時は通常ラベルを表示する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<GenerateButton />)
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('くぅー画像を生成する')
    expect(button.getAttribute('aria-busy')).toBe('false')
    expect(container.textContent).toContain('くぅー画像を生成する')
  })

  it('UT-041: useFormStatusがpendingの場合は生成中表示になる', async () => {
    formPending = true
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<GenerateButton />)
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('画像を生成中です')
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(container.textContent).toContain('生成中...')
  })

  it('UT-042: 親からpendingが渡された場合も生成中表示になる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<GenerateButton pending />)
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-label')).toBe('画像を生成中です')
  })

  it('UT-043: disabled指定時はボタンが無効になる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<GenerateButton disabled />)
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.disabled).toBe(true)
  })
})
