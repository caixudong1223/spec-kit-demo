<script setup lang="ts">
import { computed } from 'vue'
import { useImagesStore } from '@/stores/image-editor/images'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import {
  Delete,
  Upload,
  Download,
  Lock,
  Unlock,
  Top,
  Bottom,
  CaretTop,
  CaretBottom,
  View,
  Hide,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()

// 当前选中的图片
const selectedImage = computed(() => imagesStore.selectedImages[0])

// 工具按钮是否可用
const hasSelection = computed(() => !!selectedImage.value)
const isEditMode = computed(() => canvasStore.isEditMode)
const canOperate = computed(() => hasSelection.value && isEditMode.value)

// 删除选中图片
function handleDelete() {
  if (!selectedImage.value) return

  imagesStore.deleteImage(selectedImage.value.id)
  ElMessage.success('图片已删除')
}

// 图层操作
function handleBringToFront() {
  if (!selectedImage.value) return
  imagesStore.bringToFront(selectedImage.value.id)
  ElMessage.success('已移至顶层')
}

function handleSendToBack() {
  if (!selectedImage.value) return
  imagesStore.sendToBack(selectedImage.value.id)
  ElMessage.success('已移至底层')
}

function handleBringForward() {
  if (!selectedImage.value) return
  imagesStore.bringForward(selectedImage.value.id)
  ElMessage.success('向上移动一层')
}

function handleSendBackward() {
  if (!selectedImage.value) return
  imagesStore.sendBackward(selectedImage.value.id)
  ElMessage.success('向下移动一层')
}

// 锁定/解锁
function handleToggleLock() {
  if (!selectedImage.value) return
  imagesStore.toggleImageLock(selectedImage.value.id)

  const message = selectedImage.value.isLocked ? '已锁定' : '已解锁'
  ElMessage.success(message)
}

// 显示/隐藏
function handleToggleVisibility() {
  if (!selectedImage.value) return
  imagesStore.toggleImageVisibility(selectedImage.value.id)

  const message = selectedImage.value.isVisible ? '已显示' : '已隐藏'
  ElMessage.success(message)
}

// 锁定图标
const lockIcon = computed(() => {
  return selectedImage.value?.isLocked ? Lock : Unlock
})

// 显示图标
const visibilityIcon = computed(() => {
  return selectedImage.value?.isVisible ? View : Hide
})
</script>

<template>
  <div class="image-tools">
    <div class="tool-section">
      <span class="tool-label">图片操作:</span>

      <el-button-group>
        <!-- 删除 -->
        <el-button
          :icon="Delete"
          :disabled="!canOperate"
          size="small"
          @click="handleDelete"
        >
          删除
        </el-button>

        <!-- 锁定/解锁 -->
        <el-button
          :icon="lockIcon"
          :disabled="!canOperate"
          size="small"
          @click="handleToggleLock"
        >
          {{ selectedImage?.isLocked ? '解锁' : '锁定' }}
        </el-button>

        <!-- 显示/隐藏 -->
        <el-button
          :icon="visibilityIcon"
          :disabled="!canOperate"
          size="small"
          @click="handleToggleVisibility"
        >
          {{ selectedImage?.isVisible ? '隐藏' : '显示' }}
        </el-button>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <div class="tool-section">
      <span class="tool-label">图层:</span>

      <el-button-group>
        <!-- 置顶 -->
        <el-button
          :icon="Top"
          :disabled="!canOperate"
          size="small"
          @click="handleBringToFront"
        >
          置顶
        </el-button>

        <!-- 向上 -->
        <el-button
          :icon="CaretTop"
          :disabled="!canOperate"
          size="small"
          @click="handleBringForward"
        >
          上移
        </el-button>

        <!-- 向下 -->
        <el-button
          :icon="CaretBottom"
          :disabled="!canOperate"
          size="small"
          @click="handleSendBackward"
        >
          下移
        </el-button>

        <!-- 置底 -->
        <el-button
          :icon="Bottom"
          :disabled="!canOperate"
          size="small"
          @click="handleSendToBack"
        >
          置底
        </el-button>
      </el-button-group>
    </div>
  </div>
</template>

<style scoped>
.image-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.tool-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}
</style>
