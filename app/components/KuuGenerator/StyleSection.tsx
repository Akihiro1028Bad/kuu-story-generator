'use client'

import { TextPhraseOption } from '@/app/lib/presets/textPhraseOptions'
import { StylePreset } from '@/app/lib/presets/stylePresets'
import { PositionPreset } from '@/app/lib/presets/positionPresets'
import { useMemo, useRef, useState } from 'react'

function randomIntInclusive(maxInclusive: number) {
  // 0..maxInclusive を返す
  if (maxInclusive <= 0) return 0

  // ブラウザの暗号学的乱数が使える場合はそれを優先
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    const r = buf[0] / 0x1_0000_0000 // 2^32
    return Math.floor(r * (maxInclusive + 1))
  }

  return Math.floor(Math.random() * (maxInclusive + 1))
}

function shuffleArray<T>(items: T[]): T[] {
  // Fisher–Yates shuffle
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIntInclusive(i)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const __test__ = { randomIntInclusive, shuffleArray }

interface StyleSectionProps {
  options: {
    textPhrases: TextPhraseOption[]
    styles: StylePreset[]
    positions: PositionPreset[]
  } | null
  disabled?: boolean
  selectedText?: string
  textPhraseCustom?: string
  allowCustomText?: boolean
  selectedStyles?: string[]
  selectedPosition?: string
  onTextChange?: (value: string) => void
  onTextPhraseCustomChange?: (value: string) => void
  onStylesChange?: (values: string[]) => void
  onPositionChange?: (value: string) => void
}

export function StyleSection({ 
  options, 
  disabled,
  selectedText: controlledSelectedText,
  textPhraseCustom: controlledTextPhraseCustom,
  allowCustomText = false,
  selectedStyles: controlledSelectedStyles,
  selectedPosition: controlledSelectedPosition,
  onTextChange,
  onTextPhraseCustomChange,
  onStylesChange,
  onPositionChange,
}: StyleSectionProps) {
  const [internalSelectedText, setInternalSelectedText] = useState<string>('')
  const [internalTextPhraseCustom, setInternalTextPhraseCustom] = useState<string>('')
  const [internalSelectedStyles, setInternalSelectedStyles] = useState<string[]>([])
  const [internalSelectedPosition, setInternalSelectedPosition] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const styleTagRefs = useRef<{ [key: string]: HTMLLabelElement | null }>({})
  const textPhraseTagRefs = useRef<{ [key: string]: HTMLLabelElement | null }>({})

  const textPhrases = options?.textPhrases
  const styles = options?.styles
  
  // コントロールされている場合は親の値を使用、そうでなければ内部状態を使用
  const selectedText = controlledSelectedText !== undefined ? controlledSelectedText : internalSelectedText
  const textPhraseCustom =
    controlledTextPhraseCustom !== undefined ? controlledTextPhraseCustom : internalTextPhraseCustom
  const selectedStyles = controlledSelectedStyles !== undefined ? controlledSelectedStyles : internalSelectedStyles
  const selectedPosition = controlledSelectedPosition !== undefined ? controlledSelectedPosition : internalSelectedPosition
  
  // ランダムに並び替えた配列（ページリロードのたびに毎回ランダムにシャッフル）
  const shuffledTextPhrases = useMemo<TextPhraseOption[]>(() => {
    if (!textPhrases || textPhrases.length === 0) return []
    return shuffleArray(textPhrases)
  }, [textPhrases])

  const shuffledStyles = useMemo<StylePreset[]>(() => {
    if (!styles || styles.length === 0) return []
    return shuffleArray(styles)
  }, [styles])
  
  const handleTextChange = (value: string) => {
    if (onTextChange) {
      onTextChange(value)
    } else {
      setInternalSelectedText(value)
    }
  }

  const handleTextPhraseCustomChange = (value: string) => {
    if (onTextPhraseCustomChange) {
      onTextPhraseCustomChange(value)
    } else {
      setInternalTextPhraseCustom(value)
    }
  }
  
  // 選択数の上限（プロンプト側のMAX_HINTS=10に合わせて、UI側でも10個までに制限）
  const MAX_SELECTIONS = 10

  const handleStyleToggle = (styleId: string) => {
    if (selectedStyles.includes(styleId)) {
      // 選択解除は常に可能
      const newStyles = selectedStyles.filter(id => id !== styleId)
      if (onStylesChange) {
        onStylesChange(newStyles)
      } else {
        setInternalSelectedStyles(newStyles)
      }
    } else {
      // 選択追加は上限チェック
      if (selectedStyles.length >= MAX_SELECTIONS) {
        return // 上限に達している場合は何もしない
      }
      const newStyles = [...selectedStyles, styleId]
      if (onStylesChange) {
        onStylesChange(newStyles)
      } else {
        setInternalSelectedStyles(newStyles)
      }
    }
  }
  
  const handlePositionChange = (value: string) => {
    if (onPositionChange) {
      onPositionChange(value)
    } else {
      setInternalSelectedPosition(value)
    }
  }

  const filteredStyles = (styles: StylePreset[]) => {
    if (!searchQuery) return styles
    return styles.filter(style => 
      style.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      style.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  if (!options || !options.textPhrases || !options.styles || !options.positions) {
    return <div className="text-center text-secondary animate-pulse py-10 text-lg font-medium">読み込み中... 🍬</div>
  }

  return (
    <div className="space-y-8">
      {/* 1. 文言選択 - タグ形式（レスポンシブ対応） */}
      <div className="form-control w-full">
        <label className="label pb-2">
          <span className="label-text font-bold text-lg text-base-content">どのクゥーにしますか？</span>
        </label>
        <p className="text-sm text-base-content/60 mb-3">※ 1つだけ選択できます</p>
        {/* レスポンシブ対応のタグ一覧（折り返し表示） */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {shuffledTextPhrases.map((opt) => {
            const isSelected = selectedText === opt.id
            return (
              <label
                key={opt.id}
                ref={(el) => {
                  textPhraseTagRefs.current[opt.id] = el
                }}
                className={`
                  cursor-pointer px-3 py-2 sm:px-4 sm:py-2 rounded-full border-2 transition-all duration-200 flex items-center gap-2
                  ${isSelected
                    ? 'border-primary bg-primary text-primary-content shadow-md shadow-primary/30 scale-105 font-bold'
                    : 'border-base-300 bg-base-100 text-base-content hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm hover:scale-105 active:scale-95'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <input
                  type="radio"
                  name="textPhraseId"
                  value={opt.id}
                  className="sr-only"
                  onChange={(e) => handleTextChange(e.target.value)}
                  checked={isSelected}
                  disabled={disabled}
                  required
                  aria-label={opt.label}
                />
                {isSelected && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{opt.label}</span>
              </label>
            )
          })}
        </div>
        {allowCustomText && (
          <div className="mt-4">
            <label className="label pb-1">
              <span className="label-text text-sm font-semibold text-base-content/80">フリーテキスト（任意）</span>
            </label>
            <input
              type="text"
              placeholder="例: これはわたしだけのクゥー"
              value={textPhraseCustom}
              onChange={(e) => handleTextPhraseCustomChange(e.target.value)}
              className="input input-bordered w-full"
              disabled={disabled}
              aria-label="フリーテキスト入力"
            />
            <p className="mt-2 text-xs text-base-content/60">入力がある場合はフリーテキストを優先します</p>
          </div>
        )}
      </div>

      {/* 2. スタイル選択 - タグ形式（感情・雰囲気ベース） */}
      <div className="form-control w-full">
        <div className="flex items-center justify-between mb-2">
          <label className="label-text font-bold text-lg text-base-content">どんなクゥーにしますか？</label>
          {selectedStyles.length > 0 && (
            <span className={`text-sm ${selectedStyles.length >= MAX_SELECTIONS ? 'text-warning font-bold' : 'text-base-content/70'}`}>
              選択中: {selectedStyles.length}個{selectedStyles.length >= MAX_SELECTIONS ? '（上限）' : `/${MAX_SELECTIONS}個`}
            </span>
          )}
        </div>
        <p className="text-sm text-base-content/60 mb-3">※ 複数選択できます（最大{MAX_SELECTIONS}個まで）</p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 検索..."
            value={searchQuery}
            // happy-dom/vitest 環境では onChange が発火しないケースがあるため、
            // onInput を使用して確実に検索クエリを更新する
            onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
            className="input input-bordered w-full"
            disabled={disabled}
          />
        </div>

        {/* レスポンシブ対応のタグ一覧（折り返し表示） */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {filteredStyles(shuffledStyles).map(style => {
            const isSelected = selectedStyles.includes(style.id)
            const isMaxReached = selectedStyles.length >= MAX_SELECTIONS && !isSelected
            return (
              <label
                key={style.id}
                ref={(el) => {
                  styleTagRefs.current[style.id] = el
                }}
                className={`
                  cursor-pointer px-3 py-2 sm:px-4 sm:py-2 rounded-full border-2 transition-all duration-200 flex items-center gap-2
                  ${isSelected
                    ? 'border-primary bg-primary text-primary-content shadow-md shadow-primary/30 scale-105 font-bold'
                    : isMaxReached
                    ? 'border-base-300 bg-base-100 text-base-content opacity-50 cursor-not-allowed'
                    : 'border-base-300 bg-base-100 text-base-content hover:border-primary/60 hover:bg-primary/5 hover:shadow-sm hover:scale-105 active:scale-95'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleStyleToggle(style.id)}
                  disabled={disabled}
                  className="sr-only"
                  aria-label={`${style.label}: ${style.description}`}
                />
                {isSelected && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
                <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">{style.label}</span>
              </label>
            )
          })}
        </div>

        {filteredStyles(options.styles).length === 0 && searchQuery && (
          <div className="text-sm text-base-content/50 mt-2">該当するスタイルが見つかりません</div>
        )}
      </div>

      {/* 3. 位置選択 */}
      <div className="form-control w-full">
        <label className="label pb-3">
          <span className="label-text font-bold text-lg text-base-content">配置場所</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {options.positions?.map((opt) => {
            const isSelected = selectedPosition === opt.id
            return (
              <label
                key={opt.id}
                className={`
                  cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 text-center flex flex-col items-center justify-center gap-2 min-h-[5rem]
                  focus-within:ring-3 focus-within:ring-primary focus-within:ring-offset-2
                  ${isSelected
                    ? 'border-primary bg-primary text-primary-content font-bold shadow-lg shadow-primary/40 scale-[1.05] ring-2 ring-primary/50' 
                    : 'border-base-300 bg-base-100 text-base-content hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97]'
                  }
                  ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                `}
              >
                <input
                  type="radio"
                  name="positionId"
                  value={opt.id}
                  className="sr-only"
                  onChange={(e) => handlePositionChange(e.target.value)}
                  checked={isSelected}
                  disabled={disabled}
                  required
                  aria-label={opt.label}
                />
                {isSelected && (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 flex-shrink-0" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
                <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-primary-content' : 'text-base-content'}`}>
                  {opt.label}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
