'use client'

import { useEffect, useState } from 'react'
import { detectDeviceClass } from '@/app/lib/save/detectDeviceClass'
import { saveOnDesktop } from '@/app/lib/save/saveOnDesktop'
import { saveOnMobile } from '@/app/lib/save/saveOnMobile'

interface SaveActionsProps {
  imageDataUrl: string
  mimeType: string
  width: number
  height: number
}

export function SaveActions({ imageDataUrl, mimeType }: SaveActionsProps) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  useEffect(() => {
    setDevice(detectDeviceClass())
  }, [])

  const handleSave = async () => {
    setSaveStatus('保存中...')
    
    if (device === 'desktop') {
      saveOnDesktop(imageDataUrl, mimeType as 'image/png' | 'image/jpeg')
      setSaveStatus('ダウンロードしました！')
      setTimeout(() => setSaveStatus(null), 3000)
    } else {
      const result = await saveOnMobile(imageDataUrl)
      if (result.outcome === 'camera-roll-saved') {
        setSaveStatus('共有/保存メニューを開きました')
      } else if (result.outcome === 'fallback-downloaded') {
        setSaveStatus(result.message)
      } else {
        setSaveStatus(`エラー: ${result.message}`)
      }
      setTimeout(() => setSaveStatus(null), 5000)
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
        
        {saveStatus && (
          <div className="alert alert-success shadow-lg border-2 border-success/30 py-4 text-sm rounded-xl animate-[fadeIn_0.3s_ease-in-out_forwards]" role="status" aria-live="polite">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{saveStatus}</span>
          </div>
        )}
        
        <p className="text-xs sm:text-sm text-base-content/60 mt-3 leading-relaxed">
          ※ 画像はサーバーに保存されません。必ず保存してください。
        </p>
      </div>
    </div>
  )
}

