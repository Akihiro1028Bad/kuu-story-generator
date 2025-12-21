/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveOnMobile } from './saveOnMobile'

describe('saveOnMobile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
    global.URL.createObjectURL = vi.fn(() => 'blob:download') as typeof URL.createObjectURL
    global.URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL
  })

  it('UT-025: URLから画像を取得してWeb Share APIで保存できる（正常系）', async () => {
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
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result).toEqual({ outcome: 'camera-roll-saved' })
    expect(mockShare).toHaveBeenCalled()
  })

  it('UT-026: Web Share API非対応時にフォールバックダウンロードを実行する（正常系）', async () => {
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

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result.outcome).toBe('fallback-downloaded')
    expect(linkMock.click).toHaveBeenCalled()
  })

  it('UT-027: 画像取得失敗時にエラーを返す（異常系）', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/invalid.jpg')

    expect(result.outcome).toBe('failed')
  })

  it('UT-036: canShareがfalseの場合はフォールバックする', async () => {
    const mockShare = vi.fn()
    const mockCanShare = vi.fn().mockReturnValue(false)

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

    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result.outcome).toBe('fallback-downloaded')
    expect(linkMock.click).toHaveBeenCalled()
  })

  it('UT-037: shareがAbortErrorの場合は失敗を返す', async () => {
    const mockShare = vi.fn().mockRejectedValue(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    const mockCanShare = vi.fn().mockReturnValue(true)

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
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result).toEqual({ outcome: 'failed', message: '共有がキャンセルされました' })
  })

  it('UT-038: shareが失敗した場合はフォールバックする', async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error('share failed'))
    const mockCanShare = vi.fn().mockReturnValue(true)

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

    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result.outcome).toBe('fallback-downloaded')
    expect(linkMock.click).toHaveBeenCalled()
  })

  it('UT-039: 例外がError以外の場合は汎用メッセージを返す', async () => {
    global.fetch = vi.fn().mockRejectedValue('boom')

    const result = await saveOnMobile('https://example.com/image.jpg')

    expect(result).toEqual({ outcome: 'failed', message: '保存に失敗しました' })
  })
})
