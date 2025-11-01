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
 * 序列化项目文件
 */
export function serializeProjectFile(
  canvasState: CanvasState,
  images: EditorImage[],
  nodes: AnnotationNode[],
  lines: AnnotationLine[],
  projectName: string
): ProjectFile {
  const now = getCurrentISOTime()

  // 序列化图片（移除 HTMLImageElement，只保留 src）
  const serializedImages = images.map((img) => ({
    ...img,
    imageElement: undefined as any, // 移除 HTMLImageElement
  }))

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
