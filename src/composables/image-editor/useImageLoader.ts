// useImageLoader composable - 图片加载器
import { ref } from 'vue'
import { IMAGE_LIMITS } from '@/types/image-editor/defaults'
import type { EditorImage } from '@/types/image-editor'

interface LoadProgress {
  loaded: number
  total: number
  percentage: number
}

interface LoadResult {
  success: EditorImage[]
  failed: Array<{
    file: File
    error: string
  }>
}

export function useImageLoader() {
  const isLoading = ref(false)
  const progress = ref<LoadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  })
  const errors = ref<string[]>([])

  /**
   * 验证文件是否为有效图片
   */
  function validateFile(file: File): { valid: boolean; error?: string } {
    // 检查文件类型
    if (!IMAGE_LIMITS.SUPPORTED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件格式: ${file.type}`,
      }
    }

    // 检查文件大小
    if (file.size > IMAGE_LIMITS.MAX_FILE_SIZE) {
      const maxSizeMB = IMAGE_LIMITS.MAX_FILE_SIZE / 1024 / 1024
      return {
        valid: false,
        error: `文件 "${file.name}" 大小超过限制 (最大 ${maxSizeMB}MB)`,
      }
    }

    // 检查文件名
    if (!file.name || file.name.length > 255) {
      return {
        valid: false,
        error: '文件名无效或过长',
      }
    }

    return { valid: true }
  }

  /**
   * 批量验证文件
   */
  function validateFiles(files: File[]): {
    valid: File[]
    invalid: Array<{ file: File; error: string }>
  } {
    const valid: File[] = []
    const invalid: Array<{ file: File; error: string }> = []

    for (const file of files) {
      const result = validateFile(file)
      if (result.valid) {
        valid.push(file)
      } else {
        invalid.push({
          file,
          error: result.error || '未知错误',
        })
      }
    }

    return { valid, invalid }
  }

  /**
   * 加载单个图片（仅验证和预检查，实际加载由 store 完成）
   */
  async function prepareImage(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const validation = validateFile(file)
      if (!validation.valid) {
        reject(new Error(validation.error))
        return
      }

      // 预加载图片以验证是否可读
      const img = new Image()
      img.onload = () => {
        resolve()
      }
      img.onerror = () => {
        reject(new Error(`无法读取图片: ${file.name}`))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * 批量准备图片
   */
  async function prepareImages(files: File[]): Promise<LoadResult> {
    isLoading.value = true
    errors.value = []

    progress.value = {
      loaded: 0,
      total: files.length,
      percentage: 0,
    }

    const validatedFiles = validateFiles(files)
    const failed = validatedFiles.invalid

    // 记录验证失败的文件
    failed.forEach((item) => {
      errors.value.push(item.error)
    })

    // 预加载所有有效文件
    const results: EditorImage[] = []

    for (const file of validatedFiles.valid) {
      try {
        await prepareImage(file)
        // 实际的图片对象将由 store 创建
        progress.value.loaded++
        progress.value.percentage = Math.round(
          (progress.value.loaded / progress.value.total) * 100
        )
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `加载失败: ${file.name}`
        errors.value.push(errorMessage)
        failed.push({
          file,
          error: errorMessage,
        })
      }
    }

    isLoading.value = false

    return {
      success: results,
      failed,
    }
  }

  /**
   * 从 FileList 或 File[] 创建文件数组
   */
  function createFileArray(input: FileList | File[]): File[] {
    if (input instanceof FileList) {
      return Array.from(input)
    }
    return input
  }

  /**
   * 检查是否可以添加更多图片
   */
  function canAddImages(currentCount: number, newCount: number): boolean {
    return currentCount + newCount <= IMAGE_LIMITS.MAX_IMAGES
  }

  /**
   * 重置加载状态
   */
  function reset() {
    isLoading.value = false
    progress.value = {
      loaded: 0,
      total: 0,
      percentage: 0,
    }
    errors.value = []
  }

  return {
    // State
    isLoading,
    progress,
    errors,

    // Methods
    validateFile,
    validateFiles,
    prepareImage,
    prepareImages,
    createFileArray,
    canAddImages,
    reset,
  }
}
