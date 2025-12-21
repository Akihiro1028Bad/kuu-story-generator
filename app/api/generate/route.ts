import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { put, del } from '@vercel/blob'
import { buildPrompt } from '@/app/lib/prompt/buildPrompt'
import { textPhraseOptions } from '@/app/lib/presets/textPhraseOptions'
import { stylePresets } from '@/app/lib/presets/stylePresets'
import { positionPresets } from '@/app/lib/presets/positionPresets'
import { validateSelections } from '@/app/lib/validate/validateSelections'

export const runtime = 'nodejs'

const MAX_GENERATED_IMAGE_BYTES = 20 * 1024 * 1024
const ALLOWED_BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com'

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object') return value as Record<string, unknown>
  return undefined
}

function getHttpStatus(error: unknown): number | undefined {
  const e = asRecord(error)
  const status = e?.status
  if (typeof status === 'number') return status

  const response = asRecord(e?.response)
  const responseStatus = response?.status
  if (typeof responseStatus === 'number') return responseStatus

  return undefined
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
      console.warn(`[generate:warn] [Gemini] retrying after ${delay}ms`, {
        attempt,
        maxAttempts,
        status,
        errorMessage: e instanceof Error ? e.message : String(e),
      })
      await sleep(delay)
    }
  }
  // 到達しないはずだが型のため
  throw lastError
}

function toDebugJson(error: unknown) {
  const e = asRecord(error)
  const response = asRecord(e?.response)
  return {
    name: typeof e?.name === 'string' ? e.name : undefined,
    message: typeof e?.message === 'string' ? e.message : undefined,
    stack: typeof e?.stack === 'string' ? e.stack : undefined,
    status: getHttpStatus(error),
    code: typeof e?.code === 'string' ? e.code : undefined,
    // SDKが内部に抱えているレスポンス/詳細（あれば）
    details: e?.details ?? response ?? e?.error,
  }
}

function isAllowedBlobHost(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:') return false
    return url.hostname.endsWith(ALLOWED_BLOB_HOST_SUFFIX)
  } catch {
    return false
  }
}

type GeminiInlineData = {
  mimeType?: string
  data?: string
}

