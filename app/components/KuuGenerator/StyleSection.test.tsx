/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, vi } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { StyleSection, __test__ } from './StyleSection'

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

  it('UT-055: コールバックが未定義の場合は内部状態で管理する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} allowCustomText />)
    })

    // カスタムテキストの入力（onTextPhraseCustomChangeが未定義の場合）
    const customTextInput = container.querySelector('input[placeholder="例: これはわたしだけのクゥー"]') as HTMLInputElement
    await act(async () => {
      customTextInput.value = 'カスタムテキスト'
      customTextInput.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(customTextInput.value).toBe('カスタムテキスト')

    // スタイルの選択解除（onStylesChangeが未定義の場合）
    const styleInput = container.querySelector('input[aria-label="スタイル1: desc1"]') as HTMLInputElement
    await act(async () => {
      styleInput.click() // 選択
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(styleInput.checked).toBe(true)

    await act(async () => {
      styleInput.click() // 選択解除
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(styleInput.checked).toBe(false)
  })

  it('UT-056: カスタムテキスト入力のonChangeハンドラーが動作する', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} allowCustomText />)
    })

    const customTextInput = container.querySelector('input[placeholder="例: これはわたしだけのクゥー"]') as HTMLInputElement
    await act(async () => {
      customTextInput.value = 'テストテキスト'
      customTextInput.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(customTextInput.value).toBe('テストテキスト')
  })

  it('UT-057: コールバック未定義時にカスタムテキストの内部状態が更新される', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(<StyleSection options={options} allowCustomText />)
    })

    const customTextInput = container.querySelector('input[placeholder="例: これはわたしだけのクゥー"]') as HTMLInputElement
    
    // カスタムテキストを入力（onTextPhraseCustomChangeが未定義の場合）
    await act(async () => {
      customTextInput.value = 'カスタムテキスト'
      customTextInput.dispatchEvent(new Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    // 内部状態が更新されていることを確認（値が保持されている）
    expect(customTextInput.value).toBe('カスタムテキスト')
  })

  it('UT-058: コールバック未定義時にスタイル選択解除の内部状態が更新される', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    // コールバックを渡さず、内部状態を使う
    await act(async () => {
      root.render(<StyleSection options={options} />)
    })

    const styleInput = container.querySelector('input[aria-label="スタイル1: desc1"]') as HTMLInputElement
    expect(styleInput.checked).toBe(false)

    // まずスタイルを選択
    await act(async () => {
      styleInput.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    expect(styleInput.checked).toBe(true)

    // スタイルを選択解除（onStylesChangeが未定義の場合）
    await act(async () => {
      styleInput.click()
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
    // 内部状態が更新されていることを確認（チェックが外れている）
    expect(styleInput.checked).toBe(false)
  })

  it('UT-059: ランダム関数が非正の値を扱い、暗号学的乱数を優先する', () => {
    const originalCrypto = globalThis.crypto
    const getRandomValues = vi.fn((buf: Uint32Array) => {
      buf[0] = 0xffffffff
      return buf
    })
    vi.stubGlobal('crypto', { getRandomValues })

    expect(__test__.randomIntInclusive(0)).toBe(0)
    const value = __test__.randomIntInclusive(3)
    expect(getRandomValues).toHaveBeenCalled()
    expect(value).toBeLessThanOrEqual(3)

    vi.stubGlobal('crypto', originalCrypto)
  })

  it('UT-060: 暗号学的乱数が使えない場合はMath.randomを使う', () => {
    const originalCrypto = globalThis.crypto
    vi.stubGlobal('crypto', undefined)
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.6)

    const value = __test__.randomIntInclusive(4)
    expect(randomSpy).toHaveBeenCalled()
    expect(value).toBe(3)

    randomSpy.mockRestore()
    vi.stubGlobal('crypto', originalCrypto)
  })

  it('UT-061: 空のoptionsでもクラッシュせずに描画できる', async () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    await act(async () => {
      root.render(
        <StyleSection
          options={{ textPhrases: [], styles: [], positions: [] }}
        />
      )
    })

    expect(container.textContent).not.toContain('読み込み中')
  })
})
