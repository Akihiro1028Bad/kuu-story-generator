<!--
Sync Impact Report:
- Version change: 1.1.5 → 1.2.0
- Modified principles:
  - 技術スタック（3.1）: 最新安定版へ更新（Node/Next.js/React/TS/pnpm/ESLint/Prettier/Tailwind 他）
  - 開発環境（3.5）: ddev 前提を廃止し、標準 Docker Compose 前提へ移行
- Added sections: N/A
- Removed sections: N/A
- Templates requiring updates: N/A (既存テンプレートで十分対応可能)
- Follow-up TODOs:
  - RATIFICATION_DATE: 初版作成日が不明のため TODO として記載
  - リポジトリ URL: TODO として記載
-->

# kuu-story-generator Constitution

## メタ情報

- プロジェクト名: kuu-story-generator
- バージョン: 1.2.0
- 最終更新日: 2025-12-12
- オーナー: akihiro.tsutsumi
- リポジトリ: TODO: GitHub リポジトリ URL を記載

---

## 1. 目的（Purpose）

ブラウザ上でユーザーが任意の画像をアップロードし、  
いろんなスタイルの「くぅー」という文字列を Google の画像生成AI「Nano Banana Pro」と API 通信して生成・合成し、  
最終的に 1 枚の画像としてダウンロードまたは共有できる Web アプリケーションを提供する。

このアプリは以下を目指す：

- 「くぅー」という文字表現の多様なスタイル（フォント・色・装飾・レイアウト）を簡単に試せること
- ブラウザのみで完結し、追加インストール不要で利用できること
- 将来的に他のテンプレートや画像加工機能に拡張しやすい設計であること

---

## 2. スコープ / 非スコープ

### 2.1 スコープ（Scope）

- ブラウザ上からの画像アップロード機能（ローカルファイル）
- Google の画像生成AI「Nano Banana Pro」API による「くぅー」文字画像の生成
- 文字の配置はプリセットから選択（自由調整: 位置・サイズ・回転は行わない）
- スタイルプリセット（例：ポップ、手書き、ホラー風）
- 結果を 1 画像としてダウンロード
- PC / モバイル対応レスポンシブデザイン
- 日本語 UI

### 2.2 非スコープ（Out of Scope）

- ネイティブアプリ（iOS/Android）
- SNS への直接投稿（X / Instagram）
- 高度な画像編集（レイヤー・フィルタ等）
- 多人数同時編集機能
- 完全オフライン動作

---

## 3. 技術スタック（Tech Stack）

### 3.1 使用技術とバージョン  
※ context7 MCP の最新版に基づく

| 種類                       | 採用技術 | バージョン |
|--------------------------|---------|-----------|
| 実行環境                 | Node.js | **v24.12.0 (LTS: Krypton)** |
| 言語                     | TypeScript | **v5.9.3** |
| フレームワーク / Core    | Next.js (App Router) | **v16.0.10** |
| UI ライブラリ           | React | **v19.2.3** |
| スタイリング             | Tailwind CSS | **v4.1.18** |
| Lint                     | ESLint | **v9.39.1**（flat config: `eslint.config.mjs`） |
| フォーマッタ             | Prettier | **v3.7.4** |
| パッケージマネージャ     | pnpm | **v10.25.0**（packageManager で固定） |

> `package.json` 例  
> `"packageManager": "pnpm@<実環境のバージョン>"`

**将来のバージョン更新時は、context7 MCP を用いて本表をアップデートする。**

### 3.2 その他技術

- 画像処理: Canvas API / OffscreenCanvas
- API 通信: fetch（HTTPS 経由）
- UI: 必要に応じて shadcn/ui など

### 3.3 DB / Messaging

- **初期段階なし**
- 必要になった場合：Vercel Postgres / KV など

### 3.4 インフラ

- ホスティング: **Vercel**
- PR ごとに Preview デプロイ自動生成
- 画像は初期はブラウザ内に保持（永続化しない）

### 3.5 開発環境

- **ddev は使用しない**
- 開発環境は **Docker + Docker Compose** を標準とする
- Next.js 開発サーバーはコンテナ内で起動し、ホストへポート公開する
- パッケージ操作はすべて **pnpm**（Corepack 経由）
- **開発中は Prism を使用したモックサーバーを使用する**
  - Prism は Docker Compose の別サービスとして起動する
  - アプリからの既定接続先は `http://prism:4010`（Compose 内ネットワーク）
  - ホストから直接叩く場合は `http://localhost:4111`

---

## 4. アーキテクチャ原則（Architecture Principles）

