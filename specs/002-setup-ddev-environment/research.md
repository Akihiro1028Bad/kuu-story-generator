# Research: ddev環境構築とNext.js・モックサーバーセットアップ

**Date**: 2025-12-08  
**Feature**: 002-setup-ddev-environment

## 調査目的

ddev環境でNext.jsアプリケーションとPrismモックサーバーをセットアップするためのベストプラクティスを調査し、実装方針を決定する。

## 調査結果

### 1. ddevでのNode.js環境構築

**Decision**: ddevの`generic`プロジェクトタイプを使用し、`web_extra_daemons`と`web_extra_exposed_ports`でNext.js開発サーバーを設定する。

**Rationale**:
- ddevは`generic`プロジェクトタイプでNode.jsアプリケーションをサポート
- `web_extra_daemons`を使用することで、ddev環境起動時に自動的にNode.jsサーバーを起動できる
- `web_extra_exposed_ports`でポートを公開し、ddev-router経由でアクセス可能にする
- `corepack_enable: true`でpnpmを有効化できる

**Alternatives considered**:
- カスタムDockerfile: より複雑で、ddevの標準機能で十分
- 手動起動のみ: 自動起動の利便性を失う

**参考資料**:
- ddev公式ドキュメント: Node.js Extra Daemons Configuration
- ddev公式ドキュメント: Configure Extra HTTP/HTTPS Ports

**実装例**:
```yaml
# .ddev/config.yaml
project_type: generic
webserver_type: generic
corepack_enable: true
nodejs_version: '22.20.0'

web_extra_exposed_ports:
  - name: nextjs
    container_port: 3000
    http_port: 8080
    https_port: 8443

web_extra_daemons:
  - name: "nextjs-dev"
    command: "pnpm dev"
    directory: /var/www/html
```

### 2. PrismモックサーバーのDocker設定

**Decision**: ddevの`docker-compose.*.yaml`機能を使用して、Prismモックサーバーを別コンテナとして追加する。

**Rationale**:
- Prismは公式Dockerイメージ（`stoplight/prism:4`）が提供されている
- ddevの`docker-compose.*.yaml`でカスタムサービスを追加できる
- OpenAPI仕様書をボリュームマウントで共有できる
- ポート4010がPrismのデフォルトポート

**Alternatives considered**:
- webコンテナ内でPrismを実行: コンテナの責務が混在し、管理が複雑
- ホストマシンで直接実行: 環境の一貫性が失われる

**参考資料**:
- Prism公式ドキュメント: Running Prism Mock Server in Docker
- Prism公式ドキュメント: Docker Compose Configuration

**実装例**:
```yaml
# .ddev/docker-compose.prism.yaml
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

### 3. Next.js環境変数の管理

**Decision**: `.env.local`ファイルを使用し、`.env.example`をテンプレートとして提供する。

**Rationale**:
- Next.jsは`.env.local`を自動的に読み込む（`.gitignore`に追加済み）
- `.env.example`をバージョン管理下に置くことで、新規開発者が必要な環境変数を把握できる
- モックサーバーのURLを環境変数で管理することで、開発環境と本番環境で切り替え可能

**Alternatives considered**:
- ddevの`web_environment`で直接設定: プロジェクト固有の設定が混在
- `.env`ファイルをバージョン管理: 機密情報の誤コミットリスク

**参考資料**:
- Next.js公式ドキュメント: Environment Variables

**実装例**:
```bash
# .env.example
NEXT_PUBLIC_API_URL=http://prism:4010
```

### 4. ネットワーク設定

**Decision**: ddevの内部ネットワークを使用し、サービス名で接続する。

**Rationale**:
- ddevは自動的にDockerネットワークを作成し、サービス間で通信可能
- サービス名（`prism`）でDNS解決が可能
- コンテナ間通信は内部ネットワークで完結し、セキュア

**Alternatives considered**:
- localhost経由: コンテナ間通信ができない
- 固定IP: ネットワーク設定が複雑

**参考資料**:
- ddev公式ドキュメント: Networking

**実装例**:
```typescript
// Next.jsからPrismモックサーバーへの接続
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://prism:4010'
```

### 5. ポート番号の決定

**Decision**:
- Next.js開発サーバー: コンテナ内3000、外部8080/8443（ddev-router経由）
- Prismモックサーバー: コンテナ内4010、外部4010（直接公開）

**Rationale**:
- Next.jsのデフォルトポート3000を使用
- Prismのデフォルトポート4010を使用
- ddev-router経由でNext.jsにアクセスすることで、HTTPS証明書が自動設定される
- Prismは直接ポート公開で、Next.jsから内部ネットワーク経由でアクセス

**Alternatives considered**:
- すべてのポートを直接公開: ddev-routerの利点を失う
- すべてddev-router経由: Prismの設定が複雑

**参考資料**:
- ddev公式ドキュメント: Configure Extra HTTP/HTTPS Ports
- Prism公式ドキュメント: Running Prism Mock Server in Docker

## 実装方針の決定

1. **ddev設定**: `.ddev/config.yaml`でNext.js用の設定を追加
2. **Prism設定**: `.ddev/docker-compose.prism.yaml`でPrismコンテナを追加
3. **環境変数**: `.env.example`と`.env.local`で管理
4. **OpenAPI仕様書**: プロジェクトルートの`openapi.yaml`をPrismコンテナにマウント
5. **ネットワーク**: ddevの内部ネットワークでサービス間通信

## 次のステップ

- Phase 1: データモデルとコントラクトの定義
- Phase 2: 実装タスクの分解

