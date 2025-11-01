<script setup lang="ts">
import { useAnnotationsStore } from '@/stores/image-editor/annotations'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { Delete, Location, Minus } from '@element-plus/icons-vue'
import { ElButton, ElCard, ElEmpty, ElScrollbar, ElTag } from 'element-plus'
import { computed } from 'vue'

const annotationsStore = useAnnotationsStore()
const canvasStore = useCanvasStore()

// 计算所有标注
const allNodes = computed(() => annotationsStore.nodes)
const allLines = computed(() => annotationsStore.lines)

// 是否有标注
const hasAnnotations = computed(() => annotationsStore.hasAnnotations)

// 处理节点点击
function handleNodeClick(nodeId: string) {
  annotationsStore.selectNode(nodeId)
}

// 处理线段点击
function handleLineClick(lineId: string) {
  annotationsStore.selectLine(lineId)
}

// 处理删除节点
function handleDeleteNode(nodeId: string, event: Event) {
  event.stopPropagation()
  annotationsStore.deleteNode(nodeId)
}

// 处理删除线段
function handleDeleteLine(lineId: string, event: Event) {
  event.stopPropagation()
  annotationsStore.deleteLine(lineId)
}

// 格式化坐标
function formatPosition(x: number, y: number): string {
  return `(${Math.round(x)}, ${Math.round(y)})`
}
</script>

<template>
  <div class="annotation-list">
    <el-card class="annotation-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">标注列表</span>
          <el-tag type="info" size="small">
            {{ annotationsStore.totalAnnotationCount }}
          </el-tag>
        </div>
      </template>

      <el-scrollbar height="calc(100vh - 300px)">
        <div v-if="!hasAnnotations" class="empty-state">
          <el-empty description="暂无标注" :image-size="80" />
        </div>

        <div v-else class="annotation-content">
          <!-- 序号节点列表 -->
          <div v-if="allNodes.length > 0" class="annotation-section">
            <div class="section-title">
              <Location class="section-icon" />
              <span>序号节点</span>
              <el-tag type="primary" size="small">{{ allNodes.length }}</el-tag>
            </div>

            <div class="annotation-items">
              <div
                v-for="node in allNodes"
                :key="node.id"
                class="annotation-item"
                :class="{ selected: node.isSelected }"
                @click="handleNodeClick(node.id)"
              >
                <div class="item-content">
                  <div class="item-main">
                    <div
                      class="node-badge"
                      :style="{
                        backgroundColor: node.style.fill,
                        color: node.style.textColor,
                      }"
                    >
                      {{ node.number }}
                    </div>
                    <div class="item-info">
                      <div class="item-title">节点 {{ node.number }}</div>
                      <div class="item-meta">
                        {{ formatPosition(node.position.x, node.position.y) }}
                      </div>
                    </div>
                  </div>
                  <el-button
                    :icon="Delete"
                    size="small"
                    type="danger"
                    text
                    :disabled="!canvasStore.isEditMode"
                    @click="(e: Event) => handleDeleteNode(node.id, e)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 标注线列表 -->
          <div v-if="allLines.length > 0" class="annotation-section">
            <div class="section-title">
              <Minus class="section-icon" />
              <span>标注线</span>
              <el-tag type="warning" size="small">{{ allLines.length }}</el-tag>
            </div>

            <div class="annotation-items">
              <div
                v-for="line in allLines"
                :key="line.id"
                class="annotation-item"
                :class="{ selected: line.isSelected }"
                @click="handleLineClick(line.id)"
              >
                <div class="item-content">
                  <div class="item-main">
                    <div class="item-info">
                      <div class="item-title">
                        {{ line.text || '未命名标注线' }}
                      </div>
                      <div class="item-meta">
                        起点: {{ formatPosition(line.points.start.x, line.points.start.y) }}
                      </div>
                      <div class="item-meta">
                        终点: {{ formatPosition(line.points.end.x, line.points.end.y) }}
                      </div>
                    </div>
                  </div>
                  <el-button
                    :icon="Delete"
                    size="small"
                    type="danger"
                    text
                    :disabled="!canvasStore.isEditMode"
                    @click="(e: Event) => handleDeleteLine(line.id, e)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </el-card>
  </div>
</template>

<style scoped>
.annotation-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.annotation-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.annotation-card :deep(.el-card__body) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-weight: 600;
  font-size: 14px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.annotation-content {
  padding: 12px;
}

.annotation-section {
  margin-bottom: 20px;
}

.annotation-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.section-icon {
  width: 16px;
  height: 16px;
}

.annotation-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.annotation-item {
  padding: 12px;
  background-color: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.annotation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.annotation-item.selected {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.item-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.node-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
