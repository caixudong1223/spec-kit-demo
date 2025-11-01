/**
 * 画布导出 Composable
 * 用于导出画布为图片
 */

import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { downloadFile, generateFileName } from '@/utils/image-editor/file-handler'

export interface ExportOptions {
  format?: 'png' | 'jpeg'
  quality?: number // 0-1, JPEG 质量
  fileName?: string
  pixelRatio?: number // 导出分辨率倍数
}

export function useCanvasExport() {
  const isExporting = ref(false)
  const exportProgress = ref(0)

  /**
   * 导出画布为图片
   */
  async function exportCanvasAsImage(
    stage: any,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      format = 'png',
      quality = 0.92,
      fileName,
      pixelRatio = 2,
    } = options

    if (!stage) {
      ElNotification.error({
        title: '导出失败',
        message: '画布未初始化',
      })
      return
    }

    isExporting.value = true
    exportProgress.value = 0

    try {
      // 更新进度
      exportProgress.value = 30

      // 导出为 Data URL
      const dataUrl = stage.toDataURL({
        mimeType: format === 'png' ? 'image/png' : 'image/jpeg',
        quality,
        pixelRatio,
      })

      exportProgress.value = 70

      // 转换为 Blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      exportProgress.value = 90

      // 下载文件
      const finalFileName =
        fileName || generateFileName('canvas-export', format)
      downloadFile(blob, finalFileName)

      exportProgress.value = 100

      ElNotification.success({
        title: '导出成功',
        message: `画布已导出为 ${format.toUpperCase()}`,
      })
    } catch (error) {
      console.error('导出失败:', error)
      ElNotification.error({
        title: '导出失败',
        message: error instanceof Error ? error.message : '未知错误',
      })
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  /**
   * 导出为 PNG
   */
  async function exportAsPNG(stage: any, fileName?: string): Promise<void> {
    await exportCanvasAsImage(stage, {
      format: 'png',
      fileName,
    })
  }

  /**
   * 导出为 JPEG
   */
  async function exportAsJPEG(
    stage: any,
    fileName?: string,
    quality = 0.92
  ): Promise<void> {
    await exportCanvasAsImage(stage, {
      format: 'jpeg',
      quality,
      fileName,
    })
  }

  return {
    isExporting,
    exportProgress,
    exportCanvasAsImage,
    exportAsPNG,
    exportAsJPEG,
  }
}
