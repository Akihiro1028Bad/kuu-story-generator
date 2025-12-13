import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // 画像アップロード等で Server Actions のリクエスト本文が 1MB を超えるため引き上げ
    serverActions: { bodySizeLimit: '50mb' },
  } as unknown as NextConfig['experimental'],
}

export default nextConfig

