# Quick Start: 图片编辑标注组件

**Date**: 2025-10-31
**Feature**: 001-image-editor
**Phase**: 1 - Quick Start Guide

## Overview

本指南帮助开发人员快速启动图片编辑标注组件的开发工作。包含环境配置、项目初始化、核心功能实现示例和常见问题解决方案。

## Prerequisites

### 必需环境

- **Node.js**: >= 18.0.0 (推荐 20.x LTS)
- **npm**: >= 9.0.0 或 **pnpm**: >= 8.0.0 (推荐)
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 推荐工具

- **VSCode**: 代码编辑器
  - 插件: Vue Language Features (Volar)
  - 插件: TypeScript Vue Plugin (Volar)
  - 插件: ESLint
  - 插件: Prettier
  - 插件: Tailwind CSS IntelliSense

## Quick Setup (5 分钟)

### 1. 项目初始化

```bash
# 创建 Vue3 + TypeScript + Vite 项目
npm create vite@latest image-editor-demo -- --template vue-ts

cd image-editor-demo

# 安装核心依赖
npm install vue-router pinia @vueuse/core konva vue-konva

# 安装 UI 依赖
npm install element-plus @element-plus/icons-vue
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 安装开发依赖
npm install -D @vue/test-utils vitest @vitest/ui jsdom
npm install -D @testing-library/vue
npm install -D eslint prettier @typescript-eslint/eslint-plugin
npm install -D playwright @playwright/test
```

### 2. 配置 Tailwind CSS

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/assets/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 3. 配置 Vitest

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
  },
})
```

### 4. 项目结构初始化

```bash
# 创建目录结构
mkdir -p src/components/image-editor/{canvas,toolbar,panels}
mkdir -p src/stores/image-editor
mkdir -p src/composables/image-editor
mkdir -p src/utils/image-editor
mkdir -p src/types/image-editor
mkdir -p tests/{unit,integration,e2e}

# 创建类型定义文件
touch src/types/image-editor/index.ts
```

## Core Implementation (30 分钟)

### 1. 定义类型

```typescript
// src/types/image-editor/index.ts
export interface EditorImage {
  id: string
  name: string
  src: string
  imageElement: HTMLImageElement | null
  position: { x: number; y: number }
  rotation: number
  scale: { x: number; y: number }
  size: { width: number; height: number }
  zIndex: number
  isSelected: boolean
  isLocked: boolean
  isVisible: boolean
  fileSize: number
  mimeType: string
  createdAt: string
  modifiedAt: string
}

export interface AnnotationNode {
  id: string
  position: { x: number; y: number }
  number: number
  style: {
    radius: number
    fill: string
    stroke: string
    strokeWidth: number
    textColor: string
    fontSize: number
  }
  isSelected: boolean
  isVisible: boolean
  createdAt: string
  modifiedAt: string
}

// ... 其他类型定义见 data-model.md
```

### 2. 创建 Images Store

```typescript
// src/stores/image-editor/images.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EditorImage } from '@/types/image-editor'
import { v4 as uuidv4 } from 'uuid'

export const useImagesStore = defineStore('images', () => {
  // State
  const images = ref<EditorImage[]>([])
  const isLoading = ref(false)
  const loadingProgress = ref(0)

  // Getters
  const visibleImages = computed(() =>
    images.value.filter(img => img.isVisible)
  )

  const selectedImage = computed(() =>
    images.value.find(img => img.isSelected) || null
  )

  const imageCount = computed(() => images.value.length)
  const hasImages = computed(() => imageCount.value > 0)

  // Actions
  async function loadImageFromFile(file: File): Promise<string> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type')
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB')
    }

    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        const id = uuidv4()
        const now = new Date().toISOString()

        const newImage: EditorImage = {
          id,
          name: file.name,
          src: url,
          imageElement: img,
          position: { x: 100, y: 100 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          size: { width: img.width, height: img.height },
          zIndex: images.value.length,
          isSelected: false,
          isLocked: false,
          isVisible: true,
          fileSize: file.size,
          mimeType: file.type,
          createdAt: now,
          modifiedAt: now,
        }

        images.value.push(newImage)
        resolve(id)
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }

      img.src = url
    })
  }

  function deleteImage(id: string) {
    const index = images.value.findIndex(img => img.id === id)
    if (index !== -1) {
      const image = images.value[index]
      if (image.src.startsWith('blob:')) {
        URL.revokeObjectURL(image.src)
      }
      images.value.splice(index, 1)
    }
  }

  function updateImagePosition(id: string, x: number, y: number) {
    const image = images.value.find(img => img.id === id)
    if (image) {
      image.position = { x, y }
      image.modifiedAt = new Date().toISOString()
    }
  }

  return {
    // State
    images,
    isLoading,
    loadingProgress,
    // Getters
    visibleImages,
    selectedImage,
    imageCount,
    hasImages,
    // Actions
    loadImageFromFile,
    deleteImage,
    updateImagePosition,
  }
})
```

### 3. 创建 Canvas 组件

```vue
<!-- src/components/image-editor/canvas/EditorCanvas.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { Stage, Layer } from 'vue-konva'
import { useImagesStore } from '@/stores/image-editor/images'
import ImageLayer from './ImageLayer.vue'

