<script setup lang="ts">
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import type { EditorImage } from '@/types/image-editor'
import { computed, ref } from 'vue'
import AnnotationLayer from './AnnotationLayer.vue'

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()
const annotationsStore = useAnnotationsStore()

// 标注层组件引用
const annotationLayerRef = ref<InstanceType<typeof AnnotationLayer> | null>(null)

// Konva Stage 引用
const stageRef = ref<any>(null)

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
}

// 处理图片变换结束（这个事件不应该被触发，因为变换由 Transformer 处理）
function handleTransformEnd(image: EditorImage, event: any) {
  // 不再处理这个事件，由 TransformerControls 处理
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

// 处理舞台鼠标按下（开始平移）
function handleStageMouseDown(event: any) {
  // 只在平移模式下响应
  if (canvasStore.activeTool !== 'pan') return

  // 如果点击的是图片，不处理（让图片自己处理）
  if (event.target !== event.target.getStage() && event.target.getClassName() !== 'Stage') {
    return
  }

  const stage = event.target.getStage()
  const pointerPos = stage.getPointerPosition()

  isPanning.value = true
  panStartPos.value = { x: pointerPos.x, y: pointerPos.y }
  layerStartPos.value = {
    x: canvasStore.view.position.x,
    y: canvasStore.view.position.y,
  }

  // 修改鼠标样式
  stage.container().style.cursor = 'grabbing'
}

// 处理舞台鼠标移动（平移中）
function handleStageMouseMove(event: any) {
  if (!isPanning.value || canvasStore.activeTool !== 'pan') return

  const stage = event.target.getStage()
  const pointerPos = stage.getPointerPosition()

  // 计算偏移量
  const dx = pointerPos.x - panStartPos.value.x
  const dy = pointerPos.y - panStartPos.value.y

  // 更新 Layer 位置
  const newX = layerStartPos.value.x + dx
  const newY = layerStartPos.value.y + dy

  canvasStore.panTo(newX, newY)
}

// 处理舞台鼠标释放（平移结束）
function handleStageMouseUp(event: any) {
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

// Emit for parent component
const emit = defineEmits<{
  stageReady: [stage: any]
  transformerNeedsUpdate: []
}>()

// 舞台准备就绪
function handleStageReady(stage: any) {
  stageRef.value = stage
  emit('stageReady', stage)
}
</script>

<template>
  <div class="image-layer">
    <!-- vue-konva Stage 固定大小 -->
    <v-stage
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
          @transformend="(e: any) => handleTransformEnd(image, e)"
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
