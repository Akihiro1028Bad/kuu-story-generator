import { describe, it, expect } from 'vitest'
import { toUserMessage } from './toUserMessage'

describe('toUserMessage', () => {
  it('UT-011: 正常系 - ネットワークエラーをユーザー向けメッセージに変換', () => {
    const error = new Error('Network request failed')
    expect(toUserMessage(error)).toBe('ネットワークエラーが発生しました。接続を確認して再試行してください。')
  })

  it('UT-012: 正常系 - 不明なエラーを汎用メッセージに変換', () => {
    const error = new Error('Unknown error')
    expect(toUserMessage(error)).toBe('予期しないエラーが発生しました。しばらくしてから再試行してください。')
  })
})

