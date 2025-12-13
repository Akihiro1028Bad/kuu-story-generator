# Tasks: くぅー画像生成UI（001-ui-creation）

**入力**: `/specs/001-ui-creation/` の設計ドキュメント  
**前提条件**: plan.md（必須）、spec.md（必須）、test-cases.md（必須）、research.md、data-model.md、contracts/  

**⚠️ 重要ゲート**: テスト仕様書（`test-cases.md`）のレビュー承認が完了するまで、実装タスク（Phase 3以降）に進むことは禁止されます（憲章 6.1）。  
**⚠️ 重要**: 憲章により **ユニットテストは必須**、CIで `lint`/`type-check`/`test` を自動実行します。  

## 形式: `- [ ] T001 [P?] [US?] 説明（ファイルパス）`

- **[P]**: 並列実行可能（異なるファイル、依存関係なし）
- **[US1]/[US2]**: ユーザーストーリーに属するタスクのみ付与

## Phase 1: セットアップ（共有インフラ）

**目的**: 実装前提の確認・不足物の作成（初回に必ず通す）

- [x] T001 `package.json` の依存関係（Next.js/React）と scripts（lint/type-check）が揃っていることを確認
- [x] T002 `tsconfig.json` の `strict: true` を確認
- [x] T003 [P] `eslint.config.mjs` / `prettier` の設定を確認
- [x] T004 [P] `tailwind.config.ts` / `app/globals.css` の Tailwind 設定を確認
- [x] T005 [P] `.env.example` を作成し、必要な環境変数（例: `NEXT_PUBLIC_API_URL`）の説明を記載
- [x] T006 `docker-compose.yml` のPrism接続（外部APIベースURL: `NEXT_PUBLIC_API_URL=http://prism:4010`）を確認

---

## Phase 2: 基盤（ブロッキング前提）

**目的**: 全ストーリー共通の下地（ディレクトリ、テスト基盤、CI）

- [x] T007 `lib/api/client.ts` が存在し、Prismに向けて呼び出せる構造になっていることを確認
- [x] T008 [P] ディレクトリ作成: `app/lib/presets/`, `app/lib/prompt/`, `app/lib/validate/`, `app/lib/save/`, `app/lib/errors/`
- [x] T009 [P] ディレクトリ作成: `app/api/options/`, `app/api/generate/`
- [x] T010 [P] ディレクトリ作成: `app/components/KuuGenerator/`
- [x] T011 [P] テストランナー導入: `vitest` を追加し、最低限 `pnpm test` が実行できる状態にする（`package.json`, `pnpm-lock.yaml`）
- [x] T012 `package.json` に `test` スクリプトを追加し、`pnpm test` が通ることを確認（例: `vitest run`）
- [x] T013 CI追加: `lint`/`type-check`/`test` を実行する GitHub Actions を追加（例: `.github/workflows/ci.yml`）

**チェックポイント**: 基盤準備完了

---

## Phase 2.5: テスト仕様書レビューゲート ⚠️ 必須

**目的**: `test-cases.md` のレビュー承認（承認まで実装禁止）

- [x] T014 `specs/001-ui-creation/test-cases.md` をレビュー（完全性・正確性）
- [x] T015 必須列（テストID/名/前提/手順/期待結果/対象/カバレッジ率）が全ケースにあることを確認
- [x] T016 テスト種別（単体/統合）ごとのセクション分割と集計があることを確認
- [x] T017 テスト仕様書を承認（サインオフ）

---

## Phase 3: ユーザーストーリー1（P1）🎯 MVP

**ストーリー**: 画像をアップロードし、選択肢（文言/スタイル/位置）を選んで生成し、保存できる  
**独立テスト**: アップロード→選択→生成→保存が一通り完了すること  

### 実装（US1）

- [x] T018 [P] [US1] `app/lib/presets/textPhraseOptions.ts` を作成（候補: 文言）
- [x] T019 [P] [US1] `app/lib/presets/stylePresets.ts` を作成（候補: スタイル）
- [x] T020 [P] [US1] `app/lib/presets/positionPresets.ts` を作成（候補: 位置プリセット）
- [x] T021 [US1] `app/api/options/route.ts` を作成（候補一覧を返す）
- [x] T022 [US1] `app/lib/prompt/buildPrompt.ts` を作成（プロンプト生成）

- [x] T023 [US1] `app/api/generate/route.ts` を作成（FormData受領: image/textPhraseId/styleId/positionId/outputFormat）
- [x] T024 [US1] `app/api/generate/route.ts` に必須項目・候補ID検証を実装
- [x] T025 [US1] `app/api/generate/route.ts` に画像→Data URL変換を実装
- [x] T026 [US1] `app/api/generate/route.ts` に外部AI呼び出し（Prism経由）を実装（`lib/api/client.ts` 使用）
- [x] T027 [US1] `app/api/generate/route.ts` が `imageDataUrl/mimeType/width/height` を返すように整備

- [ ] T028 [US1] `app/components/KuuGenerator/actions.ts` を作成（`GenerateState` 型、`generateKuu` Server Action）
- [ ] T029 [US1] `generateKuu` から 自アプリ `/api/generate` を呼び出し、成功/失敗を state で返す（`useActionState` 前提、**Server Action からの呼び出しは `headers()` 由来の origin を使用して絶対URLで呼ぶ**）

