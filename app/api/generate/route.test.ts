/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Gemini SDK モック（route.ts は @google/genai の GoogleGenAI を直接 new して使う）
const generateContentMock = vi.fn()
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = {
      generateContent: generateContentMock,
    }
    constructor(_args: any) {}
  },
}))

describe('API Integration: /api/generate', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, GEMINI_API_KEY: 'test-key' }
    generateContentMock.mockReset()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('IT-002: 正常系 - 画像を生成して返す', async () => {
    // モック設定（Geminiが画像を返すケース）
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

    // FormData作成
    const formData = new FormData()
    formData.append('image', new File(['test'], 'test.png', { type: 'image/png' }))
    formData.append('textPhraseId', 'kuu')
    formData.append('styleIds', 'gentle')
    formData.append('positionId', 'top-left')
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
    expect(json).toHaveProperty('imageDataUrl', 'data:image/png;base64,result')
    expect(json).toHaveProperty('mimeType', 'image/png')
    expect(json).toHaveProperty('width', 100)
    expect(json).toHaveProperty('height', 100)
  })

  it('IT-003: 異常系 - 必須項目不足', async () => {
    const formData = new FormData()
    formData.append('image', new File(['test'], 'test.png', { type: 'image/png' }))
    // 他のフィールドなし

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/必須項目が不足/)
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

    const formData = new FormData()
    formData.append('image', new File(['test'], 'test.png', { type: 'image/png' }))
    formData.append('textPhraseId', 'kuu')
    formData.append('styleIds', 'gentle')
    formData.append('positionId', 'top-left')
    formData.append('outputFormat', 'png')
    formData.append('originalWidth', '100')
    formData.append('originalHeight', '100')

    const req = new NextRequest('http://localhost/api/generate', {
      method: 'POST',
      body: formData,
    })

    const response = await POST(req)
    const json = await response.json()

    expect(generateContentMock).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
    expect(json).toHaveProperty('imageDataUrl', 'data:image/png;base64,result')
  })
})

