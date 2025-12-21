/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { StyleSection } from './StyleSection'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const options = {
  textPhrases: [
    { id: 't1', label: 'テキスト1', text: 'text1' },
    { id: 't2', label: 'テキスト2', text: 'text2' },
  ],
  styles: Array.from({ length: 11 }, (_, i) => ({
    id: `s${i + 1}`,
    label: `スタイル${i + 1}`,
    description: `desc${i + 1}`,
    promptHint: `hint${i + 1}`,
    category: 'other',
  })),
  positions: [
    { id: 'p1', label: '左上', placementHint: '左上' },
    { id: 'p2', label: '右下', placementHint: '右下' },
  ],
}

describe('StyleSection', () => {
  it('UT-050: optionsがない場合は読み込み表示を出す', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={null} />)
    })

    expect(container.textContent).toContain('読み込み中')
  })

  it('UT-051: 内部状態で選択が更新される', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} allowCustomText />)
    })

    const textRadio = container.querySelector('input[aria-label="テキスト1"]') as HTMLInputElement
    await act(async () => {
      textRadio.click()
    })
    expect(textRadio.checked).toBe(true)

    const styleInput = container.querySelector('input[aria-label="スタイル1: desc1"]') as HTMLInputElement
    await act(async () => {
      styleInput.click()
    })
    expect(styleInput.checked).toBe(true)

    const positionInput = container.querySelector('input[aria-label="左上"]') as HTMLInputElement
    await act(async () => {
      positionInput.click()
    })
    expect(positionInput.checked).toBe(true)
  })

  it('UT-052: コールバックがある場合は親へ通知する', async () => {
    const onTextChange = vi.fn()
    const onStylesChange = vi.fn()
    const onPositionChange = vi.fn()

    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <StyleSection
          options={options}
          selectedText="t1"
          selectedStyles={[]}
          selectedPosition=""
          onTextChange={onTextChange}
          onStylesChange={onStylesChange}
          onPositionChange={onPositionChange}
        />
      )
    })

    const textRadio = container.querySelector('input[aria-label="テキスト2"]') as HTMLInputElement
    await act(async () => {
      textRadio.click()
    })
    expect(onTextChange).toHaveBeenCalledWith('t2')

    const styleInput = container.querySelector('input[aria-label="スタイル2: desc2"]') as HTMLInputElement
    await act(async () => {
      styleInput.click()
    })
    expect(onStylesChange).toHaveBeenCalled()

    const positionInput = container.querySelector('input[aria-label="右下"]') as HTMLInputElement
    await act(async () => {
      positionInput.click()
    })
    expect(onPositionChange).toHaveBeenCalledWith('p2')
  })

  it('UT-053: 検索結果が0件の場合はメッセージを表示する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} />)
    })

    const searchInput = container.querySelector('input[placeholder="🔍 検索..."]') as HTMLInputElement
    await act(async () => {
      searchInput.value = 'no-match'
      // onInput を使っているため input を発火
      searchInput.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(container.textContent).toContain('該当するスタイルが見つかりません')
  })

  it('UT-054: 選択上限に達した場合は追加を拒否する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} />)
    })

    const styleInputs = Array.from(
      container.querySelectorAll('input[type="checkbox"]')
    ) as HTMLInputElement[]

    await act(async () => {
      styleInputs.slice(0, 10).forEach((input) => {
        input.click()
      })
    })

    const eleventh = styleInputs[10]
    await act(async () => {
      eleventh.click()
    })

    expect(eleventh.checked).toBe(false)
  })
})
