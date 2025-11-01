# Data Model: 图片编辑标注组件

**Date**: 2025-10-31
**Feature**: 001-image-editor
**Phase**: 1 - Data Model Design

## Overview

本文档定义图片编辑标注组件的核心数据模型、实体关系、状态管理结构和数据验证规则。所有类型定义使用 TypeScript `interface`（遵循宪章要求），避免使用 `enum`，改用字符串字面量联合类型。

## Core Entities

### 1. EditorImage (图片实体)

代表画布上的单张图片对象。

```typescript
interface EditorImage {
  // 标识
  id: string                    // 唯一标识符 (UUID v4)
  name: string                  // 原始文件名

  // 图片资源
  src: string                   // Data URL 或 Blob URL
  imageElement: HTMLImageElement | null  // 加载的图片对象

  // 位置和变换
  position: {
    x: number                   // X 坐标 (相对于画布)
    y: number                   // Y 坐标 (相对于画布)
  }

  rotation: number              // 旋转角度 (0-360 度)

  scale: {
    x: number                   // X 轴缩放比例 (0.1-5.0)
    y: number                   // Y 轴缩放比例 (0.1-5.0)
  }

  // 尺寸
  size: {
    width: number               // 原始宽度 (像素)
    height: number              // 原始高度 (像素)
  }

  // 图层
  zIndex: number                // 层级顺序 (0-999)

  // 状态
  isSelected: boolean           // 是否被选中
  isLocked: boolean             // 是否锁定 (锁定后不可编辑)
  isVisible: boolean            // 是否可见

  // 元数据
  fileSize: number              // 文件大小 (字节)
  mimeType: string              // MIME 类型 (image/jpeg, image/png, etc.)
  createdAt: string             // 创建时间 (ISO 8601)
  modifiedAt: string            // 修改时间 (ISO 8601)
}
```

**验证规则**:
- `id`: 必须是有效的 UUID v4
- `name`: 非空字符串，最大 255 字符
- `src`: 必须是有效的 Data URL 或 Blob URL
- `rotation`: 0-360 范围内的数字
- `scale.x` 和 `scale.y`: 0.1-5.0 范围内的数字
- `zIndex`: 0-999 范围内的整数
- `fileSize`: 正整数，建议 < 10MB (10485760 字节)
- `mimeType`: 必须是支持的图片类型

**状态转换**:
```
[创建] → isSelected: false, isLocked: false, isVisible: true
[选中] → isSelected: true
[取消选中] → isSelected: false
[锁定] → isLocked: true (禁用拖拽、旋转、缩放、删除)
[解锁] → isLocked: false
[隐藏] → isVisible: false
[显示] → isVisible: true
[删除] → 从 images 数组移除
```

### 2. AnnotationNode (序号节点实体)

代表画布上的序号标记点。

```typescript
interface AnnotationNode {
  // 标识
  id: string                    // 唯一标识符 (UUID v4)

  // 位置
  position: {
    x: number                   // X 坐标 (相对于画布)
    y: number                   // Y 坐标 (相对于画布)
  }

  // 序号
  number: number                // 序号 (从 1 开始自动递增)

  // 样式
  style: {
    radius: number              // 圆圈半径 (像素，默认 20)
    fill: string                // 填充颜色 (CSS 颜色，默认 '#409EFF')
    stroke: string              // 边框颜色 (CSS 颜色，默认 '#FFFFFF')
    strokeWidth: number         // 边框宽度 (像素，默认 2)
    textColor: string           // 文字颜色 (CSS 颜色，默认 '#FFFFFF')
    fontSize: number            // 文字大小 (像素，默认 16)
  }

  // 状态
  isSelected: boolean           // 是否被选中
  isVisible: boolean            // 是否可见

  // 元数据
  createdAt: string             // 创建时间 (ISO 8601)
  modifiedAt: string            // 修改时间 (ISO 8601)
}
```

**验证规则**:
- `id`: 必须是有效的 UUID v4
- `number`: 正整数，自动分配，不可手动修改
- `style.radius`: 10-50 范围内的数字
- `style.fill`, `style.stroke`, `style.textColor`: 有效的 CSS 颜色值
- `style.strokeWidth`: 1-10 范围内的数字
- `style.fontSize`: 12-24 范围内的数字

**序号管理规则**:
- 创建新节点时，`number` 自动设置为 `maxNumber + 1`
- 删除节点后，后续节点的 `number` 自动重新排序
- 序号永远保持连续（1, 2, 3, ...）

### 3. AnnotationLine (标注线实体)

代表画布上的尺寸标注线。

