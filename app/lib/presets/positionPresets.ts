export interface PositionPreset {
  id: string
  label: string
  placementHint: string
}

export const positionPresets: PositionPreset[] = [
  // 1行目: 左上 上 右上
  { id: '1', label: '左上', placementHint: '画像の左上' },
  { id: '2', label: '上', placementHint: '画像の上部' },
  { id: '3', label: '右上', placementHint: '画像の右上' },
  // 2行目: 左 中央 右
  { id: '4', label: '左', placementHint: '画像の左側' },
  { id: '5', label: '中央', placementHint: '画像の中央' },
  { id: '6', label: '右', placementHint: '画像の右側' },
  // 3行目: 左下 下 右下
  { id: '7', label: '左下', placementHint: '画像の左下' },
  { id: '8', label: '下', placementHint: '画像の下部' },
  { id: '9', label: '右下', placementHint: '画像の右下' },
]

