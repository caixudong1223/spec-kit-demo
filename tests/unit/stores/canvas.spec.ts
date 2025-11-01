// useCanvasStore 单元测试
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCanvasStore } from '@/stores/image-editor/canvas'
import { DEFAULT_CANVAS } from '@/types/image-editor/defaults'

describe('useCanvasStore', () => {
  beforeEach(() => {
    // 每个测试前创建新的 Pinia 实例
    setActivePinia(createPinia())
  })

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const store = useCanvasStore()

      expect(store.config.width).toBe(DEFAULT_CANVAS.config.width)
      expect(store.config.height).toBe(DEFAULT_CANVAS.config.height)
      expect(store.config.backgroundColor).toBe(DEFAULT_CANVAS.config.backgroundColor)
      expect(store.mode).toBe('edit')
      expect(store.activeTool).toBe('select')
      expect(store.isModified).toBe(false)
    })

    it('应该正确初始化选择状态', () => {
      const store = useCanvasStore()

      expect(store.selection.type).toBeNull()
      expect(store.selection.id).toBeNull()
      expect(store.hasSelection).toBe(false)
    })
  })

  describe('画布尺寸', () => {
    it('应该能够设置画布尺寸', () => {
      const store = useCanvasStore()

      store.setCanvasSize(1280, 720)

      expect(store.config.width).toBe(1280)
      expect(store.config.height).toBe(720)
      expect(store.isModified).toBe(true)
    })

    it('应该能够设置背景颜色', () => {
      const store = useCanvasStore()

      store.setBackgroundColor('#FFFFFF')

      expect(store.config.backgroundColor).toBe('#FFFFFF')
      expect(store.isModified).toBe(true)
    })
  })

  describe('缩放操作', () => {
    it('应该能够放大画布', () => {
      const store = useCanvasStore()

      store.zoomIn()

      expect(store.view.scale).toBeGreaterThan(1.0)
    })

    it('应该能够缩小画布', () => {
      const store = useCanvasStore()

      store.zoomOut()

      expect(store.view.scale).toBeLessThan(1.0)
    })

    it('应该能够设置指定缩放比例', () => {
      const store = useCanvasStore()

      store.zoomTo(2.5)

      expect(store.view.scale).toBe(2.5)
    })

    it('应该限制缩放在有效范围内', () => {
      const store = useCanvasStore()

      store.zoomTo(10) // 超过最大值
      expect(store.view.scale).toBe(5.0)

      store.zoomTo(0.01) // 低于最小值
      expect(store.view.scale).toBe(0.1)
    })

    it('应该能够重置缩放', () => {
      const store = useCanvasStore()

      store.zoomTo(2.5)
      store.resetZoom()

      expect(store.view.scale).toBe(1.0)
    })
  })

  describe('平移操作', () => {
    it('应该能够平移画布', () => {
      const store = useCanvasStore()

      store.panTo(100, 200)

      expect(store.view.position.x).toBe(100)
      expect(store.view.position.y).toBe(200)
    })

    it('应该能够重置平移', () => {
      const store = useCanvasStore()

      store.panTo(100, 200)
      store.resetPan()

      expect(store.view.position.x).toBe(0)
      expect(store.view.position.y).toBe(0)
    })
  })

  describe('模式切换', () => {
    it('应该能够切换到查看模式', () => {
      const store = useCanvasStore()

      store.setMode('view')

      expect(store.mode).toBe('view')
      expect(store.isEditMode).toBe(false)
    })

    it('切换到查看模式时应该自动清除选择', () => {
      const store = useCanvasStore()

      store.selectObject('image', 'test-id')
      store.setMode('view')

      expect(store.selection.type).toBeNull()
      expect(store.selection.id).toBeNull()
    })

    it('切换到查看模式时应该自动设置为平移工具', () => {
      const store = useCanvasStore()

      store.setActiveTool('annotation-node')
      store.setMode('view')

      expect(store.activeTool).toBe('pan')
    })

    it('应该能够切换模式', () => {
      const store = useCanvasStore()

      expect(store.mode).toBe('edit')

      store.toggleMode()
      expect(store.mode).toBe('view')

      store.toggleMode()
      expect(store.mode).toBe('edit')
    })
  })

  describe('工具切换', () => {
    it('应该能够设置激活工具', () => {
      const store = useCanvasStore()

      store.setActiveTool('annotation-node')
      expect(store.activeTool).toBe('annotation-node')

      store.setActiveTool('annotation-line')
      expect(store.activeTool).toBe('annotation-line')
    })
  })

  describe('选择操作', () => {
    it('应该能够选中对象', () => {
      const store = useCanvasStore()

      store.selectObject('image', 'image-123')

      expect(store.selection.type).toBe('image')
      expect(store.selection.id).toBe('image-123')
      expect(store.hasSelection).toBe(true)
    })

    it('应该能够清除选择', () => {
      const store = useCanvasStore()

      store.selectObject('image', 'image-123')
      store.clearSelection()

      expect(store.selection.type).toBeNull()
      expect(store.selection.id).toBeNull()
      expect(store.hasSelection).toBe(false)
    })
  })

  describe('修改状态', () => {
    it('应该能够标记为已修改', () => {
      const store = useCanvasStore()

      store.markAsModified()

      expect(store.isModified).toBe(true)
      expect(store.needsSave).toBe(true)
    })

    it('应该能够标记为已保存', () => {
      const store = useCanvasStore()

      store.markAsModified()
      store.markAsSaved()

      expect(store.isModified).toBe(false)
      expect(store.lastSavedAt).not.toBeNull()
      expect(store.needsSave).toBe(false)
    })
  })

  describe('重置画布', () => {
    it('应该能够重置所有状态到默认值', () => {
      const store = useCanvasStore()

      // 修改一些状态
      store.setCanvasSize(1280, 720)
      store.zoomTo(2.0)
      store.panTo(100, 200)
      store.setMode('view')
      store.selectObject('image', 'test-id')
      store.markAsModified()

      // 重置
      store.resetCanvas()

      // 验证所有状态都已重置
      expect(store.config.width).toBe(DEFAULT_CANVAS.config.width)
      expect(store.config.height).toBe(DEFAULT_CANVAS.config.height)
      expect(store.view.scale).toBe(1.0)
      expect(store.view.position.x).toBe(0)
      expect(store.view.position.y).toBe(0)
      expect(store.mode).toBe('edit')
      expect(store.activeTool).toBe('select')
      expect(store.selection.type).toBeNull()
      expect(store.isModified).toBe(false)
      expect(store.lastSavedAt).toBeNull()
    })
  })

  describe('Getters', () => {
    it('canvasState 应该返回完整的画布状态', () => {
      const store = useCanvasStore()

      const state = store.canvasState

      expect(state).toHaveProperty('config')
      expect(state).toHaveProperty('view')
      expect(state).toHaveProperty('mode')
      expect(state).toHaveProperty('activeTool')
      expect(state).toHaveProperty('selection')
      expect(state).toHaveProperty('isModified')
      expect(state).toHaveProperty('lastSavedAt')
    })
  })
})
