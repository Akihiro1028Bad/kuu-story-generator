/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

const generateContentMock = vi.fn()
const putMock = vi.fn()
const delMock = vi.fn()

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: generateContentMock,
    }
    constructor() {}
  },
}))

vi.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => putMock(...args),
  del: (...args: unknown[]) => delMock(...args),
}))

describe('API Integration: /api/generate', () => {
  const originalEnv = process.env
  const imageUrl = 'https://example.public.blob.vercel-storage.com/uploads/test.jpg'

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' }
    generateContentMock.mockReset()
    putMock.mockReset()
    delMock.mockReset()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('UT-015: FormDataからimageUrlを取得できる（正常系）', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')
    formData.append('originalWidth', '100')
    formData.append('originalHeight', '100')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveProperty('imageUrl', 'https://example.public.blob.vercel-storage.com/generated/out.png')
    expect(json).toHaveProperty('mimeType', 'image/png')
  })

  it('UT-016: 画像URLから画像をダウンロードしてbase64に変換できる（正常系）', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    await POST(req)

    expect(global.fetch).toHaveBeenCalledWith(imageUrl)
    const genCall = generateContentMock.mock.calls[0]?.[0]
    const inlineData = genCall?.contents?.[0]?.parts?.[1]?.inlineData
    expect(inlineData?.data).toBe('AQI=')
  })

  it('UT-018: 許可されていないホストのimageUrlでエラーを返す（異常系）', async () => {
    const formData = new FormData()
    formData.append('imageUrl', 'https://example.com/image.jpg')
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/許可されていない/)
  })

  it('UT-019: 生成結果をVercel Blobに保存できる（正常系）', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    await POST(req)

    expect(putMock).toHaveBeenCalled()
  })

  it('UT-020: 生成成功時に元画像を削除する（正常系）', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })
    delMock.mockResolvedValue(undefined)

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    await POST(req)

    expect(delMock).toHaveBeenCalledWith(imageUrl)
  })

  it('UT-049: 大容量base64レスポンス時の処理方針（境界値）', async () => {
    const largeBase64 = 'A'.repeat(30 * 1024 * 1024)
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: largeBase64,
                },
              },
            ],
          },
        },
      ],
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(413)
    expect(json.error).toMatch(/大きすぎます|容量|base64/)
  })

  it('UT-033: 画像URL取得失敗時にエラーを返す（異常系）', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/画像の取得に失敗/)
  })

  it('UT-034: 生成失敗時に元画像を保持する（正常系）', async () => {
    generateContentMock.mockRejectedValue(new Error('Gemini failed'))

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    await POST(req)

    expect(delMock).not.toHaveBeenCalled()
  })

  it('UT-035: 削除失敗時にログを記録するが処理は続行する（異常系）', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })
    delMock.mockRejectedValue(new Error('delete failed'))

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
  })

  it('IT-002: 正常系 - 画像を生成して返す', async () => {
    generateContentMock.mockResolvedValue({
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'result',
                },
              },
            ],
          },
        },
      ],
    })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')
    formData.append('originalWidth', '100')
    formData.append('originalHeight', '100')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toHaveProperty('imageUrl')
  })

  it('IT-004: 正常系 - Geminiが一時的に5xxを返した場合は再試行して成功する', async () => {
    generateContentMock
      .mockRejectedValueOnce({ response: { status: 500 }, message: 'internal error' })
      .mockResolvedValueOnce({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'result',
                  },
                },
              ],
            },
          },
        ],
      })
    putMock.mockResolvedValue({ url: 'https://example.public.blob.vercel-storage.com/generated/out.png' })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'image/png' }),
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as Response)

    const formData = new FormData()
    formData.append('imageUrl', imageUrl)
    formData.append('textPhraseId', '1')
    formData.append('styleIds', '1')
    formData.append('positionId', '1')
    formData.append('outputFormat', 'png')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)

    expect(generateContentMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
  })
})
