/**
 * 项目文件序列化/反序列化工具
 */

import type {
  ProjectFile,
  EditorImage,
  AnnotationNode,
  AnnotationLine,
  CanvasState,
} from '@/types/image-editor'
import { getCurrentISOTime } from './validators'

/**
 * 将 HTMLImageElement 转换为 Base64
 */
function imageToBase64(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth || img.width
      canvas.height = img.naturalHeight || img.height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 Canvas 上下文'))
        return
      }

      ctx.drawImage(img, 0, 0)

      // 转换为 Base64（PNG 格式，质量较高）
      const base64 = canvas.toDataURL('image/png')
      resolve(base64)
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 序列化项目文件（异步，支持 Base64 图片）
 */
export async function serializeProjectFile(
  canvasState: CanvasState,
  images: EditorImage[],
  nodes: AnnotationNode[],
  lines: AnnotationLine[],
  projectName: string,
  onProgress?: (current: number, total: number) => void
): Promise<ProjectFile> {
  const now = getCurrentISOTime()

  // 序列化图片（转换为 Base64）
  const serializedImages = await Promise.all(
    images.map(async (img, index) => {
      try {
        // 将图片转换为 Base64
        const base64Src = await imageToBase64(img.imageElement)

        // 更新进度
        if (onProgress) {
          onProgress(index + 1, images.length)
        }

        return {
          ...img,
          src: base64Src, // 使用 Base64 代替原始 URL
          imageElement: undefined as any, // 移除 HTMLImageElement
        }
      } catch (error) {
        console.error(`图片 ${img.name} 转换失败:`, error)
        // 如果转换失败，保留原始 src
        return {
          ...img,
          imageElement: undefined as any,
        }
      }
    })
  )

  const projectFile: ProjectFile = {
    version: '1.0.0',
    projectName,
    createdAt: now,
    modifiedAt: now,
    canvas: {
      config: canvasState.config,
      view: canvasState.view,
      mode: canvasState.mode,
    },
    images: serializedImages,
    annotations: {
      nodes,
      lines,
    },
  }

  return projectFile
}

/**
 * 反序列化项目文件
 */
export function deserializeProjectFile(
  projectFile: ProjectFile
): {
  canvasConfig: CanvasState['config']
  canvasView: CanvasState['view']
  canvasMode: CanvasState['mode']
  images: EditorImage[]
  nodes: AnnotationNode[]
  lines: AnnotationLine[]
} {
  return {
    canvasConfig: projectFile.canvas.config,
    canvasView: projectFile.canvas.view,
    canvasMode: projectFile.canvas.mode,
    images: projectFile.images,
    nodes: projectFile.annotations.nodes,
    lines: projectFile.annotations.lines,
  }
}

/**
 * 验证项目文件格式
 */
export function validateProjectFile(data: any): data is ProjectFile {
  return (
    data &&
    typeof data === 'object' &&
    data.version &&
    data.projectName &&
    data.canvas &&
    data.images &&
    Array.isArray(data.images) &&
    data.annotations &&
    Array.isArray(data.annotations.nodes) &&
    Array.isArray(data.annotations.lines)
  )
}

/**
 * 计算项目文件大小（估算）
 */
export function estimateProjectSize(projectFile: ProjectFile): number {
  const jsonString = JSON.stringify(projectFile)
  return new Blob([jsonString]).size
}
