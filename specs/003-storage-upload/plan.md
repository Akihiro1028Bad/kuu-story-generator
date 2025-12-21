# Implementation Plan: ストレージベースのアップロード・URLベースのアーキテクチャ

**Branch**: `003-storage-upload` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-storage-upload/spec.md`

## Summary

本機能は、画像アップロードと生成結果の保存をストレージベースのアーキテクチャに移行する。クライアント側でVercel Blobに直接アップロードし、Server ActionとBFF APIはURLのみを受け取り、生成結果もURLとして返す。これにより、サーバーの負荷を軽減し、スケーラビリティを向上させる。

**技術的アプローチ**:
- クライアント側: `@vercel/blob/client`の`upload()`を使用して直接ストレージにアップロード
- サーバー側: `@vercel/blob/client`の`handleUpload()`でトークン生成とアップロード完了処理
- BFF API: 画像URLから画像をダウンロードし、base64に変換してGemini APIに送信
- 生成結果: BFF API側で`@vercel/blob`の`put()`を使用してストレージに保存し、URLを返す

**Breaking Changes / Migration Notes**:
- `/api/generate`のレスポンスが`imageDataUrl`から`imageUrl`に変更されるため、`actions.ts`/`KuuGenerator.tsx`/`SaveActions.tsx`/`saveOnDesktop.ts`/`saveOnMobile.ts`はURLベースへ移行が必要
- 既存の「data URL前提のダウンロード・保存処理」は互換がないため、移行完了までの並行運用が必要な場合はレスポンス両対応を検討
  - 互換期間の方針: `imageUrl` を優先しつつ、暫定的に `imageDataUrl` を残す（後方互換）
  - 移行完了後に `imageDataUrl` を削除し、契約・実装・テストから廃止

## Technical Context

**Language/Version**: TypeScript 5.9.3, Node.js v24.12.0 (LTS: Krypton)
**Primary Dependencies**: 
- Next.js 16.0.10 (App Router)
- React 19.2.3
- `@vercel/blob` (サーバー側)
- `@vercel/blob/client` (クライアント側)
- `@google/genai` 1.33.0 (Gemini API)
**Storage**: Vercel Blob (Vercelのネイティブストレージサービス)
**Testing**: Vitest 4.0.15 (ユニットテスト・コンポーネントテスト)
**Target Platform**: Web (ブラウザ、PC/モバイル対応)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 
- アップロード完了: 10秒以内（10MB以下の画像）
- 生成処理開始までの待機時間: 1秒以内
- 生成結果のURL表示・ダウンロード成功率: 95%以上
**Constraints**: 
- 画像サイズ: 10MB以下
- 生成結果のURL有効期限: 24時間以上
- Vercel Blobの制限: 通常10MB以下のファイル
**Scale/Scope**: 
- 小規模Webアプリケーション
- 単一ユーザータイプ
- 画像生成機能のアーキテクチャ改善

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲章に基づく必須チェック項目：

### アーキテクチャ原則
- [x] Next.js App Router ベースの構成を使用しているか
- [x] Server Components をデフォルトとして使用しているか
- [x] Mutation は Server Actions で統一されているか
- [x] API キーはサーバー側（Route Handlers）で保持されているか
- [x] 画像合成処理は外部AI（Gemini API）で実施し、保存先は Vercel Blob に限定する（アプリサーバー永続化なし）
- [x] 外部サービス依存は `lib/api/` に集約されているか（Vercel BlobはNext.js標準機能として扱う）

### コーディング規約
- [x] TypeScript `strict` モードが有効か
- [x] `any` 型を使用していないか（例外時はコメント必須）
- [x] ESLint + Prettier が設定されているか
- [x] Component の役割が分離されているか（UI vs Logic）
- [x] `use client` は CSR 必須時のみ使用しているか
- [x] 命名規則が遵守されているか（変数・関数: camelCase、コンポーネント・型: PascalCase）

### セキュリティ
- [x] API キーが `.env` で管理され、コミットされていないか
- [x] 画像データがサーバーに保存されていないか（仕様に基づく）→ **変更**: Vercel Blobに保存するが、サーバーメモリには保持しない
- [x] Route Handlers 経由で API 通信しているか
- [x] エラー内容がユーザーに露出していないか

### パフォーマンス
- [x] LCP が 3秒以内を目標としているか
- [x] `next/image` による最適化を実施しているか（生成結果の表示に適用可能）
- [x] アップロード画像サイズが適切に制限されているか（10MB以下）

### テスト・品質
- [x] ユニットテストが必須として計画されているか（画像レイアウト等）
- [x] コンポーネントテストが計画されているか（主要 UI）
- [x] E2Eテストが計画されていないか（本アプリは小規模のため不要）
- [x] CI で `lint`, `type-check`, `test` が自動実行されるか
- [ ] `test-cases.md` が生成され、全てのテストケースが構造化されたテーブル形式で記載されているか（Phase 0で生成予定）
- [ ] テスト仕様書に必須列（テストID、テスト名、前提条件、実行手順、期待結果、対象ファイル/関数、予想カバレッジ率）が含まれているか（Phase 0で生成予定）
- [ ] テスト種別ごと（単体テスト・統合テスト）にセクション分けされ、各セクションの最後にカバレッジ率が集計されているか（Phase 0で生成予定）

## Project Structure

### Documentation (this feature)

```text
specs/003-storage-upload/
├── plan.md              # This file (/speckit.plan command output)
├── test-cases.md        # Test specification (/speckit.plan command output - REQUIRED)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/             # Phase 1 output (/speckit.plan command)
│   └── openapi.yaml    # API契約定義
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

