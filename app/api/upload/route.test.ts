/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

const handleUploadMock = vi.fn()

vi.mock('@vercel/blob/client', () => ({
  handleUpload: (...args: unknown[]) => handleUploadMock(...args),
}))

describe('API Integration: /api/upload', () => {
  beforeEach(() => {
    handleUploadMock.mockReset()
  })

  it('UT-011: handleUpload()でトークンを生成できる（正常系）', async () => {
    handleUploadMock.mockImplementation(async (options: {
      onBeforeGenerateToken: (pathname: string, clientPayload: unknown) => Promise<unknown> | unknown
    }) => {
      await options.onBeforeGenerateToken('test.jpg', {})
      return {
        type: 'blob.generate-client-token',
        clientToken: 'token',
        url: 'https://example.com',
        uploadUrl: 'https://example.com/upload',
      }
    })

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ pathname: 'test.jpg', clientPayload: {} }),
    })

    const response = await POST(req)
    const json = await response.json()

    expect(handleUploadMock).toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(json.type).toBe('blob.generate-client-token')
  })

  it('UT-012: onBeforeGenerateTokenでバリデーションを実施する（正常系）', async () => {
    let onBeforeResult: unknown
    handleUploadMock.mockImplementation(async (options: {
      onBeforeGenerateToken: (pathname: string, clientPayload: unknown) => Promise<unknown> | unknown
    }) => {
      onBeforeResult = await options.onBeforeGenerateToken('test.jpg', {})
      return {
        type: 'blob.generate-client-token',
        clientToken: 'token',
        url: 'https://example.com',
        uploadUrl: 'https://example.com/upload',
      }
    })

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ pathname: 'test.jpg', clientPayload: {} }),
    })

    await POST(req)

    expect(onBeforeResult).toMatchObject({
      allowedContentTypes: ['image/jpeg', 'image/png'],
      maximumSizeInBytes: 10 * 1024 * 1024,
    })
  })

  it('UT-032: 無効なファイル形式でエラーを返す（異常系）', async () => {
    handleUploadMock.mockImplementation(async (options: {
      onBeforeGenerateToken: (pathname: string, clientPayload: unknown) => Promise<unknown> | unknown
    }) => {
      await options.onBeforeGenerateToken('test.gif', {})
      return { type: 'blob.generate-client-token' }
    })

    const req = new NextRequest('http://localhost/api/upload', {
      method: 'POST',
      body: JSON.stringify({ pathname: 'test.gif', clientPayload: {} }),
    })

    const response = await POST(req)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toMatch(/無効なファイル形式/)
  })
})
