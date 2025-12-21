export async function saveOnDesktop(
  imageUrl: string,
  mimeType: 'image/png' | 'image/jpeg',
  fileName?: string
): Promise<void> {
  const response = await fetch(imageUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`)
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName || `kuu-${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(objectUrl)
}
