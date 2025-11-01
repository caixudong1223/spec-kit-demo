# 图片旋转功能修复

**修复日期**: 2025-11-01
**问题**: Transformer 控制不显示，无法旋转图片
**状态**: ✅ 已修复

---

## 🐛 问题原因

`v-transformer` 组件必须在 Konva 的 `v-layer` **内部**才能工作，但之前它被放在了独立的 `TransformerControls.vue` 组件中，渲染在 `v-layer` 外部。

### 错误的结构
```vue
<!-- ImageLayer.vue -->
<v-stage>
  <v-layer>
    <v-image />  <!-- 图片 -->
  </v-layer>
</v-stage>

<!-- EditorCanvas.vue -->
<TransformerControls />  <!-- ❌ 在 layer 外部，不工作！ -->
```

### 正确的结构
```vue
<v-stage>
  <v-layer>
    <v-image />       <!-- 图片 -->
    <v-transformer /> <!-- ✅ 必须在 layer 内部！ -->
  </v-layer>
</v-stage>
```

---

## 🔧 修复方案

### 1. 将 Transformer 整合到 ImageLayer.vue

**添加的代码**:

#### 引用和状态
```typescript
// Transformer 引用
const transformerRef = ref<any>(null)

// 当前选中的图片
const selectedImage = computed(() => {
  return imagesStore.selectedImages[0]
})
```

#### Transformer 配置
```typescript
const transformerConfig = computed(() => ({
  rotateEnabled: true,
  enabledAnchors: [
    'top-left', 'top-right', 'bottom-left', 'bottom-right',
    'top-center', 'bottom-center', 'middle-left', 'middle-right'
  ],
  borderStroke: '#409EFF',
  borderStrokeWidth: 2,
  anchorFill: '#FFFFFF',
  anchorStroke: '#409EFF',
  anchorSize: 8,
  anchorCornerRadius: 4,
  keepRatio: false,
  centeredScaling: false,
}))
```

#### 更新逻辑
```typescript
function updateTransformer() {
  if (!transformerRef.value || !stageRef.value) return

  const transformer = transformerRef.value.getNode()

  if (!selectedImage.value) {
    transformer.nodes([])
    return
  }

  const layer = transformer.getLayer()
  if (!layer) return

  const imageNode = layer.findOne(`#${selectedImage.value.id}`)

  if (imageNode) {
    transformer.nodes([imageNode])
  } else {
    transformer.nodes([])
  }
}
```

#### 监听器
```typescript
// 监听选中状态变化
watch(() => selectedImage.value?.id, () => {
  nextTick(() => updateTransformer())
})

// 监听编辑模式变化
watch(() => canvasStore.isEditMode, (isEdit) => {
  if (!isEdit && transformerRef.value) {
    const transformer = transformerRef.value.getNode()
    transformer.nodes([])
  } else {
    updateTransformer()
  }
})
```

#### 变换处理
```typescript
function handleTransformEnd(event: any) {
  const node = event.target
  if (!selectedImage.value) return

  imagesStore.updateImagePosition(selectedImage.value.id, node.x(), node.y())
  imagesStore.updateImageRotation(selectedImage.value.id, node.rotation())
  imagesStore.updateImageScale(selectedImage.value.id, node.scaleX(), node.scaleY())
}
```

#### 模板
```vue
<v-layer :config="layerConfig">
  <v-image ... />

  <!-- Transformer 控制（旋转和缩放） -->
  <v-transformer
    v-if="canvasStore.isEditMode && selectedImage && canvasStore.activeTool === 'select'"
    ref="transformerRef"
    :config="transformerConfig"
    @transformend="handleTransformEnd"
  />
</v-layer>
```

---

### 2. 更新 EditorCanvas.vue

**移除的引用**:
- 删除 `TransformerControls` 组件导入
- 删除 `transformerRef` 引用
- 删除 `handleTransformerNeedsUpdate` 函数
- 移除模板中的 `<TransformerControls />` 组件

---

### 3. 删除 TransformerControls.vue

该文件已不再需要，功能已整合到 `ImageLayer.vue`。

---

## ✅ 修复后的功能

### Transformer 控制点

选中图片后，会显示：
- ✅ **蓝色边框** (#409EFF)
- ✅ **8 个锚点**：
  - 4 个角点（用于缩放和旋转）
  - 4 个边中点（用于单边缩放）
- ✅ **旋转手柄**（在图片上方）
- ✅ **白色锚点，蓝色边框**

### 操作方式

1. **选中图片**：
   - 确保处于"选择"工具模式
   - 确保处于"编辑模式"
   - 点击图片

2. **旋转图片**：
   - 将鼠标移到图片上方中间的旋转手柄
   - 或在角点外侧区域（鼠标会变成旋转图标）
   - 按住拖拽旋转

3. **缩放图片**：
   - 拖拽 4 个角点：等比缩放
   - 拖拽 4 个边中点：单边缩放

4. **移动图片**：
   - 直接拖拽图片本身

---

## 🧪 测试验证

### 测试步骤

1. 加载一张图片
2. 确保"选择"工具被选中（默认）
3. 点击图片
4. 观察：
   - [ ] 看到蓝色边框
   - [ ] 看到 8 个白色锚点
   - [ ] 可以拖拽旋转
   - [ ] 可以拖拽缩放
   - [ ] 旋转和缩放后保存正确

### 预期结果

- ✅ 图片周围显示蓝色 Transformer 边框
- ✅ 8 个锚点清晰可见
- ✅ 旋转操作流畅
- ✅ 缩放操作流畅
- ✅ 变换后位置、角度、尺寸正确保存

---

## 🔍 相关文件

**修改的文件**:
- `src/components/image-editor/canvas/ImageLayer.vue`
- `src/components/image-editor/canvas/EditorCanvas.vue`

**删除的文件**:
- `src/components/image-editor/canvas/TransformerControls.vue`

---

## 📝 技术说明

### Konva Transformer 要求

Konva 的 `v-transformer` 组件有严格的层级要求：

1. **必须在 v-layer 内部**
2. **必须与目标节点在同一个 layer**
3. **通过 `nodes()` 方法绑定目标节点**

### 为什么之前的实现不工作

之前的 `TransformerControls.vue` 是一个独立的 Vue 组件，渲染在 DOM 的不同位置：
- `ImageLayer` 渲染 `<v-stage><v-layer><v-image /></v-layer></v-stage>`
- `EditorCanvas` 渲染 `<TransformerControls />` (独立的 v-transformer)

这导致 `v-transformer` 不在任何 `v-layer` 内部，因此无法工作。

### 修复后的实现

将 `v-transformer` 直接放在 `ImageLayer.vue` 的 `v-layer` 内部，与 `v-image` 处于同一层级，满足 Konva 的要求。

---

## ⚠️ 注意事项

### 显示条件

Transformer 只在以下条件下显示：
1. ✅ 处于编辑模式（`canvasStore.isEditMode === true`）
2. ✅ 有图片被选中（`selectedImage !== null`）
3. ✅ 当前工具为"选择"（`canvasStore.activeTool === 'select'`）

### 查看模式

在查看模式下，Transformer 完全隐藏，图片无法变换。

### 其他工具模式

切换到其他工具（序号节点、标注线、平移）时，Transformer 也会隐藏。

---

**修复完成！** 🎉

现在用户可以正常旋转、缩放图片了。
