export function saveOnDesktop(
  imageDataUrl: string,
  mimeType: 'image/png' | 'image/jpeg',
  fileName?: string
): void {
  const link = document.createElement('a')
  link.href = imageDataUrl
  link.download = fileName || `kuu-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

