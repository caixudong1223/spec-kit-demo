<script setup lang="ts">
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import type { EditorImage } from '@/types/image-editor'
import { computed, ref, onMounted, nextTick, watch } from 'vue'
import AnnotationLayer from './AnnotationLayer.vue'

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()
const annotationsStore = useAnnotationsStore()

// 标注层组件引用
const annotationLayerRef = ref<InstanceType<typeof AnnotationLayer> | null>(null)

// Konva Stage 引用（直接使用 ref）
const konvaStageRef = ref<any>(null)
const stageRef = ref<any>(null)

// Transformer 引用
const transformerRef = ref<any>(null)

// 计算可见图片（按 zIndex 排序）
const sortedImages = computed(() => imagesStore.sortedByZIndex)

// Stage 配置（固定大小，不应用任何变换）
const stageConfig = computed(() => ({
  width: canvasStore.config.width,
  height: canvasStore.config.height,
}))

// Layer 配置（应用所有变换：缩放 + 平移，但不使用 draggable）
const layerConfig = computed(() => ({
  scaleX: canvasStore.view.scale,
  scaleY: canvasStore.view.scale,
  x: canvasStore.view.position.x,
  y: canvasStore.view.position.y,
}))

// 画布平移状态
const isPanning = ref(false)
const panStartPos = ref({ x: 0, y: 0 })
const layerStartPos = ref({ x: 0, y: 0 })

// 线段绘制状态
const isDrawingLine = ref(false)
const drawingLine = ref<{
  startX: number
  startY: number
  endX: number
  endY: number
} | null>(null)

// 处理图片拖拽结束
function handleDragEnd(image: EditorImage, event: any) {
  if (image.isLocked || !canvasStore.isEditMode) return

  const node = event.target

  // 直接使用节点的局部坐标（相对于 Layer）
  // 因为 Layer 的变换是通过 Vue 响应式控制的，不会产生冲突
  const x = node.x()
  const y = node.y()

  imagesStore.updateImagePosition(image.id, x, y)

  // 通知父组件更新 Transformer
  emit('transformerNeedsUpdate')
}

// 处理图片点击选择
function handleImageClick(image: EditorImage) {
  if (!canvasStore.isEditMode) return

  imagesStore.selectImage(image.id)

  // 更新 Transformer
  nextTick(() => {
    updateTransformer()
  })
}

// ========== Transformer 相关逻辑 ==========

// 当前选中的图片
const selectedImage = computed(() => {
  return imagesStore.selectedImages[0]
})

// Transformer 配置
const transformerConfig = computed(() => ({
  rotateEnabled: true,
  enabledAnchors: [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
    'top-center',
    'bottom-center',
    'middle-left',
    'middle-right',
  ],
  borderStroke: '#409EFF',
  borderStrokeWidth: 2,
  anchorFill: '#FFFFFF',
  anchorStroke: '#409EFF',
  anchorSize: 8,
  anchorCornerRadius: 4,
  keepRatio: false,
  centeredScaling: false,
}))

// 更新 Transformer 的目标节点
function updateTransformer() {
  if (!transformerRef.value || !stageRef.value) return

  const transformer = transformerRef.value.getNode()

  if (!selectedImage.value) {
    transformer.nodes([])
    return
  }

  // 查找选中图片的 Konva 节点
  const layer = transformer.getLayer()
  if (!layer) return

  const imageNode = layer.findOne(`#${selectedImage.value.id}`)

  if (imageNode) {
    transformer.nodes([imageNode])
  } else {
    transformer.nodes([])
  }
}

// 监听选中状态变化
watch(
  () => selectedImage.value?.id,
  () => {
    nextTick(() => {
      updateTransformer()
    })
  }
)

// 监听编辑模式变化
watch(
  () => canvasStore.isEditMode,
  (isEdit) => {
    if (!isEdit && transformerRef.value) {
      const transformer = transformerRef.value.getNode()
      transformer.nodes([])
    } else {
      updateTransformer()
    }
  }
)

// 处理 Transformer 变换结束
function handleTransformEnd(event: any) {
  const node = event.target
  if (!selectedImage.value) return

  // 更新图片的变换属性
  imagesStore.updateImagePosition(selectedImage.value.id, node.x(), node.y())
  imagesStore.updateImageRotation(selectedImage.value.id, node.rotation())
  imagesStore.updateImageScale(selectedImage.value.id, node.scaleX(), node.scaleY())
}

