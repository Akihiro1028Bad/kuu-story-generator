# Implementation Plan: ddev環境構築とNext.js・モックサーバーセットアップ

**Branch**: `002-setup-ddev-environment` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-setup-ddev-environment/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

ddev環境を使用してNext.jsアプリケーションの開発環境を構築し、Prismモックサーバーをセットアップする。開発者は`ddev start`コマンド一つで開発環境全体を起動でき、Next.jsアプリケーションとモックサーバーが自動的に利用可能になる。

**技術的アプローチ**:
- ddevの`generic`プロジェクトタイプを使用
- `web_extra_daemons`でNext.js開発サーバーを自動起動（オプション）
- `docker-compose.*.yaml`でPrismモックサーバーコンテナを追加
- 環境変数でモックサーバーのURLを管理

## Technical Context

**Language/Version**: 
- Node.js v22.20.0
- TypeScript v5.9.2
- Next.js v16.0.3 (App Router)
- React v19.2.0

**Primary Dependencies**: 
- ddev (最新版)
- Docker / Docker Compose
- pnpm (最新版)
- Prism v4 (Dockerイメージ: stoplight/prism:4)

**Storage**: N/A（開発環境設定ファイルのみ）

**Testing**: 
- ddev環境の起動確認
- Next.js開発サーバーの動作確認
- Prismモックサーバーの動作確認
- ネットワーク接続の確認

**Target Platform**: 
- ローカル開発環境（macOS / Linux / Windows）
- Docker環境必須

**Project Type**: web（Next.js App Routerベース）

**Performance Goals**: 
- ddev環境起動: 5分以内
- Next.js初期画面表示: 3秒以内
- モックサーバーレスポンス: 1秒以内

**Constraints**: 
- ddevがインストールされていること
- Docker Desktop（または同等のDocker環境）が利用可能であること
- インターネット接続が必要（初回セットアップ時）

**Scale/Scope**: 
- 単一開発環境
- 複数開発者での利用を想定（再現可能な環境）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲章に基づく必須チェック項目：

### アーキテクチャ原則
- [x] Next.js App Router ベースの構成を使用しているか → 使用予定（v16.0.3）
- [x] Server Components をデフォルトとして使用しているか → デフォルトで使用
- [x] Mutation は Server Actions で統一されているか → 実装時に適用
- [x] API キーはサーバー側（Route Handlers）で保持されているか → 実装時に適用
- [ ] 画像合成処理はクライアント側で実施されているか（該当する場合） → 本機能では該当なし
- [x] 外部サービス依存は `lib/api/` に集約されているか → 実装時に適用

### コーディング規約
- [x] TypeScript `strict` モードが有効か → Next.js初期化時に設定
- [x] `any` 型を使用していないか（例外時はコメント必須） → 実装時に遵守
- [x] ESLint + Prettier が設定されているか → Next.js初期化時に設定
- [x] Component の役割が分離されているか（UI vs Logic） → 実装時に遵守
- [x] `use client` は CSR 必須時のみ使用しているか → 実装時に遵守
- [x] 命名規則が遵守されているか（変数・関数: camelCase、コンポーネント・型: PascalCase） → 実装時に遵守

### セキュリティ
- [x] API キーが `.env` で管理され、コミットされていないか → `.env.local`を使用、`.gitignore`に追加
- [x] 画像データがサーバーに保存されていないか（仕様に基づく） → 本機能では該当なし
- [x] Route Handlers 経由で API 通信しているか → 実装時に適用
- [x] エラー内容がユーザーに露出していないか → 実装時に適用

### パフォーマンス
- [x] LCP が 3秒以内を目標としているか → 仕様書の成功基準に記載
- [x] `next/image` による最適化を実施しているか → 実装時に適用
- [x] アップロード画像サイズが適切に制限されているか → 実装時に適用

### テスト・品質
- [ ] ユニットテストが必須として計画されているか（画像レイアウト等） → 本機能では環境構築のみのため不要
- [ ] コンポーネントテストが計画されているか（主要 UI） → 本機能では環境構築のみのため不要
- [x] E2Eテストが計画されていないか（本アプリは小規模のため不要） → 計画なし
- [x] CI で `lint`, `type-check`, `test` が自動実行されるか → 実装時に設定
- [x] `test-cases.md` が生成され、全てのテストケースが構造化されたテーブル形式で記載されているか → 本機能では環境構築の動作確認のみ
- [x] テスト仕様書に必須列（テストID、テスト名、前提条件、実行手順、期待結果、対象ファイル/関数、予想カバレッジ率）が含まれているか → test-cases.mdに記載

