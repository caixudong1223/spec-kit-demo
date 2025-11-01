<script setup lang="ts">
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import type { AnnotationNode } from '@/types/image-editor'
import { computed } from 'vue'

const annotationsStore = useAnnotationsStore()
const canvasStore = useCanvasStore()

// 计算可见节点
const visibleNodes = computed(() => annotationsStore.visibleNodes)

// 处理节点拖拽结束
function handleNodeDragEnd(node: AnnotationNode, event: any) {
  const konvaNode = event.target
  const groupNode = konvaNode.getParent()

  // 获取 Group 的坐标
  const x = groupNode.x()
  const y = groupNode.y()

  annotationsStore.updateNodePosition(node.id, x, y)
}

// 处理节点点击（选择）
function handleNodeClick(node: AnnotationNode) {
  if (!canvasStore.isEditMode) return

  annotationsStore.selectNode(node.id)
}

// 计算节点 Group 配置
function getNodeGroupConfig(node: AnnotationNode) {
  return {
    x: node.position.x,
    y: node.position.y,
    draggable: canvasStore.isEditMode && canvasStore.activeTool === 'select',
  }
}

// 计算节点圆形配置
function getNodeCircleConfig(node: AnnotationNode) {
  return {
    radius: node.style.radius,
    fill: node.style.fill, // 蓝色背景
    stroke: node.isSelected ? '#67C23A' : node.style.stroke, // 选中时绿色边框，否则白色边框
    strokeWidth: node.isSelected ? 3 : node.style.strokeWidth,
  }
}

// 计算节点文本配置
function getNodeTextConfig(node: AnnotationNode) {
  return {
    text: String(node.number),
    fontSize: node.style.fontSize,
    fill: node.style.textColor, // 白色文字
    align: 'center' as const,
    verticalAlign: 'middle' as const,
    offsetX: node.style.radius,
    offsetY: node.style.radius,
    width: node.style.radius * 2,
    height: node.style.radius * 2,
  }
}

// 暴露给父组件使用
defineExpose({
  visibleNodes,
  getNodeGroupConfig,
  getNodeCircleConfig,
  getNodeTextConfig,
  handleNodeDragEnd,
  handleNodeClick,
})
</script>

<template>
  <!-- 此组件不渲染任何内容，只提供逻辑 -->
  <!-- 实际渲染由 ImageLayer 完成 -->
</template>
