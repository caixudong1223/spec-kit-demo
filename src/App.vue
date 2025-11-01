<script setup lang="ts">
import ImageEditorContainer from './components/image-editor/ImageEditorContainer.vue'

function handleEditorReady() {
  console.log('编辑器已准备就绪')
}

function handleModeChange(mode: 'edit' | 'view') {
  console.log('模式已切换:', mode)
}
</script>

<template>
  <ImageEditorContainer
    mode="edit"
    @ready="handleEditorReady"
    @mode-change="handleModeChange"
  />
</template>
