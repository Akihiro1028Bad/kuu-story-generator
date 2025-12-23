# Tasks: ストレージベースのアップロード・URLベースのアーキテクチャ

**Input**: Design documents from `/specs/003-storage-upload/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), test-cases.md (required - test specification review must be approved), research.md, data-model.md, contracts/

**⚠️ CRITICAL GATE**: テスト仕様書（`test-cases.md`）のレビュー承認が完了するまで、`/speckit.tasks` の実行および実装タスク（Phase 3以降）に進むことは禁止されます。憲章セクション 6.1 を参照してください。

**Tests**: TDDアプローチで実装するため、各ユーザーストーリーのテストを先に作成し、その後実装を行います。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions
- **Doc Reference**: 各タスクにドキュメント参照箇所を記載

## Path Conventions

- **Web app**: `app/` at repository root
- **Tests**: `app/**/*.test.ts` or `app/**/*.test.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: パッケージインストールと環境変数設定

**Doc Reference**: 
- `plan.md` Technical Context (パッケージ一覧)
- `quickstart.md` セットアップ (環境変数設定)

- [x] T001 パッケージインストール: `@vercel/blob`と`@vercel/blob/client`をインストール (`pnpm add @vercel/blob @vercel/blob/client`) - 参照: `plan.md` Technical Context, `quickstart.md` セットアップ
- [x] T002 環境変数設定: `.env.local`に`BLOB_READ_WRITE_TOKEN`を追加 - 参照: `quickstart.md` セットアップ, `plan.md` 実装方針 2. サーバー側handleUpload実装

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 既存のNext.jsプロジェクトのため、特別な基盤タスクは不要

**⚠️ CRITICAL**: このフェーズは既存プロジェクトのため、タスクなし。Phase 2.5に進む。

---

## Phase 2.5: Test Specification Review Gate ⚠️ MANDATORY

**Purpose**: Test specification review and approval - BLOCKS all implementation tasks

**⚠️ CRITICAL GATE**: This phase MUST be completed before any Phase 3+ implementation tasks can begin.

- [x] **GATE-001**: Review `test-cases.md` for completeness and accuracy - 参照: `test-cases.md` 全体
- [x] **GATE-002**: Verify all test cases include required columns (Test ID, Test Name, Preconditions, Steps, Expected Results, Target Files/Functions, Coverage Rates) - 参照: `test-cases.md` テーブル構造
- [x] **GATE-003**: Verify test cases are organized by test type (Unit/Integration) with coverage summaries - 参照: `test-cases.md` 単体テストセクション、統合テストセクション
- [x] **GATE-004**: Approve test specification - sign off required before proceeding to implementation - 参照: 憲章セクション 6.1

**Checkpoint**: Test specification approved - implementation tasks can now begin

---

## Phase 3: User Story 1 - 画像を直接ストレージにアップロードして生成を実行する (Priority: P1) 🎯 MVP

**Goal**: ユーザーは画像ファイルを選択すると、そのファイルが直接ストレージにアップロードされ、アップロード完了後に取得したURLを使って生成処理を実行できる。

**Independent Test**: 画像ファイルを選択し、ストレージへのアップロードが完了してURLが取得され、そのURLを使って生成処理が実行できれば、このユーザーストーリーの価値が単独で成立する。

**Doc Reference**: 
- `spec.md` User Story 1
- `plan.md` 実装方針 1. クライアント側アップロード実装, 2. サーバー側handleUpload実装, 3. Server Action変更, 4. BFF API変更
- `research.md` 1. Vercel Blob client upload実装パターン, 2. Next.js Server ActionsでのFormData URL取得パターン, 3. BFF APIでの画像URLダウンロードとbase64変換, 4. Vercel Blob put()メソッドでの生成結果保存
- `test-cases.md` UploadSection.tsx (UT-001, UT-004), actions.ts (UT-007, UT-009, UT-010), /api/upload/route.ts (UT-011, UT-012, UT-014), /api/generate/route.ts (UT-015, UT-016, UT-018, UT-019, UT-020)
- `contracts/openapi.yaml` POST /api/upload, POST /api/generate

