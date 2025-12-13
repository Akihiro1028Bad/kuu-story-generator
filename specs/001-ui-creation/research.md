# Research: くぅー画像生成UI（001-ui-creation）

**作成日**: 2025-12-12  
**対象Spec**: [spec.md](./spec.md)

## 調査方針

- 本調査は **context7（MCP）で取得した公式ドキュメント**を根拠に、実装上の主要判断を確定する。
- 憲章の優先事項（App Router / Server Components default / Mutation=Server Actions / APIキーはサーバー側 / 外部依存は `lib/api/` 集約）を満たす。

## Decision 1: 生成操作は Server Actions + FormData を採用する

**Decision**: 生成（アップロード→選択→生成）トリガーは `form action={serverAction}` で Server Action に送る。  
**Rationale**:
- Next.js は Server Actions が `FormData` を受け取れる（フォーム送信で自動的に `FormData` が渡る）ため、UIは標準フォームで構成できる。
- React 19 の `useActionState` と組み合わせることで、送信中/成功/失敗の状態を **初心者でも書きやすい形**で扱える。
**Alternatives**:
- Client から直接 Route Handler を `fetch` する（憲章「Mutation は Server Actions で統一」に反するため不採用）

**Evidence（context7）**:
- Next.js: Server Action が `FormData` を受け取る例（フォームの `action` に Server Action を指定）  
- Next.js: `request.formData()` で Route Handler が FormData を読む例  
- React: `useActionState` でフォーム送信状態/エラーを扱う例

## Decision 2: 外部AI呼び出しは Route Handler（BFF）へ集約する

**Decision**: Server Action から直接外部AIにアクセスせず、内部 Route Handler（BFF）を経由する。  
**Rationale**:
- APIキーをクライアントに露出しない（憲章）。
- 外部APIの I/F 変更やエラー処理を BFF に閉じ込め、UIと分離できる。
**Alternatives**:
- Server Action 内で外部 API を直接叩く（"Route Handlers 経由"という憲章方針に沿いづらいので不採用）

**Evidence（context7）**:
- Next.js: Route Handlers の基本形（`route.ts` で `export async function POST(request: Request)`）  
- Next.js: `request.formData()` を使う Route Handler の例

## Decision 3: フォーム状態は useActionState を採用する

**Decision**: 生成フォームの状態（pending / エラー表示 / 完了後の結果保持）は `useActionState` を採用する。  
**Rationale**:
- 送信中のボタン無効化、エラーメッセージの `aria-live` 表示などが定型化しやすい。
- Server Actions の返り値を "UIの状態" として扱えるため、分岐が読みやすい。
**Alternatives**:
- `useState` + `fetch` による手動管理（状態分岐が増え、初級者が迷いやすい）

**Evidence（context7）**:
- React: `useActionState` の基本例、pending状態を含むフォーム例

## Decision 4: Route Handler 入出力は multipart/form-data を第一候補にする

**Decision**: 内部 Route Handler への入力は `multipart/form-data` を基本とし、画像ファイルと選択値を同じ送信で扱う。  
**Rationale**:
- Next.js Route Handler は `request.formData()` を提供するため、ファイル/文字列混在の入力を扱いやすい。
**Alternatives**:
- JSON（画像を Data URI で持たせる）: payload が大きくなりやすいので必要時のみ

**Evidence（context7）**:
- Next.js: Route Handler で `request.formData()` を読む例

## 未確定事項（計画フェーズで確定する）

- **カメラロール保存**: モバイルWebの制約が大きいため、実装計画で「可能な限りの実現方法」と「フォールバック」を明示する（Spec上は FR-014/FR-016 を満たす設計にする）。

