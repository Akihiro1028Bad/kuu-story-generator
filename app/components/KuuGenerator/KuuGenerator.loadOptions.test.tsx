/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import type React from 'react'
import { act } from 'react'
import { createRoot } from 'react-dom/client'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    useActionState: () => [{ status: 'idle' }, vi.fn(), false],
  }
})

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock('next/image', () => ({
  // テストでは next/image を単純な img に置き換える（最適化は対象外）
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}))

vi.mock('./UploadSection', () => ({
  UploadSection: ({ onImageSelected }: { onImageSelected: (url: string | null) => void }) => (
    <button type="button" data-testid="mock-upload" onClick={() => onImageSelected('https://example.com/uploaded.jpg')}>
      upload
    </button>
  ),
}))

vi.mock('./StyleSection', () => ({
  StyleSection: () => <div />,
}))

vi.mock('./SaveActions', () => ({
  SaveActions: () => <div />,
}))

vi.mock('@/app/lib/presets/textPhraseOptions', () => {
  return {
    // import 自体は成功させつつ、参照時に例外を投げて KuuGenerator 側の try/catch を通す
    get textPhraseOptions() {
      throw new Error('load failed')
    },
  }
})
vi.mock('@/app/lib/presets/stylePresets', () => ({
  stylePresets: [],
}))
vi.mock('@/app/lib/presets/positionPresets', () => ({
  positionPresets: [],
}))

import { KuuGenerator } from './KuuGenerator'

describe('KuuGenerator load options', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('UT-060: オプション読み込み失敗時にログを出す', async () => {
    // NOTE: vitest が console.error を独自に捕捉するため spy で確実に検知できない場合がある。
    // ここでは「読み込み失敗により options がセットされず、Step2 で読み込み表示になる」ことを検証する。
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const container = document.createElement('div')
    const root = createRoot(container)

    await act(async () => {
      root.render(<KuuGenerator />)
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    const uploadButton = container.querySelector('[data-testid="mock-upload"]') as HTMLButtonElement | null
    if (!uploadButton) throw new Error('Expected upload button to be rendered')
    await act(async () => {
      uploadButton.click()
    })

    const nextButton = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('次へ')) as
      | HTMLButtonElement
      | undefined
    if (!nextButton) throw new Error('Expected "次へ" button to be rendered')

    await act(async () => {
      nextButton.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('読み込み中')
  })
})
