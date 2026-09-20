export async function imageUrlToPngBlob(url: string): Promise<Blob> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The image could not be downloaded.')
  const source = await response.blob()
  const bitmap = await createImageBitmap(source)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image copy is unavailable in this browser.')
  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Image conversion failed.')),
      'image/png',
    )
  })
}

export async function copyImageToClipboard(url: string): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Image copying needs a current secure browser.')
  }
  const blob = await imageUrlToPngBlob(url)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export function generatedImageUrl(content: string): string | null {
  const match = content.match(/!\[[^\]]*]\((https?:\/\/[^)]+\/v1\/generated-images\/[^)]+)\)/i)
  return match?.[1] ?? null
}
