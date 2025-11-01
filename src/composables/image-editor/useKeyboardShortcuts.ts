// useKeyboardShortcuts composable - 键盘快捷键
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import { KEYBOARD_SHORTCUTS } from '@/types/image-editor/defaults'
import { onMounted, onUnmounted, ref } from 'vue'

export function useKeyboardShortcuts() {
  const imagesStore = useImagesStore()
  const canvasStore = useCanvasStore()
  const annotationsStore = useAnnotationsStore()

  // 记录按下空格键前的工具
  const previousTool = ref<string | null>(null)

  /**
   * 处理键盘事件
   */
  function handleKeyDown(event: KeyboardEvent) {
    // 如果在输入框中，不处理快捷键
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // 只在编辑模式下处理快捷键
    if (!canvasStore.isEditMode) {
      return
    }

    const key = event.key
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey

    // Space - 临时启用平移工具
    if (key === ' ' && !previousTool.value) {
      event.preventDefault()
      previousTool.value = canvasStore.activeTool
      canvasStore.setActiveTool('pan')
      return
    }

    // Delete - 删除选中的图片或标注
    if (key === KEYBOARD_SHORTCUTS.DELETE || key === 'Backspace') {
      event.preventDefault()

      // 优先删除标注（节点或线段）
      if (annotationsStore.selectedNode) {
        annotationsStore.deleteNode(annotationsStore.selectedNode.id)
      } else if (annotationsStore.selectedLine) {
        annotationsStore.deleteLine(annotationsStore.selectedLine.id)
      } else if (imagesStore.hasSelection) {
        // 如果没有选中标注，则删除选中的图片
        imagesStore.deleteSelectedImages()
      }
      return
    }

    // Escape - 取消选择（标注和图片）
    if (key === KEYBOARD_SHORTCUTS.ESCAPE) {
      event.preventDefault()
      annotationsStore.deselectAllAnnotations()
      imagesStore.deselectAllImages()
      return
    }

    // Ctrl+A - 全选
    if (ctrl && key === 'a') {
      event.preventDefault()
      imagesStore.selectAllImages()
      return
    }

    // Ctrl+Z - 撤销 (TODO: 需要实现历史记录功能)
    if (ctrl && !shift && key === 'z') {
      event.preventDefault()
      console.log('Undo (未实现)')
      return
    }

    // Ctrl+Y 或 Ctrl+Shift+Z - 重做 (TODO: 需要实现历史记录功能)
    if ((ctrl && key === 'y') || (ctrl && shift && key === 'z')) {
      event.preventDefault()
      console.log('Redo (未实现)')
      return
    }

    // Ctrl+S - 保存 (TODO: 需要实现保存功能)
    if (ctrl && key === 's') {
      event.preventDefault()
      console.log('Save (未实现)')
      return
    }

    // 箭头键 - 移动选中的图片
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) &&
      imagesStore.hasSelection
    ) {
      event.preventDefault()
      handleArrowKey(key, shift)
      return
    }

    // + 或 = - 放大
    if (key === '+' || key === '=') {
      event.preventDefault()
      canvasStore.zoomIn()
      return
    }

    // - 或 _ - 缩小
    if (key === '-' || key === '_') {
      event.preventDefault()
      canvasStore.zoomOut()
      return
    }

    // 0 - 重置缩放
    if (key === '0' && ctrl) {
      event.preventDefault()
      canvasStore.resetZoom()
      return
    }
  }

  /**
   * 处理箭头键（移动图片）
   */
  function handleArrowKey(key: string, shift: boolean) {
    const selectedImage = imagesStore.selectedImages[0]
    if (!selectedImage || selectedImage.isLocked) return

    // 移动距离
    const step = shift ? 10 : 1

    let dx = 0
    let dy = 0

    switch (key) {
      case 'ArrowUp':
        dy = -step
        break
      case 'ArrowDown':
        dy = step
        break
      case 'ArrowLeft':
        dx = -step
        break
      case 'ArrowRight':
        dx = step
        break
    }

    // 更新图片位置
    imagesStore.updateImagePosition(
      selectedImage.id,
      selectedImage.position.x + dx,
      selectedImage.position.y + dy
    )
  }

  /**
   * 处理键盘释放事件
   */
  function handleKeyUp(event: KeyboardEvent) {
    const key = event.key

    // Space - 恢复之前的工具
    if (key === ' ' && previousTool.value) {
      event.preventDefault()
      canvasStore.setActiveTool(previousTool.value as any)
      previousTool.value = null
    }
  }

  /**
   * 注册键盘事件监听器
   */
  function register() {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  }

  /**
   * 注销键盘事件监听器
   */
  function unregister() {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  }

  // 自动注册和注销
  onMounted(() => {
    register()
  })

  onUnmounted(() => {
    unregister()
  })

  return {
    register,
    unregister,
    handleKeyDown,
  }
}
