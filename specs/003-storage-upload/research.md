# Research: ストレージベースのアップロード・URLベースのアーキテクチャ

**Date**: 2025-01-27  
**Feature**: 003-storage-upload

## 1. Vercel Blob client upload実装パターン

### Decision

クライアント側で`@vercel/blob/client`の`upload()`メソッドを使用し、サーバー側で`handleUpload()`を実装してトークン生成とアップロード完了処理を行う。

### Rationale

- **ベストプラクティス**: Vercel Blobの公式ドキュメントで推奨されている方法
- **パフォーマンス**: クライアントから直接ストレージにアップロードするため、サーバーの負荷を軽減
- **セキュリティ**: `onBeforeGenerateToken`で認証・認可を実施できる
- **スケーラビリティ**: サーバーを経由しないため、大容量ファイルや同時リクエストに対応しやすい

### Alternatives considered

1. **サーバー側で`put()`を使用する方法**
   - 却下理由: サーバーを経由するため、サーバーの負荷が増加し、スケーラビリティが低下

2. **Presigned URLを使用する方法**
   - 却下理由: Vercel Blobは`handleUpload()`と`upload()`の組み合わせが標準的で、より簡単に実装できる

### Code Examples

#### クライアント側（UploadSection.tsx）

```typescript
import { upload, type PutBlobResult } from '@vercel/blob/client'

const blob = await upload(file.name, file, {
  access: 'public',
  handleUploadUrl: '/api/upload',
  abortSignal: abortController.signal,
  onUploadProgress: ({ loaded, total, percentage }) => {
    setUploadProgress(percentage)
  },
})

const imageUrl = blob.url // アップロード完了後のURL
```

#### サーバー側（/api/upload/route.ts）

```typescript
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // 認証・認可・バリデーション
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // アップロード完了後の処理
        console.log('Blob upload completed:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロード処理に失敗しました' },
      { status: 400 }
    )
  }
}
```

## 2. Next.js Server ActionsでのFormData URL取得パターン

### Decision

`formData.get('imageUrl')`で文字列として取得し、URL形式のバリデーションを実施する。

### Rationale

- **Next.js標準**: `FormData`から文字列を取得する標準的な方法
- **型安全性**: TypeScriptで型アサーションを使用し、バリデーションで安全性を確保
- **一貫性**: 他のフォームフィールド（`textPhraseId`、`styleIds`など）と同じ方法で取得できる

### Alternatives considered

1. **JSON形式で送信する方法**
   - 却下理由: Server Actionsは`FormData`を使用するのが標準的で、既存の実装パターンと一致しない

2. **専用のAPI Routeを作成する方法**
   - 却下理由: Server Actionsで統一する方が、Next.jsのベストプラクティスに一致する

### Code Examples

```typescript
'use server'

export async function generateKuu(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  // URL形式のバリデーション関数
  function isValidUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  // FormDataからURLを取得
  const imageUrl = formData.get('imageUrl') as string

  // バリデーション
  if (!imageUrl || !isValidUrl(imageUrl)) {
    return {
      status: 'error',
      message: '無効な画像URLです。',
    }
  }

  // ... 処理続行
}
```

## 3. BFF APIでの画像URLダウンロードとbase64変換

### Decision

`fetch(imageUrl)` → `arrayBuffer()` → `Buffer.from().toString('base64')`の流れで実装する。

### Rationale

- **シンプル**: 標準的なWeb APIを使用し、追加のライブラリが不要
- **パフォーマンス**: ストリーミング処理が可能で、メモリ効率が良い
- **エラーハンドリング**: `fetch`のエラーハンドリングが標準的で分かりやすい
- **Gemini API対応**: Gemini APIは`inlineData`形式でbase64データを受け取るため、この方法が最適

### Alternatives considered

1. **`axios`などのHTTPクライアントライブラリを使用する方法**
   - 却下理由: `fetch`で十分で、追加の依存関係を増やす必要がない

2. **`node-fetch`を使用する方法**
   - 却下理由: Node.js 18以降では`fetch`が標準で利用可能

### Code Examples

```typescript
// BFF API（/api/generate/route.ts）

// 画像URLから画像をダウンロードしてbase64に変換
const imageResponse = await fetch(imageUrl)
if (!imageResponse.ok) {
  throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
}

const imageArrayBuffer = await imageResponse.arrayBuffer()
const imageBuffer = Buffer.from(imageArrayBuffer)
const imageBase64 = imageBuffer.toString('base64')
const imageMimeType = imageResponse.headers.get('content-type') || 'image/png'

// Gemini APIに送信
const req = {
  model: 'gemini-3-pro-image-preview',
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
  config: { responseModalities: ['IMAGE'] as const },
}
```

## 4. Vercel Blob put()メソッドでの生成結果保存

### Decision

base64データを`Buffer.from(base64String, 'base64')`でBufferに変換し、`put()`メソッドでVercel Blobに保存する。

### Rationale

- **公式推奨**: Vercel Blobの公式ドキュメントで推奨されている方法
- **シンプル**: サーバー側での保存処理が簡単で、追加の設定が不要
- **パフォーマンス**: 直接ストレージに保存するため、高速
- **URL取得**: `put()`の戻り値から`url`プロパティを取得できる

### Alternatives considered

1. **クライアント側で保存する方法**
   - 却下理由: 生成結果はサーバー側（BFF API）で取得されるため、サーバー側で保存する方が自然

2. **一時ファイルに保存してからアップロードする方法**
   - 却下理由: メモリ上で直接処理できるため、一時ファイルは不要

### Code Examples

