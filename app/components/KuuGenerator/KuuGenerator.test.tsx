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
  UploadSection: ({ onImageSelected, disabled }: { onImageSelected: (url: string | null) => void; disabled?: boolean }) => (
    <div>
      <button
        type="button"
        data-testid="mock-upload"
        disabled={disabled}
        onClick={() => onImageSelected('https://example.com/uploaded.jpg')}
      >
        upload
      </button>
      <button type="button" data-testid="mock-clear" onClick={() => onImageSelected(null)}>
        clear
      </button>
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
})
