# Store API Contracts: 图片编辑标注组件

**Date**: 2025-10-31
**Feature**: 001-image-editor
**Phase**: 1 - Contract Definition

## Overview

本文档定义图片编辑标注组件的 Pinia Store API 接口契约。由于这是前端组件，不涉及 HTTP REST API，因此定义的是 Store 的 State、Getters、Actions 接口规范，确保组件间通信的一致性和可测试性。

## 1. Canvas Store (useCanvasStore)

管理画布的全局配置和状态。

### State

```typescript
interface CanvasStoreState {
  config: {
    width: number
    height: number
    backgroundColor: string
  }
  view: {
    scale: number
    position: { x: number; y: number }
  }
  mode: 'edit' | 'view'
  activeTool: 'select' | 'annotation-node' | 'annotation-line' | 'pan'
  selection: {
    type: 'image' | 'annotation-node' | 'annotation-line' | null
    id: string | null
  }
  isModified: boolean
  lastSavedAt: string | null
}
```

### Getters

```typescript
interface CanvasStoreGetters {
  // 是否处于编辑模式
  isEditMode: ComputedRef<boolean>

  // 是否有选中对象
  hasSelection: ComputedRef<boolean>

  // 选中对象的详细信息
  selectedObject: ComputedRef<EditorImage | AnnotationNode | AnnotationLine | null>

  // 画布是否需要保存
  needsSave: ComputedRef<boolean>
}
```

### Actions

```typescript
interface CanvasStoreActions {
  // 设置画布尺寸
  setCanvasSize(width: number, height: number): void

  // 设置背景颜色
  setBackgroundColor(color: string): void

  // 缩放画布
  zoomIn(): void
  zoomOut(): void
  zoomTo(scale: number): void
  resetZoom(): void

  // 平移画布
  panTo(x: number, y: number): void
  resetPan(): void

  // 切换模式
  setMode(mode: 'edit' | 'view'): void
  toggleMode(): void

  // 设置激活工具
  setActiveTool(tool: 'select' | 'annotation-node' | 'annotation-line' | 'pan'): void

  // 选择对象
  selectObject(type: 'image' | 'annotation-node' | 'annotation-line', id: string): void
  clearSelection(): void

  // 标记修改状态
  markAsModified(): void
  markAsSaved(): void

  // 重置画布
  resetCanvas(): void
}
```

**事件触发**:
- `setMode('view')`: 自动调用 `clearSelection()` 和 `setActiveTool('pan')`
- `markAsModified()`: 设置 `isModified = true`
- `markAsSaved()`: 设置 `isModified = false`, `lastSavedAt = new Date().toISOString()`

---

## 2. Images Store (useImagesStore)

管理画布上的所有图片对象。

### State

```typescript
interface ImagesStoreState {
  images: EditorImage[]
  isLoading: boolean
  loadingProgress: number  // 0-100
  maxZIndex: number
}
```

### Getters

```typescript
interface ImagesStoreGetters {
  // 所有可见图片
  visibleImages: ComputedRef<EditorImage[]>

  // 选中的图片
  selectedImage: ComputedRef<EditorImage | null>

  // 按 zIndex 排序的图片
  sortedImages: ComputedRef<EditorImage[]>

  // 图片总数
  imageCount: ComputedRef<number>

  // 是否有图片
  hasImages: ComputedRef<boolean>

  // 根据 ID 获取图片
  getImageById: (id: string) => EditorImage | undefined
}
```

### Actions

```typescript
interface ImagesStoreActions {
  // 添加图片
  addImage(image: Omit<EditorImage, 'id' | 'createdAt' | 'modifiedAt'>): Promise<string>
  addImages(images: Array<Omit<EditorImage, 'id' | 'createdAt' | 'modifiedAt'>>): Promise<string[]>

  // 加载图片文件
  loadImageFromFile(file: File): Promise<string>
  loadImagesFromFiles(files: File[]): Promise<string[]>

  // 更新图片
  updateImage(id: string, updates: Partial<EditorImage>): void
  updateImagePosition(id: string, x: number, y: number): void
  updateImageRotation(id: string, rotation: number): void
  updateImageScale(id: string, scaleX: number, scaleY: number): void

  // 删除图片
  deleteImage(id: string): void
  deleteImages(ids: string[]): void
  deleteAllImages(): void

  // 图层操作
  bringToFront(id: string): void
  sendToBack(id: string): void
  bringForward(id: string): void
  sendBackward(id: string): void

  // 选择操作
  selectImage(id: string): void
  deselectImage(id: string): void
  selectAllImages(): void
  deselectAllImages(): void

  // 锁定/解锁
  lockImage(id: string): void
  unlockImage(id: string): void

  // 显示/隐藏
  showImage(id: string): void
  hideImage(id: string): void
}
```

