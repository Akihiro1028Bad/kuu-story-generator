import { textPhraseOptions } from '@/app/lib/presets/textPhraseOptions'
import { stylePresets } from '@/app/lib/presets/stylePresets'
import { positionPresets } from '@/app/lib/presets/positionPresets'

export function validateSelections(
  textPhraseId: string,
  styleIds: string[],
  positionId: string
): boolean {
  if (!textPhraseId || styleIds.length === 0 || !positionId) return false
  
  const textPhrase = textPhraseOptions.find(o => o.id === textPhraseId)
  const position = positionPresets.find(p => p.id === positionId)
  
  // すべてのスタイルIDが有効かチェック
  const allStylesValid = styleIds.every(id => stylePresets.some(p => p.id === id))

  return !!(textPhrase && allStylesValid && position)
}

