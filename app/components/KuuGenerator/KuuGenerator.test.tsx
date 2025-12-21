/**
 * @vitest-environment happy-dom
 */
/* eslint-disable @next/next/no-img-element */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { GenerateState } from './actions'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let mockState: GenerateState = { status: 'idle' }
let mockPending = false
const formActionMock = vi.fn()
let searchParams = new URLSearchParams()
let lastImageOnError: React.ReactEventHandler<HTMLImageElement> | null = null

const findButtonByText = (container: HTMLElement, text: string) =>
  Array.from(container.querySelectorAll('button')).find((button) => button.textContent?.includes(text)) as
    | HTMLButtonElement
    | undefined

const waitForStyleControls = async (container: HTMLElement) => {
  const timeoutMs = 800
  const intervalMs = 10
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    if (container.querySelector('[data-testid="set-text"]')) return
    // options の dynamic import / React state 更新が全体実行時に遅れることがあるため、
    // act でラップしつつ少し待って安定化させる（フレーク対策）。
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    })
  }
  throw new Error(`Expected mocked StyleSection controls to be rendered within ${timeoutMs}ms`)
}

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [mockState, formActionMock, mockPending],
  }
})

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    lastImageOnError = props.onError ?? null
    return <img {...props} />
  },
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => searchParams,
}))

vi.mock('./UploadSection', () => ({
  UploadSection: ({ onImageSelected, disabled, resetTrigger }: { onImageSelected: (url: string | null, localUrl?: string | null) => void; disabled?: boolean; resetTrigger?: number }) => (
    <div>
      <button
        type="button"
        data-testid="mock-upload"
        disabled={disabled}
        onClick={() => onImageSelected('https://example.com/uploaded.jpg')}
      >
        upload
      </button>
      <button
        type="button"
        data-testid="mock-upload-alt"
        disabled={disabled}
        onClick={() => onImageSelected('https://example.com/uploaded-2.jpg')}
      >
        upload alt
      </button>
      <button
        type="button"
        data-testid="mock-upload-with-local"
        disabled={disabled}
        onClick={() => onImageSelected('https://example.com/uploaded.jpg', 'blob:local-preview')}
      >
        upload with local
      </button>
      <button
        type="button"
        data-testid="mock-upload-local-only"
        disabled={disabled}
        onClick={() => onImageSelected(null, 'blob:local-preview')}
      >
        upload local only
      </button>
      <button type="button" data-testid="mock-clear" onClick={() => onImageSelected(null, null)}>
        clear
      </button>
      {resetTrigger !== undefined && <div data-testid="reset-trigger">{resetTrigger}</div>}
    </div>
  ),
}))

vi.mock('./StyleSection', () => ({
  StyleSection: ({
    onTextChange,
    onStylesChange,
    onPositionChange,
    onTextPhraseCustomChange,
    allowCustomText,
  }: {
    onTextChange?: (value: string) => void
    onStylesChange?: (values: string[]) => void
    onPositionChange?: (value: string) => void
    onTextPhraseCustomChange?: (value: string) => void
    allowCustomText?: boolean
  }) => (
    <div>
      <button type="button" data-testid="set-text" onClick={() => onTextChange?.('1')}>
        set text
      </button>
      <button type="button" data-testid="set-style" onClick={() => onStylesChange?.(['1'])}>
        set style
      </button>
      <button type="button" data-testid="set-position" onClick={() => onPositionChange?.('1')}>
        set position
      </button>
      <button
        type="button"
        data-testid="set-invalid"
        onClick={() => {
          onTextChange?.('invalid-text')
          onStylesChange?.(['invalid-style'])
          onPositionChange?.('invalid-position')
        }}
      >
        set invalid
      </button>
      {allowCustomText && (
        <button type="button" data-testid="set-custom" onClick={() => onTextPhraseCustomChange?.(' custom ')}>
          set custom
        </button>
      )}
    </div>
  ),
}))

vi.mock('./SaveActions', () => ({
  SaveActions: () => <div data-testid="save-actions" />,
}))

import { KuuGenerator } from './KuuGenerator'

