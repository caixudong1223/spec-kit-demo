# Technical Research: 图片编辑标注组件

**Date**: 2025-10-31
**Feature**: 001-image-editor
**Phase**: 0 - Research & Technology Selection

## Overview

本文档记录图片编辑标注组件的技术选型研究和最佳实践调研结果。主要研究方向包括 Canvas 渲染引擎选择、Vue3 集成方案、性能优化策略、测试方法等。

## 1. Canvas 渲染引擎选择

### 决策：Konva.js

**选择理由**:
- **高性能**：基于 HTML5 Canvas，支持硬件加速，能够流畅处理大量图形对象
- **Vue3 原生支持**：vue-konva 提供官方 Vue3 集成，支持响应式和 Composition API
- **丰富的交互 API**：内置拖拽、旋转、缩放变换器（Transformer），开箱即用
- **图层管理**：原生支持多图层（Layer）和组（Group），便于管理复杂场景
- **事件系统**：完整的鼠标和触摸事件支持，易于实现自定义交互
- **导出能力**：支持导出为图片（PNG/JPEG/Base64）和序列化为 JSON
- **轻量级**：核心库 ~80KB (gzipped)，无重度依赖
- **活跃维护**：GitHub 10k+ stars，持续更新，社区活跃

### 备选方案评估

| 方案 | 优点 | 缺点 | 结论 |
| --- | --- | --- | --- |
| **Konva.js** | Vue3 集成好，性能优秀，API 友好，内置变换器 | 相对 Fabric.js 生态略小 | ✅ **推荐** |
| **Fabric.js** | 功能强大，生态成熟，SVG 支持好 | Vue3 集成复杂，学习曲线陡，较重（~250KB） | ❌ 过于复杂 |
| **Paper.js** | 矢量图形强，路径操作强大 | 更适合创意绘图，交互组件支持弱，Vue 集成差 | ❌ 不适合本场景 |
| **原生 Canvas API** | 完全可控，无依赖 | 开发成本高，需自行实现所有交互逻辑 | ❌ 开发周期长 |

**最终决策**: 使用 Konva.js + vue-konva，在性能、开发效率和 Vue3 集成之间达到最佳平衡。

## 2. Vue3 + Konva 集成最佳实践

### 2.1 组件架构

**决策**: 采用"容器组件 + 渲染组件"分离模式

```
ImageEditor.vue (容器组件)
  ├── EditorToolbar.vue (工具栏)
  ├── EditorCanvas.vue (Konva 渲染组件)
  │   ├── v-stage (Konva Stage)
  │   │   ├── v-layer (图片层)
  │   │   │   └── v-image (每张图片)
  │   │   ├── v-layer (标注层)
  │   │   │   ├── v-circle + v-text (序号节点)
  │   │   │   └── v-line + v-text (标注线)
  │   │   └── v-layer (控制层)
  │   │       └── v-transformer (变换控制)
  └── ImageList.vue (侧边面板)
```

**理由**:
- **关注点分离**: 容器组件管理状态和业务逻辑，渲染组件专注 Konva 渲染
- **可测试性**: 渲染组件接收 props，易于单元测试
- **性能优化**: Konva 组件仅在必要时重新渲染
- **可维护性**: 清晰的组件边界，便于理解和修改

### 2.2 状态管理策略

**决策**: Pinia + Composables 混合模式

**Pinia Stores**:
- `useCanvasStore`: 画布全局状态（尺寸、缩放、模式）
- `useImagesStore`: 图片数据和操作（CRUD）
- `useAnnotationsStore`: 标注数据和操作（CRUD）
- `useHistoryStore`: 历史记录（撤销/重做）

**Composables**:
- `useImageLoader`: 图片加载逻辑封装
- `useCanvasExport`: 导出功能封装
- `useProjectFile`: 项目文件序列化/反序列化
- `useCanvasInteraction`: 画布交互事件处理

**理由**:
- Pinia 管理持久化的领域数据，支持 DevTools 调试
- Composables 封装可复用的业务逻辑，提升代码复用性
- 两者结合避免单一状态树过于庞大

### 2.3 响应式数据与 Konva 同步

**决策**: 使用 `watchEffect` 和 `computed` 进行单向数据流

```typescript
// 示例模式
const images = computed(() => useImagesStore().images)

watchEffect(() => {
  // Konva 对象更新逻辑
  konvaImages.value = images.value.map(img => ({
    id: img.id,
    image: img.imageElement,
    x: img.position.x,
    y: img.position.y,
    // ...
  }))
})
```

**理由**:
- 避免双向绑定导致的性能问题
- 明确数据流向：Store → Vue Component → Konva Objects
- 易于追踪状态变化和调试

## 3. 图片处理和性能优化

### 3.1 图片加载优化

**决策**: 异步加载 + 缩略图预加载

**策略**:
1. 使用 `Image` 对象异步加载图片
2. 大图片（>2MB）先生成缩略图预览
3. 使用 `requestIdleCallback` 在空闲时加载完整图片
4. 使用 Web Worker 处理图片压缩和格式转换

