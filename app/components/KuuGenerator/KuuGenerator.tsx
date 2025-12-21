'use client'

import { useActionState, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { generateKuu, type GenerateState } from './actions'
import { UploadSection } from './UploadSection'
import { StyleSection } from './StyleSection'
import { SaveActions } from './SaveActions'
import { TextPhraseOption } from '@/app/lib/presets/textPhraseOptions'
import { StylePreset } from '@/app/lib/presets/stylePresets'
import { PositionPreset } from '@/app/lib/presets/positionPresets'

const initialState: GenerateState = { status: 'idle' }

interface OptionsData {
  textPhrases: TextPhraseOption[]
  styles: StylePreset[]
  positions: PositionPreset[]
}

type Step = 1 | 2 | 3

interface KuuGeneratorProps {
  initialSelections?: {
    text?: string
    styles?: string[]
    position?: string
  }
}

export function KuuGenerator({ initialSelections }: KuuGeneratorProps = {}) {
  const [state, formAction, pending] = useActionState(generateKuu, initialState)
  const [currentStep, setCurrentStep] = useState<Step>(1)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [options, setOptions] = useState<OptionsData | null>(null)
  const [outputFormat] = useState<'jpeg' | 'png'>('jpeg')
  const [selectedText, setSelectedText] = useState<string>(initialSelections?.text ?? '')
  const [textPhraseCustom, setTextPhraseCustom] = useState<string>('')
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialSelections?.styles ?? [])
  const [selectedPosition, setSelectedPosition] = useState<string>(initialSelections?.position ?? '')
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showGenerateErrorModal, setShowGenerateErrorModal] = useState(false)
  const [generateErrorMessage, setGenerateErrorMessage] = useState<string>('')
  const [imageLoadError, setImageLoadError] = useState(false)
  const [resetUploadTrigger, setResetUploadTrigger] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const searchParams = useSearchParams()
  const allowCustomText = searchParams.get('tsutsu') === '1'

  useEffect(() => {
    // 画面動作確認用: API通信せずローカルの presets から読み込む
    ;(async () => {
      try {
        const [{ textPhraseOptions }, { stylePresets }, { positionPresets }] = await Promise.all([
          import('@/app/lib/presets/textPhraseOptions'),
          import('@/app/lib/presets/stylePresets'),
          import('@/app/lib/presets/positionPresets'),
        ])
        // 各プロパティが存在することを確認してから設定
        if (textPhraseOptions && stylePresets && positionPresets) {
          setOptions({ 
            textPhrases: textPhraseOptions, 
            styles: stylePresets, 
            positions: positionPresets 
          })
        }
      } catch (error) {
        console.error('Failed to load options:', error)
      }
    })()
  }, [])

  // presets が変更された（例: Fast Refresh）場合でも、古い選択IDが残って API に送られないようにクリーンアップ
  useEffect(() => {
    if (!options) return

    const validTextIds = new Set(options.textPhrases.map(p => p.id))
    const validStyleIds = new Set(options.styles.map(s => s.id))
    const validPositionIds = new Set(options.positions.map(p => p.id))

    // 無効になったIDは state から除去（UIに表示されない「幽霊選択」対策）
    setSelectedStyles(prev => prev.filter(id => validStyleIds.has(id)))
    setSelectedText(prev => (prev && validTextIds.has(prev) ? prev : ''))
    setSelectedPosition(prev => (prev && validPositionIds.has(prev) ? prev : ''))
  }, [options])

  // 生成が成功したら自動的にステップ3に移動
  useEffect(() => {
    // NOTE:
    // `useEffect([state.status])` だと success -> success（連続成功）で発火せず、
    // 生成が終わってもステップ2に留まることがある。
    // そのため state 全体の更新に追従して遷移する。
    if (state.status === 'success') {
      setCurrentStep(3)
      setImageLoadError(false)
    }
  }, [state])

  // 生成が失敗したら、見落とし防止のためエラーモーダルを自動表示
  useEffect(() => {
    if (state.status === 'error') {
      setGenerateErrorMessage(state.message)
      setShowGenerateErrorModal(true)
    }
  }, [state])

  useEffect(() => {
    if (!allowCustomText) {
      setTextPhraseCustom('')
    }
  }, [allowCustomText])


  // 画像選択時の処理
  const handleImageSelected = (remoteUrl: string | null, localUrl?: string | null) => {
    setUploadedImageUrl(remoteUrl)
    
    // ローカルURLがある場合は優先して表示（即時表示のため）
    if (localUrl) {
      setLocalPreviewUrl(localUrl)
      setImagePreview(localUrl)
    } else {
      setLocalPreviewUrl(null)
      setImagePreview(remoteUrl)
    }
  }

  // アップロード状態変更時の処理
  const handleUploadStateChange = (uploading: boolean) => {
    setIsUploading(uploading)
  }

  // リモートURLのプリロード処理
  useEffect(() => {
    if (!uploadedImageUrl) return

    // 既存のプリロードリンクを削除（重複防止）
    const existingLink = document.querySelector(`link[rel="preload"][href="${uploadedImageUrl}"]`)
    if (existingLink) {
      existingLink.remove()
    }

    // 新しいプリロードリンクを追加
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = uploadedImageUrl
    link.setAttribute('fetchpriority', 'high')
    document.head.appendChild(link)

    // クリーンアップ関数
    return () => {
      const linkToRemove = document.querySelector(`link[rel="preload"][href="${uploadedImageUrl}"]`)
      if (linkToRemove) {
        linkToRemove.remove()
      }
    }
  }, [uploadedImageUrl])

  // ローカルBlob URLのクリーンアップ
  useEffect(() => {
    return () => {
      if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  // ステップ1から2へ進む（ローカルURLがあればそれでも進める）
  const handleNextToStep2 = () => {
    if (uploadedImageUrl || localPreviewUrl) {
      setCurrentStep(2)
    }
  }

  // ステップ2から1へ戻る
  const handleBackToStep1 = () => {
    setCurrentStep(1)
    
    // 画像状態をクリア（ステップ1は「画像選択」のステップなので、戻る = 選択をやり直す）
    setUploadedImageUrl(null)
    setImagePreview(null)
    
    // ローカルBlob URLのクリーンアップ
    if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl)
    }
    setLocalPreviewUrl(null)
    
    // アップロード状態をリセット
    setIsUploading(false)
    
    // UploadSectionをリセット（親子の状態を同期）
    setResetUploadTrigger(prev => prev + 1)
    
    // ステップ2の選択状態は保持（ユーザーが再度ステップ2に進んだ時に選択が残る）
    // 完全にリセットしたい場合は以下のコメントを外す：
    // setSelectedText('')
    // setSelectedStyles([])
    // setSelectedPosition('')
  }

  // ステップ2から3へ進む（生成実行）
  const handleGenerate = async (formData: FormData) => {
    // フォームデータに選択値を設定（隠しフィールドから読み取るか、状態から設定）
    if (uploadedImageUrl) {
      formData.set('imageUrl', uploadedImageUrl)
    }
    // フォームから送信された値を使用（隠しフィールドから）
    let textPhraseId = (formData.get('textPhraseId') as string) || selectedText
    const textPhraseCustomRaw = (formData.get('textPhraseCustom') as string) || textPhraseCustom
    const textPhraseCustomValue = textPhraseCustomRaw.trim()
    const styleIdsRaw = (formData.get('styleIds') as string) || selectedStyles.join(',')
    let styleIds = styleIdsRaw
      ? styleIdsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : []
    let positionId = (formData.get('positionId') as string) || selectedPosition
    const outputFormat = formData.get('outputFormat') as string || 'jpeg'

    // options がある場合は「存在するIDだけ」に整形して、サーバで 400 にならないようにする
    if (options) {
      const validTextIds = new Set(options.textPhrases.map(p => p.id))
      const validStyleIds = new Set(options.styles.map(s => s.id))
      const validPositionIds = new Set(options.positions.map(p => p.id))

      if (!validTextIds.has(textPhraseId)) textPhraseId = ''
      styleIds = styleIds.filter(id => validStyleIds.has(id))
      if (!validPositionIds.has(positionId)) positionId = ''
    }

    // バリデーション: 必須項目が選択されているか確認（クリーンアップ後の値で判定）
    const errors: string[] = []
    if (!textPhraseId && !textPhraseCustomValue) {
      errors.push('どのクゥーにする？を選択してください')
    }
    if (styleIds.length === 0) {
      errors.push('どんなクゥーにする？を1つ以上選択してください')
    }
    if (!positionId) {
      errors.push('配置場所を選択してください')
    }

    if (errors.length > 0) {
      setValidationErrors(errors)
      setShowValidationModal(true)
      return
    }
    
    // 値を確実に設定
    formData.set('textPhraseId', textPhraseId)
    formData.set('textPhraseCustom', textPhraseCustomValue)
    formData.set('styleIds', styleIds.join(','))
    formData.set('positionId', positionId)
    formData.set('outputFormat', outputFormat)
    
    // 生成を実行（ステップ3への移動はuseEffectで自動的に行われる）
    try {
      await formAction(formData)
    } catch (e: unknown) {
      console.error('Generate action threw:', e)
      setGenerateErrorMessage(e instanceof Error ? e.message : String(e))
      setShowGenerateErrorModal(true)
    }
  }

  // 最初からやり直す
  const handleReset = () => {
    setCurrentStep(1)
    setUploadedImageUrl(null)
    setImagePreview(null)
    // ローカルBlob URLのクリーンアップ
    if (localPreviewUrl && localPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(localPreviewUrl)
    }
    setLocalPreviewUrl(null)
    setSelectedText('')
    setTextPhraseCustom('')
    setSelectedStyles([])
    setSelectedPosition('')
  }

  // ステップインジケーターの表示（バウンス・カーニバルデザイン）
  const renderStepIndicator = () => {
    const step1Active = currentStep === 1
    const step2Active = currentStep === 2
    const step3Active = currentStep === 3
    const step1Completed = (uploadedImageUrl || localPreviewUrl) && !step1Active
    const step2Completed = (step3Active || (uploadedImageUrl && selectedText && selectedStyles.length > 0 && selectedPosition)) && !step2Active

    const CheckIcon = ({ className }: { className?: string }) => (
      <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    )

    const stepColors = [
      'from-purple-500 to-pink-500',
      'from-pink-500 to-cyan-500',
      'from-cyan-500 to-purple-500',
    ]

    const steps = [
      {
        number: 1,
        label: '画像選択',
        isActive: step1Active,
        isCompleted: step1Completed,
        progress: step1Active ? 50 : step1Completed ? 100 : 0,
      },
      {
        number: 2,
        label: 'スタイル',
        isActive: step2Active,
        isCompleted: step2Completed,
        progress: step2Active ? 50 : step2Completed ? 100 : (step1Completed ? 0 : 0),
      },
      {
        number: 3,
        label: '生成',
        isActive: step3Active,
        isCompleted: false,
        progress: step3Active ? 50 : (step2Completed ? 0 : 0),
      },
    ]

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-base-content/70 uppercase tracking-wide">進捗</span>
          <span className="text-sm font-bold text-primary">
            {currentStep}/3
          </span>
        </div>
        
        <div className="flex items-center gap-3 mb-4">
          {steps.map((step, index) => {
            const colorClass = stepColors[index % stepColors.length]
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* 波打つプログレスバー */}
                <div className="relative flex-1 h-2.5 rounded-full overflow-hidden bg-base-300">
                  {step.progress > 0 && (
                    <div 
                      className={`absolute inset-0 rounded-full bg-gradient-to-r ${colorClass} wave-progress`}
                      style={{ width: `${step.progress}%` }}
                    />
                  )}
                </div>
                
                {/* ステップ番号 */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ml-2 transition-all duration-300 ${
                  step.isActive
                    ? `bg-gradient-to-br ${colorClass} text-white shadow-lg scale-110 bounce-step sparkle-container`
                    : step.isCompleted
                    ? `bg-gradient-to-br ${colorClass} text-white shadow-md rotate-check`
                    : 'bg-base-200 text-base-content/40'
                }`}>
                  {step.isCompleted ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-bold">{step.number}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* ラベル */}
        <div className="flex items-center justify-between mt-3 text-xs sm:text-sm">
          {steps.map((step) => (
            <span 
              key={step.number}
              className={`font-medium transition-colors ${
                step.isActive ? 'text-primary font-bold' : 'text-base-content/60'
              }`}
            >
              {step.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-7xl">
      {/* ヘッダー */}
      <header className="mb-10 sm:mb-14 text-center">
        <div className="relative mb-6 p-4
                        bg-gradient-to-br from-slate-900 to-slate-800
                        rounded-lg
                        border-4 border-yellow-500">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold
                         text-white
                         [text-shadow:_3px_3px_0_rgb(234,179,8),
                                     -3px_-3px_0_rgb(236,72,153),
                                     3px_-3px_0_rgb(139,92,246),
                                     -3px_3px_0_rgb(6,182,212)]
                         [filter:drop-shadow(0_0_10px_rgba(234,179,8,0.5))]">
            くぅーストーリージェネレーター
          </h1>
          {/* スプレー装飾 */}
          <div className="absolute -top-2 -left-2 w-8 h-8 bg-yellow-500/50 rounded-full blur-sm animate-spray" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-pink-500/50 rounded-full blur-sm animate-spray" style={{ animationDelay: '0.3s' }} />
        </div>
        <p className="text-base sm:text-lg text-base-content/70 font-normal leading-relaxed
                      max-w-2xl mx-auto">
          あなただけのくぅーストーリーを作成できます
        </p>
      </header>
      
      {/* ステップインジケーター */}
      {renderStepIndicator()}

      {/* ステップ1: 画像選択画面 */}
      {currentStep === 1 && (
        <div className="max-w-3xl mx-auto">
          <section className="card bg-base-100 shadow-lg border border-base-200 rounded-xl hover:shadow-xl transition-all duration-300 glass-card">
            <div className="card-body p-6 sm:p-8">
              <h2 className="card-title text-xl font-bold text-base-content mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 bg-[length:200%_200%] text-white text-2xl font-bold shadow-lg drop-shadow-md animate-gradient-flow">①</span>
                <span>画像を選ぶ</span>
              </h2>
              <UploadSection
                onImageSelected={handleImageSelected}
                onUploadStateChange={handleUploadStateChange}
                disabled={pending}
                resetTrigger={resetUploadTrigger}
              />
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextToStep2}
                  disabled={(!uploadedImageUrl && !localPreviewUrl) || pending || isUploading}
                  className="h-16 px-10 rounded-xl font-bold text-lg text-white
                    bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
                    bg-[length:200%_200%] shadow-lg
                    transition-all duration-300
                    hover:scale-105 hover:-translate-y-1
                    hover:shadow-[0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(139,92,246,0.3),0_0_60px_rgba(6,182,212,0.2)]
                    active:scale-95
                    focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                    animate-gradient-flow
                  "
                >
                  <span className="flex items-center justify-center gap-2">
                    次へ
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ステップ2: スタイル選択画面 */}
      {currentStep === 2 && (
        <div className="max-w-3xl mx-auto">
          <section className="card bg-base-100 shadow-lg border border-base-200 rounded-xl hover:shadow-xl transition-all duration-300 animate-[fadeIn_0.3s_ease-in-out_forwards] glass-card">
            <div className="card-body p-6 sm:p-8">
              <h2 className="card-title text-xl font-bold text-base-content mb-6 flex items-center gap-3">
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 bg-[length:200%_200%] text-white text-2xl font-bold shadow-lg drop-shadow-md animate-gradient-flow">②</span>
                <span>スタイルを決める</span>
              </h2>

              {/* エラー表示（見落とし防止のためカード内に表示） */}
              {state.status === 'error' && (
                <div className="mb-6 alert alert-error shadow-xl rounded-xl border-2 border-error/30" role="alert">
                  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-bold text-base mb-1">エラーが発生しました</h3>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{state.message}</div>
                  </div>
                </div>
              )}

              {imagePreview && (
                <div className="mb-6 p-4 bg-base-200 rounded-xl">
                  <p className="text-sm font-semibold text-base-content/70 mb-2">選択中の画像</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={imagePreview} 
                    alt="選択された画像のプレビュー" 
                    className="max-h-32 rounded-lg shadow-md"
                    fetchPriority="high"
                    onLoad={() => {
                      // ローカルURL表示中でリモートURLが準備できている場合、リモートURLに切り替え
                      if (localPreviewUrl && uploadedImageUrl && imagePreview === localPreviewUrl) {
                        setImagePreview(uploadedImageUrl)
                      }
                    }}
                  />
                </div>
              )}
              <form action={handleGenerate} noValidate>
                <input type="hidden" name="outputFormat" value={outputFormat} />
                <input type="hidden" name="imageUrl" value={uploadedImageUrl ?? ''} />
                <input type="hidden" name="textPhraseId" value={selectedText} />
                <input type="hidden" name="textPhraseCustom" value={textPhraseCustom} />
                <input type="hidden" name="styleIds" value={selectedStyles.join(',')} />
                <input type="hidden" name="positionId" value={selectedPosition} />
                {options && options.textPhrases && options.styles && options.positions ? (
                  <StyleSection
                    options={options}
                    disabled={pending}
                    selectedText={selectedText}
                    textPhraseCustom={textPhraseCustom}
                    allowCustomText={allowCustomText}
                    selectedStyles={selectedStyles}
                    selectedPosition={selectedPosition}
                    onTextChange={setSelectedText}
                    onTextPhraseCustomChange={setTextPhraseCustom}
                    onStylesChange={setSelectedStyles}
                    onPositionChange={setSelectedPosition}
                  />
                ) : (
                  <div className="text-center text-secondary animate-pulse py-10 text-lg font-medium">読み込み中... 🍬</div>
                )}
                <div className="mt-8 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    disabled={pending}
                    className="h-14 px-8 rounded-xl font-bold text-base sm:text-lg
                      bg-base-200 text-base-content
                      shadow-md hover:shadow-lg
                      transition-all duration-200
                      focus:outline-none focus:ring-3 focus:ring-base-300 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed
                      hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0
                    "
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                      戻る
                    </span>
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="h-16 px-10 rounded-xl font-bold text-lg text-white
                      bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
                      bg-[length:200%_200%] shadow-lg
                      transition-all duration-300
                      hover:scale-105 hover:-translate-y-1
                      hover:shadow-[0_0_20px_rgba(236,72,153,0.5),0_0_40px_rgba(139,92,246,0.3),0_0_60px_rgba(6,182,212,0.2)]
                      active:scale-95
                      focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0
                      animate-gradient-flow
                    "
                  >
                    {pending ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>生成中...</span>
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        生成する
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* 生成中ローディング画面 */}
          {pending && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="relative card bg-base-100/95 shadow-2xl border border-base-200 rounded-2xl p-8 sm:p-10 max-w-lg w-full mx-4 animate-scale-in overflow-hidden">
                {/* 回転するグラデーションリング（背景） */}
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: 'conic-gradient(from 0deg, #ec4899, #8b5cf6, #06b6d4, #ec4899)',
                    animation: 'spin 3s linear infinite',
                  }}
                />

                <div className="relative z-10 text-center">
                  {/* 中央のローディングスピナー */}
                  <div className="mb-8 flex justify-center">
                    <div className="relative">
                      <span className="loading loading-ring loading-xl text-primary"></span>
                    </div>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent">
                      画像を生成しています...
                    </span>
                  </h3>

                  <p className="text-base-content/70 text-sm sm:text-base">
                    「くぅー」が生まれる瞬間を<br className="sm:hidden" />お楽しみください！
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ステップ3: 生成完了・ダウンロード画面 */}
      {currentStep === 3 && state.status === 'success' && (
        <div className="max-w-4xl mx-auto">
          <section className="card bg-base-100 shadow-2xl border-2 border-primary/30 rounded-2xl overflow-hidden animate-[fadeInScale_0.5s_ease-out_forwards] glass-card">
            <div className="card-body p-6 sm:p-8">
              <h2 className="card-title text-2xl font-bold text-base-content justify-center mb-6">
                ✨ クゥーが誕生しました！
              </h2>
              {imageLoadError && (
                <div className="mb-6 alert alert-error shadow-xl rounded-xl border-2 border-error/30" role="alert" aria-live="polite">
                  <div>
                    <h3 className="font-bold text-base mb-1">画像の表示に失敗しました</h3>
                    <p className="text-sm leading-relaxed">
                      画像URLの期限切れや削除の可能性があります。再生成してください。
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setImageLoadError(false)
                        setCurrentStep(2)
                      }}
                      className="mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-lg font-bold text-sm text-white
                        bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500
                        bg-[length:200%_200%] shadow-md
                        transition-all duration-200
                        hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98]
                        focus:outline-none focus:ring-3 focus:ring-purple-500 focus:ring-offset-2
                        animate-gradient-flow
                      "
                    >
                      もう一度生成する
                    </button>
                  </div>
                </div>
              )}
              <figure className="bg-gradient-to-br from-base-200 to-base-100 p-6 sm:p-8 rounded-xl mb-6">
                {state.imageUrl.startsWith('http') ? (
                  <Image
                    src={state.imageUrl}
                    alt="生成されたくぅー画像"
                    width={state.width}
                    height={state.height}
                    className="rounded-xl shadow-xl max-w-full h-auto mx-auto transition-transform duration-300 hover:scale-[1.02]"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={state.imageUrl}
                    alt="生成されたくぅー画像"
                    className="rounded-xl shadow-xl max-w-full h-auto mx-auto transition-transform duration-300 hover:scale-[1.02]"
                    onError={() => setImageLoadError(true)}
                  />
                )}
              </figure>
              <SaveActions
                imageUrl={state.imageUrl}
                mimeType={state.mimeType}
                width={state.width}
                height={state.height}
              />
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={handleReset}
                  className="h-14 px-8 rounded-xl font-semibold text-base
                    bg-base-300 text-base-content
                    border-2 border-base-400
                    shadow-md hover:shadow-lg hover:bg-base-400
                    transition-all duration-200
                    focus:outline-none focus:ring-3 focus:ring-base-400 focus:ring-offset-2
                    hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0
                  "
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    最初からやり直す
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* バリデーションエラーモーダル */}
      {showValidationModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowValidationModal(false)}
        >
          <div 
            className="bg-base-100 rounded-2xl p-6 sm:p-8 max-w-lg w-full mx-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                <svg 
                  className="h-7 w-7 text-error" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-base-content mb-2">
                  必須項目が不足しています
                </h3>
                <p className="text-base text-base-content/70">
                  以下の項目を選択してください：
                </p>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center transition-colors"
                aria-label="閉じる"
              >
                <svg 
                  className="h-5 w-5 text-base-content" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* エラーリスト */}
            <div className="mb-6">
              <ul className="space-y-3">
                {validationErrors.map((error, idx) => (
                  <li 
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-error/5 rounded-lg border border-error/20"
                  >
                    <svg 
                      className="h-5 w-5 text-error flex-shrink-0 mt-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    <span className="text-base text-base-content font-medium flex-1">
                      {error}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* フッター */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationModal(false)}
                className="h-12 px-8 rounded-xl font-bold text-base text-white
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
                了解しました
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 生成失敗エラーモーダル（生成後に「何も出ない」を防ぐ） */}
      {showGenerateErrorModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowGenerateErrorModal(false)}
        >
          <div
            className="bg-base-100 rounded-2xl p-6 sm:p-8 max-w-xl w-full mx-4 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error/20 flex items-center justify-center">
                <svg className="h-7 w-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-base-content mb-2">画像生成に失敗しました</h3>
                <p className="text-base text-base-content/70">もう一度試すか、設定を確認してください。</p>
              </div>
              <button
                onClick={() => setShowGenerateErrorModal(false)}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-base-200 hover:bg-base-300 flex items-center justify-center transition-colors"
                aria-label="閉じる"
              >
                <svg className="h-5 w-5 text-base-content" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="p-4 rounded-xl bg-base-200 border border-base-300">
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-base-content">{generateErrorMessage}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowGenerateErrorModal(false)}
                className="h-12 px-6 rounded-xl font-bold text-base bg-base-200 text-base-content shadow-md hover:shadow-lg transition-all duration-200"
              >
                閉じる
              </button>
              <button
                type="button"
                onClick={() => setShowGenerateErrorModal(false)}
                className="h-12 px-8 rounded-xl font-bold text-base text-white
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
