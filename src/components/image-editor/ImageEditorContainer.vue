<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useKeyboardShortcuts } from '@/composables/image-editor/useKeyboardShortcuts'
import { useCanvasResize } from '@/composables/image-editor/useCanvasResize'
import EditorCanvas from './canvas/EditorCanvas.vue'
import ImageEditorToolbar from './toolbar/ImageEditorToolbar.vue'
import ImageTools from './toolbar/ImageTools.vue'
import ImageList from './panels/ImageList.vue'

// Props
interface Props {
  mode?: 'edit' | 'view'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
})

// Emits
interface Emits {
  (e: 'ready'): void
  (e: 'modeChange', mode: 'edit' | 'view'): void
}

const emit = defineEmits<Emits>()

const canvasStore = useCanvasStore()
const canvasWrapperRef = ref<HTMLDivElement | null>(null)

// 注册键盘快捷键
useKeyboardShortcuts()

// 自适应画布尺寸
const { isReady } = useCanvasResize(canvasWrapperRef)

// 初始化画布
onMounted(() => {
  canvasStore.setMode(props.mode)
})

// 监听画布就绪
watch(isReady, (ready) => {
  if (ready) {
    emit('ready')
    console.log('ImageEditorContainer initialized')
  }
})

// 监听模式变化
canvasStore.$subscribe((mutation, state) => {
  if (mutation.events && 'key' in mutation.events && mutation.events.key === 'mode') {
    emit('modeChange', state.mode)
  }
})
</script>

<template>
  <div class="image-editor-container">
    <!-- 主工具栏 -->
    <ImageEditorToolbar />

    <!-- 图片工具栏 -->
    <ImageTools />

    <!-- 主工作区 -->
    <div class="main-content">
      <!-- 画布区域 -->
      <div
        ref="canvasWrapperRef"
        class="canvas-wrapper"
      >
        <EditorCanvas />
      </div>

      <!-- 右侧面板：图片列表 -->
      <div class="side-panel">
        <ImageList />
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-editor-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #f9fafb;
  overflow: hidden;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.side-panel {
  width: 320px;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