## Project Structure

### Documentation (this feature)

```text
specs/002-setup-ddev-environment/
├── plan.md              # This file (/speckit.plan command output)
├── test-cases.md        # Test specification (/speckit.plan command output - REQUIRED)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

**Note**: `test-cases.md` は `/speckit.plan` コマンド実行時に自動生成され、実装予定の全てのテストケースを構造化されたテーブル形式で記載します。詳細は憲章セクション 6.1 を参照してください。

### Source Code (repository root)

```text
.ddev/
├── config.yaml                    # ddev基本設定
├── docker-compose.prism.yaml      # Prismモックサーバー設定
└── web-build/                     # カスタムDockerfile（必要に応じて）

openapi.yaml                       # OpenAPI仕様書（Prism用）

.env.example                       # 環境変数テンプレート
.env.local                         # 環境変数（.gitignore対象）

app/                               # Next.js App Router
├── layout.tsx
├── page.tsx
└── ...

lib/
└── api/                           # 外部サービス依存の集約

public/                            # 静的ファイル

package.json                       # 依存関係管理
pnpm-lock.yaml                     # ロックファイル
tsconfig.json                      # TypeScript設定
next.config.ts                     # Next.js設定
tailwind.config.ts                 # Tailwind CSS設定
```

**Structure Decision**: 
Next.js App Routerベースのシングルプロジェクト構成。ddev設定ファイルは`.ddev/`ディレクトリに配置し、OpenAPI仕様書はプロジェクトルートに配置する。

## Architecture

### システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Host Machine                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ddev Environment                    │   │
│  │                                                  │   │
│  │  ┌──────────────────┐  ┌──────────────────┐    │   │
│  │  │   web Container  │  │  prism Container │    │   │
│  │  │                  │  │                  │    │   │
│  │  │  Next.js Dev     │  │  Prism Mock      │    │   │
│  │  │  Server :3000    │  │  Server :4010    │    │   │
│  │  │                  │  │                  │    │   │
│  │  └──────────────────┘  └──────────────────┘    │   │
│  │         │                        │                │   │
│  │         └────────┬───────────────┘                │   │
│  │                  │                                │   │
│  │         ddev Internal Network                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │            ddev-router                           │   │
│  │  (HTTPS証明書自動設定、ポートマッピング)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### コンポーネント説明

1. **web Container**: Next.jsアプリケーションを実行するコンテナ
   - Node.js v22.20.0
   - pnpmでパッケージ管理
   - Next.js開発サーバー（ポート3000）
   - ホットリロード対応

2. **prism Container**: Prismモックサーバーを実行するコンテナ
   - stoplight/prism:4イメージ
   - OpenAPI仕様書を読み込んでモックレスポンスを生成
   - ポート4010でリッスン

3. **ddev-router**: ddevのルーティング機能
   - HTTPS証明書の自動設定
   - ポートマッピング（外部:内部）
   - ドメイン解決（*.ddev.site）

### データフロー

```
開発者
  │
  ├─> ddev start
  │   │
  │   ├─> web Container起動
  │   │   └─> Next.js Dev Server起動（:3000）
  │   │
  │   └─> prism Container起動
  │       └─> Prism Mock Server起動（:4010）
  │
  ├─> ブラウザでアクセス
  │   └─> https://project-name.ddev.site:8080
  │       └─> Next.js App
  │           └─> API Request
  │               └─> http://prism:4010
  │                   └─> Prism Mock Response
```

## Implementation Details

### Phase 1: ddev基本設定

#### 1.1 ddevプロジェクトの初期化

**ファイル**: `.ddev/config.yaml`

**実装手順**:
1. プロジェクトルートで`ddev config`コマンドを実行
2. プロジェクトタイプに`generic`を選択
3. ウェブサーバータイプに`generic`を選択
4. 生成された`config.yaml`を編集

**実装例**:
```yaml
name: kuu-story-generator
type: generic
webserver_type: generic
docroot: ""
php_version: ""
nodejs_version: "22.20.0"
corepack_enable: true
```

**説明**:
- `type: generic`: Node.jsアプリケーション用の設定
- `nodejs_version`: constitutionで指定されたバージョン
- `corepack_enable: true`: pnpmを有効化

#### 1.2 Next.js用ポート設定

**ファイル**: `.ddev/config.yaml`（追加）

**実装例**:
```yaml
web_extra_exposed_ports:
  - name: nextjs
    container_port: 3000
    http_port: 8080
    https_port: 8443
