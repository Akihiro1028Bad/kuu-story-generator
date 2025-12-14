import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ClientErrorPayload = {
  kind?: 'error' | 'unhandledrejection' | 'error-boundary'
  message?: string
  name?: string
  stack?: string
  digest?: string
  source?: string
  lineno?: number
  colno?: number
  url?: string
  href?: string
  userAgent?: string
  ts?: number
  extra?: unknown
}

export async function POST(request: NextRequest) {
  try {
    const bodyUnknown = await request.json().catch(() => null)
    const body = (bodyUnknown && typeof bodyUnknown === 'object' ? (bodyUnknown as ClientErrorPayload) : null) ?? {}

    // Vercel だとこのログがそのまま Functions Logs に残るので、まずはここで握る
    console.error('[client-error]', {
      ...body,
      href: body.href ?? request.headers.get('referer') ?? body.url,
      userAgent: body.userAgent ?? request.headers.get('user-agent') ?? undefined,
      vercelId: request.headers.get('x-vercel-id') ?? undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[client-error] failed to parse/report:', e)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