```typescript
import { put } from '@vercel/blob'

// Gemini APIからbase64レスポンスを取得
const outBase64 = firstInline?.inlineData?.data as string | undefined

if (!outBase64) {
  throw new Error('No image returned from Gemini API')
}

// base64データをBufferに変換
const generatedImageBuffer = Buffer.from(outBase64, 'base64')

// ファイル名を生成
const timestamp = Date.now()
const extension = outMime === 'image/png' ? 'png' : 'jpg'
const filename = `generated/kuu-${timestamp}.${extension}`

// Vercel Blobに保存
const blob = await put(filename, generatedImageBuffer, {
  access: 'public',
  addRandomSuffix: true,
  contentType: outMime,
})

// URLを取得
const generatedImageUrl = blob.url
```

## 5. 生成結果のURL表示・ダウンロード

### Decision

URLから画像を取得して表示・ダウンロードする。表示には`<img>`タグまたは`next/image`コンポーネントを使用し、ダウンロードには`fetch(imageUrl)`で画像を取得してからダウンロード処理を実行する。

### Rationale

- **標準的**: Web標準のAPIを使用し、追加のライブラリが不要
- **パフォーマンス**: `next/image`を使用することで、画像最適化が可能
- **クロスオリジン対応**: Vercel BlobのURLは公開URLのため、CORSの問題がない
- **モバイル対応**: Web Share APIを使用することで、モバイルでも適切に動作

### Alternatives considered

1. **data URLを使用する方法**
   - 却下理由: 大容量画像の場合、data URLはメモリを大量に消費するため、URLを使用する方が効率的

2. **専用のダウンロードAPI Routeを作成する方法**
   - 却下理由: 公開URLを使用することで、追加のAPI Routeは不要

### Code Examples

#### 画像表示（KuuGenerator.tsx）

```typescript
// URLを直接使用
<img 
  src={state.imageUrl} 
  alt="生成されたくぅー画像" 
  className="rounded-xl shadow-xl max-w-full h-auto mx-auto"
/>

// または next/image を使用（最適化が必要な場合）
import Image from 'next/image'

<Image
  src={state.imageUrl}
  alt="生成されたくぅー画像"
  width={state.width}
  height={state.height}
  className="rounded-xl shadow-xl max-w-full h-auto mx-auto"
/>
```

#### ダウンロード（saveOnDesktop.ts）

```typescript
export async function saveOnDesktop(
  imageUrl: string,
  mimeType: 'image/png' | 'image/jpeg',
  fileName?: string
): Promise<void> {
  try {
    // URLから画像を取得
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)
    
    // ダウンロード
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName || `kuu-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // クリーンアップ
    URL.revokeObjectURL(objectUrl)
  } catch (error) {
    console.error('Failed to save image:', error)
    throw error
  }
}
```

## 6. アップロード中断処理

### Decision

`abortSignal`を使用してアップロードをキャンセルし、`BlobRequestAbortedError`を適切に処理する。ストレージに残ったファイルは定期的なクリーンアップ（Cron Jobなど）で対応する。

### Rationale

- **標準的**: `AbortController`と`AbortSignal`はWeb標準のAPI
- **シンプル**: `upload()`メソッドが`abortSignal`をサポートしているため、実装が簡単
- **パフォーマンス**: 中断処理が即座に実行される
- **クリーンアップ**: アップロードが中断された場合、`onUploadCompleted`コールバックが呼ばれないため、URLが取得できず削除できない。定期的なクリーンアップで対応する。

### Alternatives considered

1. **中断時にストレージからファイルを削除する方法**
   - 却下理由: アップロードが中断された場合、URLが取得できず削除できない

2. **中断時にサーバー側で削除処理を実行する方法**
   - 却下理由: アップロードはクライアントから直接ストレージに実行されるため、サーバー側でURLを取得できない

### Code Examples

```typescript
// UploadSection.tsx

const abortControllerRef = useRef<AbortController | null>(null)

const handleFileChange = async (file: File | null) => {
  // 既存のアップロードをキャンセル
  if (abortControllerRef.current) {
    abortControllerRef.current.abort()
  }

  if (!file) {
    return
  }

  try {
    abortControllerRef.current = new AbortController()

    const blob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
      abortSignal: abortControllerRef.current.signal,
    })

    const imageUrl = blob.url
    // ... 処理続行
  } catch (error) {
    // BlobRequestAbortedErrorの処理
    if (error instanceof Error && error.name === 'BlobRequestAbortedError') {
      setError('アップロードがキャンセルされました。')
      return
    }

    // その他のエラー
    setError('アップロードに失敗しました。再試行してください。')
    console.error('Upload error:', error)
  }
}

// コンポーネントアンマウント時のクリーンアップ
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }
}, [])
```

## まとめ

本機能の実装では、Vercel Blobの公式ドキュメントとベストプラクティスに従い、以下の方針で実装する：

1. **クライアント側アップロード**: `@vercel/blob/client`の`upload()`を使用
2. **サーバー側トークン生成**: `handleUpload()`を実装
3. **URL取得**: `upload()`の戻り値から`url`プロパティを取得
4. **BFF API**: 画像URLから画像をダウンロードしてbase64に変換
5. **生成結果保存**: `put()`を使用してVercel Blobに保存
6. **URL表示・ダウンロード**: URLから画像を取得して表示・ダウンロード
7. **アップロード中断**: `abortSignal`を使用してキャンセル

これらの実装方法は、Vercel Blobの公式ドキュメントとNext.jsのベストプラクティスに基づいており、初級エンジニアでも理解しやすい標準的な方法である。

