'use client'

import { useEffect } from 'react'

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object'
}

function safeStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value)
  } catch {
    return undefined
  }
}

function toErrorFields(err: unknown): { name?: string; message?: string; stack?: string; extra?: unknown } {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack }
  }
  if (isRecord(err)) {
    const name = typeof err.name === 'string' ? err.name : undefined
    const message = typeof err.message === 'string' ? err.message : safeStringify(err)
    const stack = typeof err.stack === 'string' ? err.stack : undefined
    return { name, message, stack, extra: err }
  }
  return { message: typeof err === 'string' ? err : safeStringify(err), extra: err }
}

function shouldAutoReloadForChunkError(message: string | undefined) {
  if (!message) return false
  // Next.js/Vercel でデプロイ直後などに起きがちなやつ
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|CSSChunkLoadError|Failed to fetch dynamically imported module/i.test(
    message
  )
}

async function reportClientError(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)

  // 可能なら beacon（ページ遷移中でも送れる）
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const ok = navigator.sendBeacon('/api/client-error', new Blob([body], { type: 'application/json' }))
    if (ok) return
  }

  // fallback
  await fetch('/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // ここでの失敗は握りつぶす（無限ループ防止）
  })
}

export function ClientErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const errFields = toErrorFields(event.error ?? event.message)
      const message = errFields.message ?? (typeof event.message === 'string' ? event.message : undefined)

      void reportClientError({
        kind: 'error',
        ts: Date.now(),
        href: typeof location !== 'undefined' ? location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        message,
        name: errFields.name,
        stack: errFields.stack,
        source: typeof event.filename === 'string' ? event.filename : undefined,
        lineno: typeof event.lineno === 'number' ? event.lineno : undefined,
        colno: typeof event.colno === 'number' ? event.colno : undefined,
        extra: errFields.extra,
      })

      // chunk load 系は「一回だけ」自動リロードして自己回復を試す
      if (shouldAutoReloadForChunkError(message)) {
        try {
          const key = 'kuu:reloadedForChunkError'
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1')
            location.reload()
          }
        } catch {
          // ignore
        }
      }
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errFields = toErrorFields(event.reason)
      const message = errFields.message

      void reportClientError({
        kind: 'unhandledrejection',
        ts: Date.now(),
        href: typeof location !== 'undefined' ? location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        message,
        name: errFields.name,
        stack: errFields.stack,
        extra: errFields.extra,
      })

      if (shouldAutoReloadForChunkError(message)) {
        try {
          const key = 'kuu:reloadedForChunkError'
          if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1')
            location.reload()
          }
        } catch {
          // ignore
        }
      }
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}

