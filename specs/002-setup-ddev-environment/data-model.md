# Data Model: ddev環境構築とNext.js・モックサーバーセットアップ

**Date**: 2025-12-08  
**Feature**: 002-setup-ddev-environment

## 概要

本機能は開発環境の構築のみを扱うため、データベースや永続化データは存在しません。設定ファイルと環境変数の構造を定義します。

## エンティティ

### 1. 開発環境設定 (DdevConfig)

**説明**: ddev環境の基本設定を定義する設定ファイル

**ファイル**: `.ddev/config.yaml`

**属性**:
- `name` (string, required): プロジェクト名
- `type` (string, required): プロジェクトタイプ（`generic`）
- `webserver_type` (string, required): ウェブサーバータイプ（`generic`）
- `nodejs_version` (string, required): Node.jsのバージョン（`22.20.0`）
- `corepack_enable` (boolean, optional): Corepackの有効化（`true`）
- `web_extra_exposed_ports` (array, optional): 追加ポート設定
- `web_extra_daemons` (array, optional): 追加デーモン設定

**関連**:
- PrismConfig（docker-compose設定経由）

**バリデーション**:
- `name`は有効なホスト名形式である必要がある
- `nodejs_version`は有効なNode.jsバージョンである必要がある
- `web_extra_exposed_ports`の各要素は`name`, `container_port`, `http_port`, `https_port`を含む必要がある

### 2. Prism設定 (PrismConfig)

**説明**: PrismモックサーバーのDocker Compose設定

**ファイル**: `.ddev/docker-compose.prism.yaml`

**属性**:
- `container_name` (string, required): コンテナ名（ddev命名規則に従う）
- `image` (string, required): Dockerイメージ（`stoplight/prism:4`）
- `command` (string, required): 起動コマンド
- `volumes` (array, required): ボリュームマウント設定
- `labels` (object, required): ddevラベル
- `restart` (string, required): 再起動ポリシー（`no`）
- `ports` (array, required): ポート公開設定

**関連**:
- OpenAPISpec（ボリュームマウント経由）

**バリデーション**:
- `container_name`は`ddev-${DDEV_SITENAME}-prism`の形式である必要がある
- `volumes`には`./openapi.yaml:/tmp/openapi.yaml:ro`が含まれる必要がある
- `ports`には`4010`が含まれる必要がある

### 3. OpenAPI仕様書 (OpenAPISpec)

**説明**: Prismモックサーバーが使用するOpenAPI仕様書

**ファイル**: `openapi.yaml`（プロジェクトルート）

**属性**:
- `openapi` (string, required): OpenAPIバージョン（`3.0.2`）
- `info` (object, required): API情報
- `servers` (array, optional): サーバーURL
- `paths` (object, required): APIエンドポイント定義

**関連**:
- PrismConfig（ボリュームマウント経由）

**バリデーション**:
- OpenAPI 3.0.2形式である必要がある
- Prismが読み込める形式である必要がある

### 4. 環境変数設定 (EnvConfig)

**説明**: Next.jsアプリケーションが使用する環境変数

**ファイル**: `.env.local`（実際の値）、`.env.example`（テンプレート）

**属性**:
- `NEXT_PUBLIC_API_URL` (string, required): モックサーバーのURL

**関連**:
- DdevConfig（ddev環境内で使用）

**バリデーション**:
- 有効なURL形式である必要がある
- `.env.local`は`.gitignore`に含まれている必要がある

## 状態遷移

本機能では永続化データがないため、状態遷移はありません。

## データフロー

```
開発者
  │
  ├─> .ddev/config.yaml を編集
  │   └─> ddev環境設定
  │
  ├─> .ddev/docker-compose.prism.yaml を作成
  │   └─> Prismコンテナ設定
  │
  ├─> openapi.yaml を作成
  │   └─> API仕様定義
  │
  └─> .env.local を作成
      └─> 環境変数設定
```

## 制約事項

1. **ファイル配置**:
   - `.ddev/config.yaml`は`.ddev/`ディレクトリに配置
   - `openapi.yaml`はプロジェクトルートに配置
   - `.env.local`はプロジェクトルートに配置

2. **命名規則**:
   - ddevコンテナ名は`ddev-${DDEV_SITENAME}-*`の形式
   - 環境変数は`NEXT_PUBLIC_*`プレフィックスを使用（クライアント側アクセス用）

3. **バージョン管理**:
   - `.ddev/config.yaml`: バージョン管理下
   - `.ddev/docker-compose.prism.yaml`: バージョン管理下
   - `openapi.yaml`: バージョン管理下
   - `.env.example`: バージョン管理下
   - `.env.local`: `.gitignore`対象（バージョン管理外）

