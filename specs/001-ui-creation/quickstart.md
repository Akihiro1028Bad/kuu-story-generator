# Quickstart: くぅー画像生成UI（001-ui-creation）

**作成日**: 2025-12-12  
**対象Spec**: [spec.md](./spec.md)

## 概要

ユーザーが画像をアップロードし、選択肢（文言・スタイル・位置）を選んで「くぅー」文字を合成した画像を保存できるUI。

## 使い方（エンドユーザー向け）

### PCでの利用

1. **画像をアップロード**
   - 「画像を選択」ボタンをクリック
   - JPEGまたはPNG形式の画像を選択（10MB以下）

2. **スタイルを選択**
   - 「入れる文言」: 候補から選択（例: 「くぅー」）
   - 「文字のスタイル」: プリセットから選択（例: ポップ、手書き）
   - 「文字の場所」: 位置プリセットから選択（例: 左上、中央）

3. **生成を実行**
   - 「生成」ボタンをクリック
   - 生成完了まで待つ（進行中表示あり）

4. **保存**
   - 生成完了後、「保存」ボタンをクリック
   - PNGまたはJPEG形式を選択してダウンロード

### スマホでの利用

1. **画像をアップロード**（PCと同じ）
2. **スタイルを選択**（PCと同じ）
3. **生成を実行**（PCと同じ）
4. **保存**
   - 生成完了後、「保存」ボタンをクリック
   - 自動的にカメラロールに保存（JPEG形式）
   - 保存に失敗した場合は、通常のダウンロードに切り替え可能

## 開発者向けクイックスタート

### 前提条件

- Node.js 24.12.0 (LTS: Krypton)
- pnpm 10.25.0
- Docker & Docker Compose（開発環境用）

### セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd kuu-story-generator

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp .env.example .env.local
# .env.local に API キーを設定（必要に応じて）

# Docker Composeで開発環境を起動
docker-compose up -d

# 開発サーバーを起動
pnpm dev
```

### 主要なファイル構成

```
app/
├── api/
│   ├── options/route.ts      # 選択肢一覧取得API
│   └── generate/route.ts      # 画像生成API（BFF）
├── components/
│   └── KuuGenerator/         # メインUIコンポーネント
└── lib/
    ├── presets/              # 選択肢データ
    ├── prompt/               # プロンプト生成
    ├── validate/             # バリデーション
    └── save/                 # 保存処理
```

### 実装の流れ

1. **選択肢データの定義** (`app/lib/presets/`)
2. **BFF APIの実装** (`app/api/`)
3. **Server Actionsの実装** (`app/components/KuuGenerator/actions.ts`)
4. **UIコンポーネントの実装** (`app/components/KuuGenerator/`)
5. **保存処理の実装** (`app/lib/save/`)

詳細は [plan.md](./plan.md) の Phase 2 を参照。

