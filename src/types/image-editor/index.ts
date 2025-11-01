// 图片编辑标注组件 - 核心类型定义
// 遵循宪章要求：使用 interface，避免 enum

// ========== 图片实体 ==========
export interface EditorImage {
  // 标识
  id: string
  name: string

  // 图片资源
  src: string
  imageElement: HTMLImageElement | null

  // 位置和变换
  position: {
    x: number
    y: number
  }
  rotation: number // 0-360 度
  scale: {
    x: number // 0.1-5.0
    y: number // 0.1-5.0
  }

  // 尺寸
  size: {
    width: number
    height: number
  }

  // 图层
  zIndex: number // 0-999

  // 状态
  isSelected: boolean
  isLocked: boolean
  isVisible: boolean

  // 元数据
  fileSize: number
  mimeType: string
  createdAt: string
  modifiedAt: string
}

// ========== 标注节点 ==========
export interface AnnotationNode {
  // 标识
  id: string

  // 位置
  position: {
    x: number
    y: number
  }

  // 序号
  number: number

  // 样式
  style: {
    radius: number
    fill: string
    stroke: string
    strokeWidth: number
    textColor: string
    fontSize: number
  }

  // 状态
  isSelected: boolean
  isVisible: boolean

  // 元数据
  createdAt: string
  modifiedAt: string
}

// ========== 标注线 ==========
export interface AnnotationLine {
  // 标识
  id: string

  // 位置（线段的起点和终点）
  points: {
    start: {
      x: number
      y: number
    }
    end: {
      x: number
      y: number
    }
  }

  // 文本标注
  text: string
  textPosition: {
    x: number
    y: number
  }

  // 样式
  style: {
    stroke: string
    strokeWidth: number
    lineCap: 'butt' | 'round' | 'square'
    dash: number[]
    textColor: string
    fontSize: number
    textBackground: string
    showArrows: boolean
  }

  // 状态
  isSelected: boolean
  isEditing: boolean
  isVisible: boolean

  // 元数据
  createdAt: string
  modifiedAt: string
}

// ========== 画布状态 ==========
export interface CanvasState {
  // 画布配置
  config: {
    width: number
    height: number
    backgroundColor: string
  }

  // 视图状态
  view: {
    scale: number // 0.1-5.0
    position: {
      x: number
      y: number
    }
  }

  // 编辑模式
  mode: 'edit' | 'view'

  // 工具状态
  activeTool: 'select' | 'annotation-node' | 'annotation-line' | 'pan'

  // 选中状态
  selection: {
    type: 'image' | 'annotation-node' | 'annotation-line' | null
    id: string | null
  }

  // 元数据
  isModified: boolean
  lastSavedAt: string | null
}

// ========== 项目文件 ==========
export interface ProjectFile {
  // 版本
  version: string

  // 元数据
  metadata: {
    name: string
    description: string
    createdAt: string
    modifiedAt: string
    author: string
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

// ========== 历史记录 ==========
export interface HistorySnapshot {
  images: EditorImage[]
  annotations: {
    nodes: AnnotationNode[]
    lines: AnnotationLine[]
  }
  timestamp: string
  action: string
}

export interface HistoryState {
  past: HistorySnapshot[]
  present: HistorySnapshot
  future: HistorySnapshot[]
  maxHistorySize: number
}
