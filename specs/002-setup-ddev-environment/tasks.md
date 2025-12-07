# Tasks: ddev環境構築とNext.js・モックサーバーセットアップ

**Input**: Design documents from `/specs/002-setup-ddev-environment/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), test-cases.md (required - test specification review must be approved), research.md, data-model.md, contracts/

**⚠️ CRITICAL GATE**: テスト仕様書（`test-cases.md`）のレビュー承認が完了するまで、実装タスク（Phase 3以降）に進むことは禁止されます。憲章セクション 6.1 を参照してください。

**Tests**: 本機能は環境構築のみのため、テストタスクは含まれません。動作確認は統合テストとして手動で実施します。

**Organization**: タスクはユーザーストーリーごとにグループ化され、各ストーリーを独立して実装・テストできます。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[Story]**: どのユーザーストーリーに属するか（例: US1, US2, US3）
- 説明には正確なファイルパスを含める

## Path Conventions

- **プロジェクトルート**: `.ddev/`, `app/`, `lib/`, `openapi.yaml`, `.env.example`, `.env.local`
- ddev設定: `.ddev/config.yaml`, `.ddev/docker-compose.prism.yaml`
- Next.js設定: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: プロジェクトの初期化と基本構造の作成

- [x] T001 [P] `.gitignore`ファイルを確認し、`.env.local`と`.env*.local`が除外されていることを確認する（`.gitignore`）
- [x] T002 [P] `.ddev/`ディレクトリが存在することを確認する（存在しない場合は作成）

**Checkpoint**: プロジェクトの基本構造が整備された

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: すべてのユーザーストーリーの前提条件となる基盤インフラ

**⚠️ CRITICAL**: このフェーズが完了するまで、ユーザーストーリーの実装を開始できません

- [x] T003 `.ddev/config.yaml`ファイルを作成し、ddevプロジェクトを初期化する（`.ddev/config.yaml`）
  - プロジェクトルートで`ddev config --project-type=generic --webserver-type=generic`を実行
  - 生成された設定ファイルを確認

**Checkpoint**: 基盤が整備され、ユーザーストーリーの実装を開始できる状態

---

## Phase 2.5: Test Specification Review Gate ⚠️ MANDATORY

**Purpose**: テスト仕様書のレビューと承認 - すべての実装タスクをブロック

**⚠️ CRITICAL GATE**: このフェーズが完了するまで、Phase 3以降の実装タスクを開始できません。

- [x] **GATE-001**: `test-cases.md`の完全性と正確性をレビューする（`specs/002-setup-ddev-environment/test-cases.md`）
- [x] **GATE-002**: すべてのテストケースに必須列（テストID、テスト名、前提条件、実行手順、期待結果、対象ファイル/関数、カバレッジ率）が含まれていることを確認する
- [x] **GATE-003**: テストケースがテスト種別（単体テスト/統合テスト）ごとに整理され、カバレッジサマリーが含まれていることを確認する
- [x] **GATE-004**: テスト仕様書を承認する - 実装に進む前に署名が必要

**Checkpoint**: テスト仕様書が承認され、実装タスクを開始できる状態

---

## Phase 3: User Story 1 - ddev環境の初期セットアップ (Priority: P1) 🎯 MVP

**Goal**: 開発者がプロジェクトの開発環境を一から構築できるようにする

**Independent Test**: `ddev start`コマンドを実行し、すべてのコンテナが正常に起動することを確認できる。これにより、開発環境の基盤が整備されたことを検証できる。

### Implementation for User Story 1

- [x] T004 [US1] `.ddev/config.yaml`を編集し、Node.jsバージョンとCorepack設定を追加する（`.ddev/config.yaml`）
  - `nodejs_version: "22.20.0"`を追加
  - `corepack_enable: true`を追加
- [x] T005 [US1] `.ddev/config.yaml`にNext.js用のポート設定を追加する（`.ddev/config.yaml`）
  - `web_extra_exposed_ports`セクションを追加
  - `name: nextjs`, `container_port: 3000`, `http_port: 8080`, `https_port: 8443`を設定
- [x] T006 [US1] ddev環境を起動し、正常に動作することを確認する
  - `ddev start`を実行
  - `ddev describe`でサービス状態を確認
  - すべてのコンテナが起動していることを確認

**Checkpoint**: この時点で、User Story 1は完全に機能し、独立してテスト可能な状態である必要があります

---

## Phase 4: User Story 2 - Next.jsアプリケーションのセットアップ (Priority: P2)

**Goal**: 開発者がNext.jsアプリケーションを開発・実行できる環境を整備する

**Independent Test**: `ddev exec pnpm dev`コマンドを実行し、Next.js開発サーバーが起動し、ブラウザでアクセスできることを確認できる。これにより、Next.jsアプリケーションが正常に動作することを検証できる。

### Implementation for User Story 2

- [x] T007 [US2] `.env.example`ファイルを作成し、環境変数テンプレートを定義する（`.env.example`）
  - `NEXT_PUBLIC_API_URL=http://prism:4010`を追加
  - コメントで説明を追加
