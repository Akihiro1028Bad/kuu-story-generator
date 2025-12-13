/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest'
import { GET } from './route'
import { NextResponse } from 'next/server'

describe('API Integration: /api/options', () => {
  it('IT-001: 正常系 - 選択肢一覧を返す', async () => {
    const response = await GET()
    const json = await response.json()

    expect(response).toBeInstanceOf(NextResponse)
    expect(json).toHaveProperty('textPhrases')
    expect(json).toHaveProperty('styles')
    expect(json).toHaveProperty('positions')
    expect(Array.isArray(json.textPhrases)).toBe(true)
    expect(json.textPhrases.length).toBeGreaterThan(0)
  })
})

