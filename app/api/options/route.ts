import { NextResponse } from 'next/server'
import { textPhraseOptions } from '@/app/lib/presets/textPhraseOptions'
import { stylePresets } from '@/app/lib/presets/stylePresets'
import { positionPresets } from '@/app/lib/presets/positionPresets'

export async function GET() {
  return NextResponse.json({
    textPhrases: textPhraseOptions,
    styles: stylePresets,
    positions: positionPresets,
  })
}