**Note**: `test-cases.md` は `/speckit.plan` コマンド実行時に自動生成され、実装予定の全てのテストケースを構造化されたテーブル形式で記載します。詳細は憲章セクション 6.1 を参照してください。

### Source Code (repository root)

```text
app/
├── api/
│   ├── upload/
│   │   └── route.ts              # 新規: Vercel Blob handleUpload()実装
│   └── generate/
│       └── route.ts               # 変更: FormDataからimageUrlを取得、URLから画像をダウンロード、生成結果をVercel Blobに保存
├── components/
│   └── KuuGenerator/
│       ├── actions.ts             # 変更: FormDataからimageUrlを取得、BFF APIにimageUrlを送信
│       ├── UploadSection.tsx      # 変更: ファイル選択時にVercel Blobに直接アップロード、URLを取得
│       ├── KuuGenerator.tsx       # 変更: imageDataUrl → imageUrlに変更、URL表示に対応
│       └── SaveActions.tsx        # 変更: imageDataUrl → imageUrlに変更、URLからダウンロード
└── lib/
    └── save/
        ├── saveOnDesktop.ts       # 変更: imageDataUrl → imageUrlに変更、URLからダウンロード
        └── saveOnMobile.ts        # 変更: imageDataUrl → imageUrlに変更、URLからダウンロード
```

**Structure Decision**: 既存のNext.js App Router構成を維持し、新規API Route（`/api/upload`）を追加。既存コンポーネントとライブラリを段階的に変更。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| 画像データをVercel Blobに保存 | アーキテクチャ変更の要件（サーバー負荷軽減、スケーラビリティ向上） | サーバーメモリに保持する方式は、大容量ファイルや同時リクエスト時にメモリ不足のリスクがある |

## Phase 0: Outline & Research

### Research Tasks

1. **Vercel Blob client upload実装パターンの調査**
   - `handleUpload()`の実装方法
   - `upload()`の使用方法
   - エラーハンドリング（`BlobRequestAbortedError`など）
   - アップロード進行状況の取得方法

2. **Next.js Server ActionsでのFormData URL取得パターン**
   - `formData.get('imageUrl')`の使用方法
   - 型安全性の確保方法