// 处理舞台点击（取消选择或创建标注节点）
function handleStageClick(event: any) {
  if (!canvasStore.isEditMode) return

  const targetClassName = event.target.getClassName()

  // 在 annotation-node 模式下创建节点
  if (canvasStore.activeTool === 'annotation-node') {
    // 如果点击的是已有的节点（Circle 或 Text），不创建新节点
    if (targetClassName === 'Circle' || targetClassName === 'Text') {
      return
    }

    const stage = event.target.getStage()
    const layer = stage.findOne('Layer')
    if (!layer) return

    // 获取鼠标相对于 Stage 的位置
    const pointerPos = stage.getPointerPosition()

    // 转换为 Layer 的局部坐标
    const layerX = layer.x()
    const layerY = layer.y()
    const layerScaleX = layer.scaleX()
    const layerScaleY = layer.scaleY()

    const localX = (pointerPos.x - layerX) / layerScaleX
    const localY = (pointerPos.y - layerY) / layerScaleY

    // 创建节点
    annotationsStore.addNode(localX, localY)
    return
  }

  // 其他模式下，如果点击的是舞台背景，取消选择
  if (event.target === event.target.getStage()) {
    imagesStore.deselectAllImages()
    annotationsStore.deselectAllAnnotations()
  }
}

// 处理舞台鼠标按下（开始平移或绘制线段）
function handleStageMouseDown(event: any) {
  const stage = event.target.getStage()
  const pointerPos = stage.getPointerPosition()

  // 在 annotation-line 模式下开始绘制线段
  if (canvasStore.activeTool === 'annotation-line' && canvasStore.isEditMode) {
    const targetClassName = event.target.getClassName()

    // 如果点击的是已有的线段或节点，不开始绘制
    if (
      targetClassName === 'Line' ||
      targetClassName === 'Arrow' ||
      targetClassName === 'Circle' ||
      targetClassName === 'Text'
    ) {
      return
    }

    const layer = stage.findOne('Layer')
    if (!layer) return

    // 转换为 Layer 的局部坐标
    const layerX = layer.x()
    const layerY = layer.y()
    const layerScaleX = layer.scaleX()
    const layerScaleY = layer.scaleY()

    const localX = (pointerPos.x - layerX) / layerScaleX
    const localY = (pointerPos.y - layerY) / layerScaleY

    // 开始绘制线段
    isDrawingLine.value = true
    drawingLine.value = {
      startX: localX,
      startY: localY,
      endX: localX,
      endY: localY,
    }
    return
  }

  // 只在平移模式下响应
  if (canvasStore.activeTool !== 'pan') return

  // 如果点击的是图片，不处理（让图片自己处理）
  if (event.target !== event.target.getStage() && event.target.getClassName() !== 'Stage') {
    return
  }

  isPanning.value = true
  panStartPos.value = { x: pointerPos.x, y: pointerPos.y }
  layerStartPos.value = {
    x: canvasStore.view.position.x,
    y: canvasStore.view.position.y,
  }

  // 修改鼠标样式
  stage.container().style.cursor = 'grabbing'
}

// 处理舞台鼠标移动（平移中或绘制线段中）
function handleStageMouseMove(event: any) {
  const stage = event.target.getStage()
  const pointerPos = stage.getPointerPosition()

  // 在绘制线段过程中更新终点
  if (isDrawingLine.value && drawingLine.value) {
    const layer = stage.findOne('Layer')
    if (!layer) return

    // 转换为 Layer 的局部坐标
    const layerX = layer.x()
    const layerY = layer.y()
    const layerScaleX = layer.scaleX()
    const layerScaleY = layer.scaleY()

    const localX = (pointerPos.x - layerX) / layerScaleX
    const localY = (pointerPos.y - layerY) / layerScaleY

    // 更新线段终点
    drawingLine.value.endX = localX
    drawingLine.value.endY = localY
    return
  }

  // 平移画布
  if (!isPanning.value || canvasStore.activeTool !== 'pan') return

  // 计算偏移量
  const dx = pointerPos.x - panStartPos.value.x
  const dy = pointerPos.y - panStartPos.value.y

  // 更新 Layer 位置
  const newX = layerStartPos.value.x + dx
  const newY = layerStartPos.value.y + dy

  canvasStore.panTo(newX, newY)
}

// 处理舞台鼠标释放（平移结束或线段绘制完成）
function handleStageMouseUp(event: any) {
  // 完成线段绘制
  if (isDrawingLine.value && drawingLine.value) {
    const { startX, startY, endX, endY } = drawingLine.value

    // 计算线段长度，如果太短则不创建
    const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
    if (length > 5) {
      // 创建线段
      const line = annotationsStore.addLine(startX, startY, endX, endY, '')

      // 自动选中新创建的线段
      annotationsStore.selectLine(line.id)

      // 开始编辑文本
      annotationsStore.startEditingLine(line.id)
    }

    // 重置绘制状态
    isDrawingLine.value = false
    drawingLine.value = null
    return
  }

  // 平移结束
  if (!isPanning.value) return

  isPanning.value = false

  const stage = event.target.getStage()
  // 恢复鼠标样式
  stage.container().style.cursor = canvasStore.activeTool === 'pan' ? 'grab' : 'default'
}

