// useCanvasResize composable - 自适应画布尺寸
import { ref, onMounted, onUnmounted } from 'vue'
import { useCanvasStore } from '@/stores/image-editor/canvas'

export function useCanvasResize(containerRef: any) {
  const canvasStore = useCanvasStore()
  const isReady = ref(false)

  /**
   * 计算画布尺寸以适应容器
   */
  function updateCanvasSize() {
    if (!containerRef.value) return

    const container = containerRef.value as HTMLElement
    const rect = container.getBoundingClientRect()

    // 直接使用容器尺寸
    const newWidth = Math.max(800, Math.floor(rect.width))
    const newHeight = Math.max(600, Math.floor(rect.height))

    canvasStore.setCanvasSize(newWidth, newHeight)

    if (!isReady.value) {
      isReady.value = true
    }
  }

  // 防抖函数
  function debounce(fn: Function, delay: number) {
    let timeoutId: number
    return function (...args: any[]) {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => fn(...args), delay)
    }
  }

  const debouncedResize = debounce(updateCanvasSize, 200)

  // 监听窗口大小变化
  onMounted(() => {
    // 初始计算（延迟确保 DOM 已渲染）
    setTimeout(updateCanvasSize, 100)

    // 监听窗口变化
    window.addEventListener('resize', debouncedResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', debouncedResize)
  })

  return {
    isReady,
    updateCanvasSize,
  }
}