3. **BFF APIでの画像URLダウンロードとbase64変換**
   - `fetch(imageUrl)` → `arrayBuffer()` → `Buffer.from().toString('base64')`の実装
   - エラーハンドリング（ネットワークエラー、タイムアウトなど）

4. **Vercel Blob put()メソッドでの生成結果保存**
   - base64データをBufferに変換する方法
   - `put()`の使用方法とオプション
   - エラーハンドリング

5. **生成結果のURL表示・ダウンロード**
   - `next/image`コンポーネントでのURL表示
   - URLからのダウンロード実装（PC/モバイル対応）

6. **アップロード中断処理**
   - `abortSignal`の使用方法
   - `BlobRequestAbortedError`のハンドリング

### Research Output

`research.md`に以下の内容を記載：

- **Decision**: 採用した実装方法
- **Rationale**: 採用理由（ベストプラクティス、パフォーマンス、セキュリティなど）
- **Alternatives considered**: 検討した代替案と却下理由
- **Code Examples**: 実装例（初級エンジニアでも理解できる詳細なコード）

## Phase 1: Design & Contracts

### Data Model

`data-model.md`に以下のエンティティを定義：

1. **UploadedImageURL**
   - `url` (string): アップロードされた画像のURL
   - `pathname` (string): ストレージ内のパス
   - `contentType` (string): MIMEタイプ
   - `uploadedAt` (Date): アップロード日時

2. **GeneratedImageURL**
   - `url` (string): 生成結果の画像URL
   - `pathname` (string): ストレージ内のパス
   - `contentType` (string): MIMEタイプ
   - `width` (number): 画像幅
   - `height` (number): 画像高さ
   - `generatedAt` (Date): 生成日時

### API Contracts

`contracts/openapi.yaml`に以下のエンドポイントを定義：

1. **POST /api/upload**
   - リクエスト: `HandleUploadBody`（Vercel Blob標準）
   - レスポンス: `{ token: string, url: string, uploadUrl: string }` または `{ type: 'blob.upload-completed', response: 'ok' }`

2. **POST /api/generate**
   - リクエスト: FormData（`imageUrl`, `textPhraseId`, `styleIds`, `positionId`, `outputFormat`, `originalWidth`, `originalHeight`）
   - レスポンス: `{ imageUrl: string, mimeType: string, width: number, height: number }`

### Quickstart

`quickstart.md`に以下の内容を記載：

- 環境変数の設定（`BLOB_READ_WRITE_TOKEN`など）
- パッケージのインストール手順
- 実装の流れ（アップロード → 生成 → 表示・ダウンロード）
- トラブルシューティング

## 実装方針・アーキテクチャ・実装方法・実装例

### 1. クライアント側アップロード実装（UploadSection.tsx）

#### 実装方針

1. ファイル選択時に、クライアント側でVercel Blobに直接アップロード
2. アップロード進行状況を表示（`onUploadProgress`コールバックを使用）
3. アップロード完了後、`upload()`の戻り値から`url`プロパティを取得
4. 取得したURLを親コンポーネントに渡す
5. アップロード中断時は`abortSignal`を使用してキャンセル

#### アーキテクチャ

```
[UploadSection.tsx]
  ↓ ファイル選択
[upload() @vercel/blob/client]
  ↓ handleUploadUrl: /api/upload
[POST /api/upload]
  ↓ handleUpload() @vercel/blob/client
  ↓ トークン生成
[upload() @vercel/blob/client]
  ↓ 直接Vercel Blobにアップロード
[Vercel Blob]
  ↓ アップロード完了
[upload()戻り値: { url: string, ... }]
  ↓ url取得
[親コンポーネントにURLを渡す]
```

#### 実装方法

1. **パッケージインストール**
   ```bash
   pnpm add @vercel/blob/client
   ```

2. **UploadSection.tsxの変更**
   - `onImageSelected`の型を`(url: string | null) => void`に変更
   - ファイル選択時に`upload()`を呼び出し
   - アップロード進行状況をstateで管理
   - アップロード完了後、`blob.url`を取得して親コンポーネントに渡す
   - アップロード中断時は`abortSignal`を使用