```

**説明**:
- `container_port: 3000`: Next.js開発サーバーのデフォルトポート
- `http_port: 8080`: 外部からのHTTPアクセス用ポート
- `https_port: 8443`: 外部からのHTTPSアクセス用ポート（ddev-routerが証明書を自動設定）

**注意点**:
- すべてのフィールド（name, container_port, http_port, https_port）を指定する必要がある
- ポート番号が既に使用されている場合はエラーになる

#### 1.3 Next.js開発サーバーの自動起動設定（オプション）

**ファイル**: `.ddev/config.yaml`（追加）

**実装例**:
```yaml
web_extra_daemons:
  - name: "nextjs-dev"
    command: "pnpm dev"
    directory: /var/www/html
```

**説明**:
- `name`: デーモンの識別名
- `command`: 実行するコマンド
- `directory`: コマンドを実行するディレクトリ

**注意点**:
- 仕様書では「開発者が手動で起動する」としているため、この設定はオプション
- 自動起動する場合は、`ddev start`時にNext.js開発サーバーも起動する
- 手動起動する場合は、この設定を削除し、`ddev exec pnpm dev`で起動

### Phase 2: Prismモックサーバー設定

#### 2.1 Docker Compose設定ファイルの作成

**ファイル**: `.ddev/docker-compose.prism.yaml`

**実装例**:
```yaml
services:
  prism:
    container_name: "ddev-${DDEV_SITENAME}-prism"
    image: stoplight/prism:4
    command: 'mock -h 0.0.0.0 -p 4010 /tmp/openapi.yaml'
    volumes:
      - ./openapi.yaml:/tmp/openapi.yaml:ro
    labels:
      com.ddev.site-name: ${DDEV_SITENAME}
      com.ddev.approot: ${DDEV_APPROOT}
    restart: "no"
    ports:
      - "4010"
```

**説明**:
- `container_name`: ddevの命名規則に従う
- `image`: Prismの公式Dockerイメージ
- `command`: Prismモックサーバーを起動するコマンド
  - `-h 0.0.0.0`: すべてのネットワークインターフェースでリッスン
  - `-p 4010`: ポート4010でリッスン
  - `/tmp/openapi.yaml`: OpenAPI仕様書のパス（コンテナ内）
- `volumes`: プロジェクトルートの`openapi.yaml`をコンテナ内の`/tmp/openapi.yaml`にマウント
- `labels`: ddevがサービスを認識するためのラベル
- `restart: "no"`: ddevが管理するため、Dockerの自動再起動は無効
- `ports`: ポート4010を公開（ddevが自動的にホストポートを割り当て）

**注意点**:
- ファイル名は`docker-compose.*.yaml`の形式である必要がある
- ddevは起動時にこのファイルを自動的に読み込む
- OpenAPI仕様書が存在しない場合はエラーになる

#### 2.2 OpenAPI仕様書の作成

**ファイル**: `openapi.yaml`（プロジェクトルート）

**実装例**:
```yaml
openapi: 3.0.2
info:
  title: Nano Banana Pro API Mock
  version: 1.0.0
  description: モックサーバー用のOpenAPI仕様書
servers:
  - url: http://prism:4010
    description: Prismモックサーバー
paths:
  /api/v1/generate:
    post:
      summary: 画像生成API
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                prompt:
                  type: string
                  example: "くぅー"
      responses:
        '200':
          description: 成功
          content:
            application/json:
              schema:
                type: object
                properties:
                  imageUrl:
                    type: string
                    example: "https://example.com/image.png"
```

**説明**:
- OpenAPI 3.0.2形式で記述
- `servers`: モックサーバーのURLを指定
- `paths`: APIエンドポイントを定義
- 実際のAPI仕様に合わせて記述する

**注意点**:
- ファイルはプロジェクトルートに配置する
- バージョン管理下に置く（`.gitignore`に追加しない）
- Prismが読み込める形式である必要がある

### Phase 3: 環境変数設定

#### 3.1 環境変数テンプレートの作成

**ファイル**: `.env.example`

**実装例**:
```bash
# モックサーバーのURL
# 開発環境: http://prism:4010
# 本番環境: https://api.example.com
NEXT_PUBLIC_API_URL=http://prism:4010
```

**説明**:
- 新規開発者が必要な環境変数を把握できる
- バージョン管理下に置く
- 機密情報は含めない

#### 3.2 環境変数ファイルの作成

**ファイル**: `.env.local`

**実装手順**:
1. `.env.example`をコピーして`.env.local`を作成
2. 必要に応じて値を変更

**実装例**:
```bash
NEXT_PUBLIC_API_URL=http://prism:4010
```

**説明**:
- Next.jsが自動的に読み込む
- `.gitignore`に追加されていることを確認
- 機密情報を含む場合は絶対にコミットしない

#### 3.3 .gitignoreの確認

**ファイル**: `.gitignore`

**確認項目**:
```gitignore
# 環境変数
.env.local
.env*.local

