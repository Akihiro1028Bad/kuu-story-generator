'use server'

import { toUserMessage } from '@/app/lib/errors/toUserMessage'

export type GenerateState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; imageDataUrl: string; mimeType: string; width: number; height: number }

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type GenerateApiErrorBody = {
  error?: string
  debug?: unknown
}

function isGenerateApiErrorBody(value: unknown): value is GenerateApiErrorBody {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return v.error === undefined || typeof v.error === 'string'
}

export async function generateKuu(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // 1. FormDataから値を取得
    const image = formData.get('image') as File
    const textPhraseId = formData.get('textPhraseId') as string
    const styleIdsStr = formData.get('styleIds') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    
    // 複数選択されたスタイルIDを配列に変換
    const styleIds = styleIdsStr ? styleIdsStr.split(',').filter(id => id.trim()) : []
    
    // 2. 簡易バリデーション
    if (!image || !textPhraseId || styleIds.length === 0 || !positionId) {
      return {
        status: 'error',
        message: '必須項目が不足しています。画像とすべての選択肢を選んでください。',
      }
    }

    /**
     * 画面の動きだけ作りたい間は API 通信を行わず、タイムアウトで「生成中→完了」を擬似再現する。
     * - 本番/実APIに戻したい場合は `KUU_USE_REAL_API=1` を設定して下の実装を復活させる想定。
     */
    const useRealApi = process.env.KUU_USE_REAL_API === '1'
    if (!useRealApi) {
      // “生成中”をそれっぽく見せる待ち時間
      const delayMs = Number(process.env.KUU_MOCK_DELAY_MS ?? '10000')
      if (!Number.isNaN(delayMs) && delayMs > 0) await sleep(delayMs)

      // モック結果: アップロード画像をそのまま返す（外部API不要・UI確認には十分）
      const buf = Buffer.from(await image.arrayBuffer())
      const imageDataUrl = `data:${image.type};base64,${buf.toString('base64')}`

      const ow = Number(formData.get('originalWidth') ?? '')
      const oh = Number(formData.get('originalHeight') ?? '')

      return {
        status: 'success',
        imageDataUrl,
        mimeType: image.type || `image/${outputFormat}`,
        width: Number.isFinite(ow) && ow > 0 ? ow : 1024,
        height: Number.isFinite(oh) && oh > 0 ? oh : 1024,
      }
    }

    // 実APIモード: BFF APIを呼び出す
    const { headers } = await import('next/headers')
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'

    if (!host) {
      return {
        status: 'error',
        message: '実行環境のホスト情報を取得できませんでした。再試行してください。',
      }
    }

    // BFF APIにFormDataを送信
    const formDataForAPI = new FormData()
    formDataForAPI.append('image', image)
    formDataForAPI.append('textPhraseId', textPhraseId)
    formDataForAPI.append('styleIds', styleIds.join(','))
    formDataForAPI.append('positionId', positionId)
    formDataForAPI.append('outputFormat', outputFormat)
    
    const originalWidth = formData.get('originalWidth')
    const originalHeight = formData.get('originalHeight')
    if (originalWidth) formDataForAPI.append('originalWidth', originalWidth as string)
    if (originalHeight) formDataForAPI.append('originalHeight', originalHeight as string)

    const url = `${proto}://${host}/api/generate`
    const response = await fetch(url, { method: 'POST', body: formDataForAPI })

    if (!response.ok) {
      const errorUnknown = await response.json().catch(() => ({ error: '画像生成に失敗しました' }))
      const errorBody: GenerateApiErrorBody = isGenerateApiErrorBody(errorUnknown) ? errorUnknown : {}
      // dev環境では詳細をログに出す（UIにも出せるように message にも付与）
      console.error('Generate API error response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorBody,
      })

      const isProd = process.env.NODE_ENV === 'production'
      const debugSuffix =
        !isProd && errorBody.debug !== undefined
          ? `\n\n--- debug ---\n${JSON.stringify(errorBody.debug, null, 2)}`
          : ''

      const errorMessage =
        typeof errorBody.error === 'string' && errorBody.error
          ? errorBody.error
          : '画像生成に失敗しました。しばらくしてから再試行してください。'

      return {
        status: 'error',
        message: `${errorMessage}${debugSuffix}`,
      }
    }

    const result = await response.json()
    return {
      status: 'success',
      imageDataUrl: result.imageDataUrl,
      mimeType: result.mimeType,
      width: result.width,
      height: result.height,
    }
  } catch (error) {
    console.error('Server Action error:', error)
    return {
      status: 'error',
      message: toUserMessage(error),
    }
  }
}
