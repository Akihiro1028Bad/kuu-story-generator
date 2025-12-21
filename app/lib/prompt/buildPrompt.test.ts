import { describe, it, expect } from 'vitest'
import { buildPrompt } from './buildPrompt'
import { StylePreset } from '@/app/lib/presets/stylePresets'
import { PositionPreset } from '@/app/lib/presets/positionPresets'

describe('buildPrompt', () => {
  const mockTextPhrase = 'くぅー'
  const mockStyle: StylePreset = { id: 'pop', label: 'ポップ', description: 'desc', promptHint: 'ポップなスタイル', category: 'pop' }
  const mockPosition: PositionPreset = { id: 'top-left', label: '左上', placementHint: '画像の左上' }

  it('UT-001: 正常系 - プロンプトが正しく生成される（単一スタイル）', () => {
    const prompt = buildPrompt(mockTextPhrase, [mockStyle], mockPosition)
    expect(prompt).toBe(
      [
        '【タスク】提供された画像に文字を追加（画像編集）',
        '【追加する文字】「くぅー」（表記は完全一致。改行・変換・言い換え・追加文字は禁止）',
        '【配置】画像の左上',
        '【スタイル】オシャレで遊び心があり、写真のシチュレーションに合うスタイルで追加で次の要素を取り入れる: ポップなスタイル',
        '【制約】',
        '- 変更するのは「文字の追加」だけ。その他（被写体/背景/色味/構図/光/質感）は可能な限り維持する',
        '- 画像のトリミング、リサイズ、回転、余白追加はしない',
        '- 余計な文字やロゴ、透かし、記号を追加しない',
        '- 文字は読みやすいサイズにし、背景と十分なコントラストを確保する',
        '',
      ].join('\n')
    )
  })

  it('UT-002: 正常系 - プロンプトが正しく生成される（複数スタイル）', () => {
    const mockStyle2: StylePreset = { id: 'cute', label: 'かわいい', description: 'desc', promptHint: 'かわいいスタイル', category: 'cute' }
    const prompt = buildPrompt(mockTextPhrase, [mockStyle, mockStyle2], mockPosition)
    expect(prompt).toBe(
      [
        '【タスク】提供された画像に文字を追加（画像編集）',
        '【追加する文字】「くぅー」（表記は完全一致。改行・変換・言い換え・追加文字は禁止）',
        '【配置】画像の左上',
        '【スタイル】オシャレで遊び心があり、写真のシチュレーションに合うスタイルで追加で次の要素を取り入れる: ポップなスタイル、かわいいスタイル',
        '【制約】',
        '- 変更するのは「文字の追加」だけ。その他（被写体/背景/色味/構図/光/質感）は可能な限り維持する',
        '- 画像のトリミング、リサイズ、回転、余白追加はしない',
        '- 余計な文字やロゴ、透かし、記号を追加しない',
        '- 文字は読みやすいサイズにし、背景と十分なコントラストを確保する',
        '',
      ].join('\n')
    )
  })

  it('UT-003: 正常系 - スタイルが多い場合はヒントを圧縮する（最大10件+ほか）', () => {
    const styles: StylePreset[] = [
      { id: 's1', label: 's1', description: 'd', promptHint: 'ヒント1', category: 'other' },
      { id: 's2', label: 's2', description: 'd', promptHint: 'ヒント2', category: 'other' },
      { id: 's3', label: 's3', description: 'd', promptHint: 'ヒント3', category: 'other' },
      { id: 's4', label: 's4', description: 'd', promptHint: 'ヒント4', category: 'other' },
      { id: 's5', label: 's5', description: 'd', promptHint: 'ヒント5', category: 'other' },
      { id: 's6', label: 's6', description: 'd', promptHint: 'ヒント6', category: 'other' },
      { id: 's7', label: 's7', description: 'd', promptHint: 'ヒント7', category: 'other' },
      { id: 's8', label: 's8', description: 'd', promptHint: 'ヒント8', category: 'other' },
      { id: 's9', label: 's9', description: 'd', promptHint: 'ヒント9', category: 'other' },
      { id: 's10', label: 's10', description: 'd', promptHint: 'ヒント10', category: 'other' },
      { id: 's11', label: 's11', description: 'd', promptHint: 'ヒント11', category: 'other' },
    ]
    const prompt = buildPrompt(mockTextPhrase, styles, mockPosition)
    expect(prompt).toContain(
      '【スタイル】オシャレで遊び心があり、写真のシチュレーションに合うスタイルで追加で次の要素を取り入れる: ヒント1、ヒント2、ヒント3、ヒント4、ヒント5、ヒント6、ヒント7、ヒント8、ヒント9、ヒント10、ほか'
    )
  })

  it('UT-034: 正常系 - 重複ヒントを除外して連結する', () => {
    const styles: StylePreset[] = [
      { id: 's1', label: 's1', description: 'd', promptHint: '重複', category: 'other' },
      { id: 's2', label: 's2', description: 'd', promptHint: '重複', category: 'other' },
      { id: 's3', label: 's3', description: 'd', promptHint: '別のヒント', category: 'other' },
    ]
    const prompt = buildPrompt(mockTextPhrase, styles, mockPosition)
    expect(prompt).toContain('重複、別のヒント')
  })

  it('UT-035: 正常系 - promptHintが空の場合は空文字になる', () => {
    const styles: StylePreset[] = [
      { id: 's1', label: 's1', description: 'd', promptHint: undefined, category: 'other' },
    ]
    const prompt = buildPrompt(mockTextPhrase, styles, mockPosition)
    expect(prompt).toContain('【スタイル】オシャレで遊び心があり、写真のシチュレーションに合うスタイルで追加で次の要素を取り入れる: ')
  })
})