type GeminiPart = {
  inlineData?: GeminiInlineData
}

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[]
    }
  }>
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-vercel-id') ?? `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const startTime = Date.now()
  
  const log = (level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) => {
    const logData = {
      requestId,
      timestamp: new Date().toISOString(),
      elapsed: Date.now() - startTime,
      ...data,
    }
    const logMessage = `[generate:${level}] ${message}`
    if (level === 'error') {
      console.error(logMessage, logData)
    } else if (level === 'warn') {
      console.warn(logMessage, logData)
    } else {
      console.log(logMessage, logData)
    }
  }

  try {
    log('info', 'Request received', {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
    })

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      log('error', 'Missing GEMINI_API_KEY')
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY' }, { status: 500 })
    }

    const formDataStartTime = Date.now()
    const formData = await request.formData()
    log('info', 'FormData parsed', { elapsed: Date.now() - formDataStartTime })
    
    // 1. 入力取得
    const imageUrl = formData.get('imageUrl') as string
    const textPhraseId = formData.get('textPhraseId') as string
    const textPhraseCustom = (formData.get('textPhraseCustom') as string | null)?.trim() ?? ''
    const styleIdsStr = formData.get('styleIds') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    const originalWidthStr = formData.get('originalWidth') as string
    const originalHeightStr = formData.get('originalHeight') as string
    
    // 複数選択されたスタイルIDを配列に変換
    const styleIds = styleIdsStr ? styleIdsStr.split(',').filter(id => id.trim()) : []

    log('info', 'Request parameters extracted', {
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl?.substring(0, 100),
      textPhraseId,
      hasTextPhraseCustom: Boolean(textPhraseCustom),
      styleIds: styleIds.length > 0 ? styleIds : undefined,
      styleIdsCount: styleIds.length,
      positionId,
      outputFormat,
      originalWidth: originalWidthStr,
      originalHeight: originalHeightStr,
    })
    
    // 2. バリデーション
    if (!imageUrl || (!textPhraseId && !textPhraseCustom) || styleIds.length === 0 || !positionId) {
      log('warn', 'Validation failed: missing required fields', {
        hasImageUrl: !!imageUrl,
        hasTextPhraseId: !!textPhraseId,
        hasTextPhraseCustom: Boolean(textPhraseCustom),
        styleIdsCount: styleIds.length,
        hasPositionId: !!positionId,
      })
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }

    if (!isAllowedBlobHost(imageUrl)) {
      log('warn', 'Validation failed: imageUrl host not allowed', {
        imageUrl: imageUrl?.substring(0, 100),
      })
      return NextResponse.json(
        { error: '許可されていない画像URLです' },
        { status: 400 }
      )
    }

    if (outputFormat !== 'png' && outputFormat !== 'jpeg') {
      log('warn', 'Validation failed: invalid output format', { outputFormat })
      return NextResponse.json(
        { error: '無効な出力形式です' },
        { status: 400 }
      )
    }

    // バリデーション（各スタイルIDをチェック）
    const invalidStyleIds = styleIds.filter(id => !stylePresets.find(p => p.id === id))
    if (invalidStyleIds.length > 0) {
      log('warn', 'Validation failed: invalid style IDs', { invalidStyleIds })
      return NextResponse.json(
        { error: '無効な選択肢が含まれています' },
        { status: 400 }
      )
    }

    if (!validateSelections(textPhraseId, styleIds, positionId, textPhraseCustom)) {
      log('warn', 'Validation failed: validateSelections returned false', {
        textPhraseId,
        hasTextPhraseCustom: Boolean(textPhraseCustom),
        styleIds,
        positionId,
      })
      return NextResponse.json(
        { error: '無効な選択肢が含まれています' },
        { status: 400 }
      )
    }

    const textPhraseText = textPhraseCustom || textPhraseOptions.find(o => o.id === textPhraseId)?.text
    if (!textPhraseText) {
      log('warn', 'Validation failed: text phrase not found', { textPhraseId })
      return NextResponse.json(
        { error: '無効な文言IDが指定されています' },
        { status: 400 }
      )
    }

    const styles = styleIds
      .map(id => stylePresets.find(p => p.id === id))
      .filter((s): s is typeof stylePresets[number] => s !== undefined)
    
    if (styles.length === 0) {
      log('warn', 'Validation failed: no valid styles found', { styleIds })
      return NextResponse.json(
        { error: '有効なスタイルが見つかりません' },
        { status: 400 }
      )
    }

    const position = positionPresets.find(p => p.id === positionId)
    if (!position) {
      log('warn', 'Validation failed: position not found', { positionId })
      return NextResponse.json(
        { error: '無効な配置場所IDが指定されています' },
        { status: 400 }
      )
    }

    log('info', 'Validation passed', {
      textPhraseId,
      styleIds,
      positionId,
      outputFormat,
    })
    
    // 3. プロンプト生成
    const promptStartTime = Date.now()
    const prompt = buildPrompt(textPhraseText, styles, position)
    log('info', 'Prompt built', {
      promptLength: prompt.length,
      elapsed: Date.now() - promptStartTime,
      promptPreview: process.env.NODE_ENV === 'production' ? undefined : prompt.substring(0, 200),
    })
    
    // 4. 画像をbase64に変換（Geminiに送るため）
    const imageConversionStartTime = Date.now()
    let imageArrayBuffer: ArrayBuffer
    let imageBase64: string
    let imageMimeType: string
    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
      }
      imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBuffer = Buffer.from(imageArrayBuffer)
      imageBase64 = imageBuffer.toString('base64')
      imageMimeType = imageResponse.headers.get('content-type') || 'image/png'
      log('info', 'Image downloaded and converted to base64', {
        imageUrl: imageUrl.substring(0, 100),
        imageSize: imageArrayBuffer.byteLength,
        imageType: imageMimeType,
        base64Length: imageBase64.length,
        elapsed: Date.now() - imageConversionStartTime,
      })
    } catch (downloadError) {
      log('warn', 'Failed to download image from URL', {
        imageUrl: imageUrl.substring(0, 100),
        error: downloadError instanceof Error ? downloadError.message : String(downloadError),
      })
      return NextResponse.json(
        { error: '画像の取得に失敗しました。再試行してください。' },
        { status: 400 }
      )
    }

    // 5. Gemini（Nano Banana）呼び出し
    const ai = new GoogleGenAI({ apiKey })
    const model = 'gemini-3-pro-image-preview'

    log('info', 'Starting Gemini API call', {
      model,
      promptLength: prompt.length,
      imageSize: imageArrayBuffer.byteLength,
      imageType: imageMimeType,
    })

    const geminiStartTime = Date.now()
    const res = await generateContentWithRetry(
      () => {
        const attemptStartTime = Date.now()
        log('info', 'Gemini API call attempt', {
          attemptStartTime: new Date(attemptStartTime).toISOString(),
        })

        const req =
          ({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: imageMimeType,
                      data: imageBase64,
                    },
                  },
                ],
              },
            ],
            // 画像だけ返したい（念のためテキストも返る可能性がある）
            config: { responseModalities: ['IMAGE'] as const },
          } as unknown) as Parameters<typeof ai.models.generateContent>[0]

        return ai.models.generateContent(req)
      },
      { maxAttempts: 3, baseDelayMs: 250 }
    )
    
    const geminiElapsed = Date.now() - geminiStartTime
    log('info', 'Gemini API call completed', {
      elapsed: geminiElapsed,
      hasResponse: !!res,
    })

    const parsed = res as unknown as GeminiGenerateContentResponse
    const parts = parsed.candidates?.[0]?.content?.parts ?? []
    const firstInline = parts.find(p => typeof p.inlineData?.data === 'string')
    const outBase64 = firstInline?.inlineData?.data as string | undefined
    const outMime =
      (firstInline?.inlineData?.mimeType as string | undefined) ||
      (outputFormat ? `image/${outputFormat}` : 'image/png')

    log('info', 'Parsing Gemini response', {
      candidatesCount: parsed.candidates?.length ?? 0,
      partsCount: parts.length,
      hasInlineData: !!firstInline,
      hasBase64: !!outBase64,
      base64Length: outBase64?.length,
      mimeType: outMime,
    })

    if (!outBase64) {
      log('error', 'No image returned from Gemini API', {
        candidates: parsed.candidates?.length ?? 0,
        parts: parts.length,
        parsedResponse: JSON.stringify(parsed).substring(0, 500),
      })
      throw new Error('No image returned from Gemini API')
    }

    const generatedImageBuffer = Buffer.from(outBase64, 'base64')
    if (generatedImageBuffer.length > MAX_GENERATED_IMAGE_BYTES) {
      log('warn', 'Generated image too large', {
        size: generatedImageBuffer.length,
        max: MAX_GENERATED_IMAGE_BYTES,
      })
      return NextResponse.json(
        { error: '生成結果が大きすぎます。別の画像で再試行してください。' },
        { status: 413 }
      )
    }

    const timestamp = Date.now()
    const extension = outMime === 'image/png' ? 'png' : 'jpg'
    const filename = `generated/kuu-${timestamp}.${extension}`
    const blob = await put(filename, generatedImageBuffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: outMime,
    })

    // 6. 返却（Geminiのレスポンスにwidth/heightが無い場合があるため、元画像サイズを優先して返す）
    const originalWidth = Number.parseInt(originalWidthStr ?? '', 10)
    const originalHeight = Number.parseInt(originalHeightStr ?? '', 10)
    const finalWidth = Number.isFinite(originalWidth) && originalWidth > 0 ? originalWidth : 1024
    const finalHeight = Number.isFinite(originalHeight) && originalHeight > 0 ? originalHeight : 1024

    const responseData = {
      model,
      imageUrl: blob.url,
      mimeType: outMime,
      width: finalWidth,
      height: finalHeight,
    }

    const totalElapsed = Date.now() - startTime
    log('info', 'Sending success response', {
      status: 200,
      responseSize: JSON.stringify(responseData).length,
      imageUrl: blob.url.substring(0, 100),
      mimeType: outMime,
      width: finalWidth,
      height: finalHeight,
      totalElapsed,
    })

    try {
      await del(imageUrl)
      log('info', 'Original image deleted', {
        url: imageUrl.substring(0, 100),
      })
    } catch (deleteError) {
      log('warn', 'Failed to delete original image', {
        url: imageUrl.substring(0, 100),
        error: deleteError instanceof Error ? deleteError.message : String(deleteError),
      })
    }

    return NextResponse.json(responseData)
  } catch (error) {
    const totalElapsed = Date.now() - startTime
    const debug = toDebugJson(error)
    
    log('error', 'Generation failed', {
      errorName: error instanceof Error ? error.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      debug,
      totalElapsed,
    })

    // レスポンスに詳細を載せるのは開発環境のみ
    const isProd = process.env.NODE_ENV === 'production'
    const responseData = isProd
      ? { error: '画像生成に失敗しました。しばらくしてから再試行してください。' }
      : {
          error: '画像生成に失敗しました。しばらくしてから再試行してください。',
          debug,
        }

    log('info', 'Sending error response', {
      status: 500,
      responseSize: JSON.stringify(responseData).length,
      totalElapsed,
    })

    return NextResponse.json(responseData, { status: 500 })
  }
}
