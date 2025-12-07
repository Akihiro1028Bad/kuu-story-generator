# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

憲章に基づく必須チェック項目：

### アーキテクチャ原則
- [ ] Next.js App Router ベースの構成を使用しているか
- [ ] Server Components をデフォルトとして使用しているか
- [ ] Mutation は Server Actions で統一されているか
- [ ] API キーはサーバー側（Route Handlers）で保持されているか
- [ ] 画像合成処理はクライアント側で実施されているか（該当する場合）
- [ ] 外部サービス依存は `lib/api/` に集約されているか

### コーディング規約
- [ ] TypeScript `strict` モードが有効か
- [ ] `any` 型を使用していないか（例外時はコメント必須）
- [ ] ESLint + Prettier が設定されているか
- [ ] Component の役割が分離されているか（UI vs Logic）
- [ ] `use client` は CSR 必須時のみ使用しているか
- [ ] 命名規則が遵守されているか（変数・関数: camelCase、コンポーネント・型: PascalCase）

### セキュリティ
- [ ] API キーが `.env` で管理され、コミットされていないか
- [ ] 画像データがサーバーに保存されていないか（仕様に基づく）
- [ ] Route Handlers 経由で API 通信しているか
- [ ] エラー内容がユーザーに露出していないか

### パフォーマンス
- [ ] LCP が 3秒以内を目標としているか
- [ ] `next/image` による最適化を実施しているか
- [ ] アップロード画像サイズが適切に制限されているか

### テスト・品質
- [ ] ユニットテストが必須として計画されているか（画像レイアウト等）
- [ ] コンポーネントテストが計画されているか（主要 UI）
- [ ] E2Eテストが計画されていないか（本アプリは小規模のため不要）
- [ ] CI で `lint`, `type-check`, `test` が自動実行されるか
- [ ] `test-cases.md` が生成され、全てのテストケースが構造化されたテーブル形式で記載されているか
- [ ] テスト仕様書に必須列（テストID、テスト名、前提条件、実行手順、期待結果、対象ファイル/関数、予想カバレッジ率）が含まれているか
- [ ] テスト種別ごと（単体テスト・統合テスト）にセクション分けされ、各セクションの最後にカバレッジ率が集計されているか

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
