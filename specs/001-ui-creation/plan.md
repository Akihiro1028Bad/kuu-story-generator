# Implementation Plan: くぅー画像生成UI（001-ui-creation）

**Branch**: `001-ui-creation` | **Date**: 2025-12-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ui-creation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ユーザーが画像をアップロードし、以下の選択肢を選んで「くぅー」文字を合成した画像を保存できるUIを実装する。

- **入れる文言**: 候補から選択（FR-021）
- **文字スタイル**: プリセットから選択（FR-022）
- **文字の場所**: 位置プリセットから選択（FR-023）

保存導線は端末で分岐する。

- **PC**: PNG/JPEG を選んでダウンロード（FR-013）
- **スマホ**: JPEG をカメラロール保存（失敗時は通常ダウンロードへフォールバック）（FR-014/FR-016）

技術方針（調査根拠は `research.md`）：
- 生成は **Server Actions + FormData** を採用（Mutation統一）
- 外部AI呼び出しは **Route Handler（BFF）** へ集約（APIキー保護）
- UI状態は **React 19 の `useActionState`** を基本とする

## Technical Context

**Language/Version**: TypeScript 5.9.3  
**Primary Dependencies**: Next.js 16.0.10（App Router）, React 19.2.3, Tailwind CSS 4.1.18  
**Storage**: N/A（DBなし、画像はサーバー永続化しない）  
**Testing**: Vitest（ユニットテスト必須）＋必要に応じてコンポーネントテスト（E2Eは不要）  
**Target Platform**: Web（PCブラウザ / モバイルブラウザ）  
**Project Type**: Web application（Next.js App Router）  
**Performance Goals**: LCP 3秒以内、生成体感 3秒目標（憲章）  
**Constraints**: 画像のサーバー永続保存禁止、APIキーはサーバー側保持（憲章）  
**Scale/Scope**: 小規模（単一画面中心、E2Eは実施しない）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲章に基づく必須チェック項目：

### アーキテクチャ原則
- [x] Next.js App Router ベースの構成を使用する
- [x] Server Components をデフォルトとして使用する（UIで必要な箇所のみ `use client`）
- [x] Mutation は Server Actions で統一する（生成フォームは Server Action で送信）
- [x] API キーはサーバー側（Route Handlers）で保持する（外部AI呼び出しはBFFへ集約）
- [x] 画像合成は外部AIで実施し、クライアントは保存導線を担う（サーバー永続化なし）
- [x] 外部サービス依存は `lib/api/` に集約する（BFFから利用）

### コーディング規約
- [x] TypeScript `strict`（既存設定に従う）
- [x] `any` 禁止（例外はコメント）
- [x] ESLint + Prettier（既存）
- [x] UIとロジック（prompt生成/検証/保存）は分離する
- [x] `use client` はフォーム操作・保存導線などCSRが必要な箇所に限定する
- [x] 命名規則を遵守する

### セキュリティ
- [x] API キーは `.env` 管理（コミット禁止）
- [x] 画像データはサーバー永続保存しない
- [x] Route Handlers 経由で外部AIへ通信する
- [x] 詳細エラーをユーザーに露出しない（汎用メッセージ＋再試行案内）

### パフォーマンス
- [x] LCP 3秒以内を目標
- [ ] `next/image` 最適化（本機能はアップロード画像の確認表示が中心。適用可否は実装時に判断）
- [x] アップロード画像の制限（JPEG/PNGのみ、10MB上限。バリデーションはクライアント側のみ：FR-001/FR-025）

### テスト・品質
- [x] ユニットテスト必須（選択肢/プロンプト/制約/エラー整形）
- [x] コンポーネントテスト（主要UI）は中（時間が許す範囲で）
- [x] E2Eテストは計画しない
- [ ] CI で `lint`, `type-check`, `test` を自動実行（CI整備は別タスクで計画）
- [x] `test-cases.md` を作成済み（[test-cases.md](./test-cases.md)）
- [x] 必須列を満たす
- [x] 単体/統合でセクション分割＋集計を記載

## Project Structure

### Documentation (this feature)

```text
specs/001-ui-creation/
├── plan.md
├── test-cases.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
└── tasks.md             # /speckit.tasks で生成
```

