<script setup lang="ts">
import { computed } from 'vue'
import { useImagesStore } from '@/stores/image-editor/images'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import {
  Delete,
  View,
  Hide,
  Lock,
  Unlock,
  Picture,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatFileSize } from '@/utils/image-editor/image-processor'
import type { EditorImage } from '@/types/image-editor'

const imagesStore = useImagesStore()
const canvasStore = useCanvasStore()

// 按 zIndex 排序的图片列表（从上到下）
const sortedImages = computed(() => {
  return [...imagesStore.sortedByZIndex].reverse()
})

// 是否有图片
const hasImages = computed(() => imagesStore.hasImages)

// 是否编辑模式
const isEditMode = computed(() => canvasStore.isEditMode)

// 处理图片选择
function handleSelectImage(image: EditorImage) {
  if (!isEditMode.value) return
  imagesStore.selectImage(image.id)
}

// 处理删除图片
async function handleDeleteImage(image: EditorImage, event: Event) {
  event.stopPropagation()

  if (!isEditMode.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除图片 "${image.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    imagesStore.deleteImage(image.id)
    ElMessage.success('图片已删除')
  } catch {
    // 用户取消
  }
}

// 处理切换可见性
function handleToggleVisibility(image: EditorImage, event: Event) {
  event.stopPropagation()
  if (!isEditMode.value) return

  imagesStore.toggleImageVisibility(image.id)
}

// 处理切换锁定
function handleToggleLock(image: EditorImage, event: Event) {
  event.stopPropagation()
  if (!isEditMode.value) return

  imagesStore.toggleImageLock(image.id)
}

// 获取图片缩略图样式
function getThumbnailStyle(image: EditorImage) {
  return {
    opacity: image.isVisible ? 1 : 0.5,
    cursor: isEditMode.value ? 'pointer' : 'default',
  }
}

// 获取图片项类名
function getImageItemClass(image: EditorImage) {
  return {
    'image-item': true,
    'selected': image.isSelected,
    'locked': image.isLocked,
    'hidden': !image.isVisible,
  }
}
</script>

<template>
  <div class="image-list-panel">
    <div class="panel-header">
      <h3 class="panel-title">
        <Picture class="title-icon" />
        图片列表
      </h3>
      <span class="image-count">{{ imagesStore.imageCount }}</span>
    </div>

    <div class="panel-content">
      <!-- 空状态 -->
      <div
        v-if="!hasImages"
        class="empty-state"
      >
        <Picture class="empty-icon" />
        <p class="empty-text">暂无图片</p>
        <p class="empty-hint">点击"加载图片"按钮添加图片</p>
      </div>

      <!-- 图片列表 -->
      <div
        v-else
        class="image-list"
      >
        <div
          v-for="image in sortedImages"
          :key="image.id"
          :class="getImageItemClass(image)"
          @click="handleSelectImage(image)"
        >
          <!-- 缩略图 -->
          <div
            class="image-thumbnail"
            :style="getThumbnailStyle(image)"
          >
            <img
              v-if="image.imageElement"
              :src="image.src"
              :alt="image.name"
            >
            <div
              v-else
              class="thumbnail-placeholder"
            >
              <Picture />
            </div>
          </div>

          <!-- 图片信息 -->
          <div class="image-info">
            <div class="image-name">
              {{ image.name }}
            </div>
            <div class="image-meta">
              {{ image.size.width }} × {{ image.size.height }}
              <span class="separator">|</span>
              {{ formatFileSize(image.fileSize) }}
            </div>
            <div class="image-layer">
              Layer {{ image.zIndex }}
            </div>
          </div>

          <!-- 操作按钮 -->
          <div
            v-if="isEditMode"
            class="image-actions"
          >
            <!-- 可见性切换 -->
            <el-button
              :icon="image.isVisible ? View : Hide"
              :type="image.isVisible ? 'default' : 'info'"
              size="small"
              circle
              @click="(e: Event) => handleToggleVisibility(image, e)"
            />

            <!-- 锁定切换 -->
            <el-button
              :icon="image.isLocked ? Lock : Unlock"
              :type="image.isLocked ? 'warning' : 'default'"
              size="small"
              circle
              @click="(e: Event) => handleToggleLock(image, e)"
            />

            <!-- 删除 -->
            <el-button
              :icon="Delete"
              type="danger"
              size="small"
              circle
              @click="(e: Event) => handleDeleteImage(image, e)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.image-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #ffffff;
  border-left: 1px solid #e5e7eb;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.title-icon {
  width: 20px;
  height: 20px;
  color: #409EFF;
}

.image-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  background-color: #409EFF;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
}

.empty-hint {
  margin: 0;
  font-size: 14px;
  opacity: 0.7;
}

/* 图片列表 */
.image-list {
  padding: 8px;
}

.image-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background-color: #f9fafb;
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.image-item:hover {
  background-color: #f3f4f6;
  border-color: #e5e7eb;
}

.image-item.selected {
  background-color: #eff6ff;
  border-color: #409EFF;
}

.image-item.locked {
  opacity: 0.8;
}

.image-item.hidden {
  opacity: 0.5;
}

/* 缩略图 */
.image-thumbnail {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #d1d5db;
}

/* 图片信息 */
.image-info {
  flex: 1;
  min-width: 0;
}

.image-name {
  font-size: 14px;
  font-weight: 500;
  color: #111827;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 2px;
}

.separator {
  margin: 0 4px;
}

.image-layer {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

/* 操作按钮 */
.image-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-actions :deep(.el-button) {
  width: 28px;
  height: 28px;
}
</style>
