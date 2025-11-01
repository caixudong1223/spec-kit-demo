<script setup lang="ts">
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import ImageLayer from './ImageLayer.vue'
import TransformerControls from './TransformerControls.vue'
import LineTextEditor from './LineTextEditor.vue'

const canvasStore = useCanvasStore()
const imagesStore = useImagesStore()
const annotationsStore = useAnnotationsStore()

const containerRef = ref<HTMLDivElement | null>(null)
const stageRef = ref<any>(null)
const layerRef = ref<any>(null)
const transformerRef = ref<InstanceType<typeof TransformerControls> | null>(null)

// 计算画布配置
const stageConfig = computed(() => ({
  width: canvasStore.config.width,
  height: canvasStore.config.height,
}))

// 画布样式
const canvasStyle = computed(() => ({
  backgroundColor: canvasStore.config.backgroundColor,
  width: `${stageConfig.value.width}px`,
  height: `${stageConfig.value.height}px`,
}))

// 容器样式（包含光标）
const containerStyle = computed(() => {
  let cursor = 'default'

  if (canvasStore.activeTool === 'pan') {
    cursor = 'grab'
  } else if (canvasStore.activeTool === 'annotation-node') {
    cursor = 'crosshair'
  } else if (canvasStore.activeTool === 'annotation-line') {
    cursor = 'crosshair'
  }

  return { cursor }
})

// 处理舞台准备就绪
function handleStageReady(stage: any) {
  stageRef.value = stage
  const layers = stage.getLayers()
  if (layers.length > 0) {
    layerRef.value = layers[0]
  }
}

// 处理 Transformer 需要更新
function handleTransformerNeedsUpdate() {
  if (transformerRef.value) {
    transformerRef.value.updateTransformer()
  }
}

// 处理鼠标滚轮缩放
function handleWheel(event: WheelEvent) {
  event.preventDefault()

  const scaleBy = 1.1
  const oldScale = canvasStore.view.scale

  // 缩放方向
  const newScale = event.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy

  canvasStore.zoomTo(newScale)
}

// 是否显示占位符
const showPlaceholder = computed(() => !imagesStore.hasImages)

// 挂载和卸载
onMounted(() => {
  if (containerRef.value) {
    containerRef.value.addEventListener('wheel', handleWheel, { passive: false })
  }
})

onUnmounted(() => {
  if (containerRef.value) {
    containerRef.value.removeEventListener('wheel', handleWheel)
  }
})
</script>

<template>
  <div ref="containerRef" class="editor-canvas-container" :style="containerStyle">
    <div class="canvas-content">
      <div class="editor-canvas" :style="canvasStyle">
        <!-- 占位符 -->
        <div v-if="showPlaceholder" class="canvas-placeholder">
          <p class="text-gray-400 text-lg">画布区域</p>
          <p class="text-gray-300 text-sm">{{ stageConfig.width }} x {{ stageConfig.height }}</p>
          <p class="text-gray-300 text-sm">
            缩放: {{ (canvasStore.view.scale * 100).toFixed(0) }}%
          </p>
          <p class="text-gray-400 text-sm mt-4">点击工具栏的"加载图片"按钮开始</p>
          <p class="text-gray-400 text-xs mt-2">滚动鼠标滚轮缩放</p>
        </div>

        <!-- Konva 图片层 -->
        <ImageLayer
          @stage-ready="handleStageReady"
          @transformer-needs-update="handleTransformerNeedsUpdate"
        />

        <!-- Transformer 控制 -->
        <TransformerControls
          v-if="stageRef"
          ref="transformerRef"
          :stage="stageRef"
          :layer="layerRef"
        />

        <!-- 线段文本编辑器 -->
        <LineTextEditor
          v-for="line in annotationsStore.lines"
          v-show="line.isEditing"
          :key="`editor-${line.id}`"
          :line-id="line.id"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-canvas-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #e5e5e5;
  background-image:
    linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
    linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
  background-size: 20px 20px;
  background-position:
    0 0,
    0 10px,
    10px -10px,
    -10px 0px;
}

.canvas-content {
  min-width: min-content;
  min-height: min-content;
  display: inline-block;
}

.editor-canvas {
  position: relative;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  display: inline-block;
}

.canvas-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #d1d5db;
  pointer-events: none;
}
</style>