**Note**: `test-cases.md` は `/speckit.plan` コマンド実行時に自動生成され、実装予定の全てのテストケースを構造化されたテーブル形式で記載します。詳細は憲章セクション 6.1 を参照してください。

### Source Code (repository root)

```text
app/
├── api/
│   ├── options/
│   │   └── route.ts          # 選択肢一覧取得（GET）
│   └── generate/
│       └── route.ts          # 画像生成（POST、BFF）
├── components/
│   └── KuuGenerator/
│       ├── KuuGenerator.tsx  # メインUI（Client Component）
│       ├── actions.ts        # Server Actions（生成処理）
│       ├── UploadSection.tsx # 画像アップロードUI
│       ├── StyleSection.tsx  # スタイル選択UI
│       ├── GenerateButton.tsx # 生成ボタン
│       └── SaveActions.tsx   # PC/スマホ保存導線（Client）
├── lib/
│   ├── presets/
│   │   ├── textPhraseOptions.ts
│   │   ├── stylePresets.ts
│   │   └── positionPresets.ts
│   ├── prompt/
│   │   └── buildPrompt.ts
│   ├── validate/
│   │   └── validateSelections.ts
│   ├── save/
│   │   ├── detectDeviceClass.ts
│   │   ├── saveOnDesktop.ts
│   │   └── saveOnMobile.ts
│   └── errors/
│       └── toUserMessage.ts
├── layout.tsx
└── page.tsx                   # Server Component（KuuGeneratorを配置）

lib/api/
└── client.ts                  # 既存: Prism/外部API呼び出し共通
```

**Structure Decision**: 既存のNext.js App Router構成（`app/`）に、BFF Route Handlers と UI/ロジック分離の `app/lib` を追加する。

## Phase 0: Research（完了）

- [research.md](./research.md)

## Phase 1: Design & Contracts（完了）

- [data-model.md](./data-model.md)
- [contracts/openapi.yaml](./contracts/openapi.yaml)
- [quickstart.md](./quickstart.md)
- [test-cases.md](./test-cases.md)

## Phase 2: Implementation Plan（初級者向け・手順つき）

### 2.1 全体アーキテクチャ（役割分担）

```text
UI（Client Components）
  ├─ 画像アップロード / 選択UI / 保存導線
  └─ Server Action を form action で呼ぶ（FormData）

Server Actions（Mutationの入口）
  └─ 入力検証 → BFF Route Handler を呼ぶ → 結果を状態として返す

BFF Route Handlers（外部AIの通信窓口）
  └─ FormData受領 → 外部API向けpayload生成 → lib/api 経由で外部へ → 結果をDataURLで返す

lib/api（外部依存の集約）
  └─ Prism/本番APIのHTTP呼び出し共通化
```

### 2.2 実装手順（ファイル単位で迷わない版）

#### Step 1: 候補データを作る（文言/スタイル/位置）

作成するファイル（例）:
- `app/lib/presets/textPhraseOptions.ts`
- `app/lib/presets/stylePresets.ts`
- `app/lib/presets/positionPresets.ts`

ポイント:
- `id` はURLやフォーム値として扱いやすい短い文字列にする（例: `pop`, `handwrite`）
- `label` はUI表示
- `description` は説明（任意）

#### Step 2: BFF `/api/options` を作る

作成:
- `app/api/options/route.ts`

責務:
- 候補一覧（3種類）をJSONで返す

#### Step 3: prompt生成関数を作る

作成:
- `app/lib/prompt/buildPrompt.ts`

責務:
- `TextPhraseOption` + `StylePreset` + `PositionPreset` から 1つのプロンプト文字列を組み立てる

#### Step 4: BFF `/api/generate` を作る（外部AI呼び出し）

作成:
- `app/api/generate/route.ts`

責務:
- `request.formData()` で `image` と選択値を受け取る
- 入力検証（必須項目、候補IDの存在）
- 外部AIへ送る payload を組み立てる
- `lib/api/client.ts` を使って Prism/外部API を呼ぶ
- 返ってきた画像URLまたはDataを **data URL** に変換して返す

#### Step 5: Server Actions を作る（UIから呼ぶMutation）

作成:
- `app/components/KuuGenerator/actions.ts`

