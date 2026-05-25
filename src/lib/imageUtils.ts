
export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  flip = { horizontal: false, vertical: false }
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Define target dimensions (limit large images to prevent 1MB Firestore limit)
  const MAX_DIMENSION = 800;
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    if (targetWidth > targetHeight) {
      targetHeight = (MAX_DIMENSION / targetWidth) * targetHeight;
      targetWidth = MAX_DIMENSION;
    } else {
      targetWidth = (MAX_DIMENSION / targetHeight) * targetWidth;
      targetHeight = MAX_DIMENSION;
    }
  }

  // Set canvas size to the target size
  canvas.width = targetWidth
  canvas.height = targetHeight

  // Draw the image onto the canvas, shifted and scaled to show only the cropped area
  ctx.save()
  if (flip.horizontal || flip.vertical) {
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  )

  ctx.restore()

  // Start at 0.7 quality and reduce if still too large could be complex in rules, 
  // but just 0.6-0.7 is usually more than enough and very safe for 800x800
  return canvas.toDataURL('image/jpeg', 0.7)
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}
