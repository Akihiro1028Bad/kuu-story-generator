/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { saveOnDesktop } from './saveOnDesktop'

describe('saveOnDesktop', () => {
  it('UT-013: 正常系 - PCでのPNGダウンロード', () => {
// ... existing tests ...
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    saveOnDesktop('data:image/png;base64,test', 'image/png')

    expect(createElementSpy).toHaveBeenCalledWith('a')
    expect(linkMock.href).toBe('data:image/png;base64,test')
    expect(linkMock.download).toMatch(/kuu-\d+\.png/)
    expect(appendChildSpy).toHaveBeenCalled()
    expect(linkMock.click).toHaveBeenCalled()
    expect(removeChildSpy).toHaveBeenCalled()

    vi.restoreAllMocks()
  })

  it('UT-014: 正常系 - PCでのJPEGダウンロード', () => {
    const linkMock = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(linkMock)
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => linkMock)
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => linkMock)

    saveOnDesktop('data:image/jpeg;base64,test', 'image/jpeg')

    expect(linkMock.download).toMatch(/kuu-\d+\.jpg/)
    
    vi.restoreAllMocks()
  })
})
