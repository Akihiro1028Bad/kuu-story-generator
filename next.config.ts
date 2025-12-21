import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 本番での「時々出るクライアント例外」を追うために、必要なときだけ source map を有効化できるようにする。
  // 有効化する場合: Vercel の環境変数 `PRODUCTION_BROWSER_SOURCEMAPS=1` を設定して再デプロイ。
  productionBrowserSourceMaps: process.env.PRODUCTION_BROWSER_SOURCEMAPS === '1',
  experimental: {
    // 画像アップロード等で Server Actions のリクエスト本文が 1MB を超えるため引き上げ
    serverActions: { bodySizeLimit: '50mb' },
  } as unknown as NextConfig['experimental'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
    ],
  },
}

export default nextConfig
