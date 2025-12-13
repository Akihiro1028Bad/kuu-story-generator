import { describe, it, expect } from 'vitest'
import { validateSelections } from './validateSelections'

describe('validateSelections', () => {
  it('UT-003: 正常系 - すべての選択肢が有効', () => {
    // 存在するIDを指定
    expect(validateSelections('1', ['1'], '1')).toBe(true)
  })

  it('UT-003-2: 正常系 - 複数のスタイルが有効', () => {
    // 複数のスタイルIDを指定
    expect(validateSelections('1', ['1', '2'], '1')).toBe(true)
  })

  it('UT-004: 異常系 - 無効な選択肢ID', () => {
    expect(validateSelections('invalid', ['1'], '1')).toBe(false)
  })

  it('UT-004-2: 異常系 - 無効なスタイルIDが含まれる', () => {
    expect(validateSelections('1', ['1', 'invalid'], '1')).toBe(false)
  })

  it('UT-005: 異常系 - 選択肢IDが未指定', () => {
    expect(validateSelections('', ['1'], '1')).toBe(false)
    expect(validateSelections('1', [], '1')).toBe(false)
    expect(validateSelections('1', ['1'], '')).toBe(false)
  })
})

