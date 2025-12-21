import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container mx-auto px-6 py-16 max-w-2xl">
      <div className="card bg-base-100 shadow-xl border border-base-200 rounded-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold">ページが見つかりませんでした</h2>
          <p className="text-sm text-base-content/70">
            URLが間違っているか、ページが移動した可能性があります。
          </p>
          <div className="mt-4 flex gap-3">
            <Link className="btn btn-ghost" href="/">
              トップへ戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


