// 图片编辑标注组件 - 图片管理 Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useCanvasStore } from './canvas'
import type { EditorImage } from '@/types/image-editor'
import { DEFAULT_IMAGE, IMAGE_LIMITS } from '@/types/image-editor/defaults'
import { generateUUID, getCurrentISOTime, validateEditorImage } from '@/utils/image-editor/validators'

export const useImagesStore = defineStore('images', () => {
  // ========== State ==========
  const images = ref<EditorImage[]>([])
  const nextZIndex = ref(0)

  // Canvas store reference
  const canvasStore = useCanvasStore()

  // ========== Getters ==========
  const imageCount = computed(() => images.value.length)

  const hasImages = computed(() => imageCount.value > 0)

  const canAddMoreImages = computed(() => imageCount.value < IMAGE_LIMITS.MAX_IMAGES)

  const selectedImages = computed(() => images.value.filter((img) => img.isSelected))

  const hasSelection = computed(() => selectedImages.value.length > 0)

  const visibleImages = computed(() => images.value.filter((img) => img.isVisible))

  const sortedByZIndex = computed(() => {
    return [...images.value].sort((a, b) => a.zIndex - b.zIndex)
  })

  const getImageById = computed(() => {
    return (id: string) => images.value.find((img) => img.id === id)
  })

  const getNextZIndex = computed(() => nextZIndex.value)

  // ========== Actions ==========

  // 图片加载 (T032)
  async function loadImageFromFile(file: File): Promise<EditorImage | null> {
    try {
      // 验证文件类型
      if (!IMAGE_LIMITS.SUPPORTED_FORMATS.includes(file.type)) {
        throw new Error(`不支持的文件格式: ${file.type}`)
      }

      // 验证文件大小
      if (file.size > IMAGE_LIMITS.MAX_FILE_SIZE) {
        throw new Error(`文件大小超过限制 (${IMAGE_LIMITS.MAX_FILE_SIZE / 1024 / 1024}MB)`)
      }

      // 验证图片数量
      if (!canAddMoreImages.value) {
        throw new Error(`最多只能添加 ${IMAGE_LIMITS.MAX_IMAGES} 张图片`)
      }

      // 创建 HTMLImageElement
      const imageElement = await createImageElement(file)

      // 创建 EditorImage 对象
      const now = getCurrentISOTime()
      const newImage: EditorImage = {
        id: generateUUID(),
        name: file.name,
        src: URL.createObjectURL(file),
        imageElement,
        position: {
          x: DEFAULT_IMAGE.position!.x + images.value.length * 50,
          y: DEFAULT_IMAGE.position!.y + images.value.length * 50,
        },
        rotation: DEFAULT_IMAGE.rotation!,
        scale: { ...DEFAULT_IMAGE.scale! },
        size: {
          width: imageElement.naturalWidth,
          height: imageElement.naturalHeight,
        },
        zIndex: nextZIndex.value++,
        isSelected: DEFAULT_IMAGE.isSelected!,
        isLocked: DEFAULT_IMAGE.isLocked!,
        isVisible: DEFAULT_IMAGE.isVisible!,
        fileSize: file.size,
        mimeType: file.type,
        createdAt: now,
        modifiedAt: now,
      }

      // 验证图片数据
      const errors = validateEditorImage(newImage)
      if (errors.length > 0) {
        throw new Error(`图片验证失败: ${errors.join(', ')}`)
      }

      // 添加到图片列表
      images.value.push(newImage)
      canvasStore.markAsModified()

      return newImage
    } catch (error) {
      console.error('加载图片失败:', error)
      return null
    }
  }

  async function loadImagesFromFiles(files: File[]): Promise<EditorImage[]> {
    const loadedImages: EditorImage[] = []

    for (const file of files) {
      const image = await loadImageFromFile(file)
      if (image) {
        loadedImages.push(image)
      }
    }

    return loadedImages
  }

  // 辅助函数：创建 HTMLImageElement
  function createImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = URL.createObjectURL(file)
    })
  }

  // 图片更新 (T033)
  function updateImage(id: string, updates: Partial<EditorImage>) {
    const image = getImageById.value(id)
    if (!image) return

    Object.assign(image, {
      ...updates,
      modifiedAt: getCurrentISOTime(),
    })

    canvasStore.markAsModified()
  }

  function updateImagePosition(id: string, x: number, y: number) {
    const image = getImageById.value(id)
    if (!image || image.isLocked) return

    image.position.x = x
    image.position.y = y
    image.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  function updateImageRotation(id: string, rotation: number) {
    const image = getImageById.value(id)
    if (!image || image.isLocked) return

    image.rotation = rotation % 360
    image.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  function updateImageScale(id: string, scaleX: number, scaleY: number) {
    const image = getImageById.value(id)
    if (!image || image.isLocked) return

    image.scale.x = scaleX
    image.scale.y = scaleY
    image.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  // 图片删除 (T034)
  function deleteImage(id: string) {
    const index = images.value.findIndex((img) => img.id === id)
    if (index === -1) return

    const image = images.value[index]

    // 清理 Object URL
    if (image.src.startsWith('blob:')) {
      URL.revokeObjectURL(image.src)
    }

    // 删除图片
    images.value.splice(index, 1)

    // 如果删除的是选中的图片，清除选择
    if (image.isSelected) {
      canvasStore.clearSelection()
    }

    canvasStore.markAsModified()
  }

  function deleteImages(ids: string[]) {
    ids.forEach((id) => deleteImage(id))
  }

  function deleteAllImages() {
    // 清理所有 Object URLs
    images.value.forEach((img) => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src)
      }
    })

    images.value = []
    nextZIndex.value = 0
    canvasStore.clearSelection()
    canvasStore.markAsModified()
  }

  function deleteSelectedImages() {
    const selectedIds = selectedImages.value.map((img) => img.id)
    deleteImages(selectedIds)
  }

  // 图层操作 (T035)
  function bringToFront(id: string) {
    const image = getImageById.value(id)
    if (!image) return

    // 找到当前最大的 zIndex
    const maxZ = Math.max(...images.value.map((img) => img.zIndex), 0)

    image.zIndex = maxZ + 1
    nextZIndex.value = Math.max(nextZIndex.value, image.zIndex + 1)
    image.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  function sendToBack(id: string) {
    const image = getImageById.value(id)
    if (!image) return

    // 找到当前最小的 zIndex
    const minZ = Math.min(...images.value.map((img) => img.zIndex), 0)

    image.zIndex = minZ - 1
    image.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  function bringForward(id: string) {
    const image = getImageById.value(id)
    if (!image) return

    // 找到比当前 zIndex 大的最小值
    const higherImages = images.value.filter((img) => img.zIndex > image.zIndex)
    if (higherImages.length === 0) return

    const nextZ = Math.min(...higherImages.map((img) => img.zIndex))

    // 交换 zIndex
    const targetImage = images.value.find((img) => img.zIndex === nextZ)
    if (targetImage) {
      const temp = image.zIndex
      image.zIndex = targetImage.zIndex
      targetImage.zIndex = temp

      image.modifiedAt = getCurrentISOTime()
      targetImage.modifiedAt = getCurrentISOTime()
    }

    canvasStore.markAsModified()
  }

  function sendBackward(id: string) {
    const image = getImageById.value(id)
    if (!image) return

    // 找到比当前 zIndex 小的最大值
    const lowerImages = images.value.filter((img) => img.zIndex < image.zIndex)
    if (lowerImages.length === 0) return

    const prevZ = Math.max(...lowerImages.map((img) => img.zIndex))

    // 交换 zIndex
    const targetImage = images.value.find((img) => img.zIndex === prevZ)
    if (targetImage) {
      const temp = image.zIndex
      image.zIndex = targetImage.zIndex
      targetImage.zIndex = temp

      image.modifiedAt = getCurrentISOTime()
      targetImage.modifiedAt = getCurrentISOTime()
    }

    canvasStore.markAsModified()
  }

  // 选择操作 (T036)
  function selectImage(id: string) {
    // 取消所有选择
    images.value.forEach((img) => {
      img.isSelected = false
    })

    // 选中指定图片
    const image = getImageById.value(id)
    if (image) {
      image.isSelected = true
      canvasStore.selectObject('image', id)
    }
  }

  function deselectImage(id: string) {
    const image = getImageById.value(id)
    if (image) {
      image.isSelected = false
      canvasStore.clearSelection()
    }
  }

  function selectAllImages() {
    images.value.forEach((img) => {
      img.isSelected = true
    })
  }

  function deselectAllImages() {
    images.value.forEach((img) => {
      img.isSelected = false
    })
    canvasStore.clearSelection()
  }

  function toggleImageLock(id: string) {
    const image = getImageById.value(id)
    if (image) {
      image.isLocked = !image.isLocked
      image.modifiedAt = getCurrentISOTime()
      canvasStore.markAsModified()
    }
  }

  function toggleImageVisibility(id: string) {
    const image = getImageById.value(id)
    if (image) {
      image.isVisible = !image.isVisible
      image.modifiedAt = getCurrentISOTime()
      canvasStore.markAsModified()
    }
  }

  /**
   * 从 URL 加载图片（用于恢复项目）
   */
  async function loadImageFromURL(
    url: string,
    imageData?: Partial<EditorImage>
  ): Promise<EditorImage> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous' // 允许跨域
      img.onload = () => {
        const newImage: EditorImage = {
          id: imageData?.id || generateUUID(),
          name: imageData?.name || `图片 ${nextId.value++}`,
          src: url,
          imageElement: img,
          position: imageData?.position || { x: 50, y: 50 },
          scale: imageData?.scale || { x: 1, y: 1 },
          rotation: imageData?.rotation || 0,
          zIndex: imageData?.zIndex || getNextZIndex.value,
          isLocked: imageData?.isLocked || false,
          isVisible: imageData?.isVisible !== false,
          isSelected: false,
          metadata: {
            width: img.naturalWidth,
            height: img.naturalHeight,
            fileSize: 0,
            mimeType: 'image/unknown',
            lastModified: Date.now(),
          },
          createdAt: imageData?.createdAt || getCurrentISOTime(),
          modifiedAt: getCurrentISOTime(),
        }

        images.value.push(newImage)
        canvasStore.markAsModified()
        resolve(newImage)
      }
      img.onerror = () => {
        reject(new Error(`Failed to load image from URL: ${url}`))
      }
      img.src = url
    })
  }

  /**
   * 清空所有图片（别名，用于项目加载）
   */
  function clearAllImages(): void {
    deleteAllImages()
  }

  // 重置
  function resetImages() {
    deleteAllImages()
  }

  return {
    // State
    images,
    nextZIndex,

    // Getters
    imageCount,
    hasImages,
    canAddMoreImages,
    selectedImages,
    hasSelection,
    visibleImages,
    sortedByZIndex,
    getImageById,
    getNextZIndex,

    // Actions
    loadImageFromFile,
    loadImagesFromFiles,
    loadImageFromURL,
    clearAllImages,
    updateImage,
    updateImagePosition,
    updateImageRotation,
    updateImageScale,
    deleteImage,
    deleteImages,
    deleteAllImages,
    deleteSelectedImages,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    selectImage,
    deselectImage,
    selectAllImages,
    deselectAllImages,
    toggleImageLock,
    toggleImageVisibility,
    resetImages,
  }
})