**副作用**:
- `addImage`, `loadImageFromFile`: 自动分配 zIndex, 调用 `canvasStore.markAsModified()`
- `deleteImage`: 同时删除关联的标注（如果有吸附关系）
- `selectImage`: 调用 `canvasStore.selectObject('image', id)`

---

## 3. Annotations Store (useAnnotationsStore)

管理画布上的所有标注对象（序号节点和标注线）。

### State

```typescript
interface AnnotationsStoreState {
  nodes: AnnotationNode[]
  lines: AnnotationLine[]
  maxNodeNumber: number
}
```

### Getters

```typescript
interface AnnotationsStoreGetters {
  // 所有可见节点
  visibleNodes: ComputedRef<AnnotationNode[]>

  // 所有可见标注线
  visibleLines: ComputedRef<AnnotationLine[]>

  // 选中的标注节点
  selectedNode: ComputedRef<AnnotationNode | null>

  // 选中的标注线
  selectedLine: ComputedRef<AnnotationLine | null>

  // 标注总数
  nodeCount: ComputedRef<number>
  lineCount: ComputedRef<number>
  totalAnnotationCount: ComputedRef<number>

  // 是否有标注
  hasAnnotations: ComputedRef<boolean>

  // 根据 ID 获取标注
  getNodeById: (id: string) => AnnotationNode | undefined
  getLineById: (id: string) => AnnotationLine | undefined
}
```

### Actions

```typescript
interface AnnotationsStoreActions {
  // === 序号节点操作 ===

  // 添加序号节点
  addNode(position: { x: number; y: number }): string

  // 更新节点
  updateNode(id: string, updates: Partial<AnnotationNode>): void
  updateNodePosition(id: string, x: number, y: number): void

  // 删除节点
  deleteNode(id: string): void
  deleteAllNodes(): void

  // 重新编号（内部使用，删除节点后自动调用）
  _renumberNodes(): void

  // === 标注线操作 ===

  // 添加标注线
  addLine(start: { x: number; y: number }, end: { x: number; y: number }): string

  // 更新标注线
  updateLine(id: string, updates: Partial<AnnotationLine>): void
  updateLinePoints(id: string, start: { x: number; y: number }, end: { x: number; y: number }): void
  updateLineText(id: string, text: string): void

  // 删除标注线
  deleteLine(id: string): void
  deleteAllLines(): void

  // === 选择操作 ===

  selectNode(id: string): void
  selectLine(id: string): void
  deselectAllAnnotations(): void

  // === 编辑状态 ===

  startEditingLine(id: string): void
  stopEditingLine(id: string): void

  // === 批量操作 ===

  deleteAllAnnotations(): void

  // === 样式操作 ===

  updateNodeStyle(id: string, style: Partial<AnnotationNode['style']>): void
  updateLineStyle(id: string, style: Partial<AnnotationLine['style']>): void
}
```

**副作用**:
- `addNode`: 自动分配 `number = maxNodeNumber + 1`, 调用 `canvasStore.markAsModified()`
- `deleteNode`: 自动调用 `_renumberNodes()` 重新编号
- `addLine`, `updateLinePoints`: 自动计算 `textPosition` (线段中点上方 20px)
- `selectNode`, `selectLine`: 调用 `canvasStore.selectObject()`

---

## 4. History Store (useHistoryStore)

管理撤销/重做功能。

### State

```typescript
interface HistoryStoreState {
  past: HistorySnapshot[]
  present: HistorySnapshot
  future: HistorySnapshot[]
  maxHistorySize: number
}
```

### Getters

```typescript
interface HistoryStoreGetters {
  // 是否可以撤销
  canUndo: ComputedRef<boolean>

  // 是否可以重做
  canRedo: ComputedRef<boolean>

  // 历史记录数量
  historyCount: ComputedRef<number>

  // 当前操作描述
  currentAction: ComputedRef<string>
}
```

### Actions

```typescript
interface HistoryStoreActions {
  // 记录新快照
  pushSnapshot(action: string): void

  // 撤销
  undo(): void

  // 重做
  redo(): void

  // 清空历史
  clearHistory(): void

  // 设置最大历史数
  setMaxHistorySize(size: number): void
}
```

**使用模式**:
```typescript
// 在每个修改操作后调用
imagesStore.addImage(...)
historyStore.pushSnapshot('add-image')

// 撤销/重做时恢复状态
historyStore.undo() // 自动恢复 images 和 annotations 状态
```

---

## 5. Project Store (useProjectStore)

管理项目文件的保存和加载。

### State

```typescript
interface ProjectStoreState {
  currentProject: ProjectFile | null
  projectName: string
  isSaving: boolean
  isLoading: boolean
}
```

### Getters

```typescript
interface ProjectStoreGetters {
  // 是否有打开的项目
  hasProject: ComputedRef<boolean>

  // 项目文件名
  projectFileName: ComputedRef<string>

  // 项目大小（估算）
  estimatedProjectSize: ComputedRef<number>
}
```

