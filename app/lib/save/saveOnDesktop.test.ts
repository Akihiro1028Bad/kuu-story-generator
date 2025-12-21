/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { saveOnDesktop } from './saveOnDesktop'

describe('saveOnDesktop', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
    global.URL.createObjectURL = vi.fn(() => 'blob:download') as typeof URL.createObjectURL
    global.URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL
  })

  it('UT-023: URLから画像を取得してダウンロードできる（正常系）', async () => {
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
    } as unknown as Response)

    await saveOnDesktop('https://example.com/image.png', 'image/png')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png')
    expect(linkMock.href).toBe('blob:download')
    expect(linkMock.download).toMatch(/kuu-\d+\.png/)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(linkMock.click).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('UT-024: 画像取得失敗時にエラーをスローする（異常系）', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as unknown as Response)

    await expect(saveOnDesktop('https://example.com/invalid.jpg', 'image/jpeg')).rejects.toThrow(
      /Failed to fetch image/
    )
  })

  it('UT-025: fileNameパラメータが渡された場合は指定されたファイル名でダウンロードする', async () => {
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    await saveOnDesktop('https://example.com/image.jpg', 'image/jpeg', 'custom-kuu.jpg')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
    expect(linkMock.href).toBe('blob:download')
    expect(linkMock.download).toBe('custom-kuu.jpg')
    expect(appendChildSpy).toHaveBeenCalled()
    expect(linkMock.click).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('UT-026: fileNameがundefinedの場合はデフォルトファイル名を生成する', async () => {
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/png' })),
    } as unknown as Response)

    await saveOnDesktop('https://example.com/image.png', 'image/png', undefined)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.png')
    expect(linkMock.href).toBe('blob:download')
    expect(linkMock.download).toMatch(/kuu-\d+\.png/)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(linkMock.click).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('UT-027: fileNameがnullの場合はデフォルトファイル名を生成する', async () => {
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      blob: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'image/jpeg' })),
    } as unknown as Response)

    // @ts-expect-error - テストのため、nullを渡す
    await saveOnDesktop('https://example.com/image.jpg', 'image/jpeg', null)

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
    expect(linkMock.href).toBe('blob:download')
    expect(linkMock.download).toMatch(/kuu-\d+\.jpg/)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(linkMock.click).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })
})