1. **App Router ベースの Next.js 構成**
2. **Server Components がデフォルト**
3. **Mutation は Server Actions で統一**
4. **API キーは必ずサーバー側に保持**
5. **画像合成処理は外部AIで実施し、クライアントは保存導線を担う（サーバー永続化なし）**
6. **外部サービス依存は `lib/api/` に集約**

---

## 5. コーディング規約（Coding Conventions）

- TypeScript `strict` 有効
- `any` は禁止（例外時コメント必須）
- ESLint + Prettier を保存時/CIで適用
- Component は役割を分離（UI vs Logic）
- UI 例外なく CSR 必須時のみ `use client`
- 命名規則：
  - 変数・関数: camelCase  
  - コンポーネント・型: PascalCase
- **ドキュメント、コミットメッセージは全て日本語で出力すること**  

---

## 6. テスト・品質（Testing & Quality）

| 種類 | 対象 | 必須度 |
|------|------|------|
| ユニットテスト | 画像レイアウト等 | **必須** |
| コンポーネントテスト | 主要 UI | 中 |

**注意**: 本アプリは小規模のため、E2Eテストは実施しない。

- CI 時に `lint`, `type-check`, `test` を自動実行

### 6.1 テスト仕様書生成原則（Test Specification Generation）

`/speckit.plan` コマンド実行時には、実装予定の全てのテストケースと期待結果を詳細に記述したテスト仕様書（単体テスト・統合テスト）をレビューしやすい形で `test-cases.md` ファイルに出力しなければならない。

テスト仕様書は構造化されたテーブル形式で記載し、以下の列を含めること：

- **テストID**（必須、例: UT-001, IT-001）
- **テスト名**（必須、正常系・異常系・境界値などの観点を明示）
- **テスト種別**（推奨、Unit/Integration）
- **テスト観点・目的**（推奨、何を確認するかを明確に記述）
- **前提条件**（必須、環境やデータの状態）
- **実行手順**（必須、番号付きリスト形式）
- **テストデータ**（推奨、JSON形式や具体的な値例）
- **期待結果**（必須、成功時の出力や画面表示内容、異常系ではエラーメッセージや例外の種類）
- **対象ファイル/関数**（必須、パスを含めて完全に特定できる形式）
- **予想カバレッジ率**（必須、行カバレッジと分岐カバレッジを両方記載）
- **関連ユーザーストーリー**（推奨）
- **優先度**（推奨、P1/P2/P3）

テスト仕様書は、テスト種別ごと（単体テスト・統合テスト）にセクションを分けて記載し、各セクションの最後には、そのセクション全体の予想カバレッジ率（行カバレッジ、分岐カバレッジ）を集計して記載すること。

`test-cases.md` は `plan.md` と同じディレクトリ（`specs/[ブランチ名]/`）に配置し、`plan.md` から参照する。

実装者はこのテスト仕様書をレビューし、テストケースのレビューが承認されるまで次のステップ（実装開始）に進むことは禁止する。テスト仕様書のレビュー承認は、実装タスク（`/speckit.tasks`）の実行前の必須ゲートとする。

この原則により、実装前にテスト戦略を明確にし、テストの質と網羅性を確保する。

---

## 7. セキュリティ（Security）

- `.env` に API キー管理（絶対にコミット禁止）
- 画像データはサーバー保存しない（仕様変更時は憲章更新）
- Route Handlers 経由で API 通信
- エラー内容はユーザーに露出しない
- HTTPS 必須

---

## 8. パフォーマンス（Performance）

- LCP: 3秒以内（モバイル回線含む）
- Google の画像生成AI「Nano Banana Pro」API: 3秒以内を目標
- アップロード画像サイズを適切に制限
- `next/image` による最適化

---

## 9. UX / アクセシビリティ（UX / A11y）

- アップロード → スタイル → 生成 → 保存（DL）  
　という流れが迷いなく終わる UI
- エラー/通信中の明示
- キーボード操作サポート
- 色覚多様性を考慮

---

## 10. AI アシスタント利用方針（Spec Kit / context7 / Web Search）

- 仕様作成・設計・生成はこの憲章を最優先
- context7:
  - Next.js / React / Node 最新情報参照時に使用
- web search:
  - 公式外のベストプラクティス調査や比較時に使用
- 新提案は「メリット / デメリット / 影響範囲」必須

---

## 11. 憲章の更新ルール（Governance）

- 更新時は GitHub PR + オーナーレビュー必須
- バージョニングポリシー：
  - 軽微な修正 → Patch
  - 技術スタック変更 → Minor or Major
- `/speckit.analyze` で整合性チェック推奨

---

**Version**: 1.2.0 | **Ratified**: TODO(RATIFICATION_DATE): 初版作成日が不明 | **Last Amended**: 2025-12-12
