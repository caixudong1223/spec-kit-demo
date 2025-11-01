<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { useImagesStore } from '@/stores/image-editor/images'
import { useCanvasStore } from '@/stores/image-editor/canvas'

interface Props {
  stage?: any
  layer?: any
}

const props = defineProps<Props>()

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()

const transformerRef = ref<any>(null)

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
  keepRatio: false, // 允许非等比缩放
  centeredScaling: false,
}))

// 更新 Transformer 的目标节点
function updateTransformer() {
  if (!transformerRef.value || !props.stage) return

  const transformer = transformerRef.value.getNode()

  if (!selectedImage.value) {
    transformer.nodes([])
    return
  }

  // 查找选中图片的 Konva 节点
  const layer = props.stage.getLayers()[0]
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

// 组件挂载后更新
onMounted(() => {
  nextTick(() => {
    updateTransformer()
  })
})

// 处理变换结束
function handleTransformEnd() {
  if (!selectedImage.value || !transformerRef.value) return

  const transformer = transformerRef.value.getNode()
  const node = transformer.nodes()[0]

  if (!node) return

  // 更新图片的变换属性
  imagesStore.updateImagePosition(selectedImage.value.id, node.x(), node.y())
  imagesStore.updateImageRotation(selectedImage.value.id, node.rotation())
  imagesStore.updateImageScale(selectedImage.value.id, node.scaleX(), node.scaleY())
}

// 暴露方法给父组件
defineExpose({
  updateTransformer,
})
</script>

<template>
  <v-transformer
    v-if="canvasStore.isEditMode && selectedImage && canvasStore.activeTool === 'select'"
    ref="transformerRef"
    :config="transformerConfig"
    @transformend="handleTransformEnd"
  />
</template>
