// 图片编辑标注组件 - 画布状态管理 Store
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CanvasState } from '@/types/image-editor'
import { DEFAULT_CANVAS, ZOOM_LIMITS } from '@/types/image-editor/defaults'

export const useCanvasStore = defineStore('canvas', () => {
  // ========== State ==========
  const config = ref({
    width: DEFAULT_CANVAS.config.width,
    height: DEFAULT_CANVAS.config.height,
    backgroundColor: DEFAULT_CANVAS.config.backgroundColor,
  })

  const view = ref({
    scale: DEFAULT_CANVAS.view.scale,
    position: { x: DEFAULT_CANVAS.view.position.x, y: DEFAULT_CANVAS.view.position.y },
  })

  const mode = ref<CanvasState['mode']>(DEFAULT_CANVAS.mode)
  const activeTool = ref<CanvasState['activeTool']>(DEFAULT_CANVAS.activeTool)

  const selection = ref<CanvasState['selection']>({
    type: DEFAULT_CANVAS.selection.type,
    id: DEFAULT_CANVAS.selection.id,
  })

  const isModified = ref(DEFAULT_CANVAS.isModified)
  const lastSavedAt = ref<string | null>(DEFAULT_CANVAS.lastSavedAt)

  // ========== Getters ==========
  const isEditMode = computed(() => mode.value === 'edit')

  const hasSelection = computed(() => selection.value.type !== null && selection.value.id !== null)

  const needsSave = computed(() => isModified.value)

  const canvasState = computed<CanvasState>(() => ({
    config: config.value,
    view: view.value,
    mode: mode.value,
    activeTool: activeTool.value,
    selection: selection.value,
    isModified: isModified.value,
    lastSavedAt: lastSavedAt.value,
  }))

  // ========== Actions ==========

  // 画布尺寸配置
  function setCanvasSize(width: number, height: number) {
    config.value.width = width
    config.value.height = height
    markAsModified()
  }

  function setBackgroundColor(color: string) {
    config.value.backgroundColor = color
    markAsModified()
  }

  // 缩放操作
  function zoomIn() {
    const newScale = Math.min(view.value.scale + ZOOM_LIMITS.STEP, ZOOM_LIMITS.MAX)
    view.value.scale = Number(newScale.toFixed(1))
  }

  function zoomOut() {
    const newScale = Math.max(view.value.scale - ZOOM_LIMITS.STEP, ZOOM_LIMITS.MIN)
    view.value.scale = Number(newScale.toFixed(1))
  }

  function zoomTo(scale: number) {
    const clampedScale = Math.max(ZOOM_LIMITS.MIN, Math.min(scale, ZOOM_LIMITS.MAX))
    view.value.scale = Number(clampedScale.toFixed(1))
  }

  function resetZoom() {
    view.value.scale = ZOOM_LIMITS.DEFAULT
  }

  // 平移操作
  function panTo(x: number, y: number) {
    view.value.position.x = x
    view.value.position.y = y
  }

  function resetPan() {
    view.value.position.x = 0
    view.value.position.y = 0
  }

  // 模式切换
  function setMode(newMode: CanvasState['mode']) {
    mode.value = newMode
    if (newMode === 'view') {
      // 切换到查看模式时，自动清除选择并设置为平移工具
      clearSelection()
      setActiveTool('pan')
    }
  }

  function toggleMode() {
    setMode(mode.value === 'edit' ? 'view' : 'edit')
  }

  // 工具切换
  function setActiveTool(tool: CanvasState['activeTool']) {
    activeTool.value = tool
  }

  // 选择操作
  function selectObject(
    type: 'image' | 'annotation-node' | 'annotation-line',
    id: string
  ) {
    selection.value = { type, id }
  }

  function clearSelection() {
    selection.value = { type: null, id: null }
  }

  // 修改状态标记
  function markAsModified() {
    isModified.value = true
  }

  function markAsSaved() {
    isModified.value = false
    lastSavedAt.value = new Date().toISOString()
  }

  // 重置画布
  function resetCanvas() {
    config.value = {
      width: DEFAULT_CANVAS.config.width,
      height: DEFAULT_CANVAS.config.height,
      backgroundColor: DEFAULT_CANVAS.config.backgroundColor,
    }
    view.value = {
      scale: DEFAULT_CANVAS.view.scale,
      position: { x: DEFAULT_CANVAS.view.position.x, y: DEFAULT_CANVAS.view.position.y },
    }
    mode.value = DEFAULT_CANVAS.mode
    activeTool.value = DEFAULT_CANVAS.activeTool
    selection.value = { type: null, id: null }
    isModified.value = false
    lastSavedAt.value = null
  }

  return {
    // State
    config,
    view,
    mode,
    activeTool,
    selection,
    isModified,
    lastSavedAt,

    // Getters
    isEditMode,
    hasSelection,
    needsSave,
    canvasState,

    // Actions
    setCanvasSize,
    setBackgroundColor,
    zoomIn,
    zoomOut,
    zoomTo,
    resetZoom,
    panTo,
    resetPan,
    setMode,
    toggleMode,
    setActiveTool,
    selectObject,
    clearSelection,
    markAsModified,
    markAsSaved,
    resetCanvas,
  }
})