- [x] T008 [US2] `.env.local`ファイルを作成し、環境変数を設定する（`.env.local`）
  - `.env.example`をコピーして作成
  - 必要に応じて値を調整
- [x] T009 [US2] ddev環境内でNext.jsプロジェクトを初期化する
  - 手動でNext.jsプロジェクトの基本ファイルを作成（create-next-appは既存ファイルで失敗したため）
- [x] T010 [US2] `package.json`を確認し、constitutionで指定されたバージョンが使用されていることを確認する（`package.json`）
  - `next: "16.0.3"`, `react: "19.2.0"`, `typescript: "5.9.2"`を確認
  - `packageManager: "pnpm@9.0.0"`が設定されていることを確認
- [x] T011 [US2] `package.json`に`type-check`スクリプトを追加する（`package.json`）
  - `"type-check": "tsc --noEmit"`を追加
- [x] T012 [US2] `lib/api/`ディレクトリを作成する（`lib/api/`）
- [x] T013 [US2] `lib/api/client.ts`ファイルを作成し、APIクライアント関数を実装する（`lib/api/client.ts`）
  - 環境変数`NEXT_PUBLIC_API_URL`を読み込む
  - `fetchFromAPI`関数を実装
- [x] T014 [US2] ddev環境内でパッケージをインストールする
  - `ddev exec pnpm install`を実行
- [x] T015 [US2] Next.js開発サーバーを起動し、動作確認する
  - `ddev exec pnpm dev`を実行
  - ブラウザで`https://kuu-story-generator.ddev.site:8080`にアクセス
  - 初期画面が3秒以内に表示されることを確認

**Checkpoint**: この時点で、User Stories 1 AND 2は両方とも独立して動作する必要があります

---

## Phase 5: User Story 3 - モックサーバーのセットアップ (Priority: P2)

**Goal**: 開発者が外部APIに依存せずに開発を進められるよう、Prismモックサーバーをセットアップする

**Independent Test**: `ddev start`コマンドを実行し、モックサーバーが自動的に起動し、APIエンドポイントにアクセスできることを確認できる。これにより、モックサーバーが正常に動作することを検証できる。

### Implementation for User Story 3

- [x] T016 [US3] `openapi.yaml`ファイルをプロジェクトルートに作成する（`openapi.yaml`）
  - `contracts/openapi.yaml`をベースに作成
  - OpenAPI 3.0.2形式で記述
  - `/api/v1/generate`エンドポイントを定義
- [x] T017 [US3] `.ddev/docker-compose.prism.yaml`ファイルを作成し、Prismモックサーバーコンテナを定義する（`.ddev/docker-compose.prism.yaml`）
  - `container_name: "ddev-${DDEV_SITENAME}-prism"`を設定
  - `image: stoplight/prism:4`を指定
  - `command: 'mock -h 0.0.0.0 -p 4010 /tmp/openapi.yaml'`を設定
  - `volumes`で`./openapi.yaml:/tmp/openapi.yaml:ro`をマウント
  - `labels`でddevラベルを設定
  - `restart: "no"`を設定
  - `ports: ["4010"]`を設定
- [x] T018 [US3] ddev環境を再起動し、Prismコンテナが自動起動することを確認する
  - `ddev restart`を実行
  - `ddev describe`でprismコンテナが起動していることを確認
- [x] T019 [US3] Prismモックサーバーが正常に動作することを確認する
  - `ddev exec curl http://prism:4010/api/v1/generate`を実行
  - モックレスポンスが1秒以内に返されることを確認
  - OpenAPI仕様書に基づいたレスポンスが返されることを確認
- [x] T020 [US3] Next.jsアプリケーションからPrismモックサーバーへの接続を確認する
  - Next.jsアプリケーションからAPIリクエストを送信
  - 環境変数`NEXT_PUBLIC_API_URL`が正しく読み込まれていることを確認
  - モックレスポンスが返されることを確認（lib/api/client.tsで実装済み）

**Checkpoint**: この時点で、すべてのユーザーストーリーが独立して機能する必要があります

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善