責務:
- 生成フォームから `FormData` を受け取り、`/api/generate` を呼ぶ
- 成功/失敗を **状態**として返す（`useActionState` と相性が良い）

#### Step 6: 画面UIを作る（ステップ型、PC/スマホレイアウト）

作成:
- `app/components/KuuGenerator/KuuGenerator.tsx`（`'use client'`）
- `app/page.tsx` は Server Component のまま、上記コンポーネントを配置

責務:
- ステップ表示（アップロード→スタイル→生成→保存）
- 結果・保存の固定表示（PC: 2カラム右、Mobile: 上）
- `useActionState` で pending/エラー/結果を管理

#### Step 7: 保存導線（PC/スマホ）

作成:
- `app/lib/save/saveOnDesktop.ts`（PNG/JPEGのDL）
- `app/lib/save/saveOnMobile.ts`（カメラロール保存を"可能な限り"実現し、失敗時はDL）

注意:
- モバイルWebはOS/ブラウザ制約が大きい。Planでは **失敗時フォールバック** を必ず実装する（FR-016）。

### 2.3 実装例（詳細版・初級者向け）

#### Step 1: 候補データの実装例

```ts
// app/lib/presets/textPhraseOptions.ts
export interface TextPhraseOption {
  id: string
  label: string
  text: string
}

export const textPhraseOptions: TextPhraseOption[] = [
  { id: 'kuu', label: 'くぅー', text: 'くぅー' },
  { id: 'kuu2', label: 'くぅー！', text: 'くぅー！' },
  // ... 他の候補
]
```

**ポイント**:
- `id` はフォーム値として使うため、URL-safeな文字列にする
- `label` はUIに表示される名前
- `text` は実際にAIに送られる文言

#### Step 2: BFF `/api/options` の実装例

```ts
// app/api/options/route.ts
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
```

**ポイント**:
- Server Componentからも呼べるが、Client Componentからも `fetch` で呼べる
- キャッシュ戦略は実装時に検討（現時点では毎回取得）

#### Step 3: プロンプト生成の実装例

```ts
// app/lib/prompt/buildPrompt.ts
import { TextPhraseOption } from '@/app/lib/presets/textPhraseOptions'
import { StylePreset } from '@/app/lib/presets/stylePresets'
import { PositionPreset } from '@/app/lib/presets/positionPresets'

export function buildPrompt(
  textPhrase: TextPhraseOption,
  style: StylePreset,
  position: PositionPreset
): string {
  // 例: "くぅーという文字を、ポップなスタイルで、画像の左上に追加してください"
  return `${textPhrase.text}という文字を、${style.promptHint}で、${position.placementHint}に追加してください`
}
```

**ポイント**:
- プロンプトの組み立てロジックを分離することで、テストしやすくなる
- 将来的にプロンプトの調整が必要になった場合、この関数だけ修正すればよい

#### Step 4: BFF `/api/generate` の実装例（詳細）

```ts
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildPrompt } from '@/app/lib/prompt/buildPrompt'
import { fetchFromAPI } from '@/lib/api/client'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // 1. 入力取得
    const image = formData.get('image') as File
    const textPhraseId = formData.get('textPhraseId') as string
    const styleId = formData.get('styleId') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    
    // 2. バリデーション（サーバー側では簡易チェックのみ。詳細はクライアント側で実施済み）
    if (!image || !textPhraseId || !styleId || !positionId) {
      return NextResponse.json(
        { error: '必須項目が不足しています' },
        { status: 400 }
      )
    }
    
    // 3. 画像をData URLに変換（外部APIに送るため）
    const imageBuffer = await image.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')
    const imageDataUrl = `data:${image.type};base64,${imageBase64}`
    
    // 4. プロンプト生成（候補データを取得して組み立て）
    // 注意: 実際の実装では、候補データを取得する必要がある
    const prompt = buildPrompt(/* ... */)
    
    // 5. 外部API呼び出し
    const result = await fetchFromAPI('/fal-ai/nano-banana-pro/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        image_urls: [imageDataUrl],
        output_format: outputFormat,
        sync_mode: true, // Data URLで返す
      }),
    })
    
    // 6. 結果を返す
    return NextResponse.json({
      imageDataUrl: result.images[0].url, // または result.images[0].data
      mimeType: `image/${outputFormat}`,
      width: result.images[0].width,
      height: result.images[0].height,
    })
  } catch (error) {
    console.error('Generation error:', error)
    return NextResponse.json(
      { error: '画像生成に失敗しました。しばらくしてから再試行してください。' },
      { status: 500 }
    )
  }
}
```