// 计算图片配置
function getImageConfig(image: EditorImage) {
  return {
    x: image.position.x,
    y: image.position.y,
    rotation: image.rotation,
    scaleX: image.scale.x,
    scaleY: image.scale.y,
    draggable: !image.isLocked && canvasStore.isEditMode && canvasStore.activeTool === 'select',
    // 在平移模式下，图片不响应事件，避免坐标混乱
    listening: canvasStore.isEditMode && canvasStore.activeTool !== 'pan',
    opacity: image.isVisible ? 1 : 0.3,
  }
}

// 处理节点拖拽结束
function handleNodeDragEnd(node: any, event: any) {
  const konvaNode = event.target
  const groupNode = konvaNode.getClassName() === 'Group' ? konvaNode : konvaNode.getParent()

  // 获取 Group 的坐标
  const x = groupNode.x()
  const y = groupNode.y()

  annotationsStore.updateNodePosition(node.id, x, y)
}

// 处理节点点击（选择）
function handleNodeClick(node: any) {
  if (!canvasStore.isEditMode) return

  annotationsStore.selectNode(node.id)
}

// 处理线段点击（选择）
function handleLineClick(line: any) {
  if (!canvasStore.isEditMode) return

  annotationsStore.selectLine(line.id)
}

// 处理文本点击（开始编辑）
function handleTextClick(line: any, event: any) {
  if (!canvasStore.isEditMode) return

  event.cancelBubble = true // 阻止事件冒泡到 group

  annotationsStore.selectLine(line.id)
  annotationsStore.startEditingLine(line.id)
}

// 计算线段长度（用于显示）
function calculateLineLength(line: any): string {
  const dx = line.points.end.x - line.points.start.x
  const dy = line.points.end.y - line.points.start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  return `${Math.round(length)}px`
}

// 计算线段角度（度数）
function calculateLineAngle(line: any): number {
  const dx = line.points.end.x - line.points.start.x
  const dy = line.points.end.y - line.points.start.y
  let angle = Math.atan2(dy, dx) * 180 / Math.PI

  // 保持文字始终正向显示（不倒置）
  if (angle > 90) {
    angle = angle - 180
  } else if (angle < -90) {
    angle = angle + 180
  }

  return angle
}

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

// Emit for parent component
const emit = defineEmits<{
  stageReady: [stage: any]
  transformerNeedsUpdate: []
}>()

// 舞台准备就绪（从 ref 获取）
onMounted(async () => {
  await nextTick()
  // 延迟一下，确保 Konva Stage 完全初始化
  setTimeout(() => {
    // 从 ref 获取 Konva Stage 实例
    if (konvaStageRef.value && konvaStageRef.value.getStage) {
      const stage = konvaStageRef.value.getStage()
      console.log('🖼️ ImageLayer: Stage obtained from ref', stage)
      stageRef.value = stage
      console.log('🖼️ ImageLayer: Emitting stageReady to EditorCanvas')
      emit('stageReady', stage)

      // 初始化 Transformer
      nextTick(() => {
        updateTransformer()
      })
    } else {
      console.error('❌ ImageLayer: Failed to get stage from ref', konvaStageRef.value)
    }
  }, 100)
})

// 舞台准备就绪（备用方法，从 @ready 事件）
function handleStageReady(stage: any) {
  console.log('🖼️ ImageLayer: Stage ready from v-stage @ready event', stage)
  if (stageRef.value) {
    console.log('🖼️ ImageLayer: Stage already set, skipping')
    return
  }
  stageRef.value = stage
  console.log('🖼️ ImageLayer: Emitting stageReady to EditorCanvas')
  emit('stageReady', stage)
}
</script>