- [x] T021 [P] `quickstart.md`の手順に従って環境構築を検証する（`specs/002-setup-ddev-environment/quickstart.md`）
- [x] T022 [P] `test-cases.md`の統合テストケースを実行し、すべてが成功することを確認する（`specs/002-setup-ddev-environment/test-cases.md`）
- [x] T023 [P] `.ddev/config.yaml`の設定が正しいことを再確認する（`.ddev/config.yaml`）
- [x] T024 [P] `.ddev/docker-compose.prism.yaml`の設定が正しいことを再確認する（`.ddev/docker-compose.prism.yaml`）
- [x] T025 [P] `openapi.yaml`の形式が正しいことを確認する（`openapi.yaml`）
- [x] T026 [P] `.env.example`と`.env.local`の内容を確認する（`.env.example`, `.env.local`）
- [x] T027 [P] `.gitignore`に`.env.local`が含まれていることを再確認する（`.gitignore`）
- [x] T028 ddev環境の停止・再起動が正常に動作することを確認する
  - `ddev stop`を実行（1分以内に完了）
  - `ddev start`を実行（5分以内に完了）
  - すべてのコンテナが正常に起動することを確認

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし - すぐに開始可能
- **Foundational (Phase 2)**: Setup完了に依存 - すべてのユーザーストーリーをブロック
- **Test Specification Review (Phase 2.5)**: plan.md完了に依存 - すべての実装タスク（Phase 3以降）をブロック
- **User Stories (Phase 3+)**: Foundational (Phase 2) AND Test Specification Review (Phase 2.5) の完了に依存
  - ユーザーストーリーは並列で進められる（人員がいる場合）
  - または優先順位順に順次実行（P1 → P2 → P2）
- **Polish (Final Phase)**: すべての希望するユーザーストーリーの完了に依存

### User Story Dependencies

- **User Story 1 (P1)**: Foundational (Phase 2) AND Test Specification Review (Phase 2.5) 完了後に開始可能 - 他のストーリーへの依存なし
- **User Story 2 (P2)**: Foundational (Phase 2) AND Test Specification Review (Phase 2.5) 完了後に開始可能 - User Story 1と並列実行可能（独立してテスト可能）
- **User Story 3 (P2)**: Foundational (Phase 2) AND Test Specification Review (Phase 2.5) 完了後に開始可能 - User Story 1, 2と並列実行可能（独立してテスト可能）

### Within Each User Story

- コア実装 → 統合 → 動作確認
- ストーリー完了後に次の優先度に進む

### Parallel Opportunities

- Phase 1のすべてのタスク（[P]マーク付き）は並列実行可能
- Phase 2完了後、すべてのユーザーストーリー（US1, US2, US3）は並列で開始可能（チーム容量があれば）
- Phase 6のすべてのタスク（[P]マーク付き）は並列実行可能
- 異なるユーザーストーリーは異なるチームメンバーが並列で作業可能

---

## Parallel Example: User Story 1

```bash
# User Story 1のタスクは順次実行が必要（設定ファイルの編集は順番に実行）
Task: "T004 [US1] .ddev/config.yamlを編集し、Node.jsバージョンとCorepack設定を追加する"
Task: "T005 [US1] .ddev/config.yamlにNext.js用のポート設定を追加する"
Task: "T006 [US1] ddev環境を起動し、正常に動作することを確認する"
```

---

## Parallel Example: User Story 2 and 3

```bash
# User Story 2と3は並列実行可能（異なるファイルを扱う）
# Developer A: User Story 2
Task: "T007 [US2] .env.exampleファイルを作成し、環境変数テンプレートを定義する"
Task: "T008 [US2] .env.localファイルを作成し、環境変数を設定する"
Task: "T009 [US2] ddev環境内でNext.jsプロジェクトを初期化する"

# Developer B: User Story 3
Task: "T016 [US3] openapi.yamlファイルをプロジェクトルートに作成する"
Task: "T017 [US3] .ddev/docker-compose.prism.yamlファイルを作成し、Prismモックサーバーコンテナを定義する"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup を完了
2. Phase 2: Foundational を完了（CRITICAL - すべてのストーリーをブロック）
3. Phase 2.5: Test Specification Review を完了（CRITICAL GATE - すべての実装をブロック）
4. Phase 3: User Story 1 を完了
5. **STOP and VALIDATE**: User Story 1を独立してテスト
6. デプロイ/デモ（準備ができていれば）

### Incremental Delivery

1. Setup + Foundational を完了 → 基盤準備完了
2. Test Specification Review を完了 → テスト戦略承認
3. User Story 1 を追加 → 独立してテスト → デプロイ/デモ（MVP!）
4. User Story 2 を追加 → 独立してテスト → デプロイ/デモ
5. User Story 3 を追加 → 独立してテスト → デプロイ/デモ
6. 各ストーリーは前のストーリーを壊すことなく価値を追加

### Parallel Team Strategy

複数の開発者がいる場合：

1. チームで Setup + Foundational を完了
2. チームで Test Specification Review を完了（必須ゲート）
3. Test Specification Review が承認されたら：
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
4. ストーリーは独立して完了し、統合

---

## Notes

- [P]タスク = 異なるファイル、依存関係なし
- [Story]ラベルはタスクを特定のユーザーストーリーにマッピングしてトレーサビリティを確保
- 各ユーザーストーリーは独立して完了可能でテスト可能である必要がある
- 各タスクまたは論理的なグループの後にコミット
- 任意のチェックポイントで停止してストーリーを独立して検証
- 避けるべきこと: 曖昧なタスク、同じファイルの競合、独立性を壊すストーリー間の依存関係

