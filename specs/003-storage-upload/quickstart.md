# Quickstart: ストレージベースのアップロード・URLベースのアーキテクチャ

**Date**: 2025-01-27  
**Feature**: 003-storage-upload

## 概要

本機能は、画像アップロードと生成結果の保存をストレージベースのアーキテクチャに移行する。クライアント側でVercel Blobに直接アップロードし、Server ActionとBFF APIはURLのみを受け取り、生成結果もURLとして返す。

## 前提条件

- Node.js v24.12.0 (LTS: Krypton) 以上
- pnpm 10.25.0 以上
- Vercelアカウント（Vercel Blobを使用するため）
- Gemini APIキー（画像生成に使用）

## セットアップ

### 1. パッケージのインストール

```bash
pnpm add @vercel/blob
```

### 2. 環境変数の設定

`.env.local`ファイルに以下の環境変数を追加：

```env
# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# その他（既存）
KUU_USE_REAL_API=1
```

### 3. Vercel Blobトークンの取得

1. Vercelダッシュボードにログイン
2. プロジェクトの設定 → Storage → Blob に移動
3. 「Create Database」または既存のBlobストアを選択
4. 「Settings」タブで「Read and Write」トークンをコピー
5. `.env.local`の`BLOB_READ_WRITE_TOKEN`に設定

## 実装の流れ

### 1. アップロードエンドポイントの作成

`app/api/upload/route.ts`を作成：

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
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
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

### 2. UploadSection.tsxの変更

`app/components/KuuGenerator/UploadSection.tsx`を変更：

- `onImageSelected`の型を`(url: string | null) => void`に変更
- ファイル選択時に`upload()`を呼び出し
- アップロード完了後、`blob.url`を取得して親コンポーネントに渡す

詳細な実装例は`plan.md`を参照。

### 3. actions.tsの変更

`app/components/KuuGenerator/actions.ts`を変更：

- `formData.get('image') as File` → `formData.get('imageUrl') as string`
- URL形式のバリデーションを追加
- BFF APIへの送信: `formDataForAPI.append('imageUrl', imageUrl)`

詳細な実装例は`plan.md`を参照。

### 4. BFF APIの変更

`app/api/generate/route.ts`を変更：

- `formData.get('image') as File` → `formData.get('imageUrl') as string`
- `imageUrl`はVercel Blobの公開URLに限定し、BFF API側でホストallowlist検証を実施
- 画像URLから画像をダウンロード: `fetch(imageUrl)` → `arrayBuffer()` → `base64`変換
- 生成結果をVercel Blobに保存: `put()`を使用
- 元画像を削除: `del()`を使用

詳細な実装例は`plan.md`を参照。

### 5. UIコンポーネントの変更

`app/components/KuuGenerator/KuuGenerator.tsx`と`SaveActions.tsx`を変更：

- `imageDataUrl` → `imageUrl`に変更
- URLから画像を表示・ダウンロード

詳細な実装例は`plan.md`を参照。

## 動作確認

### 1. 開発サーバーの起動

```bash
pnpm dev
```

### 2. アップロードの確認

1. ブラウザで`http://localhost:3000`にアクセス
2. 画像ファイルを選択
3. アップロード進行状況が表示されることを確認
4. アップロード完了後、URLが取得されることを確認

### 3. 生成処理の確認

1. アップロード完了後、スタイルと位置を選択
2. 生成ボタンをクリック
3. 生成処理が実行されることを確認
4. 生成結果のURLが取得されることを確認
5. 画像が表示されることを確認

### 4. ダウンロードの確認

1. 生成結果が表示された状態でダウンロードボタンをクリック
2. 画像がダウンロードされることを確認

## トラブルシューティング

### アップロードが失敗する

- **原因**: `BLOB_READ_WRITE_TOKEN`が正しく設定されていない
- **解決策**: `.env.local`の`BLOB_READ_WRITE_TOKEN`を確認

### 生成処理が失敗する

- **原因**: `GEMINI_API_KEY`が正しく設定されていない、または画像URLが無効
- **解決策**: 
  - `.env.local`の`GEMINI_API_KEY`を確認
  - 画像URLが有効であることを確認（Vercel BlobのURL形式）

### 画像が表示されない

- **原因**: CORSエラー、またはURLが無効
- **解決策**: 
  - ブラウザのコンソールでエラーを確認
  - URLが正しい形式であることを確認

### アップロード中断が動作しない

- **原因**: `abortSignal`が正しく設定されていない
- **解決策**: `UploadSection.tsx`の`abortController`の実装を確認

### ローカルでonUploadCompletedが動作しない

- **原因**: Vercel Blobは`localhost`へコールバックできない
- **解決策**: ngrok等で公開URLを用意し、`.env.local`に`VERCEL_BLOB_CALLBACK_URL=https://xxxxx.ngrok-free.app`を設定

## Breaking Changes

- `/api/generate`のレスポンスが`imageDataUrl`から`imageUrl`に変更されるため、UI/保存処理はURLベースへ移行が必要
- 互換期間中は`imageUrl`を優先しつつ、`imageDataUrl`が残る場合にも動作するよう両対応を行う

## 保存ポリシー

- 生成結果の画像URLは24時間以上有効となる運用方針を想定（Vercel Blobの公開URLを前提）
- 長期保存が必要な場合は、ユーザー側でダウンロード保存する

## 次のステップ

1. **テストの実行**: `pnpm test`でテストを実行
2. **リントの実行**: `pnpm lint`でリントを実行
3. **型チェック**: `pnpm type-check`で型チェックを実行
4. **デプロイ**: Vercelにデプロイして本番環境で動作確認

## 参考資料

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [Gemini API Documentation](https://ai.google.dev/docs)
