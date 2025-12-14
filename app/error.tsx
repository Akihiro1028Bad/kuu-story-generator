'use client'

import { useEffect } from 'react'

async function reportError(error: Error & { digest?: string }) {
  // ここで throw すると二次障害になるので握る
  await fetch('/api/client-error', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      kind: 'error-boundary',
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
}

export default function Error({
  error,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  reset: _reset, // 未使用: リロードに統一のため
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
    void reportError(error)
  }, [error])

  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <div className="card bg-base-100 shadow-xl border border-base-200 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold">すいません、読み込み中にエラーが発生しました</h2>
          <p className="text-sm text-base-content/70">
            以下のボタンからページの更新を試してください。
          </p>
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
  )
}

