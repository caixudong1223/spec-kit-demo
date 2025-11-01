// 图片编辑标注组件 - 标注管理 Store
import type { AnnotationLine, AnnotationNode } from '@/types/image-editor'
import { DEFAULT_ANNOTATION_LINE, DEFAULT_ANNOTATION_NODE } from '@/types/image-editor/defaults'
import {
  generateUUID,
  getCurrentISOTime,
  validateAnnotationLine,
  validateAnnotationNode,
} from '@/utils/image-editor/validators'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useCanvasStore } from './canvas'

export const useAnnotationsStore = defineStore('annotations', () => {
  // ========== State ==========
  const nodes = ref<AnnotationNode[]>([])
  const lines = ref<AnnotationLine[]>([])
  const maxNodeNumber = ref(0)

  // Canvas store reference
  const canvasStore = useCanvasStore()

  // ========== Getters ==========
  const nodeCount = computed(() => nodes.value.length)

  const lineCount = computed(() => lines.value.length)

  const totalAnnotationCount = computed(() => nodeCount.value + lineCount.value)

  const hasAnnotations = computed(() => totalAnnotationCount.value > 0)

  const visibleNodes = computed(() => nodes.value.filter((node) => node.isVisible))

  const visibleLines = computed(() => lines.value.filter((line) => line.isVisible))

  const selectedNode = computed(() => nodes.value.find((node) => node.isSelected))

  const selectedLine = computed(() => lines.value.find((line) => line.isSelected))

  const getNodeById = computed(() => {
    return (id: string) => nodes.value.find((node) => node.id === id)
  })

  const getLineById = computed(() => {
    return (id: string) => lines.value.find((line) => line.id === id)
  })

  // ========== Actions ==========

  // 节点操作 (T053)

  /**
   * 添加序号节点
   */
  function addNode(x: number, y: number): AnnotationNode {
    const now = getCurrentISOTime()

    // 自动分配序号
    maxNodeNumber.value += 1

    const newNode: AnnotationNode = {
      id: generateUUID(),
      number: maxNodeNumber.value,
      position: { x, y },
      style: { ...DEFAULT_ANNOTATION_NODE.style },
      isSelected: false,
      isVisible: true,
      createdAt: now,
      modifiedAt: now,
    }

    // 验证节点数据
    const errors = validateAnnotationNode(newNode)
    if (errors.length > 0) {
      console.error('节点验证失败:', errors)
      throw new Error(`节点验证失败: ${errors.join(', ')}`)
    }

    nodes.value.push(newNode)
    canvasStore.markAsModified()

    return newNode
  }

  /**
   * 删除节点
   */
  function deleteNode(id: string): void {
    const index = nodes.value.findIndex((node) => node.id === id)
    if (index === -1) return

    const node = nodes.value[index]

    // 删除节点
    nodes.value.splice(index, 1)

    // 如果删除的是选中的节点，清除选择
    if (node.isSelected) {
      canvasStore.clearSelection()
    }

    // 重新编号
    _renumberNodes()

    canvasStore.markAsModified()
  }

  /**
   * 删除多个节点
   */
  function deleteNodes(ids: string[]): void {
    ids.forEach((id) => deleteNode(id))
  }

  /**
   * 更新节点
   */
  function updateNode(id: string, updates: Partial<AnnotationNode>): void {
    const node = getNodeById.value(id)
    if (!node) return

    Object.assign(node, {
      ...updates,
      modifiedAt: getCurrentISOTime(),
    })

    canvasStore.markAsModified()
  }

  /**
   * 更新节点位置
   */
  function updateNodePosition(id: string, x: number, y: number): void {
    const node = getNodeById.value(id)
    if (!node) return

    node.position.x = x
    node.position.y = y
    node.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  /**
   * 更新节点样式
   */
  function updateNodeStyle(id: string, style: Partial<AnnotationNode['style']>): void {
    const node = getNodeById.value(id)
    if (!node) return

    Object.assign(node.style, style)
    node.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  /**
   * 私有函数：重新编号所有节点 (T054)
   * 按照 createdAt 排序，重新分配连续的序号
   */
  function _renumberNodes(): void {
    // 按创建时间排序
    const sortedNodes = [...nodes.value].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    // 重新分配序号
    sortedNodes.forEach((node, index) => {
      node.number = index + 1
    })

    // 更新最大序号
    maxNodeNumber.value = sortedNodes.length
  }

  // 节点选择操作 (T055)

  /**
   * 选择节点
   */
  function selectNode(id: string): void {
    // 取消所有节点和线的选择
    deselectAllAnnotations()

    const node = getNodeById.value(id)
    if (!node) return

    node.isSelected = true
    canvasStore.selectObject('annotation-node', id)
  }

  /**
   * 取消选择节点
   */
  function deselectNode(id: string): void {
    const node = getNodeById.value(id)
    if (!node) return

    node.isSelected = false
    canvasStore.clearSelection()
  }

  /**
   * 取消所有标注的选择
   */
  function deselectAllAnnotations(): void {
    nodes.value.forEach((node) => {
      node.isSelected = false
    })
    lines.value.forEach((line) => {
      line.isSelected = false
    })
    canvasStore.clearSelection()
  }

  // 线段操作（为 US3 预留）

  /**
   * 添加标注线（US3）
   */
  function addLine(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    text: string = ''
  ): AnnotationLine {
    const now = getCurrentISOTime()

    // 计算文本位置（线段中点）
    const textPosition = {
      x: (startX + endX) / 2,
      y: (startY + endY) / 2,
    }

    const newLine: AnnotationLine = {
      id: generateUUID(),
      points: {
        start: { x: startX, y: startY },
        end: { x: endX, y: endY },
      },
      text,
      textPosition,
      style: { ...DEFAULT_ANNOTATION_LINE.style },
      isSelected: false,
      isVisible: true,
      isEditing: false,
      createdAt: now,
      modifiedAt: now,
    }

    // 验证线段数据
    const errors = validateAnnotationLine(newLine)
    if (errors.length > 0) {
      console.error('线段验证失败:', errors)
      throw new Error(`线段验证失败: ${errors.join(', ')}`)
    }

    lines.value.push(newLine)
    canvasStore.markAsModified()

    return newLine
  }

  /**
   * 删除标注线（US3）
   */
  function deleteLine(id: string): void {
    const index = lines.value.findIndex((line) => line.id === id)
    if (index === -1) return

    const line = lines.value[index]

    // 删除线段
    lines.value.splice(index, 1)

    // 如果删除的是选中的线段，清除选择
    if (line.isSelected) {
      canvasStore.clearSelection()
    }

    canvasStore.markAsModified()
  }

  /**
   * 选择线段（US3）
   */
  function selectLine(id: string): void {
    // 取消所有选择
    deselectAllAnnotations()

    const line = getLineById.value(id)
    if (!line) return

    line.isSelected = true
    canvasStore.selectObject('annotation-line', id)
  }

  /**
   * 更新线段（T068）
   */
  function updateLine(id: string, updates: Partial<AnnotationLine>): void {
    const line = getLineById.value(id)
    if (!line) return

    Object.assign(line, {
      ...updates,
      modifiedAt: getCurrentISOTime(),
    })

    canvasStore.markAsModified()
  }

  /**
   * 更新线段端点（T068）
   */
  function updateLinePoints(
    id: string,
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): void {
    const line = getLineById.value(id)
    if (!line) return

    line.points.start.x = startX
    line.points.start.y = startY
    line.points.end.x = endX
    line.points.end.y = endY

    // 重新计算文本位置（中点）
    line.textPosition.x = (startX + endX) / 2
    line.textPosition.y = (startY + endY) / 2

    line.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  /**
   * 更新线段文本（T068）
   */
  function updateLineText(id: string, text: string): void {
    const line = getLineById.value(id)
    if (!line) return

    line.text = text
    line.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  /**
   * 更新线段样式（T071）
   */
  function updateLineStyle(id: string, style: Partial<AnnotationLine['style']>): void {
    const line = getLineById.value(id)
    if (!line) return

    Object.assign(line.style, style)
    line.modifiedAt = getCurrentISOTime()

    canvasStore.markAsModified()
  }

  /**
   * 开始编辑线段文本（T069）
   */
  function startEditingLine(id: string): void {
    const line = getLineById.value(id)
    if (!line) return

    // 取消其他线段的编辑状态
    lines.value.forEach((l) => {
      l.isEditing = false
    })

    line.isEditing = true
  }

  /**
   * 停止编辑线段文本（T069）
   */
  function stopEditingLine(id: string): void {
    const line = getLineById.value(id)
    if (!line) return

    line.isEditing = false
  }

  // 清除所有标注
  function clearAllAnnotations(): void {
    nodes.value = []
    lines.value = []
    maxNodeNumber.value = 0
    canvasStore.clearSelection()
    canvasStore.markAsModified()
  }

  return {
    // State
    nodes,
    lines,
    maxNodeNumber,

    // Getters
    nodeCount,
    lineCount,
    totalAnnotationCount,
    hasAnnotations,
    visibleNodes,
    visibleLines,
    selectedNode,
    selectedLine,
    getNodeById,
    getLineById,

    // Actions - Nodes
    addNode,
    deleteNode,
    deleteNodes,
    updateNode,
    updateNodePosition,
    updateNodeStyle,
    selectNode,
    deselectNode,
    deselectAllAnnotations,

    // Actions - Lines (US3)
    addLine,
    deleteLine,
    selectLine,
    updateLine,
    updateLinePoints,
    updateLineText,
    updateLineStyle,
    startEditingLine,
    stopEditingLine,

    // Clear all
    clearAllAnnotations,
  }
})
