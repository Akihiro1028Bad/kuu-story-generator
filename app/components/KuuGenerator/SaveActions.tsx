'use client'

import { useState } from 'react'
import { detectDeviceClass } from '@/app/lib/save/detectDeviceClass'
import { saveOnDesktop } from '@/app/lib/save/saveOnDesktop'
import { saveOnMobile } from '@/app/lib/save/saveOnMobile'

interface SaveActionsProps {
  imageUrl: string
  mimeType: string
  width: number
  height: number
}

export function SaveActions({ imageUrl, mimeType }: SaveActionsProps) {
  const [device] = useState<'desktop' | 'mobile'>(() => detectDeviceClass())

  const handleSave = async () => {
    if (device === 'desktop') {
      await saveOnDesktop(imageUrl, mimeType as 'image/png' | 'image/jpeg')
    } else {
      await saveOnMobile(imageUrl)
    }
  }

  const label = device === 'mobile' ? '保存・共有する' : 'ダウンロードする'
  const ariaLabel = device === 'mobile' ? '画像を保存・共有する' : '画像をダウンロードする'

  return (
    <div className="text-center w-full">
      <div className="space-y-5">
        <button
          onClick={handleSave}
          className="w-full h-16 px-8 rounded-xl font-bold text-lg text-white
            bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
            bg-[length:200%_200%] shadow-lg
            hover:shadow-[0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(139,92,246,0.3)]
            transition-all duration-300
            focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
            hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0
            animate-gradient-flow
          "
          aria-label={ariaLabel}
        >
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {label}
          </span>
        </button>
        
        <p className="text-xs sm:text-sm text-base-content/60 mt-3 leading-relaxed">
          ※ 画像はURLで一定期間取得できます。必要に応じて保存してください。
        </p>
      </div>
    </div>
  )
}
