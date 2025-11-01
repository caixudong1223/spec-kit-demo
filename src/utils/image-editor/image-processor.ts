// 图片处理工具函数
import type { EditorImage } from '@/types/image-editor'

interface ResizeOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maintainAspectRatio?: boolean
}

interface ThumbnailOptions {
  width: number
  height: number
  quality?: number
  fit?: 'cover' | 'contain'
}

/**
 * 调整图片大小
 */
export async function resizeImage(
  imageElement: HTMLImageElement,
  options: ResizeOptions
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.92,
    maintainAspectRatio = true,
  } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文')
  }

  let { width, height } = imageElement

  if (maintainAspectRatio) {
    const aspectRatio = width / height

    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }

    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }
  } else {
    width = Math.min(width, maxWidth)
    height = Math.min(height, maxHeight)
  }

  canvas.width = width
  canvas.height = height

  ctx.drawImage(imageElement, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * 生成缩略图
 */
export async function generateThumbnail(
  imageElement: HTMLImageElement,
  options: ThumbnailOptions
): Promise<string> {
  const { width, height, quality = 0.8, fit = 'cover' } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文')
  }

  canvas.width = width
  canvas.height = height

  const imgAspect = imageElement.width / imageElement.height
  const thumbAspect = width / height

  let sx = 0,
    sy = 0,
    sw = imageElement.width,
    sh = imageElement.height

  if (fit === 'cover') {
    // 填充模式：裁剪图片以填充整个缩略图
    if (imgAspect > thumbAspect) {
      // 图片更宽，裁剪左右
      sw = imageElement.height * thumbAspect
      sx = (imageElement.width - sw) / 2
    } else {
      // 图片更高，裁剪上下
      sh = imageElement.width / thumbAspect
      sy = (imageElement.height - sh) / 2
    }
  } else {
    // 包含模式：缩放图片以适应缩略图
    if (imgAspect > thumbAspect) {
      // 图片更宽
      const scale = width / imageElement.width
      const scaledHeight = imageElement.height * scale
      const offsetY = (height - scaledHeight) / 2
      ctx.drawImage(imageElement, 0, offsetY, width, scaledHeight)
      return canvas.toDataURL('image/jpeg', quality)
    } else {
      // 图片更高
      const scale = height / imageElement.height
      const scaledWidth = imageElement.width * scale
      const offsetX = (width - scaledWidth) / 2
      ctx.drawImage(imageElement, offsetX, 0, scaledWidth, height)
      return canvas.toDataURL('image/jpeg', quality)
    }
  }

  ctx.drawImage(imageElement, sx, sy, sw, sh, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * 转换图片格式
 */
export async function convertImageFormat(
  imageElement: HTMLImageElement,
  format: 'image/png' | 'image/jpeg' | 'image/webp',
  quality = 0.92
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文')
  }

  canvas.width = imageElement.width
  canvas.height = imageElement.height

  ctx.drawImage(imageElement, 0, 0)

  return canvas.toDataURL(format, quality)
}

/**
 * 从 EditorImage 导出图片
 */
export async function exportImage(
  image: EditorImage,
  options: {
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
    includeTransforms?: boolean
  } = {}
): Promise<Blob> {
  const { format = 'image/png', quality = 0.92, includeTransforms = true } = options

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx || !image.imageElement) {
    throw new Error('无法创建 Canvas 上下文或图片元素不存在')
  }

  if (includeTransforms) {
    // 计算应用变换后的画布尺寸
    const scaledWidth = image.size.width * image.scale.x
    const scaledHeight = image.size.height * image.scale.y

    canvas.width = scaledWidth
    canvas.height = scaledHeight

    ctx.save()

    // 应用变换
    ctx.translate(scaledWidth / 2, scaledHeight / 2)
    ctx.rotate((image.rotation * Math.PI) / 180)
    ctx.scale(image.scale.x, image.scale.y)
    ctx.translate(-image.size.width / 2, -image.size.height / 2)

    ctx.drawImage(image.imageElement, 0, 0, image.size.width, image.size.height)

    ctx.restore()
  } else {
    // 原始尺寸导出
    canvas.width = image.size.width
    canvas.height = image.size.height
    ctx.drawImage(image.imageElement, 0, 0)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('无法创建 Blob'))
        }
      },
      format,
      quality
    )
  })
}

/**
 * 导出多个图片为 ZIP（这个功能需要额外的库，这里只提供接口）
 */
export async function exportImagesAsZip(
  images: EditorImage[],
  options: {
    format?: 'image/png' | 'image/jpeg' | 'image/webp'
    quality?: number
  } = {}
): Promise<Blob> {
  // TODO: 实现 ZIP 打包功能（需要 jszip 库）
  // 这里先抛出错误提示
  throw new Error('ZIP 导出功能尚未实现，需要集成 jszip 库')
}

/**
 * 计算图片文件大小（格式化）
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * 获取图片的 EXIF 方向信息（如果需要）
 */
export function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer)

      if (view.getUint16(0, false) !== 0xffd8) {
        resolve(1) // 不是 JPEG
        return
      }

      const length = view.byteLength
      let offset = 2

      while (offset < length) {
        const marker = view.getUint16(offset, false)
        offset += 2

        if (marker === 0xffe1) {
          const exifLength = view.getUint16(offset, false)
          offset += 2

          if (view.getUint32(offset, false) === 0x45786966) {
            // "Exif"
            // 这里简化处理，实际 EXIF 解析较复杂
            resolve(1)
            return
          }
        } else {
          offset += view.getUint16(offset, false)
        }
      }

      resolve(1)
    }

    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
  })
}
