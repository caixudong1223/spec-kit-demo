// 图片编辑标注组件 - 默认值配置
import type {
  EditorImage,
  AnnotationNode,
  AnnotationLine,
  CanvasState,
} from '@/types/image-editor'

// ========== 默认图片配置 ==========
export const DEFAULT_IMAGE: Partial<EditorImage> = {
  position: { x: 0, y: 0 },
  rotation: 0,
  scale: { x: 1, y: 1 },
  zIndex: 0,
  isSelected: false,
  isLocked: false,
  isVisible: true,
}

// ========== 默认标注节点配置 ==========
export const DEFAULT_ANNOTATION_NODE: Partial<AnnotationNode> = {
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

// ========== 默认标注线配置 ==========
export const DEFAULT_ANNOTATION_LINE: Partial<AnnotationLine> = {
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

// ========== 默认画布配置 ==========
export const DEFAULT_CANVAS: CanvasState = {
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

// ========== 画布尺寸预设 ==========
export const CANVAS_PRESETS = {
  HD: { width: 1920, height: 1080, name: '1080p (Full HD)' },
  '4K': { width: 3840, height: 2160, name: '4K (UHD)' },
  A4: { width: 2480, height: 3508, name: 'A4 (210x297mm @ 300dpi)' },
  SQUARE: { width: 1920, height: 1920, name: '正方形' },
} as const

// ========== 缩放限制 ==========
export const ZOOM_LIMITS = {
  MIN: 0.1,
  MAX: 5.0,
  STEP: 0.1,
  DEFAULT: 1.0,
} as const

// ========== 图片限制 ==========
export const IMAGE_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_IMAGES: 50,
  SUPPORTED_FORMATS: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
} as const

// ========== 标注限制 ==========
export const ANNOTATION_LIMITS = {
  MAX_NODES: 100,
  MAX_LINES: 100,
  MAX_TEXT_LENGTH: 100,
  MIN_LINE_LENGTH: 5, // 像素
} as const

// ========== 历史记录配置 ==========
export const HISTORY_CONFIG = {
  MAX_SIZE: 50,
} as const

// ========== 性能配置 ==========
export const PERFORMANCE_CONFIG = {
  DRAG_THROTTLE_MS: 16, // 60fps
  RESIZE_THROTTLE_MS: 16,
  TEXT_INPUT_DEBOUNCE_MS: 300,
  AUTOSAVE_INTERVAL_MS: 30000, // 30秒
} as const

// ========== 键盘快捷键 ==========
export const KEYBOARD_SHORTCUTS = {
  DELETE: 'Delete',
  UNDO: 'Control+z',
  REDO: 'Control+y',
  SAVE: 'Control+s',
  ESCAPE: 'Escape',
  SELECT_ALL: 'Control+a',
} as const

// ========== 项目文件版本 ==========
export const PROJECT_VERSION = '1.0.0'