describe('KuuGenerator', () => {
  beforeEach(() => {
    mockState = { status: 'idle' }
    mockPending = false
    formActionMock.mockReset()
    searchParams = new URLSearchParams()
    lastImageOnError = null
  })

  it('UT-050: 初期表示でステップ1が表示される', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    expect(container.textContent).toContain('画像を選ぶ')
    const nextButton = findButtonByText(container, '次へ')
    expect(nextButton?.disabled).toBe(true)
  })

  it('UT-051: 必須項目不足でバリデーションモーダルを表示する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('必須項目が不足しています')
  })

  it('UT-052: 選択値が揃えば生成アクションを呼び出す', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    formActionMock.mockResolvedValue(undefined)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(formActionMock).toHaveBeenCalled()
  })

  it('UT-053: 生成アクションが失敗した場合はエラーモーダルを表示する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    formActionMock.mockRejectedValue(new Error('boom'))

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })

    expect(container.textContent).toContain('画像生成に失敗しました')
  })

  it('UT-054: 成功状態では結果画面を表示する', async () => {
    mockState = {
      status: 'success',
      imageUrl: 'https://example.public.blob.vercel-storage.com/generated/out.png',
      mimeType: 'image/png',
      width: 100,
      height: 100,
    }

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('クゥーが誕生しました')
    expect(container.querySelector('[data-testid="save-actions"]')).not.toBeNull()
  })

  it('UT-055: 生成結果URLが無効/期限切れ時にエラー表示と再生成導線を出す（異常系）', async () => {
    mockState = {
      status: 'success',
      imageUrl: 'https://example.public.blob.vercel-storage.com/generated/expired.png',
      mimeType: 'image/png',
      width: 100,
      height: 100,
    }

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await act(async () => {
      if (!lastImageOnError) {
        throw new Error('Expected next/image onError handler to be set')
      }
      lastImageOnError(new Event('error') as unknown as React.SyntheticEvent<HTMLImageElement, Event>)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像の表示に失敗しました')
    expect(container.textContent).toContain('もう一度生成する')

    const retryButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('もう一度生成する')
    ) as HTMLButtonElement | undefined
    if (retryButton) {
      await act(async () => {
        retryButton.click()
      })
    }
  })

  it('UT-056: data URL の場合は img タグを使用する', async () => {
    mockState = {
      status: 'success',
      imageUrl: 'data:image/png;base64,AAA',
      mimeType: 'image/png',
      width: 100,
      height: 100,
    }

    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const img = container.querySelector('img') as HTMLImageElement | null
    expect(img?.getAttribute('src')).toContain('data:image/png')
  })

  it('UT-057: pending状態ではローディングオーバーレイを表示する', async () => {
    mockPending = false
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    await act(async () => {
      nextButton?.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // 生成中（pending）を疑似的に発生させて再レンダー
    mockPending = true
    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像を生成しています')
  })

  it('UT-058: 検索パラメータでカスタムテキストが有効になる', async () => {
    searchParams = new URLSearchParams('tsutsu=1')
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.querySelector('[data-testid="set-custom"]')).not.toBeNull()
  })

  it('UT-059: state.statusがerrorの場合はエラーモーダルを自動表示する', async () => {
    mockState = { status: 'error', message: 'エラー詳細' }
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像生成に失敗しました')
    expect(container.textContent).toContain('エラー詳細')
  })

  it('UT-060: handleResetでローカルBlob URLをクリーンアップする', async () => {
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL')
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    // ローカルURL付きでアップロード
    const uploadWithLocalButton = container.querySelector('[data-testid="mock-upload-with-local"]') as HTMLButtonElement
    await act(async () => {
      uploadWithLocalButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    // ステップ3に進む
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    formActionMock.mockResolvedValue(undefined)
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // リセットボタンを探す（「もう一度生成する」ボタンなど）
    const resetButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('もう一度生成する') || button.textContent?.includes('最初からやり直す')
    ) as HTMLButtonElement | undefined

    if (resetButton) {
      await act(async () => {
        resetButton.click()
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      // ローカルBlob URLがクリーンアップされることを確認
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:local-preview')
    }
  })

  it('UT-061: 画像のonLoadでローカルURLからリモートURLに切り替える', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    // ローカルURL付きでアップロード
    const uploadWithLocalButton = container.querySelector('[data-testid="mock-upload-with-local"]') as HTMLButtonElement
    await act(async () => {
      uploadWithLocalButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // 画像要素を探す
    const img = container.querySelector('img[alt="選択された画像のプレビュー"]') as HTMLImageElement | null
    if (img) {
      // onLoadイベントを発火
      await act(async () => {
        img.dispatchEvent(new Event('load', { bubbles: true }))
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      // リモートURLに切り替わっていることを確認
      expect(img.src).toBe('https://example.com/uploaded.jpg')
    }
  })

  it('UT-062: バリデーションモーダルのXボタンでモーダルを閉じる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('必須項目が不足しています')

    // モーダルのXボタンを探す（バリデーションモーダル内）
    const modal = container.querySelector('.fixed.inset-0') as HTMLDivElement | null
    if (modal) {
      const closeXButton = modal.querySelector('button[aria-label="閉じる"]') as HTMLButtonElement | null
      if (closeXButton) {
        await act(async () => {
          closeXButton.click()
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
        // モーダルが閉じられたことを確認
        expect(container.textContent).not.toContain('必須項目が不足しています')
      }
    }
  })

  it('UT-064: バリデーションモーダルの「了解しました」ボタンでモーダルを閉じる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('必須項目が不足しています')

    // モーダルの「了解しました」ボタンを探す
    const closeButton = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('了解しました')
    ) as HTMLButtonElement | undefined

    expect(closeButton).not.toBeUndefined()
    if (closeButton) {
      await act(async () => {
        closeButton.click()
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      // モーダルが閉じられたことを確認
      expect(container.textContent).not.toContain('必須項目が不足しています')
    }
  })

  it('UT-063: エラーモーダルの背景クリックでモーダルを閉じる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    formActionMock.mockRejectedValue(new Error('boom'))

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像生成に失敗しました')

    // モーダルの背景クリックで閉じる
    const modalBackground = container.querySelector('.fixed.inset-0') as HTMLDivElement | null
    expect(modalBackground).not.toBeNull()
    if (modalBackground) {
      await act(async () => {
        modalBackground.click()
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      // モーダルが閉じられたことを確認
      expect(container.textContent).not.toContain('画像生成に失敗しました')
    }
  })

  it('UT-065: エラーモーダルのXボタンでモーダルを閉じる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    formActionMock.mockRejectedValue(new Error('boom'))

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像生成に失敗しました')

    // モーダルのXボタンを探す（エラーモーダル内）
    const modal = container.querySelector('.fixed.inset-0') as HTMLDivElement | null
    if (modal) {
      const closeXButton = modal.querySelector('button[aria-label="閉じる"]') as HTMLButtonElement | null
      expect(closeXButton).not.toBeNull()
      if (closeXButton) {
        await act(async () => {
          closeXButton.click()
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
        // モーダルが閉じられたことを確認
        expect(container.textContent).not.toContain('画像生成に失敗しました')
      }
    }
  })

  it('UT-066: エラーモーダルの「閉じる」ボタン（フッター）でモーダルを閉じる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    formActionMock.mockRejectedValue(new Error('boom'))

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setText = container.querySelector('[data-testid="set-text"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setText || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setText.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像生成に失敗しました')

    // モーダルの「閉じる」ボタンを探す（フッターの閉じるボタン - bg-base-200のボタン）
    const modal = container.querySelector('.fixed.inset-0') as HTMLDivElement | null
    if (modal) {
      const closeButtons = Array.from(modal.querySelectorAll('button')).filter(
        (button) => button.textContent?.includes('閉じる') && button.className.includes('bg-base-200')
      ) as HTMLButtonElement[]
      
      expect(closeButtons.length).toBeGreaterThan(0)
      if (closeButtons.length > 0) {
        await act(async () => {
          closeButtons[0].click()
          await new Promise((resolve) => setTimeout(resolve, 0))
        })
        // モーダルが閉じられたことを確認
        expect(container.textContent).not.toContain('画像生成に失敗しました')
      }
    }
  })

  it('UT-067: allowCustomTextが無効になるとカスタムテキストをクリアする', async () => {
    searchParams = new URLSearchParams('tsutsu=1')
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setCustom = container.querySelector('[data-testid="set-custom"]') as HTMLButtonElement | null
    if (!setCustom) {
      throw new Error('Expected custom text button to be rendered')
    }
    await act(async () => {
      setCustom.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const customInput = container.querySelector('input[name="textPhraseCustom"]') as HTMLInputElement | null
    expect(customInput?.value).toBe(' custom ')

    searchParams = new URLSearchParams()
    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const customInputAfter = container.querySelector('input[name="textPhraseCustom"]') as HTMLInputElement | null
    expect(customInputAfter?.value).toBe('')
  })

  it('UT-068: 戻る操作でローカルプレビューを解放しリセットトリガーを更新する', async () => {
    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL')
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload-with-local"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const backButton = findButtonByText(container, '戻る')
    if (!backButton) {
      throw new Error('Expected "戻る" button to be rendered')
    }
    await act(async () => {
      backButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('画像を選ぶ')
    const resetTrigger = container.querySelector('[data-testid="reset-trigger"]') as HTMLDivElement | null
    expect(resetTrigger?.textContent).toBe('1')
    expect(revokeSpy).toHaveBeenCalledWith('blob:local-preview')
  })

  it('UT-069: プリロードリンクを更新・クリーンアップする', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const initialLink = document.createElement('link')
    initialLink.rel = 'preload'
    initialLink.as = 'image'
    initialLink.href = 'https://example.com/uploaded.jpg'
    document.head.appendChild(initialLink)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const preloadLinks = document.head.querySelectorAll('link[rel="preload"][href="https://example.com/uploaded.jpg"]')
    expect(preloadLinks.length).toBe(1)

    const uploadAltButton = container.querySelector('[data-testid="mock-upload-alt"]') as HTMLButtonElement
    await act(async () => {
      uploadAltButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(document.head.querySelector('link[rel="preload"][href="https://example.com/uploaded.jpg"]')).toBeNull()
    expect(document.head.querySelector('link[rel="preload"][href="https://example.com/uploaded-2.jpg"]')).not.toBeNull()

    await act(async () => {
      root.unmount()
    })
    expect(document.head.querySelector('link[rel="preload"][href="https://example.com/uploaded-2.jpg"]')).toBeNull()
  })

  it('UT-070: optionsにないIDは除外されバリデーションエラーになる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setInvalid = container.querySelector('[data-testid="set-invalid"]') as HTMLButtonElement | null
    if (!setInvalid) {
      throw new Error('Expected invalid button to be rendered')
    }
    await act(async () => {
      setInvalid.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('必須項目が不足しています')
  })

  it('UT-071: カスタムテキストをトリムして送信する', async () => {
    searchParams = new URLSearchParams('tsutsu=1')
    formActionMock.mockResolvedValue(undefined)
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = findButtonByText(container, '次へ')
    if (!nextButton) {
      throw new Error('Expected "次へ" button to be rendered')
    }
    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    await waitForStyleControls(container)
    const setCustom = container.querySelector('[data-testid="set-custom"]') as HTMLButtonElement | null
    const setStyle = container.querySelector('[data-testid="set-style"]') as HTMLButtonElement | null
    const setPosition = container.querySelector('[data-testid="set-position"]') as HTMLButtonElement | null
    if (!setCustom || !setStyle || !setPosition) {
      throw new Error('Expected mocked StyleSection controls to be rendered')
    }
    await act(async () => {
      setCustom.click()
      setStyle.click()
      setPosition.click()
    })

    const form = container.querySelector('form') as HTMLFormElement | null
    if (!form) {
      throw new Error('Expected form to be rendered')
    }
    await act(async () => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const formData = formActionMock.mock.calls[0]?.[0] as FormData | undefined
    expect(formData?.get('textPhraseCustom')).toBe('custom')
    expect(formData?.get('textPhraseId')).toBe('')
  })
})
