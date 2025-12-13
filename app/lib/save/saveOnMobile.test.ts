/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveOnMobile } from './saveOnMobile'

describe('saveOnMobile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  it('UT-015: 正常系 - モバイルでのカメラロール保存（成功）', async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined)
    const mockCanShare = vi.fn().mockReturnValue(true)
    
    // navigator is read-only in some envs, but happy-dom might allow it.
    // If not, we might need Object.defineProperty
    Object.defineProperty(window.navigator, 'share', {
      value: mockShare,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window.navigator, 'canShare', {
      value: mockCanShare,
      configurable: true,
      writable: true,
    })

    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('data:image/jpeg;base64,test')

    expect(result).toEqual({ outcome: 'camera-roll-saved' })
    expect(mockShare).toHaveBeenCalled()
  })

  it('UT-016: 正常系 - モバイルでのカメラロール保存失敗時のフォールバック', async () => {
    // navigator.share がない場合
    Object.defineProperty(window.navigator, 'share', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    Object.defineProperty(window.navigator, 'canShare', {
      value: undefined,
      configurable: true,
      writable: true,
    })

    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    const result = await saveOnMobile('data:image/jpeg;base64,test')

    expect(result.outcome).toBe('fallback-downloaded')
    expect(linkMock.click).toHaveBeenCalled()
  })
})