```typescript
interface AnnotationLine {
  // 标识
  id: string                    // 唯一标识符 (UUID v4)

  // 位置 (线段的起点和终点)
  points: {
    start: {
      x: number                 // 起点 X 坐标
      y: number                 // 起点 Y 坐标
    }
    end: {
      x: number                 // 终点 X 坐标
      y: number                 // 终点 Y 坐标
    }
  }

  // 文本标注
  text: string                  // 标注文本 (如 "120cm")
  textPosition: {
    x: number                   // 文本 X 坐标 (自动计算或手动调整)
    y: number                   // 文本 Y 坐标 (自动计算或手动调整)
  }

  // 样式
  style: {
    stroke: string              // 线条颜色 (CSS 颜色，默认 '#F56C6C')
    strokeWidth: number         // 线条宽度 (像素，默认 2)
    lineCap: 'butt' | 'round' | 'square'  // 线条端点样式 (默认 'round')
    dash: number[]              // 虚线样式 (如 [5, 5] 表示虚线，[] 表示实线)
    textColor: string           // 文字颜色 (CSS 颜色，默认 '#F56C6C')
    fontSize: number            // 文字大小 (像素，默认 14)
    textBackground: string      // 文字背景 (CSS 颜色，默认 '#FFFFFF')
    showArrows: boolean         // 是否显示箭头 (默认 true)
  }

  // 状态
  isSelected: boolean           // 是否被选中
  isEditing: boolean            // 是否在编辑文本
  isVisible: boolean            // 是否可见

  // 元数据
  createdAt: string             // 创建时间 (ISO 8601)
  modifiedAt: string            // 修改时间 (ISO 8601)
}
```

**验证规则**:
- `id`: 必须是有效的 UUID v4
- `text`: 最大 100 字符
- `style.stroke`, `style.textColor`, `style.textBackground`: 有效的 CSS 颜色值
- `style.strokeWidth`: 1-10 范围内的数字
- `style.fontSize`: 10-24 范围内的数字
- `points.start` 和 `points.end`: 不能完全重合（距离 > 5 像素）

**自动计算**:
- `textPosition`: 默认位于线段中点上方 20px 处
- 线段长度（用于显示）: `Math.sqrt((end.x - start.x)^2 + (end.y - start.y)^2)`

### 4. Canvas (画布状态)

代表整个画布的配置和状态。

```typescript
interface CanvasState {
  // 画布配置
  config: {
    width: number               // 画布宽度 (像素)
    height: number              // 画布高度 (像素)
    backgroundColor: string     // 背景颜色 (CSS 颜色，默认 '#F5F5F5')
  }

  // 视图状态
  view: {
    scale: number               // 缩放比例 (0.1-5.0，默认 1.0)
    position: {
      x: number                 // 画布平移 X 偏移
      y: number                 // 画布平移 Y 偏移
    }
  }

  // 编辑模式
  mode: 'edit' | 'view'         // 'edit': 编辑模式, 'view': 查看模式

  // 工具状态
  activeTool: 'select' | 'annotation-node' | 'annotation-line' | 'pan'

  // 选中状态
  selection: {
    type: 'image' | 'annotation-node' | 'annotation-line' | null
    id: string | null           // 选中对象的 ID
  }

  // 元数据
  isModified: boolean           // 画布是否有未保存的修改
  lastSavedAt: string | null    // 最后保存时间 (ISO 8601)
}
```

**工具模式说明**:
- `select`: 选择模式，可以选中和操作对象
- `annotation-node`: 序号标注模式，点击创建序号节点
- `annotation-line`: 尺寸标注模式，拖拽创建标注线
- `pan`: 平移模式，拖拽画布移动视图

### 5. ProjectFile (项目文件)

代表可保存和加载的项目文件结构。

```typescript
interface ProjectFile {
  // 版本
  version: string               // 项目文件格式版本 (如 '1.0.0')

  // 元数据
  metadata: {
    name: string                // 项目名称
    description: string         // 项目描述
    createdAt: string           // 创建时间 (ISO 8601)
    modifiedAt: string          // 修改时间 (ISO 8601)
    author: string              // 创建者 (可选)
  }

  // 画布状态
  canvas: {
    width: number
    height: number
    backgroundColor: string
  }

  // 图片数据
  images: EditorImage[]

  // 标注数据
  annotations: {
    nodes: AnnotationNode[]
    lines: AnnotationLine[]
  }
}
```

**序列化规则**:
- 小项目（< 5MB）: 图片 `src` 使用 Base64 Data URL
- 大项目（>= 5MB）: 图片 `src` 使用相对路径，打包为 ZIP
- `imageElement` 字段不序列化（加载时重新创建）

### 6. HistoryState (历史记录)

支持撤销/重做功能的历史状态。

```typescript
interface HistoryState {
  // 历史记录栈
  past: HistorySnapshot[]       // 过去的状态 (用于撤销)
  present: HistorySnapshot      // 当前状态
  future: HistorySnapshot[]     // 未来的状态 (用于重做)

  // 配置
  maxHistorySize: number        // 最大历史记录数 (默认 50)
}

interface HistorySnapshot {
  images: EditorImage[]
  annotations: {
    nodes: AnnotationNode[]
    lines: AnnotationLine[]
  }
  timestamp: string             // 快照时间 (ISO 8601)
  action: string                // 操作描述 (如 'add-image', 'delete-node')
}
```

**历史管理规则**:
- 每次修改操作创建新快照
- 撤销: `present → past`, `future.pop() → present`
- 重做: `present → future`, `past.pop() → present`
- 新操作清空 `future` 栈
- 超过 `maxHistorySize` 时移除最早的快照

