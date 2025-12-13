'use client'

import { useFormStatus } from 'react-dom'

interface GenerateButtonProps {
  pending?: boolean
  disabled?: boolean
}

export function GenerateButton({ pending: parentPending, disabled }: GenerateButtonProps) {
  const status = useFormStatus()
  const isPending = parentPending || status.pending

  return (
    <button
      type="submit"
      disabled={disabled || isPending}
      className={`
        w-full h-14 sm:h-16 px-8 rounded-xl font-bold text-base sm:text-lg
        bg-primary text-primary-content
        shadow-lg hover:shadow-xl hover:shadow-primary/30
        transition-all duration-200
        focus:outline-none focus:ring-3 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-md
        ${isPending 
          ? 'cursor-wait opacity-75' 
          : 'hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0'
        }
      `}
      aria-label={isPending ? '画像を生成中です' : 'くぅー画像を生成する'}
      aria-busy={isPending}
    >
      {isPending ? (
        <span className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>生成中...</span>
        </span>
      ) : (
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          くぅー画像を生成する
        </span>
      )}
    </button>
  )
}

