# クライアント側例外（“Application error: a client-side exception…”）の原因特定手順

このリポジトリでは、ブラウザで発生した例外がサーバログに出ない問題を解消するために、**クライアントの例外を `/api/client-error` に送信して Vercel Logs で確認できる**ようにする仕組みを追加しています。

## 追加したもの

- `app/api/client-error/route.ts`
  - クライアントから送られてきた例外情報を `console.error("[client-error]", ...)` で出力します（Vercel Logs で見える）。
- `app/components/ClientErrorReporter.tsx`
  - `window.error` / `unhandledrejection` を拾って `/api/client-error` に送信します。
- `app/global-error.tsx`
  - Next.js App Router の `global-error` で捕捉できるエラーも送信します。

## 必須: レポーターのマウント

`ClientErrorReporter` は「どこかのクライアントコンポーネント」として実行される必要があります。通常は `app/layout.tsx` に 1 行追加するのが簡単です。

例（`app/layout.tsx` の `<body>` 内）:

```tsx
import { ClientErrorReporter } from "./components/ClientErrorReporter";

// ...
<body>
  <ClientErrorReporter />
  {children}
</body>
```

## 動作確認

デプロイ後、ブラウザの DevTools Console で以下を実行し、Vercel Logs に `[client-error]` が出ることを確認します。

```js
fetch("/api/client-error", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ type: "error", message: "client-error test", timestamp: new Date().toISOString() }),
});
```

## 次にエラーが起きたときの見方

1. Vercel の該当デプロイの Logs を開く
2. `[client-error]` でフィルタ
3. `payload.message` / `payload.stack` / `payload.href` / `payload.nextBuildId` を確認

`nextBuildId` が取れていれば「どのビルドで起きたか」が追えるので、再現しにくい“時々起きる”系の調査がしやすくなります。

## 追加でやると強い（任意）

- **本番ソースマップ有効化**: Stacktrace が minify されて読めない場合、`next.config.js` の `productionBrowserSourceMaps: true` を一時的に有効化すると原因箇所が特定しやすいです。
  - 本番配布物のサイズ増加などのトレードオフがあるので、調査が終わったら戻す運用がおすすめです。

