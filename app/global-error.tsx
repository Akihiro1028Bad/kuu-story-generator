'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reset: _reset, // 未使用: リロードに統一のため
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
    // ここでは fetch 失敗しても良いので握る
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        kind: 'error-boundary',
        scope: 'global',
        ts: Date.now(),
        href: typeof location !== 'undefined' ? location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        name: error.name,
        message: error.message,
        stack: error.stack,
        digest: error.digest,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [error])

  return (
    <html lang="ja" data-theme="glass">
      <body className="font-sans antialiased">
        <div className="container mx-auto px-6 py-16 max-w-2xl">
          <div className="card bg-base-100 shadow-xl border border-base-200 rounded-2xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold">すいません、アプリでエラーが発生しました</h2>
              <p className="text-sm text-base-content/70">以下のボタンからページの更新を試してください。</p>
              <div className="mt-4 flex gap-3">
                <button className="btn btn-ghost" onClick={() => location.reload()}>
                  ページを更新
                </button>
              </div>
              {error.digest && (
                <p className="mt-4 text-xs text-base-content/50">digest: {error.digest}</p>
              )}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

