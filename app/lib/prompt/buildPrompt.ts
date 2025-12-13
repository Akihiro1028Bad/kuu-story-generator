import { TextPhraseOption } from '@/app/lib/presets/textPhraseOptions'
import { StylePreset } from '@/app/lib/presets/stylePresets'
import { PositionPreset } from '@/app/lib/presets/positionPresets'

export function buildPrompt(
  textPhrase: TextPhraseOption,
  styles: StylePreset[],
  position: PositionPreset
): string {
  // 外部AIへの指示（プロンプト）
  //
  // Geminiの画像編集は「提供画像を前提に、変更点を限定し、他は変えない」を明確にすると安定しやすい。
  // ここでは UI/Spec に合わせ日本語中心にしつつ、失敗しやすい要点は英語でも補強する（任意だが実運用で効くことが多い）。

  const styleHints = summarizeStyleHints(styles)

  // 重要: 追加する文字列は「完全一致」を強く要求する（勝手な変換/装飾/追記を抑制）
  const exactText = textPhrase.text

  return [
    '【タスク】提供された画像に文字を追加（画像編集）',
    `【追加する文字】「${exactText}」（表記は完全一致。改行・変換・言い換え・追加文字は禁止）`,
    `【配置】${position.placementHint}`,
    `【スタイル】オシャレで遊び心があり、写真のシチュレーションに合うスタイルで追加で次の要素を取り入れる: ${styleHints}`,
    '【制約】',
    '- 変更するのは「文字の追加」だけ。その他（被写体/背景/色味/構図/光/質感）は可能な限り維持する',
    '- 画像のトリミング、リサイズ、回転、余白追加はしない',
    '- 余計な文字やロゴ、透かし、記号を追加しない',
    '- 文字は読みやすいサイズにし、背景と十分なコントラストを確保する',
    '',
  ].join('\n')
}

function summarizeStyleHints(styles: StylePreset[]): string {
  // 生成系モデルは長い列挙が続くと注意が散りやすいので、重複除去＋上限を設ける
  // Gemini APIのプロンプト長制限は十分に大きいため、10個程度まで表示可能
  // ただし、選択数が少ない場合は全て表示し、多い場合のみ制限する
  const MAX_HINTS = 10
  const seen = new Set<string>()
  const unique = styles
    .map(s => s.promptHint?.trim())
    .filter((h): h is string => Boolean(h))
    .filter(h => {
      if (seen.has(h)) return false
      seen.add(h)
      return true
    })

  // 選択数が少ない場合は全て表示、多い場合のみ制限
  if (unique.length <= MAX_HINTS) return unique.join('、')
  return `${unique.slice(0, MAX_HINTS).join('、')}、ほか`
}