const imagesStore = useImagesStore()

const stageConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
}

const images = computed(() => imagesStore.visibleImages)
</script>

<template>
  <div class="editor-canvas">
    <Stage :config="stageConfig">
      <Layer>
        <ImageLayer
          v-for="image in images"
          :key="image.id"
          :image="image"
        />
      </Layer>
    </Stage>
  </div>
</template>

<style scoped>
.editor-canvas {
  width: 100%;
  height: 100vh;
  background-color: #f5f5f5;
}
</style>
```

### 4. 创建 Image Layer 组件

```vue
<!-- src/components/image-editor/canvas/ImageLayer.vue -->
<script setup lang="ts">
import { Image as KonvaImage, Transformer } from 'vue-konva'
import { ref, computed } from 'vue'
import type { EditorImage } from '@/types/image-editor'

interface Props {
  image: EditorImage
}

const props = defineProps<Props>()

const imageRef = ref(null)
const transformerRef = ref(null)

const imageConfig = computed(() => ({
  image: props.image.imageElement,
  x: props.image.position.x,
  y: props.image.position.y,
  rotation: props.image.rotation,
  scaleX: props.image.scale.x,
  scaleY: props.image.scale.y,
  draggable: !props.image.isLocked,
}))

function handleDragEnd(e: any) {
  const { x, y } = e.target.position()
  // 触发 store action 更新位置
  console.log('Drag end:', x, y)
}

function handleTransformEnd(e: any) {
  const node = e.target
  const rotation = node.rotation()
  const scaleX = node.scaleX()
  const scaleY = node.scaleY()

  // 触发 store action 更新变换
  console.log('Transform end:', rotation, scaleX, scaleY)
}
</script>

<template>
  <konva-image
    ref="imageRef"
    :config="imageConfig"
    @dragend="handleDragEnd"
    @transformend="handleTransformEnd"
  />
  <transformer
    v-if="image.isSelected"
    ref="transformerRef"
  />
</template>
```

### 5. 创建主编辑器组件

```vue
<!-- src/components/image-editor/ImageEditor.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useImagesStore } from '@/stores/image-editor/images'
import EditorCanvas from './canvas/EditorCanvas.vue'
import EditorToolbar from './toolbar/EditorToolbar.vue'

const imagesStore = useImagesStore()

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files || [])

  for (const file of files) {
    try {
      await imagesStore.loadImageFromFile(file)
    } catch (error) {
      console.error('Failed to load image:', error)
    }
  }
}
</script>

<template>
  <div class="image-editor">
    <EditorToolbar />

    <div class="editor-main">
      <EditorCanvas />

      <!-- 侧边面板 -->
      <aside class="editor-sidebar">
        <div class="file-upload">
          <input
            type="file"
            multiple
            accept="image/*"
            @change="handleFileSelect"
          />
        </div>

        <div class="image-list">
          <h3>图片列表 ({{ imagesStore.imageCount }})</h3>
          <!-- 图片列表 UI -->
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.image-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.editor-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.editor-sidebar {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  padding: 1rem;
  overflow-y: auto;
}
</style>
```

## Testing Examples

### 单元测试示例

```typescript
// tests/unit/stores/images.spec.ts
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach } from 'vitest'
import { useImagesStore } from '@/stores/image-editor/images'

describe('useImagesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with empty images', () => {
    const store = useImagesStore()
    expect(store.images).toEqual([])
    expect(store.imageCount).toBe(0)
    expect(store.hasImages).toBe(false)
  })

  it('should delete image correctly', () => {
    const store = useImagesStore()
    // Mock image
    store.images.push({
      id: 'test-id',
      name: 'test.jpg',
      // ... 其他属性
    })

    store.deleteImage('test-id')
    expect(store.imageCount).toBe(0)
  })
})
```

### E2E 测试示例

```typescript
// tests/e2e/basic-workflow.spec.ts
import { test, expect } from '@playwright/test'

