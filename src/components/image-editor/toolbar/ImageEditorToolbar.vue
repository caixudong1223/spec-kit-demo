<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { useImagesStore } from '@/stores/image-editor/images'
import { useImageLoader } from '@/composables/image-editor/useImageLoader'
import { useCanvasExport } from '@/composables/image-editor/useCanvasExport'
import { useProjectFile } from '@/composables/image-editor/useProjectFile'
import {
  ZoomIn,
  ZoomOut,
  Pointer,
  CirclePlus,
  Connection,
  Position,
  View,
  Edit,
  Upload,
  FolderOpened,
  Download,
  Document,
  FolderAdd,
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// Props
interface Props {
  stage?: any
}

const props = defineProps<Props>()

const canvasStore = useCanvasStore()
const imagesStore = useImagesStore()
const imageLoader = useImageLoader()
const canvasExport = useCanvasExport()
const projectFile = useProjectFile()

const fileInputRef = ref<HTMLInputElement | null>(null)
const projectInputRef = ref<HTMLInputElement | null>(null)

// 工具按钮配置
const tools = [
  { id: 'select', icon: Pointer, label: '选择工具' },
  { id: 'annotation-node', icon: CirclePlus, label: '标注节点' },
  { id: 'annotation-line', icon: Connection, label: '标注线' },
  { id: 'pan', icon: Position, label: '平移画布' },
] as const

// 处理工具切换
function handleToolChange(toolId: string) {
  canvasStore.setActiveTool(toolId as any)
}

// 处理缩放
function handleZoomIn() {
  canvasStore.zoomIn()
}

function handleZoomOut() {
  canvasStore.zoomOut()
}

function handleResetZoom() {
  canvasStore.resetZoom()
}

// 处理模式切换
function handleToggleMode() {
  canvasStore.toggleMode()
}

// 处理文件选择
function handleSelectFiles() {
  fileInputRef.value?.click()
}

// 处理文件上传
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  // 验证文件
  const fileArray = imageLoader.createFileArray(files)
  const validation = imageLoader.validateFiles(fileArray)

  // 显示验证失败的文件
  if (validation.invalid.length > 0) {
    validation.invalid.forEach((item) => {
      ElMessage.error(item.error)
    })
  }

  // 加载有效文件
  if (validation.valid.length > 0) {
    try {
      const loadedImages = await imagesStore.loadImagesFromFiles(validation.valid)

      if (loadedImages.length > 0) {
        ElMessage.success(`成功加载 ${loadedImages.length} 张图片`)
      } else {
        ElMessage.warning('没有成功加载任何图片')
      }
    } catch (error) {
      ElMessage.error('加载图片失败')
      console.error(error)
    }
  }

  // 重置 input
  target.value = ''
}

// ========== 导出功能 ==========

// 导出为 PNG
async function handleExportPNG() {
  console.log('🚀 Toolbar: Export PNG clicked, stage =', props.stage)
  if (!props.stage) {
    console.error('❌ Toolbar: Stage is null/undefined!')
    ElMessage.error('画布未初始化')
    return
  }
  await canvasExport.exportAsPNG(props.stage)
}

// 导出为 JPEG
async function handleExportJPEG() {
  if (!props.stage) {
    ElMessage.error('画布未初始化')
    return
  }
  await canvasExport.exportAsJPEG(props.stage)
}

// ========== 项目文件管理 ==========

// 保存项目
async function handleSaveProject() {
  await projectFile.saveProjectFile()
}

// 选择项目文件
function handleSelectProjectFile() {
  projectInputRef.value?.click()
}

// 加载项目文件
async function handleLoadProjectFile(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files

  if (!files || files.length === 0) return

  const file = files[0]
  await projectFile.loadProjectFile(file)

  // 重置 input
  target.value = ''
}

// 缩放显示文本
const zoomText = computed(() => `${(canvasStore.view.scale * 100).toFixed(0)}%`)

// 模式按钮
const modeIcon = computed(() => canvasStore.isEditMode ? Edit : View)
const modeLabel = computed(() => canvasStore.isEditMode ? '编辑模式' : '查看模式')
const modeType = computed(() => canvasStore.isEditMode ? 'primary' : 'info')

// 是否可以加载图片
const canLoadImages = computed(() => imagesStore.canAddMoreImages)
</script>

<template>
  <div class="image-editor-toolbar">
    <!-- 左侧：文件操作 -->
    <div class="toolbar-section">
      <el-button
        type="primary"
        :icon="Upload"
        :disabled="!canLoadImages || !canvasStore.isEditMode"
        @click="handleSelectFiles"
      >
        加载图片
      </el-button>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style="display: none"
        @change="handleFileChange"
      >
    </div>

    <el-divider direction="vertical" />

    <!-- 项目管理 -->
    <div class="toolbar-section">
      <el-button
        :icon="Document"
        @click="handleSaveProject"
      >
        保存项目
      </el-button>

      <el-button
        :icon="FolderAdd"
        @click="handleSelectProjectFile"
      >
        加载项目
      </el-button>

      <!-- 隐藏的项目文件输入 -->
      <input
        ref="projectInputRef"
        type="file"
        accept="application/json"
        style="display: none"
        @change="handleLoadProjectFile"
      >
    </div>

    <el-divider direction="vertical" />

    <!-- 导出 -->
    <div class="toolbar-section">
      <el-button
        :icon="Download"
        @click="handleExportPNG"
      >
        导出PNG
      </el-button>

      <el-button
        :icon="Download"
        @click="handleExportJPEG"
      >
        导出JPEG
      </el-button>
    </div>

    <el-divider direction="vertical" />

    <!-- 中间：工具栏 -->
    <div class="toolbar-section">
      <el-button-group>
        <el-button
          v-for="tool in tools"
          :key="tool.id"
          :type="canvasStore.activeTool === tool.id ? 'primary' : 'default'"
          :icon="tool.icon"
          :disabled="!canvasStore.isEditMode && tool.id !== 'pan'"
          @click="handleToolChange(tool.id)"
        >
          {{ tool.label }}
        </el-button>
      </el-button-group>
    </div>

    <el-divider direction="vertical" />

    <!-- 缩放控制 -->
    <div class="toolbar-section">
      <el-button-group>
        <el-button :icon="ZoomOut" @click="handleZoomOut">
          缩小
        </el-button>
        <el-button @click="handleResetZoom">
          {{ zoomText }}
        </el-button>
        <el-button :icon="ZoomIn" @click="handleZoomIn">
          放大
        </el-button>
      </el-button-group>
    </div>

    <!-- 右侧：模式切换 -->
    <div class="toolbar-section ml-auto">
      <el-button
        :type="modeType"
        :icon="modeIcon"
        @click="handleToggleMode"
      >
        {{ modeLabel }}
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.image-editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ml-auto {
  margin-left: auto;
}
</style>
