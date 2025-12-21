/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { UploadSection } from './UploadSection'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const uploadMock = vi.fn()

vi.mock('@vercel/blob/client', () => ({
  upload: (...args: unknown[]) => uploadMock(...args),
}))

describe('UploadSection', () => {
  beforeEach(() => {
    uploadMock.mockReset()
    vi.restoreAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    global.URL.createObjectURL = vi.fn(() => 'blob:preview') as typeof URL.createObjectURL
    global.URL.revokeObjectURL = vi.fn() as typeof URL.revokeObjectURL
  })

  it('UT-001: ファイル選択時にVercel Blobにアップロードできる（正常系）', async () => {
    const onImageSelected = vi.fn()
    uploadMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/uploads/test.jpg' })

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(uploadMock).toHaveBeenCalledTimes(1)
    expect(uploadMock.mock.calls[0][0]).toBe('test.jpg')
    expect(uploadMock.mock.calls[0][1]).toBe(file)
    expect(onImageSelected).toHaveBeenCalledWith(
      'https://example.public.blob.vercel-storage.com/uploads/test.jpg'
    )
  })

  it('UT-004: アップロード進行状況を表示する（正常系）', async () => {
    const onImageSelected = vi.fn()
    let resolveUpload: (value: { url: string }) => void
    const uploadPromise = new Promise<{ url: string }>((resolve) => {
      resolveUpload = resolve
    })

    uploadMock.mockImplementation(
      async (
        _name: string,
        _file: File,
        options: {
          onUploadProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
        }
      ) => {
      options.onUploadProgress?.({ loaded: 1, total: 2, percentage: 50 })
      return uploadPromise
      }
    )

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const progress = container.querySelector('[data-testid="upload-progress"]') as HTMLDivElement | null
    expect(progress).not.toBeNull()

    await act(async () => {
      resolveUpload({ url: 'https://example.public.blob.vercel-storage.com/uploads/test.jpg' })
    })
  })

  it('UT-027: 無効なファイル形式でエラーを表示する（異常系）', async () => {
    const onImageSelected = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(uploadMock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('JPEGまたはPNG形式の画像を選択してください。')
  })

  it('UT-028: 10MBを超えるファイルでエラーを表示する（境界値）', async () => {
    const onImageSelected = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const bigBuffer = new Uint8Array(10 * 1024 * 1024 + 1)
    const file = new File([bigBuffer], 'big.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(uploadMock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('画像サイズは10MB以下にしてください。')
  })

  it('UT-040: ファイル未選択時はプレビューをクリアする', async () => {
    const onImageSelected = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(onImageSelected).toHaveBeenCalledWith(null)
    expect(container.querySelector('img')).toBeNull()
  })

  it('UT-041: disabled時はドラッグ操作を無視する', async () => {
    const onImageSelected = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} disabled />)
    })

    const dropZone = container.querySelector('[role="button"]') as HTMLDivElement
    await act(async () => {
      dropZone.dispatchEvent(new DragEvent('dragover', { bubbles: true }))
    })

    expect(dropZone.className).toContain('vivid-default')
  })

  it('UT-042: Enterキーでファイル選択を起動できる', async () => {
    const onImageSelected = vi.fn()
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(input, 'click')
    const dropZone = container.querySelector('[role="button"]') as HTMLDivElement

    await act(async () => {
      dropZone.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })

    expect(clickSpy).toHaveBeenCalled()
  })

  it('UT-043: プレビュー画像のロードで寸法を保持する', async () => {
    const onImageSelected = vi.fn()
    uploadMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/uploads/test.jpg' })

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const img = container.querySelector('img') as HTMLImageElement
    Object.defineProperty(img, 'naturalWidth', { value: 320 })
    Object.defineProperty(img, 'naturalHeight', { value: 240 })

    await act(async () => {
      img.dispatchEvent(new Event('load'))
    })

    const widthInput = container.querySelector('input[name="originalWidth"]') as HTMLInputElement
    const heightInput = container.querySelector('input[name="originalHeight"]') as HTMLInputElement
    expect(widthInput.value).toBe('320')
    expect(heightInput.value).toBe('240')
  })

  it('UT-044: クリアボタンでプレビューを削除する', async () => {
    const onImageSelected = vi.fn()
    uploadMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/uploads/test.jpg' })

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const clearButton = container.querySelector('button[aria-label="画像を削除"]') as HTMLButtonElement

    await act(async () => {
      clearButton.click()
    })

    expect(onImageSelected).toHaveBeenLastCalledWith(null)
    expect(container.querySelector('img')).toBeNull()
  })

  it('UT-045: 連続アップロードで前回のAbortControllerを中断する', async () => {
    const onImageSelected = vi.fn()
    const abortSpy = vi.fn()
    const originalAbortController = global.AbortController

    global.AbortController = class {
      signal = {} as AbortSignal
      abort = abortSpy
    } as unknown as typeof AbortController

    uploadMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/uploads/test.jpg' })

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file1 = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file1], configurable: true })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file2], configurable: true })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(abortSpy).toHaveBeenCalled()

    global.AbortController = originalAbortController
  })

  it('UT-029: アップロード中断時にBlobRequestAbortedErrorを処理する（異常系）', async () => {
    const onImageSelected = vi.fn()
    uploadMock.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'BlobRequestAbortedError' }))

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.textContent).toContain('アップロードがキャンセルされました。')
  })

  it('UT-030: アップロード失敗時にエラーメッセージを表示する（異常系）', async () => {
    const onImageSelected = vi.fn()
    uploadMock.mockRejectedValue(new Error('upload failed'))

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<UploadSection onImageSelected={onImageSelected} />)
    })

    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input, 'files', { value: [file] })

    await act(async () => {
      input.dispatchEvent(new Event('change', { bubbles: true }))
    })

    expect(container.textContent).toContain('アップロードに失敗しました。再試行してください。')
  })
})
