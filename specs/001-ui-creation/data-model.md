# Data Model: くぅー画像生成UI（001-ui-creation）

**作成日**: 2025-12-12  
**対象Spec**: [spec.md](./spec.md)

## 目的

この機能はDBを持たず、ユーザー操作中の状態をブラウザ内で保持する。  
ただし、実装・テスト・API契約のために「扱うデータ（エンティティ）」を明確化する。

## エンティティ

### UploadedImage

- **説明**: ユーザーがローカルからアップロードした元画像。
- **主な属性**:
  - `fileName`: string（表示用）
  - `mimeType`: string（例: `image/jpeg`, `image/png`）
  - `byteSize`: number
  - `width`: number
  - `height`: number
  - `dataUrl`: string（生成リクエスト用。大きすぎる場合は ObjectURL を使うなど実装で最適化）
- **不変条件**:
  - 出力画像サイズ（ピクセル）は **UploadedImage の width/height と同一**（FR-012）
  - サイズ上限: 10MB（FR-001）
  - 対応形式: JPEG・PNGのみ（FR-001）
  - バリデーションはクライアント側のみで実施（FR-025）

### TextPhraseOption

- **説明**: 「入れる文言」の候補。
- **主な属性**:
  - `id`: string
  - `label`: string（UI表示名）
  - `text`: string（実際に生成プロンプトに入る文言）

### StylePreset

- **説明**: 文字の見た目（フォント/色/装飾/質感/雰囲気）を表すプリセット。
- **主な属性**:
  - `id`: string
  - `label`: string
  - `description`: string
  - `promptHint`: string（生成AIに渡す指示のテンプレ断片）

### PositionPreset

- **説明**: 文字の配置候補（自由調整ではなく、固定の候補から選ぶ）。
- **主な属性**:
  - `id`: string
  - `label`: string（例: 左上/右上/中央/左下/右下）
  - `placementHint`: string（生成AIに渡す指示のテンプレ断片）

### GenerationRequest

- **説明**: 生成を実行するための入力セット。
- **主な属性**:
  - `uploadedImage`: UploadedImage
  - `textPhraseId`: string（TextPhraseOption.id）
  - `styleId`: string（StylePreset.id）
  - `positionId`: string（PositionPreset.id）
  - `outputFormat`: 'png' | 'jpeg'（PC: 選択可能、スマホ: 'jpeg'固定）

### CompositionResult

- **説明**: 合成された最終結果（保存の対象）。
- **主な属性**:
  - `imageDataUrl`: string（data URL形式）
  - `mimeType`: string（`image/png` または `image/jpeg`）
  - `width`: number（元画像と同じ）
  - `height`: number（元画像と同じ）

## 状態遷移

### 生成フローの状態

```text
idle → uploading → validating → generating → success | error
```

- `idle`: 初期状態
- `uploading`: 画像アップロード中（クライアント側）
- `validating`: クライアント側バリデーション中
- `generating`: サーバー側で生成処理中
- `success`: 生成成功（保存可能）
- `error`: エラー発生（再試行可能）

## データフロー

### 生成リクエスト

```text
Client (FormData)
  → Server Action (generateKuu)
    → BFF Route Handler (/api/generate)
      → External API (Nano Banana Pro)
        → BFF (画像URL/Data取得)
          → Server Action (DataURL変換)
            → Client (useActionState state更新)
```

### 保存フロー

```text
Client (CompositionResult)
  → detectDeviceClass()
    → PC: saveOnDesktop() (PNG/JPEG選択)
    → Mobile: saveOnMobile() (カメラロール保存 → 失敗時はDL)
```