### Tests for User Story 1 (TDD - Write First) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T003 [P] [US1] UploadSection.tsxのテスト: ファイル選択時にVercel Blobにアップロードできる（正常系）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-001
- [x] T004 [P] [US1] UploadSection.tsxのテスト: アップロード進行状況を表示する（正常系）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-004
- [x] T005 [P] [US1] actions.tsのテスト: FormDataからimageUrlを取得できる（正常系）を実装 (`app/components/KuuGenerator/actions.test.ts`) - 参照: `test-cases.md` UT-007
- [x] T006 [P] [US1] actions.tsのテスト: BFF APIにimageUrlを送信できる（正常系）を実装 (`app/components/KuuGenerator/actions.test.ts`) - 参照: `test-cases.md` UT-009
- [x] T007 [P] [US1] /api/upload/route.tsのテスト: handleUpload()でトークンを生成できる（正常系）を実装 (`app/api/upload/route.test.ts`) - 参照: `test-cases.md` UT-011
- [x] T008 [P] [US1] /api/upload/route.tsのテスト: onBeforeGenerateTokenでバリデーションを実施する（正常系）を実装 (`app/api/upload/route.test.ts`) - 参照: `test-cases.md` UT-012
- [x] T009 [P] [US1] /api/generate/route.tsのテスト: FormDataからimageUrlを取得できる（正常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-015
- [x] T010 [P] [US1] /api/generate/route.tsのテスト: 画像URLから画像をダウンロードしてbase64に変換できる（正常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-016
- [x] T011 [P] [US1] /api/generate/route.tsのテスト: 許可されていないホストのimageUrlでエラーを返す（異常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-018, `spec.md` FR-026
- [x] T012 [P] [US1] /api/generate/route.tsのテスト: 生成結果をVercel Blobに保存できる（正常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-019
- [x] T013 [P] [US1] /api/generate/route.tsのテスト: 生成成功時に元画像を削除する（正常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-020
- [x] T049 [P] [US1] /api/generate/route.tsのテスト: 大容量base64レスポンス時の処理方針（境界値）を実装 (`app/api/generate/route.test.ts`) - 参照: `spec.md` FR-020

### Implementation for User Story 1

- [x] T014 [US1] /api/upload/route.tsを作成: `handleUpload()`を実装し、`onBeforeGenerateToken`でバリデーション、`onUploadCompleted`でログ記録 (`app/api/upload/route.ts`) - 参照: `plan.md` 実装方針 2. サーバー側handleUpload実装, `research.md` 1. Vercel Blob client upload実装パターン, `contracts/openapi.yaml` POST /api/upload
- [x] T015 [US1] UploadSection.tsxを変更: `onImageSelected`の型を`(url: string | null) => void`に変更し、ファイル選択時に`upload()`を呼び出し、アップロード進行状況を表示 (`app/components/KuuGenerator/UploadSection.tsx`) - 参照: `plan.md` 実装方針 1. クライアント側アップロード実装, `research.md` 1. Vercel Blob client upload実装パターン, `spec.md` FR-001, FR-002, FR-008, FR-016, FR-024
- [x] T016 [US1] actions.tsを変更: FormDataから`image`（File）の代わりに`imageUrl`（string）を取得し、URL形式のバリデーションを追加、BFF APIに`imageUrl`を送信 (`app/components/KuuGenerator/actions.ts`) - 参照: `plan.md` 実装方針 3. Server Action変更, `research.md` 2. Next.js Server ActionsでのFormData URL取得パターン, `spec.md` FR-003, FR-021
- [x] T017 [US1] /api/generate/route.tsを変更: FormDataから`image`（File）の代わりに`imageUrl`（string）を取得し、画像URLから画像をダウンロードしてbase64に変換、生成結果をVercel Blobに保存、元画像を削除 (`app/api/generate/route.ts`) - 参照: `plan.md` 実装方針 4. BFF API変更, `research.md` 3. BFF APIでの画像URLダウンロードとbase64変換, 4. Vercel Blob put()メソッドでの生成結果保存, `spec.md` FR-022, FR-023, FR-013, FR-018, FR-019, FR-026, `contracts/openapi.yaml` POST /api/generate
- [x] T018 [US1] GenerateState型を変更: `imageDataUrl`を`imageUrl`に変更し、互換期間中は`imageDataUrl`も受け入れる (`app/components/KuuGenerator/actions.ts`) - 参照: `plan.md` Breaking Changes / Migration Notes, `spec.md` Breaking Changes / Compatibility
- [x] T050 [US1] /api/generate/route.tsを変更: 大容量base64レスポンス時の処理方針（サイズチェック/ログ/失敗時のガード）を追加 (`app/api/generate/route.ts`) - 参照: `spec.md` FR-020

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 生成結果をURLで表示・ダウンロードする (Priority: P1)