**代码示例**:
```typescript
async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url) // 释放内存
      resolve(img)
    }
    img.onerror = reject
    img.src = url
  })
}
```

### 3.2 Canvas 渲染性能优化

**决策**: 图层分离 + 部分重绘

**关键策略**:
- **图层分离**: 图片层、标注层、控制层独立，避免全量重绘
- **节流防抖**: 拖拽和缩放事件使用 `throttle`（16ms），文本输入使用 `debounce`（300ms）
- **虚拟滚动**: 图片列表超过 50 张时使用虚拟滚动
- **懒加载**: 画布外的图片延迟渲染
- **缓存机制**: 使用 `Konva.Image` 的缓存功能，避免重复绘制

**Konva 配置**:
```typescript
const stageConfig = {
  width: window.innerWidth,
  height: window.innerHeight,
  draggable: false, // 禁用 Stage 拖拽，使用自定义平移
  listening: true,  // 启用事件监听
}

const layerConfig = {
  listening: true,
  imageSmoothingEnabled: true, // 图片抗锯齿
}
```

### 3.3 内存管理

**决策**: 及时释放资源 + 限制并发

**策略**:
- 组件卸载时销毁 Konva Stage: `stage.destroy()`
- 图片删除时释放 URL: `URL.revokeObjectURL()`
- 限制同时加载图片数量（并发 5 张）
- 大项目提示用户（图片数 > 20 或标注 > 100）

## 4. 导出和序列化

### 4.1 画布导出为图片

**决策**: 使用 Konva 内置导出 API + 自定义质量控制

**导出流程**:
```typescript
async function exportCanvasAsImage(format: 'png' | 'jpeg', quality = 0.9) {
  const stage = stageRef.value

  // 1. 隐藏控制层（变换器等）
  controlLayer.hide()

  // 2. 导出为 DataURL
  const dataURL = stage.toDataURL({
    pixelRatio: 2, // 2倍分辨率，提升导出质量
    mimeType: format === 'jpeg' ? 'image/jpeg' : 'image/png',
    quality: format === 'jpeg' ? quality : 1,
  })

  // 3. 恢复控制层
  controlLayer.show()

  // 4. 触发下载
  downloadFile(dataURL, `canvas-export-${Date.now()}.${format}`)
}
```

**优化**:
- 导出前隐藏所有编辑控制元素
- 支持自定义导出尺寸（原始/2x/4x）
- 提供进度反馈（大画布导出可能需要数秒）

### 4.2 项目文件序列化

**决策**: JSON 格式 + Base64 图片嵌入（可选）

**文件结构**:
```typescript
interface ProjectFile {
  version: string              // 项目文件版本
  metadata: {
    name: string
    createdAt: string
    modifiedAt: string
  }
  canvas: {
    width: number
    height: number
    backgroundColor: string
  }
  images: Array<{
    id: string
    name: string
    src: string              // Data URL 或相对路径
    position: { x: number; y: number }
    rotation: number
    scale: { x: number; y: number }
    zIndex: number
  }>
  annotations: {
    nodes: Array<{
      id: string
      position: { x: number; y: number }
      number: number
      style: { color: string; size: number }
    }>
    lines: Array<{
      id: string
      start: { x: number; y: number }
      end: { x: number; y: number }
      text: string
      style: { color: string; lineWidth: number }
    }>
  }
}
```

**保存策略**:
- **小项目**（< 5MB）: 图片 Base64 嵌入 JSON
- **大项目**（>= 5MB）: 生成 ZIP 包（JSON + 图片文件）
- 提供"另存为"和"自动保存"两种模式

## 5. 编辑模式与查看模式

### 决策: 状态驱动的权限控制

**实现模式**:
```typescript
// Store
const canvasStore = useCanvasStore()
const isEditMode = computed(() => canvasStore.mode === 'edit')

// 组件中使用
const isDraggable = computed(() => isEditMode.value)
const showControls = computed(() => isEditMode.value)

// Konva 配置
<v-image
  :config="{
    draggable: isDraggable,
    listening: isEditMode,
  }"
/>
```

**切换效果**:
- **编辑模式**: 显示所有控制、可拖拽、可修改
- **查看模式**: 隐藏控制、禁用拖拽、禁用修改、保留缩放和平移

## 6. 测试策略

### 6.1 单元测试

**工具**: Vitest + @vue/test-utils

**测试重点**:
- **Stores**: 状态变更逻辑（添加/删除/更新图片和标注）
- **Composables**: 图片加载、文件处理、序列化逻辑
- **Utils**: 纯函数工具（验证器、转换器）

**示例**:
```typescript
// tests/unit/stores/images.spec.ts
describe('useImagesStore', () => {
  it('should add image correctly', () => {
    const store = useImagesStore()
    store.addImage({ id: '1', src: 'test.jpg', ... })
    expect(store.images).toHaveLength(1)
  })
})
```

### 6.2 组件测试

**工具**: @testing-library/vue

**测试重点**:
- 组件渲染正确性
- 用户交互响应（点击、输入）
- Props 和 Events 正确传递