#### 実装例

```typescript
'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { upload, type PutBlobResult } from '@vercel/blob/client'

interface UploadSectionProps {
  onImageSelected: (url: string | null) => void
  disabled?: boolean
}

export function UploadSection({ onImageSelected, disabled }: UploadSectionProps) {
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileChange = async (file: File | null) => {
    setError(null)
    setUploadProgress(0)
    setIsUploading(false)

    // 既存のアップロードをキャンセル
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (!file) {
      onImageSelected(null)
      setPreview(null)
      return
    }

    // バリデーション（既存の実装を維持）
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setError('JPEGまたはPNG形式の画像を選択してください。')
      onImageSelected(null)
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('画像サイズは10MB以下にしてください。')
      onImageSelected(null)
      return
    }

    // ローカルプレビュー（既存の実装を維持）
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    // Vercel Blobにアップロード
    try {
      setIsUploading(true)
      abortControllerRef.current = new AbortController()

      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        abortSignal: abortControllerRef.current.signal,
        onUploadProgress: ({ loaded, total, percentage }) => {
          setUploadProgress(percentage)
        },
      })

      // アップロード完了後、URLを取得
      const imageUrl = blob.url
      onImageSelected(imageUrl)
      setIsUploading(false)
      setUploadProgress(100)
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      
      // BlobRequestAbortedErrorの処理
      if (error instanceof Error && error.name === 'BlobRequestAbortedError') {
        setError('アップロードがキャンセルされました。')
        onImageSelected(null)
        URL.revokeObjectURL(objectUrl)
        return
      }

      // その他のエラー
      setError('アップロードに失敗しました。再試行してください。')
      onImageSelected(null)
      URL.revokeObjectURL(objectUrl)
      console.error('Upload error:', error)
    }
  }

  // 既存のhandleInputChange, handleDragOver, handleDragLeave, handleDropを維持
  // ...

  // クリーンアップ（コンポーネントアンマウント時）
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  // 既存のレンダリングロジックを維持し、アップロード進行状況を表示
  return (
    <div className="space-y-5">
      {/* 既存のドラッグ&ドロップUI */}
      {/* アップロード進行状況の表示 */}
      {isUploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      {/* 既存のエラー表示 */}
    </div>
  )
}
```

### 2. サーバー側handleUpload実装（/api/upload/route.ts）

#### 実装方針

1. `handleUpload()`を使用してトークン生成とアップロード完了処理を実装
2. `onBeforeGenerateToken`で認証・認可・バリデーションを実施
3. `onBeforeGenerateToken`で`maximumSizeInBytes`を設定し、サーバー側でも10MB制限を強制
4. `onUploadCompleted`でアップロード完了後の処理を実行（ログ記録など）
5. エラーハンドリングを適切に実装
6. ローカル開発では`onUploadCompleted`が動作しないため、`VERCEL_BLOB_CALLBACK_URL`（ngrok等）を使用

#### アーキテクチャ

```
[クライアント: upload()]
  ↓ POST /api/upload
[handleUpload() @vercel/blob/client]
  ↓ onBeforeGenerateToken
[認証・認可・バリデーション]
  ↓ トークン生成
[クライアント: upload() 続行]
  ↓ 直接Vercel Blobにアップロード
[Vercel Blob]
  ↓ アップロード完了
[onUploadCompleted]
[ログ記録など]
```

#### 実装方法

1. **パッケージインストール**
   ```bash
   pnpm add @vercel/blob/client
   ```

2. **環境変数の設定**
   ```env
   BLOB_READ_WRITE_TOKEN=your_token_here
   ```

3. **/api/upload/route.tsの作成**

