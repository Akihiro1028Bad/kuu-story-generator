'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // グローバルエラーをログに記録
    console.error('Global application error:', error)
  }, [error])

  return (
    <html lang="ja" data-theme="glass">
      <body className="font-sans antialiased">
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="max-w-md w-full bg-base-100 rounded-2xl shadow-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-error/20 flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-error"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-base-content mb-2">重大なエラーが発生しました</h1>
              <p className="text-base-content/70 text-sm mb-4">
                申し訳ございません。アプリケーションで重大なエラーが発生しました。
              </p>
              {error.message && (
                <div className="mb-4 p-3 bg-base-200 rounded-lg text-left">
                  <p className="text-xs font-mono text-base-content/60 break-all">
                    {error.message}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={reset}
                className="px-6 py-3 rounded-xl font-bold text-base text-white
                  bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
                  bg-[length:200%_200%] shadow-lg
                  transition-all duration-300
                  hover:scale-105 hover:-translate-y-1
                  hover:shadow-[0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(139,92,246,0.3),0_0_60px_rgba(6,182,212,0.2)]
                  active:scale-95
                  focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
                  animate-gradient-flow
                "
              >
                もう一度試す
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 rounded-xl font-bold text-base
                  bg-base-200 text-base-content
                  shadow-md hover:shadow-lg
                  transition-all duration-200
                  hover:scale-[1.02] hover:-translate-y-0.5
                  active:scale-[0.98]
                "
              >
                ホームに戻る
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
