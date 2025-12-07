# Quick Start Guide: ddev環境構築とNext.js・モックサーバーセットアップ

**Date**: 2025-12-08  
**Feature**: 002-setup-ddev-environment

## 前提条件

- ddevがインストールされていること
- Docker Desktop（または同等のDocker環境）が起動していること
- インターネット接続があること（初回セットアップ時）

## セットアップ手順

### ステップ1: ddevプロジェクトの初期化

プロジェクトルートで以下のコマンドを実行します：

```bash
ddev config --project-type=generic --webserver-type=generic
```

これにより、`.ddev/config.yaml`が生成されます。

### ステップ2: ddev設定の編集

`.ddev/config.yaml`を以下のように編集します：

```yaml
name: kuu-story-generator
type: generic
webserver_type: generic
docroot: ""
php_version: ""
nodejs_version: "22.20.0"
corepack_enable: true

web_extra_exposed_ports:
  - name: nextjs
    container_port: 3000
    http_port: 8080
    https_port: 8443
```

**説明**:
- `name`: プロジェクト名（URLに使用される）
- `nodejs_version`: constitutionで指定されたバージョン
- `corepack_enable`: pnpmを有効化
- `web_extra_exposed_ports`: Next.js開発サーバー用のポート設定

### ステップ3: Prismモックサーバー設定の作成

`.ddev/docker-compose.prism.yaml`を作成し、以下の内容を記述します：

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
- Prismモックサーバーを別コンテナとして追加
- OpenAPI仕様書をボリュームマウント
- ポート4010でリッスン

### ステップ4: OpenAPI仕様書の作成

プロジェクトルートに`openapi.yaml`を作成します：

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

**注意**: 実際のAPI仕様に合わせて編集してください。

### ステップ5: 環境変数テンプレートの作成

`.env.example`を作成します：

```bash
# モックサーバーのURL
# 開発環境: http://prism:4010
# 本番環境: https://api.example.com
NEXT_PUBLIC_API_URL=http://prism:4010
```

### ステップ6: 環境変数ファイルの作成

`.env.example`をコピーして`.env.local`を作成します：

```bash
cp .env.example .env.local
```

必要に応じて値を編集してください。

### ステップ7: .gitignoreの確認

`.gitignore`に以下が含まれていることを確認します：

```gitignore
# 環境変数
.env.local
.env*.local
```

### ステップ8: ddev環境の起動

以下のコマンドでddev環境を起動します：

```bash
ddev start
```

**期待される動作**:
- webコンテナが起動
- prismコンテナが起動
- すべてのサービスが正常に起動

### ステップ9: Next.jsプロジェクトの初期化

ddev環境内でNext.jsプロジェクトを初期化します：

```bash
ddev exec npx create-next-app@16.0.3 . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
```

**オプション説明**:
- `--typescript`: TypeScriptを有効化
- `--tailwind`: Tailwind CSSを有効化
- `--app`: App Routerを使用
- `--no-src-dir`: プロジェクトルートに配置
- `--import-alias "@/*"`: インポートエイリアスを設定

### ステップ10: パッケージのインストール

```bash
ddev exec pnpm install
```

### ステップ11: Next.js開発サーバーの起動

```bash
ddev exec pnpm dev
```

**注意**: 手動起動の場合、このコマンドを実行する必要があります。自動起動を設定した場合は、`ddev start`時に自動的に起動します。

### ステップ12: 動作確認

1. **Next.jsアプリケーション**: ブラウザで`https://kuu-story-generator.ddev.site:8080`にアクセス
2. **Prismモックサーバー**: `ddev exec curl http://prism:4010/api/v1/generate`を実行

## トラブルシューティング

### ポートが既に使用されている

**エラー**: `Port 8080 is already in use`

**解決方法**:
1. `.ddev/config.yaml`の`web_extra_exposed_ports`のポート番号を変更
2. または、使用中のプロセスを停止

### Prismコンテナが起動しない

**エラー**: `prism container failed to start`

**解決方法**:
1. `openapi.yaml`が存在することを確認
2. `openapi.yaml`の形式が正しいことを確認
3. `ddev logs prism`でログを確認

### Next.js開発サーバーに接続できない

**エラー**: `Connection refused`

**解決方法**:
1. `ddev exec pnpm dev`が実行されていることを確認
2. ポート設定（`web_extra_exposed_ports`）が正しいことを確認
3. `ddev describe`でポートマッピングを確認

### 環境変数が読み込まれない

**エラー**: `process.env.NEXT_PUBLIC_API_URL is undefined`

**解決方法**:
1. `.env.local`が存在することを確認
2. 環境変数名が`NEXT_PUBLIC_`で始まっていることを確認
3. Next.js開発サーバーを再起動

## よくある質問

### Q: Next.js開発サーバーを自動起動したい

A: `.ddev/config.yaml`に以下を追加します：

```yaml
web_extra_daemons:
  - name: "nextjs-dev"
    command: "pnpm dev"
    directory: /var/www/html
```

### Q: Prismモックサーバーのポートを変更したい

A: `.ddev/docker-compose.prism.yaml`の`command`と`ports`を変更します：

```yaml
command: 'mock -h 0.0.0.0 -p 5000 /tmp/openapi.yaml'
ports:
  - "5000"
```

### Q: 複数のOpenAPI仕様書を使用したい

A: 複数のPrismコンテナを定義するか、Prismのマルチドキュメント機能を使用します。

## 次のステップ

- [ ] Next.jsアプリケーションの開発を開始
- [ ] APIクライアントの実装
- [ ] モックレスポンスのカスタマイズ