### Actions

```typescript
interface ProjectStoreActions {
  // 创建新项目
  createNewProject(name: string): void

  // 保存项目
  saveProject(): Promise<void>
  saveProjectAs(name: string): Promise<void>

  // 加载项目
  loadProjectFromFile(file: File): Promise<void>
  loadProjectFromJSON(json: string): Promise<void>

  // 导出画布为图片
  exportCanvasAsImage(format: 'png' | 'jpeg', quality?: number): Promise<void>

  // 自动保存
  enableAutoSave(intervalMs: number): void
  disableAutoSave(): void

  // 关闭项目
  closeProject(): void
}
```

**保存策略**:
- 小项目（< 5MB）: 导出为单个 JSON 文件，图片 Base64 嵌入
- 大项目（>= 5MB）: 导出为 ZIP 文件，包含 JSON + 图片文件

**加载流程**:
1. 读取项目文件
2. 验证版本和格式
3. 恢复画布状态 (`canvasStore`)
4. 恢复图片 (`imagesStore`)
5. 恢复标注 (`annotationsStore`)
6. 清空历史记录 (`historyStore`)

---

## Store 交互流程

### 1. 加载图片流程

```
User Action (选择文件)
  ↓
imagesStore.loadImagesFromFiles(files)
  ↓
  ├─→ 创建 HTMLImageElement 对象
  ├─→ 生成 Data URL
  ├─→ 添加到 images 数组
  └─→ canvasStore.markAsModified()
  ↓
historyStore.pushSnapshot('add-images')
```

### 2. 创建序号节点流程

```
User Action (点击画布)
  ↓
canvasStore.activeTool === 'annotation-node'
  ↓
annotationsStore.addNode({ x, y })
  ↓
  ├─→ 分配 number = maxNodeNumber + 1
  ├─→ 添加到 nodes 数组
  └─→ canvasStore.markAsModified()
  ↓
historyStore.pushSnapshot('add-node')
```

### 3. 删除图片流程

```
User Action (点击删除按钮)
  ↓
imagesStore.deleteImage(id)
  ↓
  ├─→ 从 images 数组移除
  ├─→ 释放 Blob URL
  ├─→ canvasStore.clearSelection()
  └─→ canvasStore.markAsModified()
  ↓
historyStore.pushSnapshot('delete-image')
```

### 4. 模式切换流程

```
User Action (切换到查看模式)
  ↓
canvasStore.setMode('view')
  ↓
  ├─→ mode = 'view'
  ├─→ clearSelection()
  ├─→ setActiveTool('pan')
  └─→ 触发 UI 更新（隐藏所有控制）
```

### 5. 保存项目流程

```
User Action (点击保存)
  ↓
projectStore.saveProject()
  ↓
  ├─→ 收集 canvasStore 状态
  ├─→ 收集 imagesStore.images
  ├─→ 收集 annotationsStore (nodes + lines)
  ├─→ 序列化为 ProjectFile
  ├─→ 生成 JSON 或 ZIP
  └─→ 触发浏览器下载
  ↓
canvasStore.markAsSaved()
```

## Error Handling

所有 Actions 应当实现错误处理：

```typescript
async loadImageFromFile(file: File): Promise<string> {
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('Invalid file type')
    }

    // 验证文件大小
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds 10MB limit')
    }

    // 加载图片
    const image = await loadImage(file)
    const id = this.addImage({ ... })

    return id
  } catch (error) {
    console.error('Failed to load image:', error)
    // 触发 UI 错误提示
    useNotification().error('图片加载失败', error.message)
    throw error
  }
}
```

## Testing Contracts

每个 Store 应提供单元测试覆盖：

```typescript
// 示例: imagesStore 测试
describe('useImagesStore', () => {
  it('should add image correctly', () => {
    const store = useImagesStore()
    const id = store.addImage({ name: 'test.jpg', src: 'data:...', ... })

    expect(store.images).toHaveLength(1)
    expect(store.images[0].id).toBe(id)
  })

  it('should delete image and call markAsModified', () => {
    const store = useImagesStore()
    const canvasStore = useCanvasStore()
    const spy = vi.spyOn(canvasStore, 'markAsModified')

    const id = store.addImage({ ... })
    store.deleteImage(id)

    expect(store.images).toHaveLength(0)
    expect(spy).toHaveBeenCalled()
  })
})
```

## Summary

Store API 契约定义完成，包含 5 个核心 Store：
- **CanvasStore**: 画布配置和状态管理
- **ImagesStore**: 图片 CRUD 和操作
- **AnnotationsStore**: 标注 CRUD 和操作
- **HistoryStore**: 撤销/重做功能
- **ProjectStore**: 项目文件保存/加载

所有 Store 遵循 Pinia 最佳实践，提供清晰的 State、Getters、Actions 接口，确保组件间通信一致性和可测试性。
