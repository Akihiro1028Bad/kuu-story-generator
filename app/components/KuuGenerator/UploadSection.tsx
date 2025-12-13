'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'

interface UploadSectionProps {
  onImageSelected: (file: File | null) => void
  disabled?: boolean
}

export function UploadSection({ onImageSelected, disabled }: UploadSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (file: File | null) => {
    setError(null)

    if (!file) {
      onImageSelected(null)
      setPreview(null)
      return
    }

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('JPEGまたはPNG形式の画像を選択してください。')
      onImageSelected(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('画像サイズは10MB以下にしてください。')
      onImageSelected(null)
      return
    }

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    
    img.onload = () => {
      onImageSelected(file)
      setPreview(objectUrl)
    }
    
    img.onerror = () => {
      setError('画像の読み込みに失敗しました。')
      onImageSelected(null)
      URL.revokeObjectURL(objectUrl)
    }
    
    img.src = objectUrl
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    handleFileChange(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled) return
    
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileChange(file)
    }
  }

  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget
    setDimensions({ width: naturalWidth, height: naturalHeight })
  }

  const clearPreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setDimensions(null)
    onImageSelected(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      <div
        className={`
          relative overflow-hidden rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 cursor-pointer group
          ${isDragging 
            ? 'vivid-drag-over' 
            : preview 
              ? 'vivid-preview' 
              : 'vivid-default'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        aria-label="画像をアップロード"
      >
        <input
          type="file"
          accept="image/png, image/jpeg"
          className="sr-only"
          name="image"
          ref={fileInputRef}
          onChange={handleInputChange}
          disabled={disabled}
          aria-label="画像ファイルを選択"
        />
        
        {preview ? (
          <div className="relative inline-block max-w-full">
            <div className="vivid-preview-frame p-2 rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={preview} 
                alt="アップロードされた画像のプレビュー" 
                className="max-h-72 sm:max-h-96 mx-auto rounded-lg shadow-2xl transition-transform duration-300 group-hover:scale-[1.03]"
                onLoad={onImageLoad}
              />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                clearPreview()
              }}
              className="absolute -top-3 -right-3 w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-xl hover:scale-110 hover:shadow-2xl active:scale-95 transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-3 focus:ring-pink-500 focus:ring-offset-2 z-10"
              disabled={disabled}
              aria-label="画像を削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-gray-900 py-6 relative z-10">
            <div className="vivid-icon mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="font-bold text-xl mb-2">画像をここへドロップ</p>
            <p className="text-sm text-gray-700 mb-5 leading-relaxed">またはクリックして選択</p>
            <p className="text-xs font-bold text-gray-900 inline-block px-5 py-2.5 rounded-full bg-white/90 border-2 border-gray-900 shadow-lg">JPEG / PNG (10MBまで)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-warning shadow-lg border-2 border-warning/30 rounded-xl" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <span className="font-semibold text-sm">{error}</span>
          </div>
        </div>
      )}

      {dimensions && (
        <>
          <input type="hidden" name="originalWidth" value={dimensions.width} />
          <input type="hidden" name="originalHeight" value={dimensions.height} />
        </>
      )}
    </div>
  )
}