**ポイント**:
- エラーハンドリングは必ず実装する（詳細エラーはログに、ユーザーには汎用メッセージ）
- 画像の変換処理は非同期なので `await` を忘れない
- 外部APIのレスポンス形式は実装時に確認（モックサーバーの仕様に合わせる）

#### Step 5: Server Action の実装例（詳細）

```ts
// app/components/KuuGenerator/actions.ts
'use server'

import { headers } from 'next/headers'

export type GenerateState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'success'; imageDataUrl: string; mimeType: string; width: number; height: number }

const initialState: GenerateState = { status: 'idle' }

export async function generateKuu(
  prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  try {
    // 1. FormDataから値を取得
    const image = formData.get('image') as File
    const textPhraseId = formData.get('textPhraseId') as string
    const styleId = formData.get('styleId') as string
    const positionId = formData.get('positionId') as string
    const outputFormat = formData.get('outputFormat') as 'png' | 'jpeg'
    
    // 2. クライアント側でバリデーション済みだが、念のためサーバー側でも簡易チェック
    if (!image || !textPhraseId || !styleId || !positionId) {
      return {
        status: 'error',
        message: '必須項目が不足しています。画像とすべての選択肢を選んでください。',
      }
    }
    
    // 3. BFF APIを呼び出す
    const formDataForAPI = new FormData()
    formDataForAPI.append('image', image)
    formDataForAPI.append('textPhraseId', textPhraseId)
    formDataForAPI.append('styleId', styleId)
    formDataForAPI.append('positionId', positionId)
    formDataForAPI.append('outputFormat', outputFormat)
    
    // 注意: Server Action からの fetch は絶対URLが必要になるため、
    // リクエストヘッダーから origin（proto/host）を組み立てて自アプリの Route Handler を呼ぶ。
    // NEXT_PUBLIC_API_URL は「外部API（Prism/本番AI）のベースURL」用途と衝突するため、ここでは使用しない。
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'http'

    if (!host) {
      return {
        status: 'error',
        message: '実行環境のホスト情報を取得できませんでした。再試行してください。',
      }
    }

    const url = `${proto}://${host}/api/generate`
    const response = await fetch(url, { method: 'POST', body: formDataForAPI })
    
    if (!response.ok) {
      const error = await response.json()
      return {
        status: 'error',
        message: error.error || '画像生成に失敗しました。',
      }
    }
    
    const result = await response.json()
    
    // 4. 成功状態を返す
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
      message: '予期しないエラーが発生しました。しばらくしてから再試行してください。',
    }
  }
}
```

**ポイント**:
- `useActionState` を使う場合、Server Actionの第一引数は `prevState` になる
- エラー時は必ずユーザー向けメッセージを返す（詳細エラーはログに）
- `fetch` のURLは環境変数から取得（開発/本番で切り替え可能）

#### Step 6: Client Component の実装例（詳細）

```tsx
// app/components/KuuGenerator/KuuGenerator.tsx
'use client'

import { useActionState, useState, useEffect } from 'react'
import { generateKuu, type GenerateState } from './actions'
import { UploadSection } from './UploadSection'
import { StyleSection } from './StyleSection'
import { GenerateButton } from './GenerateButton'
import { SaveActions } from './SaveActions'

const initialState: GenerateState = { status: 'idle' }

