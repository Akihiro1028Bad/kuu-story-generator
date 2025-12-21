import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png']

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const lower = pathname.toLowerCase()
        if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) {
          throw new Error('無効なファイル形式です。JPEGまたはPNG形式のみアップロードできます。')
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Blob upload completed:', {
          url: blob.url,
          pathname: blob.pathname,
          contentType: blob.contentType,
        })
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Upload handler error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'アップロード処理に失敗しました' },
      { status: 400 }
    )
  }
}
