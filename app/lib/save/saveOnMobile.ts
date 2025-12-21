export type MobileSaveResult =
  | { outcome: 'camera-roll-saved' }
  | { outcome: 'fallback-downloaded'; message: string }
  | { outcome: 'failed'; message: string }

export async function saveOnMobile(imageUrl: string): Promise<MobileSaveResult> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    const blob = await response.blob()

    // 方法1: Web Share API (Level 2)
    // ファイル共有がサポートされているか確認
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `kuu-${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'くぅー画像',
            text: 'くぅー画像を生成しました！'
          })
          return { outcome: 'camera-roll-saved' }
        } catch (error) {
           if ((error as Error).name === 'AbortError') {
             return { outcome: 'failed', message: '共有がキャンセルされました' }
           }
           // 共有失敗時はフォールバックへ進む
        }
      }
    }
    
    // 方法2: 通常のダウンロードにフォールバック
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `kuu-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(objectUrl)
    
    return {
      outcome: 'fallback-downloaded',
      message: '画像をダウンロードしました（カメラロールへの保存は非対応のため）。',
    }
  } catch (error) {
    return { outcome: 'failed', message: error instanceof Error ? error.message : '保存に失敗しました' }
  }
}