## Entity Relationships

```
Canvas (1)
  ├── images (1:N) → EditorImage
  └── annotations (1:1)
      ├── nodes (1:N) → AnnotationNode
      └── lines (1:N) → AnnotationLine

ProjectFile (1)
  ├── metadata (1:1)
  ├── canvas (1:1) → Canvas config
  ├── images (1:N) → EditorImage
  └── annotations (1:1)
      ├── nodes (1:N) → AnnotationNode
      └── lines (1:N) → AnnotationLine

HistoryState (1)
  ├── past (1:N) → HistorySnapshot
  ├── present (1:1) → HistorySnapshot
  └── future (1:N) → HistorySnapshot
```

## Data Validation

### 通用验证函数

```typescript
// UUID v4 验证
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

// CSS 颜色验证
function isValidColor(color: string): boolean {
  const s = new Option().style
  s.color = color
  return s.color !== ''
}

// 范围验证
function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

// ISO 8601 日期验证
function isValidISODate(date: string): boolean {
  return !isNaN(Date.parse(date))
}
```

### 实体验证器

```typescript
// 图片实体验证
function validateEditorImage(image: EditorImage): string[] {
  const errors: string[] = []

  if (!isValidUUID(image.id)) errors.push('Invalid image ID')
  if (!image.name || image.name.length > 255) errors.push('Invalid image name')
  if (!isInRange(image.rotation, 0, 360)) errors.push('Rotation out of range')
  if (!isInRange(image.scale.x, 0.1, 5.0)) errors.push('Scale X out of range')
  if (!isInRange(image.scale.y, 0.1, 5.0)) errors.push('Scale Y out of range')
  if (!isInRange(image.zIndex, 0, 999)) errors.push('Z-index out of range')

  return errors
}

// 标注节点验证
function validateAnnotationNode(node: AnnotationNode): string[] {
  const errors: string[] = []

  if (!isValidUUID(node.id)) errors.push('Invalid node ID')
  if (node.number < 1) errors.push('Invalid node number')
  if (!isValidColor(node.style.fill)) errors.push('Invalid fill color')
  if (!isInRange(node.style.radius, 10, 50)) errors.push('Radius out of range')

  return errors
}

// 标注线验证
function validateAnnotationLine(line: AnnotationLine): string[] {
  const errors: string[] = []

  if (!isValidUUID(line.id)) errors.push('Invalid line ID')
  if (line.text.length > 100) errors.push('Text too long')
  if (!isValidColor(line.style.stroke)) errors.push('Invalid stroke color')

  const distance = Math.sqrt(
    Math.pow(line.points.end.x - line.points.start.x, 2) +
    Math.pow(line.points.end.y - line.points.start.y, 2)
  )
  if (distance < 5) errors.push('Line too short')

  return errors
}
```

## Default Values

### 默认图片配置

```typescript
const DEFAULT_IMAGE: Partial<EditorImage> = {
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
  zIndex: 0,
  isSelected: false,
  isLocked: false,
  isVisible: true,
}
```

### 默认标注节点配置

```typescript
const DEFAULT_ANNOTATION_NODE: Partial<AnnotationNode> = {
  style: {
    radius: 20,
    fill: '#409EFF',
    stroke: '#FFFFFF',
    strokeWidth: 2,
    textColor: '#FFFFFF',
    fontSize: 16,
  },
  isSelected: false,
  isVisible: true,
}
```

### 默认标注线配置

```typescript
const DEFAULT_ANNOTATION_LINE: Partial<AnnotationLine> = {
  text: '',
  style: {
    stroke: '#F56C6C',
    strokeWidth: 2,
    lineCap: 'round',
    dash: [],
    textColor: '#F56C6C',
    fontSize: 14,
    textBackground: '#FFFFFF',
    showArrows: true,
  },
  isSelected: false,
  isEditing: false,
  isVisible: true,
}
```

### 默认画布配置

```typescript
const DEFAULT_CANVAS: CanvasState = {
  config: {
    width: 1920,
    height: 1080,
    backgroundColor: '#F5F5F5',
  },
  view: {
    scale: 1.0,
    position: { x: 0, y: 0 },
  },
  mode: 'edit',
  activeTool: 'select',
  selection: {
    type: null,
    id: null,
  },
  isModified: false,
  lastSavedAt: null,
}
```

## Data Migration

### 版本兼容性

**当前版本**: 1.0.0

**迁移策略**:
```typescript
function migrateProjectFile(file: any): ProjectFile {
  const version = file.version || '1.0.0'

  switch (version) {
    case '1.0.0':
      return file as ProjectFile

    // 未来版本迁移逻辑
    // case '2.0.0':
    //   return migrateFrom1To2(file)

    default:
      throw new Error(`Unsupported project file version: ${version}`)
  }
}
```

## Summary

数据模型设计完成，定义了 6 个核心实体（EditorImage, AnnotationNode, AnnotationLine, Canvas, ProjectFile, HistoryState），明确了实体关系、验证规则和默认值。所有类型定义遵循宪章要求，使用 TypeScript `interface` 和字符串字面量联合类型，确保类型安全和可维护性。
