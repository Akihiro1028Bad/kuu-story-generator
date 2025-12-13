import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { buildPrompt } from '@/app/lib/prompt/buildPrompt'
import { textPhraseOptions } from '@/app/lib/presets/textPhraseOptions'
import { stylePresets } from '@/app/lib/presets/stylePresets'
import { positionPresets } from '@/app/lib/presets/positionPresets'
import { validateSelections } from '@/app/lib/validate/validateSelections'

export const runtime = 'nodejs'

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function getHttpStatus(error: unknown): number | undefined {
  const e = error as any
  return e?.status ?? e?.response?.status
}

function isRetryableGeminiError(error: unknown): boolean {
  // ユーザー要望: Geminiが 500 系を返した場合に再試行する
  // 実運用上は 5xx をまとめて対象にするのが安全（Gemini側一時障害/ゲートウェイ等）
  const status = getHttpStatus(error)
  return typeof status === 'number' && status >= 500 && status <= 599
}

async function generateContentWithRetry<T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; baseDelayMs?: number }
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 3
  const baseDelayMs = opts?.baseDelayMs ?? 250

  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (!isRetryableGeminiError(e) || attempt === maxAttempts) throw e

      const status = getHttpStatus(e)
      const delay = baseDelayMs * 2 ** (attempt - 1)
      console.warn(`[Gemini] retrying after ${delay}ms (attempt ${attempt}/${maxAttempts}, status=${status})`)
      await sleep(delay)
    }
  }
  // 到達しないはずだが型のため
  throw lastError
}

function toDebugJson(error: unknown) {
  const e = error as any
  return {
    name: e?.name,
    message: e?.message,
    stack: e?.stack,
    status: e?.status ?? e?.response?.status,
    code: e?.code,
    // SDKが内部に抱えているレスポンス/詳細（あれば）
    details: e?.details ?? e?.response ?? e?.error,
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })
    }

    const formData = await request.formData()
    
    // 1. 入力取得
    const image = formData.get('image') as File
    const textPhraseId = formData.get('textPhraseId') as string
    const styleIdsStr = formData.get('styleIds') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    const originalWidthStr = formData.get('originalWidth') as string
    const originalHeightStr = formData.get('originalHeight') as string
    
    // 複数選択されたスタイルIDを配列に変換
    const styleIds = styleIdsStr ? styleIdsStr.split(',').filter(id => id.trim()) : []
    
    // 2. バリデーション
    if (!image || !textPhraseId || styleIds.length === 0 || !positionId) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    if (outputFormat !== 'png' && outputFormat !== 'jpeg') {
      return NextResponse.json(
        { error: '無効な出力形式です' },
        { status: 400 }
      )
    }

    // バリデーション（各スタイルIDをチェック）
    const invalidStyleIds = styleIds.filter(id => !stylePresets.find(p => p.id === id))
    if (invalidStyleIds.length > 0) {
      return NextResponse.json(
        { error: '無効な選択肢が含まれています' },
        { status: 400 }
      )
    }

    if (!validateSelections(textPhraseId, styleIds, positionId)) {
      return NextResponse.json(
        { error: '無効な選択肢が含まれています' },
        { status: 400 }
      )
    }

    const textPhrase = textPhraseOptions.find(o => o.id === textPhraseId)
    if (!textPhrase) {
      return NextResponse.json(
        { error: '無効な文言IDが指定されています' },
        { status: 400 }
      )
    }

    const styles = styleIds
      .map(id => stylePresets.find(p => p.id === id))
      .filter((s): s is typeof stylePresets[number] => s !== undefined)
    
    if (styles.length === 0) {
      return NextResponse.json(
        { error: '有効なスタイルが見つかりません' },
        { status: 400 }
      )
    }

    const position = positionPresets.find(p => p.id === positionId)
    if (!position) {
      return NextResponse.json(
        { error: '無効な配置場所IDが指定されています' },
        { status: 400 }
      )
    }
    
    // 3. プロンプト生成
    const prompt = buildPrompt(textPhrase, styles, position)

    // デバッグ用: 送信プロンプトをログ出力（本番は長さのみ）
    if (process.env.NODE_ENV === 'production') {
      console.log('[Gemini] prompt length:', prompt.length)
    } else {
      console.log('[Gemini] prompt:', prompt)
    }
    
    // 4. 画像をbase64に変換（Geminiに送るため）
    const imageBuffer = await image.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // 5. Gemini（Nano Banana）呼び出し
    const ai = new GoogleGenAI({ apiKey })
    const model ='gemini-3-pro-image-preview'

    const res = await generateContentWithRetry(
      () =>
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: image.type || 'image/png',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          // 画像だけ返したい（念のためテキストも返る可能性がある）
          config: { responseModalities: ['IMAGE'] },
        } as any),
      { maxAttempts: 3, baseDelayMs: 250 }
    )

    const parts = (res as any)?.candidates?.[0]?.content?.parts ?? []
    const firstInline = parts.find((p: any) => p?.inlineData?.data)
    const outBase64 = firstInline?.inlineData?.data as string | undefined
    const outMime =
      (firstInline?.inlineData?.mimeType as string | undefined) ||
      (outputFormat ? `image/${outputFormat}` : 'image/png')

    if (!outBase64) {
      throw new Error('No image returned from Gemini API')
    }

    const outDataUrl = `data:${outMime};base64,${outBase64}`

    // 6. 返却（Geminiのレスポンスにwidth/heightが無い場合があるため、元画像サイズを優先して返す）
    const originalWidth = Number.parseInt(originalWidthStr ?? '', 10)
    const originalHeight = Number.parseInt(originalHeightStr ?? '', 10)

    return NextResponse.json({
      model,
      imageDataUrl: outDataUrl,
      mimeType: outMime,
      width: Number.isFinite(originalWidth) && originalWidth > 0 ? originalWidth : 1024,
      height: Number.isFinite(originalHeight) && originalHeight > 0 ? originalHeight : 1024,
    })
  } catch (error) {
    const debug = toDebugJson(error)
    // サーバーログは常に詳細を出す（運用時の調査用）
    console.error('Generation error (debug):', debug)

    // レスポンスに詳細を載せるのは開発環境のみ
    const isProd = process.env.NODE_ENV === 'production'
    return NextResponse.json(
      isProd
        ? { error: '画像生成に失敗しました。しばらくしてから再試行してください。' }
        : {
            error: '画像生成に失敗しました。しばらくしてから再試行してください。',
            debug,
          },
      { status: 500 }
    )
  }
}