#### 実装例

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
        // 認証・認可（必要に応じて実装）
        // 例: セッション確認、ユーザー認証など
        
        // バリデーション: ファイル名の拡張子チェック
        const allowedExtensions = ['.jpg', '.jpeg', '.png']
        const hasValidExtension = allowedExtensions.some(ext =>
          pathname.toLowerCase().endsWith(ext)
        )
        
        if (!hasValidExtension) {
          throw new Error('無効なファイル形式です。JPEGまたはPNG形式のみアップロードできます。')
        }

        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          // callbackUrlは自動計算される（Vercel環境の場合）
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // アップロード完了後の処理
        // 例: ログ記録、データベース更新など
        console.log('Blob upload completed:', {
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
          size: blob.size,
        })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロード処理に失敗しました' },
      { status: 400 }
    )
  }
}
```

### 3. Server Action変更（actions.ts）

#### 実装方針

1. FormDataから`image`（File）の代わりに`imageUrl`（string）を取得
2. バリデーション: `imageUrl`が存在し、有効なURL形式か確認
3. BFF APIにFormDataを送信する際、`imageUrl`を文字列として含める
4. モックモードでも`imageUrl`を使用（既存の動作確認用ロジックを維持）

#### アーキテクチャ

```
[KuuGenerator.tsx]
  ↓ FormData作成（imageUrlを含む）
[generateKuu() Server Action]
  ↓ FormDataからimageUrl取得
[バリデーション]
  ↓ FormData作成（imageUrlを含む）
[POST /api/generate]
  ↓ FormDataからimageUrl取得
[BFF API処理]
```

#### 実装方法

1. **actions.tsの変更**
   - `formData.get('image') as File` → `formData.get('imageUrl') as string`
   - バリデーション: URL形式の確認
   - BFF APIへの送信: `formDataForAPI.append('imageUrl', imageUrl)`

#### 実装例

```typescript
'use server'

import { toUserMessage } from '@/app/lib/errors/toUserMessage'

export type GenerateState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; imageUrl: string; mimeType: string; width: number; height: number }