**示例**:
```typescript
// tests/unit/components/EditorToolbar.spec.ts
it('should emit mode-change event when mode switch clicked', async () => {
  const { emitted, getByRole } = render(EditorToolbar)
  await fireEvent.click(getByRole('button', { name: /查看模式/ }))
  expect(emitted()['mode-change']).toBeTruthy()
})
```

### 6.3 集成测试

**工具**: Vitest (组件集成) + Playwright (E2E)

**测试场景**:
- 完整的图片加载 → 编辑 → 导出流程
- 标注创建 → 编辑 → 删除流程
- 项目保存 → 加载流程
- 模式切换对所有功能的影响

### 6.4 E2E 测试

**工具**: Playwright

**测试场景**:
```typescript
// tests/e2e/basic-workflow.spec.ts
test('complete editing workflow', async ({ page }) => {
  await page.goto('/image-editor')

  // 1. 加载图片
  await page.setInputFiles('input[type="file"]', ['test1.jpg', 'test2.jpg'])
  await expect(page.locator('.konva-image')).toHaveCount(2)

  // 2. 添加标注
  await page.click('[aria-label="序号标注"]')
  await page.click('.konva-stage', { position: { x: 100, y: 100 } })
  await expect(page.locator('.annotation-node')).toHaveCount(1)

  // 3. 导出
  await page.click('[aria-label="导出图片"]')
  // 验证下载触发
})
```

## 7. 可访问性（WCAG 合规）

### 决策: 键盘导航 + ARIA 标签

**关键实现**:
- **键盘快捷键**:
  - `Delete`: 删除选中对象
  - `Ctrl+Z`: 撤销
  - `Ctrl+Y`: 重做
  - `Escape`: 取消选择
  - `Tab`: 切换选中对象
- **ARIA 标签**: 所有工具按钮添加 `aria-label`
- **焦点管理**: 使用 `useFocusManagement` 管理焦点
- **颜色对比**: 标注颜色确保 4.5:1 对比度

## 8. 依赖清单

### 核心依赖

```json
{
  "dependencies": {
    "vue": "^3.3.8",
    "vue-router": "^4.2.5",
    "pinia": "^2.1.7",
    "@vueuse/core": "^10.6.1",
    "konva": "^9.2.3",
    "vue-konva": "^3.0.2",
    "element-plus": "^2.4.3",
    "@element-plus/icons-vue": "^2.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.5.0",
    "vite": "^5.0.2",
    "typescript": "^5.2.2",
    "@vue/test-utils": "^2.4.1",
    "@testing-library/vue": "^8.0.1",
    "vitest": "^1.0.1",
    "@vitest/ui": "^1.0.1",
    "playwright": "^1.40.0",
    "eslint": "^8.54.0",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.3.5"
  }
}
```

### 可选依赖

- `jszip`: 大项目导出为 ZIP（如需要）
- `file-saver`: 简化文件下载
- `lodash-es`: 工具函数（防抖、节流）

## 9. 风险评估

| 风险 | 影响 | 缓解措施 |
| --- | --- | --- |
| Konva 学习曲线 | 中 | 详细文档和示例，团队培训 |
| 大图片内存占用 | 高 | 限制图片大小，压缩预览，及时释放内存 |
| 浏览器兼容性 | 低 | 目标现代浏览器，提供降级提示 |
| Canvas 导出性能 | 中 | 异步导出，进度反馈，限制分辨率 |
| 复杂项目文件加载慢 | 中 | 懒加载，进度条，分块加载 |

## 10. 实施建议

### 开发阶段划分

**Phase 1 (MVP)**:
- 图片加载和基础操作（拖拽、旋转、缩放、删除）
- 简单的工具栏和画布
- 预计 2 周

**Phase 2**:
- 序号节点标注
- 标注列表和管理
- 预计 1 周

**Phase 3**:
- 尺寸标注线
- 标注编辑功能
- 预计 1 周

**Phase 4**:
- 画布导出和项目保存/加载
- 模式切换
- 预计 1 周

**Phase 5**:
- 性能优化和测试
- 可访问性改进
- 预计 1 周

### 技术栈最终确认

✅ **Vue 3.3+** - 前端框架
✅ **Vite 5.0+** - 构建工具
✅ **TypeScript 5.2+** - 类型系统
✅ **Konva 9.2+ + vue-konva 3.0+** - Canvas 渲染引擎
✅ **Pinia 2.1+** - 状态管理
✅ **VueUse 10.0+** - 组合式工具
✅ **Element Plus 2.4+** - UI 组件
✅ **Tailwind CSS 3.3+** - 样式框架
✅ **Vitest** - 单元测试
✅ **Playwright** - E2E 测试

## 总结

技术选型完成，所有 NEEDS CLARIFICATION 项已解决。Konva.js 是图片编辑场景的最佳选择，结合 Vue3 Composition API 和 Pinia 状态管理，能够构建高性能、可维护的图片编辑标注组件。后续将按照 Phase 1-5 逐步实施，确保每个阶段都可独立测试和交付。