# ddev
.ddev/.gitignore
```

**説明**:
- `.env.local`が`.gitignore`に含まれていることを確認
- ddevの自動生成ファイルも除外する

### Phase 4: Next.jsアプリケーション設定

#### 4.1 Next.jsプロジェクトの初期化

**実装手順**:
1. `ddev exec npx create-next-app@16.0.3 .`を実行
2. 以下のオプションを選択:
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - App Router: Yes
   - src/ directory: No（プロジェクトルートに配置）
   - import alias: @/*

**説明**:
- constitutionで指定されたバージョンを使用
- App Routerを選択（必須）
- TypeScriptを有効化

#### 4.2 環境変数の使用

**ファイル**: `lib/api/client.ts`（例）

**実装例**:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://prism:4010'

export async function fetchFromAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`
  const response = await fetch(url, options)
  return response.json()
}
```

**説明**:
- `NEXT_PUBLIC_`プレフィックスでクライアント側からもアクセス可能
- デフォルト値を設定することで、環境変数が未設定でも動作する
- `lib/api/`に集約することで、外部サービス依存を一元管理

#### 4.3 package.jsonの設定

**ファイル**: `package.json`

**実装例**:
```json
{
  "name": "kuu-story-generator",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "16.0.3",
    "react": "19.2.0",
    "react-dom": "19.2.0"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "5.9.2",
    "eslint": "^9.37.0",
    "eslint-config-next": "16.0.3",
    "prettier": "^3.6.2"
  }
}
```

**説明**:
- `packageManager`: pnpmのバージョンを固定
- constitutionで指定されたバージョンを使用
- スクリプトに`type-check`を追加

### Phase 5: 動作確認

#### 5.1 ddev環境の起動確認

**実装手順**:
1. `ddev start`を実行
2. `ddev describe`でサービス状態を確認
3. すべてのコンテナが起動していることを確認

**期待結果**:
- webコンテナが起動している
- prismコンテナが起動している
- ポートが正しくマッピングされている

#### 5.2 Next.js開発サーバーの起動確認

**実装手順**:
1. `ddev exec pnpm install`を実行
2. `ddev exec pnpm dev`を実行（手動起動の場合）
3. ブラウザで`https://kuu-story-generator.ddev.site:8080`にアクセス

**期待結果**:
- Next.jsの初期画面が表示される
- ホットリロードが機能する

#### 5.3 Prismモックサーバーの動作確認

**実装手順**:
1. `ddev exec curl http://prism:4010/api/v1/generate`を実行
2. モックレスポンスが返されることを確認

**期待結果**:
- OpenAPI仕様書に基づいたレスポンスが返される
- ステータスコードが正しい

#### 5.4 ネットワーク接続の確認

**実装手順**:
1. Next.jsアプリケーションからPrismモックサーバーにリクエストを送信
2. レスポンスが返されることを確認

**期待結果**:
- 環境変数で設定したURLで接続できる
- モックレスポンスが正しく返される

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

本機能では憲章違反はありません。

## テスト仕様書

詳細なテストケースは [test-cases.md](./test-cases.md) を参照してください。

テスト仕様書には以下の内容が含まれています：
- 単体テスト: 5ケース（設定ファイルの検証）
- 統合テスト: 6ケース（環境起動、サーバー動作、ネットワーク接続の確認）

すべてのテストケースは構造化されたテーブル形式で記載され、テストID、テスト名、前提条件、実行手順、期待結果、対象ファイル/関数、予想カバレッジ率が含まれています。

## 次のステップ

1. ✅ `data-model.md`の作成（完了）
2. ✅ `quickstart.md`の作成（完了）
3. ✅ `test-cases.md`の作成（完了）
4. `/speckit.tasks`で実装タスクを分解