// URL形式のバリデーション関数
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function generateKuu(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // 1. FormDataから値を取得
    const imageUrl = formData.get('imageUrl') as string
    const textPhraseId = formData.get('textPhraseId') as string
    const textPhraseCustom = (formData.get('textPhraseCustom') as string | null)?.trim() ?? ''
    const styleIdsStr = formData.get('styleIds') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    
    // 複数選択されたスタイルIDを配列に変換
    const styleIds = styleIdsStr ? styleIdsStr.split(',').filter(id => id.trim()) : []
    
    // 2. 簡易バリデーション
    if (!imageUrl || !isValidUrl(imageUrl) || (!textPhraseId && !textPhraseCustom) || styleIds.length === 0 || !positionId) {
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
      // モックモード: imageUrlから画像を取得してdata URLに変換
      const delayMs = Number(process.env.KUU_MOCK_DELAY_MS ?? '10000')
      if (!Number.isNaN(delayMs) && delayMs > 0) await sleep(delayMs)

      try {
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }
        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()
        const buf = Buffer.from(arrayBuffer)
        const imageDataUrl = `data:${blob.type};base64,${buf.toString('base64')}`

        const ow = Number(formData.get('originalWidth') ?? '')
        const oh = Number(formData.get('originalHeight') ?? '')

        return {
          status: 'success',
          imageUrl: imageDataUrl, // モックモードではdata URLを返す（既存の動作確認用）
          mimeType: blob.type || `image/${outputFormat}`,
          width: Number.isFinite(ow) && ow > 0 ? ow : 1024,
          height: Number.isFinite(oh) && oh > 0 ? oh : 1024,
        }
      } catch (error) {
        return {
          status: 'error',
          message: '画像の取得に失敗しました。再試行してください。',
        }
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
    formDataForAPI.append('imageUrl', imageUrl) // URLを文字列として追加
    formDataForAPI.append('textPhraseId', textPhraseId)
    if (textPhraseCustom) formDataForAPI.append('textPhraseCustom', textPhraseCustom)
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
      const errorBody: { error?: string; debug?: unknown } = errorUnknown
      
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
      imageUrl: result.imageUrl, // BFF APIから返されたURL
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
```

### 4. BFF API変更（/api/generate/route.ts）

#### 実装方針

1. FormDataから`image`（File）の代わりに`imageUrl`（string）を取得
2. `imageUrl`のホストをVercel Blobの公開URLに限定し、allowlist検証を実施（SSRF対策）
3. 画像URLから画像をダウンロード: `fetch(imageUrl)` → `arrayBuffer()` → `Buffer.from().toString('base64')`
4. base64データを`inlineData`としてGemini APIに送信（既存の実装を維持）
5. 生成結果（base64）をBufferに変換し、`put()`を使用してVercel Blobに保存
6. 保存完了後、URLを取得して返す
7. 生成成功時、元画像を削除（`del()`を使用）

#### アーキテクチャ

```
[Server Action]
  ↓ POST /api/generate (FormData: imageUrl)
[BFF API]
  ↓ FormDataからimageUrl取得
  ↓ fetch(imageUrl) → arrayBuffer() → base64変換
[Gemini API]
  ↓ base64レスポンス
[BFF API]
  ↓ Buffer.from(base64, 'base64')
  ↓ put() @vercel/blob
[Vercel Blob]
  ↓ URL取得
  ↓ del() @vercel/blob (元画像削除)
[レスポンス: { imageUrl, mimeType, width, height }]
```

#### 実装方法

1. **パッケージインストール**
   ```bash
   pnpm add @vercel/blob
   ```

2. **環境変数の設定**
   ```env
   BLOB_READ_WRITE_TOKEN=your_token_here
   GEMINI_API_KEY=your_key_here
   ```

3. **/api/generate/route.tsの変更**
   - `formData.get('image') as File` → `formData.get('imageUrl') as string`
   - `imageUrl`のallowlist検証を追加（Vercel Blobの公開URLのみ許可）

   ```typescript
   const allowedHosts = [
     // 例: {account}.public.blob.vercel-storage.com
     '.public.blob.vercel-storage.com',
   ]

   function isAllowedBlobHost(urlString: string): boolean {
     try {
       const url = new URL(urlString)
       if (url.protocol !== 'https:') return false
       return allowedHosts.some(host =>
         host.startsWith('.') ? url.hostname.endsWith(host) : url.hostname === host
       )
     } catch {
       return false
     }
   }

   if (!isAllowedBlobHost(imageUrl)) {
     return NextResponse.json({ error: '許可されていない画像URLです' }, { status: 400 })
   }
   ```
   - 画像URLから画像をダウンロードしてbase64に変換
   - 生成結果をVercel Blobに保存
   - 元画像を削除

#### 実装例

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { put, del } from '@vercel/blob'
import { buildPrompt } from '@/app/lib/prompt/buildPrompt'
// ... 既存のimport

export const runtime = 'nodejs'

// ... 既存のヘルパー関数

export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-vercel-id') ?? `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  const startTime = Date.now()
  
  // ... 既存のログ関数

  let uploadedImageUrl: string | null = null // 元画像のURL（削除用）

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
    const imageUrl = formData.get('imageUrl') as string // File → stringに変更
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
      imageUrl: imageUrl?.substring(0, 100), // URLの一部のみログ
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

    // URL形式のバリデーション
    try {
      new URL(imageUrl)
    } catch {
      log('warn', 'Validation failed: invalid image URL', { imageUrl: imageUrl?.substring(0, 100) })
      return NextResponse.json(
        { error: '無効な画像URLです' },
        { status: 400 }
      )
    }

    // ... 既存のバリデーション（outputFormat, styleIds, textPhrase, position）

    // 元画像のURLを保存（削除用）
    uploadedImageUrl = imageUrl

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
    
    // 4. 画像URLから画像をダウンロードしてbase64に変換
    const imageDownloadStartTime = Date.now()
    let imageBase64: string
    let imageMimeType: string

    try {
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
      }
      
      const imageArrayBuffer = await imageResponse.arrayBuffer()
      const imageBuffer = Buffer.from(imageArrayBuffer)
      imageBase64 = imageBuffer.toString('base64')
      imageMimeType = imageResponse.headers.get('content-type') || 'image/png'
      
      log('info', 'Image downloaded and converted to base64', {
        imageUrl: imageUrl.substring(0, 100),
        imageSize: imageArrayBuffer.byteLength,
        imageType: imageMimeType,
        base64Length: imageBase64.length,
        elapsed: Date.now() - imageDownloadStartTime,
      })
    } catch (error) {
      log('error', 'Failed to download image from URL', {
        imageUrl: imageUrl.substring(0, 100),
        error: error instanceof Error ? error.message : String(error),
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

    // 6. 生成結果をVercel Blobに保存
    const blobSaveStartTime = Date.now()
    let generatedImageUrl: string

    try {
      // base64データをBufferに変換
      const generatedImageBuffer = Buffer.from(outBase64, 'base64')
      
      // ファイル名を生成（タイムスタンプベース）
      const timestamp = Date.now()
      const extension = outMime === 'image/png' ? 'png' : 'jpg'
      const filename = `generated/kuu-${timestamp}.${extension}`

      // Vercel Blobに保存
      const blob = await put(filename, generatedImageBuffer, {
        access: 'public',
        addRandomSuffix: true,
        contentType: outMime,
      })

      generatedImageUrl = blob.url

      log('info', 'Generated image saved to Vercel Blob', {
        url: generatedImageUrl,
        pathname: blob.pathname,
        contentType: outMime,
        size: generatedImageBuffer.length,
        elapsed: Date.now() - blobSaveStartTime,
      })
    } catch (error) {
      log('error', 'Failed to save generated image to Vercel Blob', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw new Error('生成結果の保存に失敗しました')
    }

    // 7. 元画像を削除（生成成功時のみ）
    if (uploadedImageUrl) {
      try {
        await del(uploadedImageUrl)
        log('info', 'Original image deleted', {
          url: uploadedImageUrl.substring(0, 100),
        })
      } catch (error) {
        // 削除失敗はログに記録するが、生成処理自体は成功として扱う
        log('warn', 'Failed to delete original image', {
          url: uploadedImageUrl.substring(0, 100),
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // 8. 返却
    const originalWidth = Number.parseInt(originalWidthStr ?? '', 10)
    const originalHeight = Number.parseInt(originalHeightStr ?? '', 10)
    const finalWidth = Number.isFinite(originalWidth) && originalWidth > 0 ? originalWidth : 1024
    const finalHeight = Number.isFinite(originalHeight) && originalHeight > 0 ? originalHeight : 1024

    const responseData = {
      model,
      imageUrl: generatedImageUrl, // data URL → URLに変更
      mimeType: outMime,
      width: finalWidth,
      height: finalHeight,
    }

    const totalElapsed = Date.now() - startTime
    log('info', 'Sending success response', {
      status: 200,
      responseSize: JSON.stringify(responseData).length,
      imageUrl: generatedImageUrl.substring(0, 100),
      mimeType: outMime,
      width: finalWidth,
      height: finalHeight,
      totalElapsed,
    })

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
```

### 5. UIコンポーネント変更（KuuGenerator.tsx, SaveActions.tsx）

#### 実装方針

1. `GenerateState`の`imageDataUrl`を`imageUrl`に変更
2. 画像表示: `next/image`コンポーネントを使用（URL表示に対応）
3. ダウンロード: URLから画像を取得してダウンロード

#### 実装方法

1. **KuuGenerator.tsxの変更**
   - `state.imageDataUrl` → `state.imageUrl`
   - 画像表示: `<img src={state.imageUrl} />` または `<Image src={state.imageUrl} />`

2. **SaveActions.tsxの変更**
   - `imageDataUrl` → `imageUrl`
   - `saveOnDesktop(imageUrl, mimeType)` → URLから画像を取得してダウンロード
   - `saveOnMobile(imageUrl)` → URLから画像を取得して保存

#### 実装例

**KuuGenerator.tsx（変更箇所のみ）**

```typescript
// GenerateStateの型定義を変更（actions.tsで定義）
// export type GenerateState =
//   | { status: 'idle' }
//   | { status: 'error'; message: string }
//   | { status: 'success'; imageUrl: string; mimeType: string; width: number; height: number }

// ステップ3の画像表示部分
{currentStep === 3 && state.status === 'success' && (
  <div className="max-w-4xl mx-auto">
    <section className="card bg-base-100 shadow-2xl border-2 border-primary/30 rounded-2xl overflow-hidden animate-[fadeInScale_0.5s_ease-out_forwards] glass-card">
      <div className="card-body p-6 sm:p-8">
        <h2 className="card-title text-2xl font-bold text-base-content justify-center mb-6">
          ✨ くぅーが誕生しました！
        </h2>
        <figure className="bg-gradient-to-br from-base-200 to-base-100 p-6 sm:p-8 rounded-xl mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={state.imageUrl} 
            alt="生成されたくぅー画像" 
            className="rounded-xl shadow-xl max-w-full h-auto mx-auto transition-transform duration-300 hover:scale-[1.02]"
          />
        </figure>
        <SaveActions
          imageUrl={state.imageUrl}
          mimeType={state.mimeType}
          width={state.width}
          height={state.height}
        />
        {/* ... */}
      </div>
    </section>
  </div>
)}
```

**SaveActions.tsx**

```typescript
'use client'

import { useState } from 'react'
import { detectDeviceClass } from '@/app/lib/save/detectDeviceClass'
import { saveOnDesktop } from '@/app/lib/save/saveOnDesktop'
import { saveOnMobile } from '@/app/lib/save/saveOnMobile'

interface SaveActionsProps {
  imageUrl: string // imageDataUrl → imageUrlに変更
  mimeType: string
  width: number
  height: number
}

export function SaveActions({ imageUrl, mimeType }: SaveActionsProps) {
  const [device] = useState<'desktop' | 'mobile'>(() => detectDeviceClass())

  const handleSave = async () => {
    if (device === 'desktop') {
      saveOnDesktop(imageUrl, mimeType as 'image/png' | 'image/jpeg')
    } else {
      await saveOnMobile(imageUrl)
    }
  }

  // ... 既存のレンダリングロジック
}
```

**saveOnDesktop.ts**

```typescript
export async function saveOnDesktop(
  imageUrl: string, // imageDataUrl → imageUrlに変更
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

**saveOnMobile.ts**

```typescript
export type MobileSaveResult =
  | { outcome: 'camera-roll-saved' }
  | { outcome: 'fallback-downloaded'; message: string }
  | { outcome: 'failed'; message: string }

export async function saveOnMobile(imageUrl: string): Promise<MobileSaveResult> {
  try {
    // URLから画像を取得
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const blob = await response.blob()
    const file = new File([blob], `kuu-${Date.now()}.jpg`, { type: 'image/jpeg' })
    
    // 方法1: Web Share API (Level 2)
    if (navigator.share && navigator.canShare) {
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'くぅー画像',
            text: 'くぅー画像を生成しました！'
          })
          return { outcome: 'camera-roll-saved' }
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            return { outcome: 'failed', message: '共有がキャンセルされました' }
          }
          // 共有失敗時はフォールバックへ進む
        }
      }
    }
    
    // 方法2: 通常のダウンロードにフォールバック
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `kuu-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
    
    return {
      outcome: 'fallback-downloaded',
      message: '画像をダウンロードしました（カメラロールへの保存は非対応のため）。',
    }
  } catch (error) {
    return { outcome: 'failed', message: error instanceof Error ? error.message : '保存に失敗しました' }
  }
}
```

## 次のステップ

1. **Phase 0完了後**: `research.md`を確認し、実装方法を確定
2. **Phase 1完了後**: `data-model.md`, `contracts/openapi.yaml`, `quickstart.md`を確認
3. **実装開始**: `/speckit.tasks`コマンドでタスクを生成し、実装を開始