**Goal**: ユーザーは生成完了後、生成結果の画像URLを使って画像を表示し、ダウンロードできる。

**Independent Test**: 生成結果のURLを受け取り、そのURLを使って画像を表示し、ダウンロードできれば、このユーザーストーリーの価値が単独で成立する。

**Doc Reference**: 
- `spec.md` User Story 2
- `plan.md` 実装方針 5. UIコンポーネント変更
- `research.md` 5. 生成結果のURL表示・ダウンロード
- `test-cases.md` saveOnDesktop.ts (UT-023), saveOnMobile.ts (UT-025, UT-026), actions.ts (UT-028)
- `contracts/openapi.yaml` POST /api/generate (レスポンスに`imageUrl`)

### Tests for User Story 2 (TDD - Write First) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T019 [P] [US2] saveOnDesktop.tsのテスト: URLから画像を取得してダウンロードできる（正常系）を実装 (`app/lib/save/saveOnDesktop.test.ts`) - 参照: `test-cases.md` UT-023
- [x] T020 [P] [US2] saveOnMobile.tsのテスト: URLから画像を取得してWeb Share APIで保存できる（正常系）を実装 (`app/lib/save/saveOnMobile.test.ts`) - 参照: `test-cases.md` UT-025
- [x] T021 [P] [US2] saveOnMobile.tsのテスト: Web Share API非対応時にフォールバックダウンロードを実行する（正常系）を実装 (`app/lib/save/saveOnMobile.test.ts`) - 参照: `test-cases.md` UT-026
- [x] T022 [P] [US2] actions.tsのテスト: 互換期間中にimageUrlとimageDataUrlの両方を扱える（正常系）を実装 (`app/components/KuuGenerator/actions.test.ts`) - 参照: `test-cases.md` UT-028

### Implementation for User Story 2

- [x] T023 [US2] KuuGenerator.tsxを変更: `state.imageDataUrl`を`state.imageUrl`に変更し、画像表示をURLベースに変更 (`app/components/KuuGenerator/KuuGenerator.tsx`) - 参照: `plan.md` 実装方針 5. UIコンポーネント変更, `spec.md` FR-005
- [x] T024 [US2] SaveActions.tsxを変更: `imageDataUrl`を`imageUrl`に変更し、URLベースのダウンロードに対応 (`app/components/KuuGenerator/SaveActions.tsx`) - 参照: `plan.md` 実装方針 5. UIコンポーネント変更, `spec.md` FR-006, FR-007
- [x] T025 [US2] saveOnDesktop.tsを変更: `imageDataUrl`を`imageUrl`に変更し、URLから画像を取得してダウンロード (`app/lib/save/saveOnDesktop.ts`) - 参照: `plan.md` 実装方針 5. UIコンポーネント変更, `research.md` 5. 生成結果のURL表示・ダウンロード, `spec.md` FR-006
- [x] T026 [US2] saveOnMobile.tsを変更: `imageDataUrl`を`imageUrl`に変更し、URLから画像を取得して保存 (`app/lib/save/saveOnMobile.ts`) - 参照: `plan.md` 実装方針 5. UIコンポーネント変更, `research.md` 5. 生成結果のURL表示・ダウンロード, `spec.md` FR-007

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - アップロード・生成処理のエラーハンドリング (Priority: P2)

