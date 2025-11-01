<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'

interface Props {
  lineId: string
}

const props = defineProps<Props>()

const annotationsStore = useAnnotationsStore()
const canvasStore = useCanvasStore()

const inputRef = ref<HTMLInputElement | null>(null)
const textValue = ref('')

// 计算线段信息
const line = computed(() => annotationsStore.getLineById(props.lineId))

// 计算文本位置（线段中点上方，与线保持距离）
function calculateTextPosition(line: any) {
  const midX = (line.points.start.x + line.points.end.x) / 2
  const midY = (line.points.start.y + line.points.end.y) / 2

  // 计算线段的垂直方向（向上偏移）
  const dx = line.points.end.x - line.points.start.x
  const dy = line.points.end.y - line.points.start.y
  const length = Math.sqrt(dx * dx + dy * dy)

  if (length === 0) return { x: midX, y: midY }

  // 垂直向量（逆时针旋转90度）
  const perpX = -dy / length
  const perpY = dx / length

  // 偏移距离（15像素）
  const offset = 15

  return {
    x: midX + perpX * offset,
    y: midY + perpY * offset
  }
}

// 计算输入框位置（相对于画布）
const inputStyle = computed(() => {
  if (!line.value) return { display: 'none' }

  const scale = canvasStore.view.scale
  const layerX = canvasStore.view.position.x
  const layerY = canvasStore.view.position.y

  // 计算偏移后的文本位置
  const textPos = calculateTextPosition(line.value)

  // 转换为屏幕坐标
  const screenX = textPos.x * scale + layerX
  const screenY = textPos.y * scale + layerY

  return {
    position: 'absolute',
    left: `${screenX}px`,
    top: `${screenY}px`,
    transform: 'translate(-50%, -50%)',
    zIndex: 1000,
  }
})

// 初始化文本值
watch(
  () => line.value?.text,
  (newText) => {
    if (newText !== undefined) {
      textValue.value = newText
    }
  },
  { immediate: true }
)

// 自动聚焦
onMounted(async () => {
  await nextTick()
  if (inputRef.value) {
    inputRef.value.focus()
    inputRef.value.select()
  }
})

// 处理输入框失焦
function handleBlur() {
  if (!line.value) return

  // 更新线段文本
  annotationsStore.updateLineText(line.value.id, textValue.value)

  // 停止编辑
  annotationsStore.stopEditingLine(line.value.id)
}

// 处理回车键
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    handleBlur()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    // 取消编辑，恢复原文本
    if (line.value) {
      textValue.value = line.value.text
      annotationsStore.stopEditingLine(line.value.id)
    }
  }
}
</script>

<template>
  <div v-if="line" class="line-text-editor" :style="inputStyle">
    <input
      ref="inputRef"
      v-model="textValue"
      type="text"
      class="text-input"
      placeholder="输入尺寸信息"
      @blur="handleBlur"
      @keydown="handleKeydown"
    >
  </div>
</template>

<style scoped>
.line-text-editor {
  position: absolute;
  pointer-events: auto;
}

.text-input {
  min-width: 120px;
  padding: 6px 12px;
  border: 2px solid #409EFF;
  border-radius: 4px;
  font-size: 14px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  outline: none;
  transition: all 0.2s;
}

.text-input:focus {
  border-color: #66b1ff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
}

.text-input::placeholder {
  color: #c0c4cc;
}
</style>
