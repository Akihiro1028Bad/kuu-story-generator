# Data Model: ストレージベースのアップロード・URLベースのアーキテクチャ

**Date**: 2025-01-27  
**Feature**: 003-storage-upload

## エンティティ

### UploadedImageURL

アップロードされた画像のURL。生成処理の入力として使用される。

#### 属性

| 属性名 | 型 | 説明 | 必須 | 制約 |
|--------|-----|------|------|------|
| `url` | `string` | アップロードされた画像のURL（Vercel Blobの公開URL） | 必須 | - URL形式（`http://`または`https://`で始まる）<br>- Vercel BlobのURL形式 |
| `pathname` | `string` | ストレージ内のパス | 必須 | - 一意であること<br>- ランダムサフィックスが付与される |
| `contentType` | `string` | MIMEタイプ | 必須 | - `image/jpeg`または`image/png` |
| `size` | `number` | ファイルサイズ（バイト） | 必須 | - 10MB以下（10,485,760バイト） |
| `uploadedAt` | `Date` | アップロード日時 | 必須 | - ISO 8601形式 |

#### ライフサイクル

1. **作成**: クライアント側で`upload()`メソッドを使用してVercel Blobにアップロードされた時点で作成される
2. **使用**: Server ActionとBFF APIで生成処理の入力として使用される
3. **削除**: 生成処理が成功し、生成結果のURLが正常に取得できた場合に削除される（`del()`メソッドを使用）

#### バリデーションルール

- URL形式の検証: `new URL(urlString)`で検証
- ファイル形式の検証: `contentType`が`image/jpeg`または`image/png`であること
- ファイルサイズの検証: `size`が10MB以下であること

#### 状態遷移

```
[未アップロード] 
  → [アップロード中] (upload()呼び出し)
  → [アップロード完了] (blob.url取得)
  → [生成処理中] (generateKuu呼び出し)
  → [生成成功] (del()呼び出し)
  → [削除完了]
```

### GeneratedImageURL

生成処理の結果として取得された画像のURL。表示・ダウンロード・保存に使用される。

#### 属性

| 属性名 | 型 | 説明 | 必須 | 制約 |
|--------|-----|------|------|------|
| `url` | `string` | 生成結果の画像URL（Vercel Blobの公開URL） | 必須 | - URL形式（`http://`または`https://`で始まる）<br>- Vercel BlobのURL形式 |
| `pathname` | `string` | ストレージ内のパス | 必須 | - 一意であること<br>- `generated/`プレフィックスが付与される<br>- ランダムサフィックスが付与される |
| `contentType` | `string` | MIMEタイプ | 必須 | - `image/png`または`image/jpeg` |
| `width` | `number` | 画像幅（ピクセル） | 必須 | - 正の整数 |
| `height` | `number` | 画像高さ（ピクセル） | 必須 | - 正の整数 |
| `generatedAt` | `Date` | 生成日時 | 必須 | - ISO 8601形式 |

#### ライフサイクル

1. **作成**: BFF API側で`put()`メソッドを使用してVercel Blobに保存された時点で作成される
2. **使用**: UIで表示・ダウンロード・保存に使用される
3. **有効期限**: 生成完了後24時間以上有効（Vercel Blobの設定による）

#### バリデーションルール

- URL形式の検証: `new URL(urlString)`で検証
- 画像サイズの検証: `width`と`height`が正の整数であること

#### 状態遷移

```
[未生成]
  → [生成処理中] (Gemini API呼び出し)
  → [生成完了] (put()呼び出し)
  → [URL取得] (blob.url取得)
  → [表示・ダウンロード可能]
```

### StorageFile

ストレージに保存されたファイル。ファイル名、パス、メタデータなどの属性を持つ。

#### 属性

| 属性名 | 型 | 説明 | 必須 | 制約 |
|--------|-----|------|------|------|
| `pathname` | `string` | ストレージ内のパス | 必須 | - 一意であること |
| `url` | `string` | 公開URL | 必須 | - URL形式 |
| `contentType` | `string` | MIMEタイプ | 必須 | - 有効なMIMEタイプ |
| `size` | `number` | ファイルサイズ（バイト） | 必須 | - 正の整数 |
| `uploadedAt` | `Date` | アップロード日時 | 必須 | - ISO 8601形式 |

#### ライフサイクル

1. **作成**: `upload()`または`put()`メソッドでVercel Blobに保存された時点で作成される
2. **使用**: URLを通じてアクセス可能
3. **削除**: `del()`メソッドで削除される

## 関係性

### UploadedImageURL → GeneratedImageURL

- **関係**: 1対1
- **説明**: 1つのアップロードされた画像から1つの生成結果が作成される
- **制約**: 生成処理が成功した場合のみ、GeneratedImageURLが作成される

### StorageFile → UploadedImageURL / GeneratedImageURL

- **関係**: 1対1
- **説明**: StorageFileはUploadedImageURLまたはGeneratedImageURLの実体を表す
- **制約**: 各URLは1つのStorageFileに対応する

## データフロー

### アップロードフロー

```
[クライアント: File選択]
  → [UploadSection: バリデーション]
  → [upload() @vercel/blob/client]
  → [Vercel Blob: 保存]
  → [UploadedImageURL: 作成]
  → [クライアント: URL取得]
```

### 生成フロー

```
[Server Action: FormData受信]
  → [imageUrl取得]
  → [BFF API: FormData送信]
  → [BFF API: 画像URLから画像ダウンロード]
  → [BFF API: base64変換]
  → [Gemini API: 生成]
  → [BFF API: base64レスポンス受信]
  → [BFF API: Buffer変換]
  → [BFF API: put() @vercel/blob]
  → [Vercel Blob: 保存]
  → [GeneratedImageURL: 作成]
  → [BFF API: URL返却]
  → [Server Action: URL返却]
  → [クライアント: URL取得]
```

### 削除フロー

```
[生成成功]
  → [BFF API: del() @vercel/blob]
  → [Vercel Blob: 削除]
  → [UploadedImageURL: 削除完了]
```

## データボリューム・スケール仮定

- **ファイルサイズ**: 10MB以下（通常1-5MB）
- **同時アップロード**: 1ユーザーあたり1ファイル（同時アップロードは想定しない）
- **生成結果の保存期間**: 24時間以上（Vercel Blobの設定による）
- **ストレージ容量**: Vercel Blobの無料プランまたは有料プランの制限内

## 一意性ルール

- **UploadedImageURL.url**: 一意（Vercel Blobが自動的にランダムサフィックスを付与）
- **GeneratedImageURL.url**: 一意（Vercel Blobが自動的にランダムサフィックスを付与）
- **StorageFile.pathname**: 一意（Vercel Blobが自動的にランダムサフィックスを付与）

## バリデーションルール（全体）

### クライアント側

- ファイル形式: `image/jpeg`または`image/png`
- ファイルサイズ: 10MB以下
- URL形式: `http://`または`https://`で始まる

### サーバー側

- URL形式: `new URL(urlString)`で検証
- ファイル形式: `allowedContentTypes`で検証（`image/jpeg`, `image/png`）
- 必須項目: `imageUrl`, `textPhraseId`または`textPhraseCustom`, `styleIds`, `positionId`が存在すること