export function KuuGenerator() {
  const [state, formAction, pending] = useActionState(generateKuu, initialState)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [options, setOptions] = useState(null)

  // 選択肢を取得
  useEffect(() => {
    fetch('/api/options')
      .then((res) => res.json())
      .then(setOptions)
      .catch(console.error)
  }, [])

  return (
    <div className="container mx-auto p-4">
      {/* PC: 2カラム、Mobile: 1カラム（上: 結果・保存 / 下: 操作） */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 左（PC）または下（Mobile）: 操作パネル */}
        <div>
          <form action={formAction}>
            {/* ステップ1: 画像アップロード */}
            <UploadSection
              onImageSelected={setUploadedImage}
              disabled={pending}
            />
            
            {/* ステップ2: スタイル選択 */}
            {uploadedImage && (
              <StyleSection
                options={options}
                disabled={pending}
              />
            )}
            
            {/* ステップ3: 生成ボタン */}
            {uploadedImage && options && (
              <GenerateButton
                pending={pending}
                disabled={pending}
              />
            )}
          </form>
          
          {/* エラー表示 */}
          {state.status === 'error' && (
            <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
              {state.message}
            </div>
          )}
        </div>
        
        {/* 右（PC）または上（Mobile）: 結果・保存 */}
        <div>
          {state.status === 'success' && (
            <div>
              <p className="mb-4">生成が完了しました！</p>
              <SaveActions
                imageDataUrl={state.imageDataUrl}
                mimeType={state.mimeType}
                width={state.width}
                height={state.height}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

**ポイント**:
- `useActionState` の戻り値: `[state, formAction, pending]`
  - `state`: Server Actionの返り値（成功/失敗の状態）
  - `formAction`: フォームの `action` に渡す関数
  - `pending`: 送信中かどうかの真偽値
- ステップ表示は条件付きレンダリングで実現
- エラー表示は `aria-live` 属性を付けるとアクセシビリティが向上

#### Step 7: 保存処理の実装例

```ts
// app/lib/save/saveOnDesktop.ts
export function saveOnDesktop(
  imageDataUrl: string,
  mimeType: 'image/png' | 'image/jpeg',
  fileName?: string
): void {
  const link = document.createElement('a')
  link.href = imageDataUrl
  link.download = fileName || `kuu-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
```

```ts
// app/lib/save/saveOnMobile.ts
export type MobileSaveResult =
  | { outcome: 'camera-roll-saved' }
  | { outcome: 'fallback-downloaded'; message: string }
  | { outcome: 'failed'; message: string }

export async function saveOnMobile(imageDataUrl: string): Promise<MobileSaveResult> {
  try {
    // iOS Safari / Chrome でのカメラロール保存
    // 注意: モバイルWebの制約により、完全な実装は難しい場合がある
    // 失敗時は通常のダウンロードにフォールバック
    
    // 方法1: Web Share API（対応ブラウザのみ）
    if (navigator.share) {
      const response = await fetch(imageDataUrl)
      const blob = await response.blob()
      const file = new File([blob], 'kuu.jpg', { type: 'image/jpeg' })
      
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        return { outcome: 'camera-roll-saved' }
      }
    }
    
    // 方法2: 通常のダウンロードにフォールバック
    const link = document.createElement('a')
    link.href = imageDataUrl
    link.download = `kuu-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return {
      outcome: 'fallback-downloaded',
      message: 'カメラロールへの保存に対応していないため、ダウンロードに切り替えました。',
    }
  } catch (error) {
    return { outcome: 'failed', message: error instanceof Error ? error.message : '保存に失敗しました' }
  }
}
```

**ポイント**:
- モバイルWebのカメラロール保存はOS/ブラウザ依存が大きい
- Web Share APIは対応ブラウザが限られるため、フォールバック必須
- フォールバックした場合も含め、結果（保存できた/できない/ダウンロードに切替）をユーザーに通知する（FR-016）

### 2.4 実装時の注意点（初級者向け）

1. **TypeScriptの型定義を必ず書く**
   - `any` は使わない（憲章違反）
   - 型が不明な場合は `unknown` を使い、型ガードで絞り込む

2. **エラーハンドリングを忘れない**
   - `try-catch` で囲む
   - ユーザー向けメッセージは必ず日本語で
   - 詳細エラーは `console.error` でログに出力

3. **非同期処理は `await` を忘れない**
   - `fetch`、`formData()` などは非同期
   - `async/await` を使うか、`.then()` でチェーンする

4. **`use client` の使い分け**
   - フォーム操作、状態管理が必要なコンポーネントのみ `'use client'`
   - それ以外は Server Component のまま

5. **パフォーマンスを意識する**
   - 大きな画像は Data URL ではなく Object URL を使う
   - 不要な再レンダリングを避ける（`useMemo`、`useCallback` を適切に使用）

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | - | - |
