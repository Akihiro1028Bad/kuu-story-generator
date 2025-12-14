import { KuuGenerator } from '@/app/components/KuuGenerator/KuuGenerator'

// デプロイ直後などの「古いHTMLキャッシュ + 新しいJSチャンク」不整合（ChunkLoadError）を避けるため、
// トップページは静的生成ではなく動的に配信する。
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen py-6 sm:py-8">
      <KuuGenerator />
    </main>
  )
}
