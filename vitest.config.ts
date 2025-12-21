import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    coverage: {
      // プロバイダーの指定（v8がデフォルト）
      provider: 'v8',
      
      // カバレッジを有効化（CLIフラグでも可能）
      enabled: false, // デフォルトはfalse、--coverageフラグで有効化
      
      // カバレッジレポーター（複数指定可能）
      reporter: [
        'text',        // コンソール出力
        'json',        // JSON形式（CI/CD連携用）
        'html',        // HTMLレポート（ブラウザで確認可能）
        'lcov',        // LCOV形式（多くのCI/CDツールで使用）
      ],
      
      // レポート出力ディレクトリ
      reportsDirectory: './coverage',
      
      // カバレッジ対象ファイルのパターン
      include: [
        'app/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      
      // カバレッジから除外するパターン
      exclude: [
        // テストファイル自体
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        // Next.js設定ファイル
        '**/next.config.{ts,js}',
        '**/next-env.d.ts',
        // 型定義ファイル
        '**/*.d.ts',
        // 設定ファイル
        '**/*.config.{ts,js,mjs}',
        // エラーページ（Next.js自動生成）
        '**/error.tsx',
        '**/global-error.tsx',
        '**/not-found.tsx',
        // レイアウトファイル（通常テストしない）
        '**/layout.tsx',
        // ページファイル（E2Eテストでカバー）
        '**/page.tsx',
        // ルートハンドラー（統合テストでカバー）
        'app/api/**/route.ts',
        // node_modules
        '**/node_modules/**',
        // ビルド成果物
        '**/.next/**',
        '**/dist/**',
        '**/coverage/**',
      ],
      
      // カバレッジしきい値（オプション）
      thresholds: {
        // 全体のしきい値
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
      
      // カバレッジレポート生成前に既存レポートを削除
      clean: true,
    },
  },
})

