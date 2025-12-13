# kuu-story-generator

「くぅー」という文字列を、さまざまなスタイルで画像生成・合成してダウンロードできる Web アプリです。

## 開発環境（標準）

本プロジェクトは **ddev を使用しません**。開発は **Docker + Docker Compose** を標準とします。

### 前提

- Docker Desktop（または互換ランタイム）
- `docker compose` が使えること

### 起動（Next.js + Prism モック）

```bash
docker compose up --build
```

または Make を使う場合：

```bash
make up
```

- 依存関係（`node_modules`）は **コンテナ内で解決**します（ホストには作りません）
- アプリ: `http://localhost:3000`
- Prism（モック API）: `http://localhost:4111`

依存追加/更新後にキャッシュが原因で不整合が出るのを避けるため、
起動時に `pnpm install --force` と `.next` 配下のクリアを行います。

停止は `Ctrl+C`、バックグラウンド起動は以下です：

```bash
docker compose up -d --build
docker compose logs -f
```

Make を使う場合：

```bash
make up-d
make logs
```

### Prism モックについて

- OpenAPI 仕様: `openapi.yaml`
- Compose 内の既定接続先: `http://prism:4010`
- ホストから直接叩く場合: `http://localhost:4111`

## ローカル（Docker を使わない）での起動（任意）

Node.js / pnpm をローカルに用意する場合：

```bash
corepack enable
pnpm install
pnpm dev
```

この場合、API 先はホスト側 Prism を使う想定なので、環境変数を設定してください：

```bash
export NEXT_PUBLIC_API_URL="http://localhost:4111"
```

Prism だけ Docker で起動する例：

```bash
docker compose up -d prism
```

## よく使うコマンド

```bash
pnpm lint
pnpm type-check
pnpm build
```

Docker前提（コンテナ内で実行）なら：

```bash
make lint
make type-check
make build
```