<template>
  <div class="image-layer">
    <!-- vue-konva Stage 固定大小 -->
    <v-stage
      ref="konvaStageRef"
      :config="stageConfig"
      @mousedown="handleStageMouseDown"
      @mousemove="handleStageMouseMove"
      @mouseup="handleStageMouseUp"
      @mouseleave="handleStageMouseUp"
      @click="handleStageClick"
      @touchstart="handleStageClick"
      @ready="handleStageReady"
    >
      <!-- Layer 应用所有变换 -->
      <v-layer :config="layerConfig">
        <!-- 渲染所有图片 -->
        <v-image
          v-for="image in sortedImages"
          :key="image.id"
          :config="{
            ...getImageConfig(image),
            image: image.imageElement,
            id: image.id,
          }"
          @dragend="(e: any) => handleDragEnd(image, e)"
          @click="() => handleImageClick(image)"
          @tap="() => handleImageClick(image)"
        />

        <!-- 渲染所有标注节点 -->
        <v-group
          v-for="node in annotationsStore.visibleNodes"
          :key="node.id"
          :config="{
            x: node.position.x,
            y: node.position.y,
            draggable: canvasStore.isEditMode && canvasStore.activeTool === 'select',
          }"
          @dragend="(e: any) => handleNodeDragEnd(node, e)"
          @click="() => handleNodeClick(node)"
          @tap="() => handleNodeClick(node)"
        >
          <!-- 节点圆形背景 -->
          <v-circle
            :config="{
              radius: node.style.radius,
              fill: node.style.fill,
              stroke: node.isSelected ? '#67C23A' : node.style.stroke,
              strokeWidth: node.isSelected ? 3 : node.style.strokeWidth,
            }"
          />

          <!-- 节点序号文本 -->
          <v-text
            :config="{
              text: String(node.number),
              fontSize: node.style.fontSize,
              fill: node.style.textColor,
              align: 'center',
              verticalAlign: 'middle',
              offsetX: node.style.radius,
              offsetY: node.style.radius,
              width: node.style.radius * 2,
              height: node.style.radius * 2,
            }"
          />
        </v-group>

        <!-- 渲染正在绘制的线段 -->
        <v-line
          v-if="isDrawingLine && drawingLine"
          :config="{
            points: [
              drawingLine.startX,
              drawingLine.startY,
              drawingLine.endX,
              drawingLine.endY,
            ],
            stroke: '#409EFF',
            strokeWidth: 2,
            dash: [5, 5],
            lineCap: 'round',
            lineJoin: 'round',
          }"
        />

        <!-- 渲染所有标注线 -->
        <v-group
          v-for="line in annotationsStore.visibleLines"
          :key="line.id"
          @click="() => handleLineClick(line)"
          @tap="() => handleLineClick(line)"
        >
          <!-- 线段本体（双向箭头） -->
          <v-arrow
            v-if="line.style.showArrows"
            :config="{
              points: [
                line.points.start.x,
                line.points.start.y,
                line.points.end.x,
                line.points.end.y,
              ],
              stroke: line.isSelected ? '#67C23A' : line.style.stroke,
              strokeWidth: line.isSelected ? 3 : line.style.strokeWidth,
              fill: line.isSelected ? '#67C23A' : line.style.stroke,
              lineCap: line.style.lineCap,
              dash: line.style.dash,
              pointerLength: 12,
              pointerWidth: 12,
              pointerAtBeginning: true,
              pointerAtEnding: true,
            }"
          />
          <v-line
            v-else
            :config="{
              points: [
                line.points.start.x,
                line.points.start.y,
                line.points.end.x,
                line.points.end.y,
              ],
              stroke: line.isSelected ? '#67C23A' : line.style.stroke,
              strokeWidth: line.isSelected ? 3 : line.style.strokeWidth,
              lineCap: line.style.lineCap,
              dash: line.style.dash,
            }"
          />

          <!-- 线段文本标签（与线平行，保持间距） -->
          <v-text
            :config="{
              x: calculateTextPosition(line).x,
              y: calculateTextPosition(line).y,
              text: line.text || calculateLineLength(line),
              fontSize: line.style.fontSize,
              fill: line.style.textColor,
              fontStyle: 'bold',
              align: 'center',
              verticalAlign: 'middle',
              rotation: calculateLineAngle(line),
              offsetX: 50,
              offsetY: 9,
              width: 100,
              listening: canvasStore.isEditMode,
            }"
            @click="(e: any) => handleTextClick(line, e)"
            @tap="(e: any) => handleTextClick(line, e)"
          />
        </v-group>

        <!-- Transformer 控制（旋转和缩放） -->
        <v-transformer
          v-if="canvasStore.isEditMode && selectedImage && canvasStore.activeTool === 'select'"
          ref="transformerRef"
          :config="transformerConfig"
          @transformend="handleTransformEnd"
        />
      </v-layer>
    </v-stage>

    <!-- 标注层逻辑组件（不渲染） -->
    <AnnotationLayer ref="annotationLayerRef" />
  </div>
</template>

<style scoped>
.image-layer {
  width: 100%;
  height: 100%;
}
</style>
