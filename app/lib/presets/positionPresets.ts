export interface PositionPreset {
  id: string
  label: string
  placementHint: string
}

export const positionPresets: PositionPreset[] = [
  // 1行目: 左上 上 右上
  { id: 'top-left', label: '左上', placementHint: '画像の左上' },
  { id: 'top', label: '上', placementHint: '画像の上部' },
  { id: 'top-right', label: '右上', placementHint: '画像の右上' },
  // 2行目: 左 中央 右
  { id: 'left', label: '左', placementHint: '画像の左側' },
  { id: 'center', label: '中央', placementHint: '画像の中央' },
  { id: 'right', label: '右', placementHint: '画像の右側' },
  // 3行目: 左下 下 右下
  { id: 'bottom-left', label: '左下', placementHint: '画像の左下' },
  { id: 'bottom', label: '下', placementHint: '画像の下部' },
  { id: 'bottom-right', label: '右下', placementHint: '画像の右下' },
]