**Goal**: ユーザーはアップロードや生成処理でエラーが発生した場合、適切なエラーメッセージを受け取り、復帰できる。

**Independent Test**: 代表的なエラーケース（アップロード失敗、ストレージ接続エラー、生成失敗）で、ユーザーが次に取るべき行動が明確に示され、操作を継続できることを確認できる。

**Doc Reference**: 
- `spec.md` User Story 3, Edge Cases
- `plan.md` 実装方針 1. クライアント側アップロード実装 (エラーハンドリング), 4. BFF API変更 (エラーハンドリング)
- `research.md` 6. アップロード中断処理
- `test-cases.md` UploadSection.tsx (UT-002, UT-003, UT-005, UT-006), actions.ts (UT-008), /api/upload/route.ts (UT-013), /api/generate/route.ts (UT-017, UT-021, UT-022), saveOnDesktop.ts (UT-024), saveOnMobile.ts (UT-027)

### Tests for User Story 3 (TDD - Write First) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [x] T027 [P] [US3] UploadSection.tsxのテスト: 無効なファイル形式でエラーを表示する（異常系）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-002
- [x] T028 [P] [US3] UploadSection.tsxのテスト: 10MBを超えるファイルでエラーを表示する（境界値）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-003
- [x] T029 [P] [US3] UploadSection.tsxのテスト: アップロード中断時にBlobRequestAbortedErrorを処理する（異常系）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-005
- [x] T030 [P] [US3] UploadSection.tsxのテスト: アップロード失敗時にエラーメッセージを表示する（異常系）を実装 (`app/components/KuuGenerator/UploadSection.test.tsx`) - 参照: `test-cases.md` UT-006
- [x] T031 [P] [US3] actions.tsのテスト: 無効なURL形式でエラーを返す（異常系）を実装 (`app/components/KuuGenerator/actions.test.ts`) - 参照: `test-cases.md` UT-008
- [x] T032 [P] [US3] /api/upload/route.tsのテスト: 無効なファイル形式でエラーを返す（異常系）を実装 (`app/api/upload/route.test.ts`) - 参照: `test-cases.md` UT-013
- [x] T033 [P] [US3] /api/generate/route.tsのテスト: 画像URL取得失敗時にエラーを返す（異常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-017
- [x] T034 [P] [US3] /api/generate/route.tsのテスト: 生成失敗時に元画像を保持する（正常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-021
- [x] T035 [P] [US3] /api/generate/route.tsのテスト: 削除失敗時にログを記録するが処理は続行する（異常系）を実装 (`app/api/generate/route.test.ts`) - 参照: `test-cases.md` UT-022
- [x] T036 [P] [US3] saveOnDesktop.tsのテスト: 画像取得失敗時にエラーをスローする（異常系）を実装 (`app/lib/save/saveOnDesktop.test.ts`) - 参照: `test-cases.md` UT-024
- [x] T037 [P] [US3] saveOnMobile.tsのテスト: 画像取得失敗時にエラーを返す（異常系）を実装 (`app/lib/save/saveOnMobile.test.ts`) - 参照: `test-cases.md` UT-027
- [x] T051 [P] [US3] KuuGenerator.tsxのテスト: 生成結果URLが無効/期限切れ時にエラー表示と再生成導線を出す（異常系）を実装 (`app/components/KuuGenerator/KuuGenerator.test.tsx`) - 参照: `spec.md` FR-011

### Implementation for User Story 3

