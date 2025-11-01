/**
 * 项目文件管理 Composable
 * 用于保存和加载项目文件
 */

import { ref } from 'vue'
import { ElNotification } from 'element-plus'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import {
  serializeProjectFile,
  deserializeProjectFile,
  validateProjectFile,
} from '@/utils/image-editor/serializer'
import {
  downloadJSON,
  readFileAsText,
  generateFileName,
} from '@/utils/image-editor/file-handler'
import type { ProjectFile } from '@/types/image-editor'

export function useProjectFile() {
  const canvasStore = useCanvasStore()
  const imagesStore = useImagesStore()
  const annotationsStore = useAnnotationsStore()

  const isSaving = ref(false)
  const isLoading = ref(false)
  const currentProjectName = ref('未命名项目')

  /**
   * 保存项目文件
   */
  async function saveProjectFile(projectName?: string): Promise<void> {
    isSaving.value = true

    // 显示保存进度通知
    let progressNotification: any = null

    try {
      const name = projectName || currentProjectName.value
      const imageCount = imagesStore.images.length

      // 如果有图片，显示进度通知
      if (imageCount > 0) {
        progressNotification = ElNotification.info({
          title: '保存中',
          message: `正在转换图片 (0/${imageCount})...`,
          duration: 0, // 不自动关闭
        })
      }

      // 序列化项目数据（带进度回调）
      const projectFile = await serializeProjectFile(
        canvasStore.canvasState,
        imagesStore.images,
        annotationsStore.nodes,
        annotationsStore.lines,
        name,
        (current, total) => {
          // 更新进度通知
          if (progressNotification) {
            progressNotification.message = `正在转换图片 (${current}/${total})...`
          }
        }
      )

      // 关闭进度通知
      if (progressNotification) {
        progressNotification.close()
      }

      // 生成文件名
      const fileName = generateFileName(
        name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_'),
        'json'
      )

      // 下载 JSON 文件
      downloadJSON(projectFile, fileName)

      currentProjectName.value = name
      canvasStore.markAsSaved()

      ElNotification.success({
        title: '保存成功',
        message: `项目已保存为 ${fileName}`,
      })
    } catch (error) {
      console.error('保存项目失败:', error)

      // 关闭进度通知
      if (progressNotification) {
        progressNotification.close()
      }

      ElNotification.error({
        title: '保存失败',
        message: error instanceof Error ? error.message : '未知错误',
      })
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 加载项目文件
   */
  async function loadProjectFile(file: File): Promise<void> {
    isLoading.value = true

    try {
      // 读取文件内容
      const fileContent = await readFileAsText(file)
      const projectData = JSON.parse(fileContent)

      // 验证文件格式
      if (!validateProjectFile(projectData)) {
        throw new Error('无效的项目文件格式')
      }

      const projectFile = projectData as ProjectFile

      // 反序列化数据
      const {
        canvasConfig,
        canvasView,
        canvasMode,
        images,
        nodes,
        lines,
      } = deserializeProjectFile(projectFile)

      // 清空当前状态
      imagesStore.clearAllImages()
      annotationsStore.clearAllAnnotations()

      // 恢复画布配置
      canvasStore.setCanvasSize(canvasConfig.width, canvasConfig.height)
      canvasStore.setBackgroundColor(canvasConfig.backgroundColor)
      canvasStore.panTo(canvasView.position.x, canvasView.position.y)
      canvasStore.zoomTo(canvasView.scale)
      canvasStore.setMode(canvasMode)

      // 恢复图片（需要重新加载图片）
      for (const img of images) {
        await imagesStore.loadImageFromURL(img.src, img)
      }

      // 恢复标注
      nodes.forEach((node) => {
        annotationsStore.nodes.push(node)
      })
      lines.forEach((line) => {
        annotationsStore.lines.push(line)
      })

      // 更新最大节点序号
      if (nodes.length > 0) {
        annotationsStore.maxNodeNumber = Math.max(
          ...nodes.map((n) => n.number)
        )
      }

      currentProjectName.value = projectFile.projectName
      canvasStore.markAsSaved()

      ElNotification.success({
        title: '加载成功',
        message: `项目 "${projectFile.projectName}" 已加载`,
      })
    } catch (error) {
      console.error('加载项目失败:', error)
      ElNotification.error({
        title: '加载失败',
        message: error instanceof Error ? error.message : '文件格式错误',
      })
    } finally {
      isLoading.value = false
    }
  }

  return {
    isSaving,
    isLoading,
    currentProjectName,
    saveProjectFile,
    loadProjectFile,
  }
}
