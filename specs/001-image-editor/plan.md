# Implementation Plan: 图片编辑标注组件

**Branch**: `001-image-editor` | **Date**: 2025-10-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-image-editor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

构建一个基于 Vue3 的图片编辑标注组件，支持多图片管理（加载、拖拽、旋转、缩放、删除）、两种标注功能（序号节点和尺寸标注线）、画布状态导出为图片、项目保存与加载，以及编辑模式与查看模式切换。技术方案采用 Vue3 + TypeScript + Vite + Konva.js 构建，Konva 提供高性能的 Canvas 渲染和交互能力，Vue3 Composition API 管理状态和逻辑，Pinia 处理复杂的画布状态管理，确保组件可测试、可维护且性能优秀。

## Technical Context

**Language/Version**: TypeScript 5.2+ / JavaScript ES2022
**Primary Dependencies**:
- Vue 3.3+ (Composition API)
- Vite 5.0+ (构建工具)
- Konva 9.2+ (Canvas 渲染引擎)
- vue-konva 3.0+ (Vue3 Konva 集成)
- Pinia 2.1+ (状态管理)
- VueUse 10.0+ (组合式工具库)
- Element Plus 2.4+ (UI 组件)
- Tailwind CSS 3.3+ (样式框架)

**Storage**:
- 浏览器本地存储（localStorage/IndexedDB 用于自动保存草稿）
- 文件系统（通过浏览器 File API 加载图片，下载 API 导出文件）

**Testing**:
- Vitest (单元测试，Vue 组件测试)
- @vue/test-utils (Vue 组件测试工具)
- Playwright (E2E 测试，用户交互流程测试)
- @testing-library/vue (用户行为驱动测试)

**Target Platform**:
- 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+, Edge 90+）
- 桌面优先（1920x1080 及以上），支持平板（1024x768）
- 移动端查看模式支持（768x1024）

**Project Type**: Single web application (Vue 3 SPA)

**Performance Goals**:
- 画布初始渲染 < 500ms
- 图片加载（5张，每张2MB）< 3s
- 交互操作响应 < 16ms (60fps)
- 导出 1920x1080 画布 < 2s
- 支持 20 张图片 + 100 个标注无性能降级

**Constraints**:
- 单张图片文件 < 10MB（建议）
- 画布最大尺寸 4096x4096
- 浏览器内存占用 < 500MB
- 项目文件大小 < 50MB
- 离线可用（PWA 可选）

**Scale/Scope**:
- 单用户本地编辑
- 单个画布项目支持 50+ 图片和 200+ 标注
- 预期 1000+ 用户日活
- 组件可复用于多个页面/应用

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

根据 `.specify/memory/constitution.md` 检查以下合规性：

### I. Code Quality Excellence ✓
- [x] TypeScript 类型安全：所有代码使用 interface，避免 enum
- [x] 函数式编程：使用 Composition API `<script setup>`，避免类
- [x] 命名规范：目录使用 kebab-case，变量使用描述性名称
- [x] 模块化：每个文件职责单一，遵循 DRY 原则

### II. Testing Standards ✓
- [x] 测试优先：功能实现前编写测试
- [x] 测试层次：包含单元测试、集成测试、契约测试（如适用）
- [x] 可测试性：组件设计为可独立测试
- [x] 异步处理：使用 Suspense 包裹异步组件

### III. User Experience Consistency ✓
- [x] UI 组件：使用 Headless UI、Element Plus、Tailwind CSS
- [x] 响应式设计：移动优先策略（桌面优先，但支持响应式）
- [x] 设计一致性：统一的设计语言和交互模式
- [x] 可访问性：符合 WCAG 标准

### IV. Performance Requirements ✓
- [x] Web Vitals：LCP < 2.5s, FID < 100ms, CLS < 0.1
- [x] 构建优化：Vite 代码分块策略，打包体积优化
- [x] 资源优化：WebP 图片格式，懒加载
- [x] 运行时：合理使用 VueUse 优化性能

**合规状态**: 全部符合

**偏差说明**: 无偏差。设计完全符合宪章要求，使用 Vue3 Composition API + TypeScript，Konva 作为高性能 Canvas 引擎，Element Plus 和 Tailwind CSS 提供一致的 UI 体验。

## Project Structure

### Documentation (this feature)

```text
specs/001-image-editor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── store-api.md     # Pinia store 接口定义
└── checklists/
    └── requirements.md  # 规范质量检查清单
```

### Source Code (repository root)

```text
src/
├── components/
│   └── image-editor/
│       ├── ImageEditor.vue              # 主编辑器容器组件
│       ├── canvas/
│       │   ├── EditorCanvas.vue         # Konva 画布包装组件
│       │   ├── ImageLayer.vue           # 图片图层组件
│       │   ├── AnnotationLayer.vue      # 标注图层组件
│       │   └── TransformerControls.vue  # 变换控制组件
│       ├── toolbar/
│       │   ├── EditorToolbar.vue        # 工具栏主组件
│       │   ├── ImageTools.vue           # 图片操作工具
│       │   ├── AnnotationTools.vue      # 标注工具
│       │   └── ModeSwitch.vue           # 模式切换
│       └── panels/
│           ├── ImageList.vue            # 图片列表面板
│           ├── AnnotationList.vue       # 标注列表面板
│           └── PropertiesPanel.vue      # 属性面板
├── stores/
│   └── image-editor/
│       ├── canvas.ts                    # 画布状态管理
│       ├── images.ts                    # 图片管理
│       ├── annotations.ts               # 标注管理
│       └── history.ts                   # 历史记录（撤销/重做）
├── composables/
│   └── image-editor/
│       ├── useImageLoader.ts            # 图片加载
│       ├── useCanvasExport.ts           # 画布导出
│       ├── useProjectFile.ts            # 项目文件保存/加载
│       ├── useCanvasInteraction.ts      # 画布交互处理
│       └── useKeyboardShortcuts.ts      # 键盘快捷键
├── utils/
│   └── image-editor/
│       ├── image-processor.ts           # 图片处理工具
│       ├── file-handler.ts              # 文件读写工具
│       ├── serializer.ts                # 项目序列化/反序列化
│       └── validators.ts                # 数据验证
└── types/
    └── image-editor/
        ├── canvas.ts                    # 画布相关类型
        ├── image.ts                     # 图片相关类型
        ├── annotation.ts                # 标注相关类型
        └── project.ts                   # 项目文件类型

tests/
├── unit/
│   ├── stores/                          # Store 单元测试
│   ├── composables/                     # Composables 单元测试
│   └── utils/                           # 工具函数单元测试
├── integration/
│   └── image-editor/
│       ├── image-operations.spec.ts     # 图片操作集成测试
│       ├── annotation-workflow.spec.ts  # 标注工作流测试
│       └── export-save.spec.ts          # 导出保存测试
└── e2e/
    └── image-editor/
        ├── basic-workflow.spec.ts       # 基础工作流 E2E
        └── mode-switching.spec.ts       # 模式切换 E2E
```

**Structure Decision**: 采用 Option 1 (Single project) 结构，因为这是一个独立的前端 Vue 组件，不需要后端。使用 `src/components/image-editor/` 作为组件根目录，按功能模块（画布、工具栏、面板）组织子组件。状态管理使用 Pinia stores，组合式函数（composables）封装可复用逻辑，工具函数（utils）提供纯函数工具，类型定义（types）集中管理 TypeScript 接口。测试按层次分为单元测试、集成测试和 E2E 测试，确保全面覆盖。

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

无需填写 - 所有宪章检查项均已通过。