- [x] T038 [US3] UploadSection.tsxを変更: アップロード中断処理を追加（`abortSignal`を使用）、エラーハンドリングを強化 (`app/components/KuuGenerator/UploadSection.tsx`) - 参照: `plan.md` 実装方針 1. クライアント側アップロード実装, `research.md` 6. アップロード中断処理, `spec.md` FR-009, FR-012, FR-025
- [x] T039 [US3] /api/upload/route.tsを変更: エラーハンドリングを強化、無効なファイル形式のバリデーションを追加 (`app/api/upload/route.ts`) - 参照: `plan.md` 実装方針 2. サーバー側handleUpload実装, `spec.md` FR-014, FR-015
- [x] T040 [US3] /api/generate/route.tsを変更: 画像URL取得失敗時のエラーハンドリング、生成失敗時の元画像保持、削除失敗時のログ記録を追加 (`app/api/generate/route.ts`) - 参照: `plan.md` 実装方針 4. BFF API変更, `spec.md` FR-010, FR-017
- [x] T041 [US3] actions.tsを変更: エラーハンドリングを強化、無効なURL形式のバリデーションを追加 (`app/components/KuuGenerator/actions.ts`) - 参照: `plan.md` 実装方針 3. Server Action変更, `spec.md` FR-010
- [x] T052 [US3] KuuGenerator.tsxを変更: 生成結果URLが無効/期限切れ時のエラー表示と再生成導線を追加 (`app/components/KuuGenerator/KuuGenerator.tsx`) - 参照: `spec.md` FR-011

**Checkpoint**: At this point, all user stories should be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複数のユーザーストーリーに影響する改善と品質向上

**Doc Reference**: 
- `plan.md` Constitution Check
- `spec.md` Success Criteria
- `quickstart.md` トラブルシューティング

- [x] T042 [P] ドキュメント更新: `quickstart.md`の実装手順を確認し、必要に応じて更新 (`specs/003-storage-upload/quickstart.md`) - 参照: `quickstart.md` 全体
- [x] T043 [P] コードクリーンアップ: `any`型を削除し、TypeScript `strict`モードを確認 (`app/**/*.ts`, `app/**/*.tsx`) - 参照: `plan.md` Constitution Check コーディング規約
- [x] T044 [P] パフォーマンス最適化: LCP < 3秒を確認、`next/image`による最適化を実施 (`app/components/KuuGenerator/KuuGenerator.tsx`) - 参照: `plan.md` Constitution Check パフォーマンス, `spec.md` SC-001, SC-002
- [x] T045 [P] セキュリティ強化: APIキーがサーバー側のみで保持されていることを確認、エラーハンドリングでユーザーに露出しないことを確認 (`app/api/**/*.ts`) - 参照: `plan.md` Constitution Check セキュリティ
- [x] T046 [P] 追加のユニットテスト: 統合テストを実装（IT-001, IT-002, IT-004） (`app/**/*.test.ts`, `app/**/*.test.tsx`) - 参照: `test-cases.md` 統合テストセクション
- [x] T047 [P] アクセシビリティ改善: キーボード操作サポート、色覚多様性を考慮 (`app/components/KuuGenerator/**/*.tsx`) - 参照: `plan.md` Constitution Check UX / アクセシビリティ
- [ ] T048 quickstart.md検証: `quickstart.md`の手順に従って動作確認を実施 - 参照: `quickstart.md` 動作確認
- [x] T053 [P] 保存ポリシー確認: 生成結果URLが24時間以上有効となる設定/運用方針を確認し、必要なら実装方針を追記 (`app/api/generate/route.ts`, `specs/003-storage-upload/quickstart.md`) - 参照: `spec.md` FR-028, `spec.md` SC-006

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: 既存プロジェクトのため、タスクなし
- **Test Specification Review (Phase 2.5)**: Depends on plan.md completion - BLOCKS all implementation tasks (Phase 3+)
- **User Stories (Phase 3+)**: All depend on Setup (Phase 1) AND Test Specification Review (Phase 2.5) completion
  - User Story 1 (P1) と User Story 2 (P1) は並行実行可能（異なるファイルを変更）
  - User Story 3 (P2) は User Story 1, 2 の後に実装（エラーハンドリングのため）
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup (Phase 1) AND Test Specification Review (Phase 2.5) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Setup (Phase 1) AND Test Specification Review (Phase 2.5) - Depends on User Story 1 (生成結果のURLが必要)
- **User Story 3 (P2)**: Can start after Setup (Phase 1) AND Test Specification Review (Phase 2.5) - Depends on User Story 1, 2 (エラーハンドリングのため)

### Within Each User Story

