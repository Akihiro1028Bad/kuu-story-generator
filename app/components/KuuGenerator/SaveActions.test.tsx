/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let deviceClass: 'desktop' | 'mobile' = 'desktop'
const saveOnDesktopMock = vi.fn()
const saveOnMobileMock = vi.fn()

vi.mock('@/app/lib/save/detectDeviceClass', () => ({
  detectDeviceClass: () => deviceClass,
}))

vi.mock('@/app/lib/save/saveOnDesktop', () => ({
  saveOnDesktop: (...args: unknown[]) => saveOnDesktopMock(...args),
}))

vi.mock('@/app/lib/save/saveOnMobile', () => ({
  saveOnMobile: (...args: unknown[]) => saveOnMobileMock(...args),
}))

import { SaveActions } from './SaveActions'

describe('SaveActions', () => {
  it('UT-044: desktopの場合はダウンロードボタンを表示し保存処理を呼ぶ', async () => {
    deviceClass = 'desktop'
    saveOnDesktopMock.mockResolvedValue(undefined)

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <SaveActions imageUrl="https://example.com/image.jpg" mimeType="image/jpeg" width={100} height={100} />
      )
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('画像をダウンロードする')
    expect(container.textContent).toContain('ダウンロードする')

    await act(async () => {
      button.click()
    })

    expect(saveOnDesktopMock).toHaveBeenCalledWith('https://example.com/image.jpg', 'image/jpeg')
  })

  it('UT-045: mobileの場合は保存・共有ボタンを表示し保存処理を呼ぶ', async () => {
    deviceClass = 'mobile'
    saveOnMobileMock.mockResolvedValue({ outcome: 'camera-roll-saved' })

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <SaveActions imageUrl="https://example.com/image.jpg" mimeType="image/jpeg" width={100} height={100} />
      )
    })

    const button = container.querySelector('button') as HTMLButtonElement
    expect(button.getAttribute('aria-label')).toBe('画像を保存・共有する')
    expect(container.textContent).toContain('保存・共有する')

    await act(async () => {
      button.click()
    })

    expect(saveOnMobileMock).toHaveBeenCalledWith('https://example.com/image.jpg')
  })
})