- [ ] T030 [US1] `app/components/KuuGenerator/UploadSection.tsx` を作成（JPEG/PNG・10MBの**クライアント側**検証）
- [ ] T031 [US1] `UploadSection.tsx` で元画像の `width/height` を取得し、フォームに `originalWidth/originalHeight` を含める（FR-012対策）
- [ ] T032 [US1] `app/api/generate/route.ts` で `originalWidth/originalHeight` を受け取り、返却 `width/height` と一致チェック（不一致はエラー）（FR-012）

- [ ] T033 [US1] `app/components/KuuGenerator/StyleSection.tsx` を作成（文言/スタイル/位置の選択UI）
- [ ] T034 [US1] `app/components/KuuGenerator/GenerateButton.tsx` を作成（送信中 disabled）
- [ ] T035 [US1] `app/components/KuuGenerator/SaveActions.tsx` を作成（保存ボタンのみを表示、詳細情報は出さない）（FR-024）
- [ ] T036 [US1] `app/components/KuuGenerator/KuuGenerator.tsx` を作成（ステップ表示、PC=2カラム/スマホ=1カラム、進行中/完了/失敗を明示（`aria-live` 推奨）、完了時は「完了メッセージ＋保存ボタンのみ」）（FR-005/017/018/019/024）
- [ ] T037 [US1] `app/page.tsx` に `KuuGenerator` を配置

- [ ] T038 [US1] `app/lib/save/detectDeviceClass.ts` を作成（PC/スマホ判定）
- [ ] T039 [US1] `app/lib/save/saveOnDesktop.ts` を作成（PC: PNG/JPEG選択DL）（FR-013）
- [ ] T040 [US1] `app/lib/save/saveOnMobile.ts` を作成（スマホ: JPEGカメラロール保存→失敗時DL。**フォールバック時はユーザーへ明示**）（FR-014/016）

### テスト（US1: 憲章により必須）

- [ ] T041 [P] [US1] `app/lib/prompt/buildPrompt.test.ts` を追加（UT相当）
- [ ] T042 [P] [US1] `app/lib/save/saveOnDesktop.test.ts` を追加（UT相当）
- [ ] T043 [P] [US1] `app/lib/save/saveOnMobile.test.ts` を追加（UT相当）
- [ ] T044 [P] [US1] `app/api/options/route.ts` の統合テストを追加（IT相当、配置方針に従う）
- [ ] T045 [P] [US1] `app/api/generate/route.ts` の統合テストを追加（IT相当、配置方針に従う）

**チェックポイント**: US1の独立動作（アップロード→選択→生成→保存）を確認

---

## Phase 4: ユーザーストーリー2（P2）

**ストーリー**: やり直し/エラー時の復帰ができる  
**独立テスト**: 未アップロード、生成失敗、入力制限で「次に何をすべきか」が明確で復帰できる  

### 実装（US2）

- [ ] T046 [P] [US2] `app/lib/validate/validateSelections.ts` を作成（候補IDの検証）
- [ ] T047 [P] [US2] `app/lib/errors/toUserMessage.ts` を作成（技術エラー→日本語メッセージ）
- [ ] T048 [US2] `UploadSection.tsx` のエラー文言・表示（ユーザーが次に取る行動まで）を整備（FR-010）
- [ ] T049 [US2] `actions.ts` のエラー状態を拡充（入力不足/外部失敗/ネットワーク等の区別）
- [ ] T050 [US2] `KuuGenerator.tsx` に再試行と状態保持（アップロード/選択の維持）を実装
- [ ] T051 [US2] `app/api/generate/route.ts` のエラーハンドリングを強化（ユーザー向けは汎用＋再試行案内、詳細はログ）（憲章セキュリティ）

### テスト（US2: 憲章により必須）

- [ ] T052 [P] [US2] `app/lib/validate/validateSelections.test.ts` を追加（UT相当）
- [ ] T053 [P] [US2] `app/lib/errors/toUserMessage.test.ts` を追加（UT相当）

---

## Phase 5: 仕上げ（横断）

- [ ] T054 ライトテーマのみであることを担保（テーマ切替UI無し、`dark:` クラスを利用しない、`prefers-color-scheme` で見た目が変わらないことを確認）（FR-020）
- [ ] T055 [P] アクセシビリティ: `aria-live`、ラベル、キーボード操作を整備（Edge Cases: アクセシビリティ）
- [ ] T056 [P] パフォーマンス: LCP 3秒目標に向けた画像取り扱い最適化（必要ならObjectURL等）
- [ ] T057 [P] レスポンシブ確認: PC（2カラム）/スマホ（1カラム）を確認（FR-017/018）
- [ ] T058 [P] 日本語UIの全量確認（FR-009）
- [ ] T059 [P] iOS/Android の両方で保存導線を確認（カメラロール保存→失敗時DLのフォールバック含む）（FR-015/016）
- [ ] T060 [P] 画像データをサーバーに永続保存していないことを確認（DB/ストレージ書き込み無し、BFFはメモリ処理のみ）（FR-011）

---

## 依存関係（要点）

- Phase 2（基盤）と Phase 2.5（レビュー承認）完了後に Phase 3+ を開始
- [P] は並列実行可（異なるファイルで衝突しにくい）