- Tests (TDD) MUST be written and FAIL before implementation
- API Route before Server Action
- Server Action before UI Components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All test tasks for a user story marked [P] can run in parallel
- User Story 1 と User Story 2 のテストは並行実行可能（異なるファイル）
- User Story 1 の実装タスク（T014-T018）は順次実行が必要（依存関係あり）
- User Story 2 の実装タスク（T023-T026）は順次実行が必要（依存関係あり）

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (TDD):
Task: "UploadSection.tsxのテスト: ファイル選択時にVercel Blobにアップロードできる（正常系）を実装"
Task: "UploadSection.tsxのテスト: アップロード進行状況を表示する（正常系）を実装"
Task: "actions.tsのテスト: FormDataからimageUrlを取得できる（正常系）を実装"
Task: "actions.tsのテスト: BFF APIにimageUrlを送信できる（正常系）を実装"
Task: "/api/upload/route.tsのテスト: handleUpload()でトークンを生成できる（正常系）を実装"
Task: "/api/upload/route.tsのテスト: onBeforeGenerateTokenでバリデーションを実施する（正常系）を実装"
Task: "/api/generate/route.tsのテスト: FormDataからimageUrlを取得できる（正常系）を実装"
Task: "/api/generate/route.tsのテスト: 画像URLから画像をダウンロードしてbase64に変換できる（正常系）を実装"
Task: "/api/generate/route.tsのテスト: 許可されていないホストのimageUrlでエラーを返す（異常系）を実装"
Task: "/api/generate/route.tsのテスト: 生成結果をVercel Blobに保存できる（正常系）を実装"
Task: "/api/generate/route.tsのテスト: 生成成功時に元画像を削除する（正常系）を実装"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2.5: Test Specification Review (CRITICAL GATE - blocks all implementation)
3. Complete Phase 3: User Story 1 (Tests → Implementation)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Test Specification Review → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup together
2. Team completes Test Specification Review together (REQUIRED GATE)
3. Once Test Specification Review is approved:
   - Developer A: User Story 1 (Tests → Implementation)
   - Developer B: User Story 2 (Tests → Implementation) - User Story 1完了後
   - Developer C: User Story 3 (Tests → Implementation) - User Story 1, 2完了後
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- **TDD**: Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **Doc Reference**: 各タスクにドキュメント参照箇所を記載（plan.md, spec.md, research.md, test-cases.md, contracts/openapi.yaml, quickstart.md）

---

## Task Summary

- **Total Tasks**: 48 tasks
- **Phase 1 (Setup)**: 2 tasks
- **Phase 2.5 (Test Specification Review)**: 4 tasks (GATE)
- **Phase 3 (User Story 1)**: 16 tasks (11 tests + 5 implementation)
- **Phase 4 (User Story 2)**: 8 tasks (4 tests + 4 implementation)
- **Phase 5 (User Story 3)**: 12 tasks (11 tests + 4 implementation)
- **Phase 6 (Polish)**: 7 tasks

### Parallel Opportunities

- Phase 1: All tasks can run in parallel
- Phase 3: All test tasks (T003-T013) can run in parallel
- Phase 4: All test tasks (T019-T022) can run in parallel
- Phase 5: All test tasks (T027-T037) can run in parallel
- Phase 6: All tasks marked [P] can run in parallel

### Independent Test Criteria

- **User Story 1**: 画像ファイルを選択し、ストレージへのアップロードが完了してURLが取得され、そのURLを使って生成処理が実行できれば、このユーザーストーリーの価値が単独で成立する。
- **User Story 2**: 生成結果のURLを受け取り、そのURLを使って画像を表示し、ダウンロードできれば、このユーザーストーリーの価値が単独で成立する。
- **User Story 3**: 代表的なエラーケース（アップロード失敗、ストレージ接続エラー、生成失敗）で、ユーザーが次に取るべき行動が明確に示され、操作を継続できることを確認できる。

### Suggested MVP Scope

- **MVP**: User Story 1 only (Phase 3)
- **理由**: アーキテクチャ変更の中核機能であり、他の機能の前提となるため


