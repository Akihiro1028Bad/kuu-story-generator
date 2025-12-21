/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateKuu } from './actions'

const headersMock = vi.fn()
vi.mock('next/headers', () => ({
  headers: () => headersMock(),
}))

describe('generateKuu', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    headersMock.mockReset()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('UT-007: FormDataからimageUrlを取得できる（正常系）', async () => {
    delete process.env.KUU_USE_REAL_API
    process.env.KUU_MOCK_DELAY_MS = '0'
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('success')
  })

  it('UT-009: BFF APIにimageUrlを送信できる（正常系）', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        imageUrl: 'https://example.public.blob.vercel-storage.com/generated/test.jpg',
        mimeType: 'image/jpeg',
        width: 100,
        height: 100,
      }),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)
    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]
    const body = fetchCall?.[1]?.body as FormData

    expect(body.get('imageUrl')).toBe('https://example.com/image.jpg')
    expect(result.status).toBe('success')
  })

  it('UT-010: モックモードでimageUrlから画像を取得できる（正常系）', async () => {
    delete process.env.KUU_USE_REAL_API
    process.env.KUU_MOCK_DELAY_MS = '0'
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(global.fetch).toHaveBeenCalledWith('https://example.com/image.jpg')
    expect(result.status).toBe('success')
  })

  it('UT-028: 互換期間中にimageUrlとimageDataUrlの両方を扱える（正常系）', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        imageUrl: 'https://example.public.blob.vercel-storage.com/generated/test.jpg',
        imageDataUrl: 'data:image/png;base64,legacy',
        mimeType: 'image/png',
        width: 100,
        height: 100,
      }),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.imageUrl).toBe('https://example.public.blob.vercel-storage.com/generated/test.jpg')
    }
  })

  it('UT-031: 無効なURL形式でエラーを返す（異常系）', async () => {
    const formData = new FormData()
    formData.append('imageUrl', 'not-a-url')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
  })

  it('UT-032: 必須項目不足でエラーを返す（異常系）', async () => {
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('outputFormat', 'jpeg')

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('必須項目が不足')
    }
  })

  it('UT-033: 無効なURLプロトコルでエラーを返す（異常系）', async () => {
    const formData = new FormData()
    formData.append('imageUrl', 'ftp://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('無効な画像URL')
    }
  })

  it('UT-034: モックモードで画像取得失敗時にエラーを返す（異常系）', async () => {
    delete process.env.KUU_USE_REAL_API
    process.env.KUU_MOCK_DELAY_MS = '0'
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Not Found',
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
  })

  it('UT-035: モックモードで寸法が有効ならそのまま使う', async () => {
    delete process.env.KUU_USE_REAL_API
    process.env.KUU_MOCK_DELAY_MS = '0'
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')
    formData.append('originalWidth', '640')
    formData.append('originalHeight', '480')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1]).buffer),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('success')
    if (result.status === 'success') {
      expect(result.width).toBe(640)
      expect(result.height).toBe(480)
    }
  })

  it('UT-035a: モックモードで待機時間が有効なら遅延する', async () => {
    vi.useFakeTimers()
    delete process.env.KUU_USE_REAL_API
    process.env.KUU_MOCK_DELAY_MS = '1'
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/jpeg' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1]).buffer),
    } as unknown as Response)

    const promise = generateKuu({ status: 'idle' }, formData)
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.status).toBe('success')
    vi.useRealTimers()
  })

  it('UT-036: 実APIでホストが取得できない場合はエラーを返す', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers())

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('ホスト情報')
    }
  })

  it('UT-037: 実APIでエラーレスポンスのdebugを含める', async () => {
    process.env.KUU_USE_REAL_API = '1'
    process.env.NODE_ENV = 'development'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
      json: vi.fn().mockResolvedValue({ error: 'fail', debug: { hint: 'detail' } }),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
    if (result.status === 'error') {
      expect(result.message).toContain('--- debug ---')
    }
  })

  it('UT-038: 実APIでエラーボディが不正な場合は汎用メッセージ', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: vi.fn().mockResolvedValue('oops'),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
  })

  it('UT-039: 実APIで画像URLが欠落した場合はエラーを返す', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ mimeType: 'image/png', width: 100, height: 100 }),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
  })

  it('UT-039a: 実APIでimageDataUrlのみでも成功する', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        imageDataUrl: 'data:image/png;base64,legacy',
        mimeType: 'image/png',
        width: 100,
        height: 100,
      }),
    } as unknown as Response)

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('success')
  })

  it('UT-040: 実APIでfetch例外が発生した場合はエラーに変換する', async () => {
    process.env.KUU_USE_REAL_API = '1'
    headersMock.mockResolvedValue(new Headers({ host: 'localhost:3000', 'x-forwarded-proto': 'http' }))

    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', 'phrase1')
    formData.append('styleIds', 'style1')
    formData.append('positionId', 'pos1')
    formData.append('outputFormat', 'jpeg')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('boom'))

    const result = await generateKuu({ status: 'idle' }, formData)

    expect(result.status).toBe('error')
  })
})