test('complete image editing workflow', async ({ page }) => {
  await page.goto('http://localhost:5173')

  // 1. 加载图片
  await page.setInputFiles('input[type="file"]', [
    'tests/fixtures/test-image-1.jpg',
    'tests/fixtures/test-image-2.jpg',
  ])

  // 2. 验证图片加载
  await expect(page.locator('.image-list')).toContainText('图片列表 (2)')

  // 3. 选中第一张图片
  await page.click('.konva-image >> nth=0')

  // 4. 拖拽图片
  await page.dragAndDrop('.konva-image >> nth=0', '.editor-canvas', {
    targetPosition: { x: 200, y: 200 }
  })

  // 5. 导出画布
  await page.click('[aria-label="导出图片"]')

  // 验证下载触发
  const downloadPromise = page.waitForEvent('download')
  await downloadPromise
})
```

## Development Workflow

### 1. 开发服务器

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 2. 测试

```bash
# 运行单元测试
npm run test:unit

# 运行单元测试（监听模式）
npm run test:unit:watch

# 运行 E2E 测试
npm run test:e2e

# 打开 Vitest UI
npm run test:ui
```

### 3. 代码检查

```bash
# ESLint 检查
npm run lint

# Prettier 格式化
npm run format

# TypeScript 类型检查
npm run type-check
```

### 4. 构建

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

## Common Issues & Solutions

### Issue 1: Konva 图片不显示

**问题**: 加载图片后 Konva 画布上看不到图片

**原因**: `imageElement` 未正确加载或 `Image.onload` 未触发

**解决方案**:
```typescript
// 确保在 Image.onload 后再添加到 store
img.onload = () => {
  const newImage = {
    // ...
    imageElement: img, // 确保传递的是加载完成的 Image 对象
  }
  images.value.push(newImage)
}
```

### Issue 2: 拖拽性能差

**问题**: 拖拽多张图片时卡顿

**解决方案**:
```typescript
// 使用节流优化拖拽事件
import { throttle } from 'lodash-es'

const handleDrag = throttle((e) => {
  // 更新位置逻辑
}, 16) // 60fps
```

### Issue 3: 图片内存泄漏

**问题**: 加载大量图片后浏览器内存占用过高

**解决方案**:
```typescript
// 删除图片时释放 Blob URL
function deleteImage(id: string) {
  const image = images.value.find(img => img.id === id)
  if (image && image.src.startsWith('blob:')) {
    URL.revokeObjectURL(image.src)
  }
  images.value = images.value.filter(img => img.id !== id)
}

// 组件卸载时清理
onUnmounted(() => {
  images.value.forEach(img => {
    if (img.src.startsWith('blob:')) {
      URL.revokeObjectURL(img.src)
    }
  })
})
```

### Issue 4: TypeScript 类型错误

**问题**: Konva 组件类型定义缺失

**解决方案**:
```typescript
// 安装类型定义
npm install -D @types/konva

// 或在 src/types/vue-konva.d.ts 中声明
declare module 'vue-konva' {
  import { DefineComponent } from 'vue'
  export const Stage: DefineComponent<any>
  export const Layer: DefineComponent<any>
  export const Image: DefineComponent<any>
  // ...
}
```

## Next Steps

完成快速开始后，您可以：

1. **实现序号标注功能**: 参考 `data-model.md` 中的 `AnnotationNode` 定义
2. **实现尺寸标注线**: 参考 `data-model.md` 中的 `AnnotationLine` 定义
3. **添加导出功能**: 使用 `Konva.Stage.toDataURL()` 导出画布
4. **实现撤销/重做**: 参考 `store-api.md` 中的 `HistoryStore`
5. **性能优化**: 参考 `research.md` 中的性能优化策略
6. **编写测试**: 参考本文档中的测试示例

## Reference Links

- **Vue 3 文档**: https://vuejs.org/
- **Vite 文档**: https://vitejs.dev/
- **Konva 文档**: https://konvajs.org/
- **vue-konva 文档**: https://konvajs.org/docs/vue/
- **Pinia 文档**: https://pinia.vuejs.org/
- **VueUse 文档**: https://vueuse.org/
- **Element Plus 文档**: https://element-plus.org/
- **Tailwind CSS 文档**: https://tailwindcss.com/
- **Vitest 文档**: https://vitest.dev/
- **Playwright 文档**: https://playwright.dev/

## Support

遇到问题？

1. 查看 `research.md` 了解技术选型和最佳实践
2. 查看 `data-model.md` 了解数据结构
3. 查看 `store-api.md` 了解 Store 接口
4. 参考 Konva 官方示例: https://konvajs.org/docs/

祝开发顺利！🚀
