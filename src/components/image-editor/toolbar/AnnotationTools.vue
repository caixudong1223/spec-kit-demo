<script setup lang="ts">
import { computed } from 'vue'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { Location, Delete, Minus } from '@element-plus/icons-vue'
import { ElButton, ElButtonGroup, ElDivider, ElTooltip } from 'element-plus'

const canvasStore = useCanvasStore()
const annotationsStore = useAnnotationsStore()

// 工具列表
const tools = [
  {
    id: 'annotation-node',
    label: '序号节点',
    icon: Location,
    tooltip: '点击画布添加序号节点',
  },
  {
    id: 'annotation-line',
    label: '标注线',
    icon: Minus,
    tooltip: '拖拽绘制标注线',
  },
]

// 计算选中的标注
const selectedAnnotation = computed(() => {
  return annotationsStore.selectedNode || annotationsStore.selectedLine
})

// 是否有选中的标注
const hasSelection = computed(() => !!selectedAnnotation.value)

// 处理工具切换
function handleToolChange(toolId: string) {
  canvasStore.setActiveTool(toolId as any)
}

// 处理删除标注
function handleDeleteAnnotation() {
  const node = annotationsStore.selectedNode
  const line = annotationsStore.selectedLine

  if (node) {
    annotationsStore.deleteNode(node.id)
  } else if (line) {
    annotationsStore.deleteLine(line.id)
  }
}

// 计算统计信息
const statsText = computed(() => {
  const nodeCount = annotationsStore.nodeCount
  const lineCount = annotationsStore.lineCount
  return `节点: ${nodeCount} | 线段: ${lineCount}`
})
</script>

<template>
  <div class="annotation-tools">
    <!-- 左侧：标注工具 -->
    <div class="toolbar-section">
      <el-button-group>
        <el-tooltip
          v-for="tool in tools"
          :key="tool.id"
          :content="tool.tooltip"
          placement="bottom"
        >
          <el-button
            :type="canvasStore.activeTool === tool.id ? 'primary' : 'default'"
            :icon="tool.icon"
            :disabled="!canvasStore.isEditMode"
            @click="handleToolChange(tool.id)"
          >
            {{ tool.label }}
          </el-button>
        </el-tooltip>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <!-- 中间：操作按钮 -->
    <div class="toolbar-section">
      <el-tooltip
        content="删除选中的标注"
        placement="bottom"
      >
        <el-button
          :icon="Delete"
          :disabled="!hasSelection || !canvasStore.isEditMode"
          @click="handleDeleteAnnotation"
        >
          删除标注
        </el-button>
      </el-tooltip>
    </div>

    <!-- 右侧：统计信息 -->
    <div class="toolbar-section ml-auto">
      <span class="text-sm text-gray-600">
        {{ statsText }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.annotation-tools {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  gap: 8px;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ml-auto {
  margin-left: auto;
}
</style>
