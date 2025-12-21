/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('fetchFromAPI', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    global.fetch = vi.fn()
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  it('UT-035: 環境変数のAPI URLを使用してリクエストする', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://example.com'
    const { fetchFromAPI } = await import('./client')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true }),
    } as unknown as Response)

    await fetchFromAPI('/test')

    expect(global.fetch).toHaveBeenCalledWith('http://example.com/test', undefined)
  })

  it('UT-036: レスポンスがOKでない場合はエラーを投げる', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    const { fetchFromAPI } = await import('./client')

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      statusText: 'Bad Request',
    } as unknown as Response)

    await expect(fetchFromAPI('/bad')).rejects.toThrow('API request failed: Bad Request')
  })
})
