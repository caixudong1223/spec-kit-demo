# Tasks: 图片编辑标注组件

**Input**: Design documents from `/specs/001-image-editor/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are included as part of the constitution compliance. Tests MUST be written before implementation (TDD approach).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths shown below are based on plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize Vite + Vue3 + TypeScript project with recommended configuration
- [ ] T002 Install core dependencies (vue, vite, typescript, vue-router, pinia, @vueuse/core)
- [ ] T003 Install Konva dependencies (konva, vue-konva) for canvas rendering
- [ ] T004 Install UI dependencies (element-plus, @element-plus/icons-vue)
- [ ] T005 Configure Tailwind CSS with PostCSS in tailwind.config.js and postcss.config.js
- [ ] T006 [P] Configure Vitest for unit testing in vite.config.ts
- [ ] T007 [P] Install and configure Playwright for E2E testing in playwright.config.ts
- [ ] T008 [P] Configure ESLint with TypeScript and Vue support in .eslintrc.js
- [ ] T009 [P] Configure Prettier for code formatting in .prettierrc.js
- [ ] T010 Create directory structure per plan.md: src/components/image-editor/, src/stores/image-editor/, src/composables/image-editor/, src/utils/image-editor/, src/types/image-editor/
- [ ] T011 [P] Create subdirectories: src/components/image-editor/canvas/, toolbar/, panels/
- [ ] T012 [P] Create test directories: tests/unit/, tests/integration/, tests/e2e/
- [ ] T013 Configure Pinia in src/main.ts as global state management
- [ ] T014 Configure Vue Router in src/router/index.ts (if needed for demo app)
- [ ] T015 Import Tailwind CSS styles in src/assets/main.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T016 Define core TypeScript interfaces in src/types/image-editor/index.ts: EditorImage, AnnotationNode, AnnotationLine, CanvasState, ProjectFile, HistoryState
- [ ] T017 [P] Define validation utilities in src/utils/image-editor/validators.ts: isValidUUID, isValidColor, isInRange, validateEditorImage, validateAnnotationNode, validateAnnotationLine
- [ ] T018 [P] Define default constants in src/types/image-editor/defaults.ts: DEFAULT_IMAGE, DEFAULT_ANNOTATION_NODE, DEFAULT_ANNOTATION_LINE, DEFAULT_CANVAS
- [ ] T019 Create useCanvasStore in src/stores/image-editor/canvas.ts with State (config, view, mode, activeTool, selection, isModified, lastSavedAt)
- [ ] T020 Implement useCanvasStore Getters in src/stores/image-editor/canvas.ts: isEditMode, hasSelection, selectedObject, needsSave
- [ ] T021 Implement useCanvasStore Actions in src/stores/image-editor/canvas.ts: setCanvasSize, setBackgroundColor, zoom functions, pan functions, setMode, setActiveTool, selectObject, clearSelection, markAsModified, markAsSaved, resetCanvas
- [ ] T022 Write unit tests for useCanvasStore in tests/unit/stores/canvas.spec.ts
- [ ] T023 Create base EditorCanvas component skeleton in src/components/image-editor/canvas/EditorCanvas.vue with Konva Stage and Layer setup
- [ ] T024 Create base EditorToolbar component skeleton in src/components/image-editor/toolbar/EditorToolbar.vue
- [ ] T025 Create main ImageEditor container component in src/components/image-editor/ImageEditor.vue integrating EditorCanvas and EditorToolbar

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 多图片管理与基础操作 (Priority: P1) 🎯 MVP

**Goal**: 用户可以加载多张图片到画布，执行拖拽、旋转、缩放、删除操作

**Independent Test**: 加载多张测试图片，执行所有基础操作，验证每个操作正确响应，无需标注功能即可独立测试

### Tests for User Story 1 (TDD Approach) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T026 [P] [US1] Write unit tests for useImagesStore basic operations in tests/unit/stores/images.spec.ts: addImage, deleteImage, updateImagePosition, updateImageRotation, updateImageScale
- [ ] T027 [P] [US1] Write integration tests for image loading workflow in tests/integration/image-editor/image-operations.spec.ts: file selection → image loading → display on canvas
- [ ] T028 [P] [US1] Write E2E test for complete image editing workflow in tests/e2e/image-editor/basic-workflow.spec.ts: load images → drag → rotate → scale → delete → verify results

### Implementation for User Story 1

- [ ] T029 [P] [US1] Create useImagesStore State in src/stores/image-editor/images.ts: images array, isLoading, loadingProgress, maxZIndex
- [ ] T030 [P] [US1] Implement useImagesStore Getters in src/stores/image-editor/images.ts: visibleImages, selectedImage, sortedImages, imageCount, hasImages, getImageById
- [ ] T031 [US1] Implement useImagesStore Actions for adding images in src/stores/image-editor/images.ts: addImage, addImages, with UUID generation, zIndex assignment, timestamp creation
- [ ] T032 [US1] Implement useImagesStore Actions for loading from files in src/stores/image-editor/images.ts: loadImageFromFile, loadImagesFromFiles with HTMLImageElement creation, URL.createObjectURL, error handling
- [ ] T033 [US1] Implement useImagesStore Actions for updating images in src/stores/image-editor/images.ts: updateImage, updateImagePosition, updateImageRotation, updateImageScale with modifiedAt timestamp
- [ ] T034 [US1] Implement useImagesStore Actions for deleting images in src/stores/image-editor/images.ts: deleteImage, deleteImages, deleteAllImages with URL cleanup
- [ ] T035 [US1] Implement useImagesStore Actions for layer operations in src/stores/image-editor/images.ts: bringToFront, sendToBack, bringForward, sendBackward with zIndex manipulation
- [ ] T036 [US1] Implement useImagesStore Actions for selection in src/stores/image-editor/images.ts: selectImage, deselectImage, selectAllImages, deselectAllImages calling canvasStore.selectObject
- [ ] T037 [P] [US1] Create useImageLoader composable in src/composables/image-editor/useImageLoader.ts: file validation, image loading, error handling, progress tracking
- [ ] T038 [P] [US1] Create image-processor utility in src/utils/image-editor/image-processor.ts: image resizing, format conversion, thumbnail generation
- [ ] T039 [US1] Implement ImageLayer component in src/components/image-editor/canvas/ImageLayer.vue with v-image from vue-konva, draggable, listening to drag events, calling store actions on dragend
- [ ] T040 [US1] Implement TransformerControls component in src/components/image-editor/canvas/TransformerControls.vue with v-transformer from vue-konva, handling rotation and scale, calling store actions on transformend
- [ ] T041 [US1] Update EditorCanvas component in src/components/image-editor/canvas/EditorCanvas.vue to render ImageLayer for each image and TransformerControls for selected image
- [ ] T042 [US1] Create ImageTools component in src/components/image-editor/toolbar/ImageTools.vue with delete button, layer up/down buttons, lock/unlock toggle
- [ ] T043 [US1] Create ImageList panel component in src/components/image-editor/panels/ImageList.vue displaying all images with thumbnails, selection state, delete button per image
- [ ] T044 [US1] Implement file upload UI in ImageEditor.vue: file input element, drag-drop zone, file selection handler calling useImagesStore.loadImagesFromFiles
- [ ] T045 [US1] Add keyboard shortcuts in ImageEditor.vue using useKeyboardShortcuts composable: Delete key for deleteImage, Arrow keys for nudge position
- [ ] T046 [US1] Style all US1 components with Tailwind CSS ensuring responsive design and Element Plus integration
- [ ] T047 [US1] Run all US1 tests and verify they pass

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 序号节点标注 (Priority: P2)

**Goal**: 用户可以在画布上点击创建序号节点，序号自动递增，可以删除节点并自动重新编号

**Independent Test**: 激活序号标注模式，点击多个位置创建节点，验证序号递增、删除后重新排序

### Tests for User Story 2 (TDD Approach) ⚠️

- [ ] T048 [P] [US2] Write unit tests for useAnnotationsStore node operations in tests/unit/stores/annotations.spec.ts: addNode, deleteNode, _renumberNodes, updateNodePosition
- [ ] T049 [P] [US2] Write integration tests for annotation node workflow in tests/integration/image-editor/annotation-workflow.spec.ts: activate node mode → click canvas → create node → verify number → delete node → verify renumbering
- [ ] T050 [P] [US2] Write E2E test for node annotation in tests/e2e/image-editor/node-annotation.spec.ts: complete node creation and deletion workflow

### Implementation for User Story 2

- [ ] T051 [P] [US2] Create useAnnotationsStore State in src/stores/image-editor/annotations.ts: nodes array, lines array, maxNodeNumber
- [ ] T052 [P] [US2] Implement useAnnotationsStore Getters in src/stores/image-editor/annotations.ts: visibleNodes, visibleLines, selectedNode, selectedLine, nodeCount, lineCount, totalAnnotationCount, hasAnnotations, getNodeById, getLineById
- [ ] T053 [US2] Implement useAnnotationsStore Actions for nodes in src/stores/image-editor/annotations.ts: addNode with auto number assignment, deleteNode with _renumberNodes call, updateNode, updateNodePosition
- [ ] T054 [US2] Implement _renumberNodes private function in src/stores/image-editor/annotations.ts: sort nodes by createdAt, reassign sequential numbers starting from 1
- [ ] T055 [US2] Implement useAnnotationsStore Actions for node selection in src/stores/image-editor/annotations.ts: selectNode, deselectAllAnnotations calling canvasStore.selectObject
- [ ] T056 [US2] Implement useAnnotationsStore Actions for node styles in src/stores/image-editor/annotations.ts: updateNodeStyle with style object merging
- [ ] T057 [US2] Create AnnotationNodeRenderer sub-component in src/components/image-editor/canvas/AnnotationLayer.vue rendering v-circle for node background, v-text for number
- [ ] T058 [US2] Update AnnotationLayer component in src/components/image-editor/canvas/AnnotationLayer.vue to handle canvas click events when activeTool is 'annotation-node', call annotationsStore.addNode with click position
- [ ] T059 [US2] Implement node selection in AnnotationLayer.vue: on node click, call annotationsStore.selectNode, show delete button when selected
- [ ] T060 [US2] Create AnnotationTools component in src/components/image-editor/toolbar/AnnotationTools.vue with toggle buttons for 'annotation-node' and 'annotation-line' modes, calling canvasStore.setActiveTool
- [ ] T061 [US2] Create AnnotationList panel component in src/components/image-editor/panels/AnnotationList.vue displaying all nodes and lines, with delete action per item
- [ ] T062 [US2] Add visual feedback in EditorCanvas.vue: cursor change when annotation-node tool is active (crosshair cursor)
- [ ] T063 [US2] Style all US2 components with Tailwind CSS and ensure node visibility on all backgrounds
- [ ] T064 [US2] Run all US2 tests and verify they pass

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 尺寸标注线 (Priority: P2)

**Goal**: 用户可以绘制标注线并添加文本信息，可以编辑和删除标注线

**Independent Test**: 激活尺寸标注模式，绘制多条标注线，添加文本，验证编辑和删除功能

### Tests for User Story 3 (TDD Approach) ⚠️

- [ ] T065 [P] [US3] Write unit tests for useAnnotationsStore line operations in tests/unit/stores/annotations.spec.ts: addLine, deleteLine, updateLine, updateLinePoints, updateLineText
- [ ] T066 [P] [US3] Write integration tests for annotation line workflow in tests/integration/image-editor/annotation-workflow.spec.ts: activate line mode → drag to create line → add text → edit text → delete line
- [ ] T067 [P] [US3] Write E2E test for line annotation in tests/e2e/image-editor/line-annotation.spec.ts: complete line creation, editing, and deletion workflow

### Implementation for User Story 3

- [ ] T068 [US3] Implement useAnnotationsStore Actions for lines in src/stores/image-editor/annotations.ts: addLine with points and textPosition auto-calculation, deleteLine, updateLine, updateLinePoints, updateLineText
- [ ] T069 [US3] Implement useAnnotationsStore Actions for line editing state in src/stores/image-editor/annotations.ts: startEditingLine, stopEditingLine setting isEditing flag
- [ ] T070 [US3] Implement useAnnotationsStore Actions for line selection in src/stores/image-editor/annotations.ts: selectLine calling canvasStore.selectObject
- [ ] T071 [US3] Implement useAnnotationsStore Actions for line styles in src/stores/image-editor/annotations.ts: updateLineStyle with style object merging
- [ ] T072 [US3] Create AnnotationLineRenderer sub-component in src/components/image-editor/canvas/AnnotationLayer.vue rendering v-line for line segment, v-text for text label, optional v-arrow for endpoints
- [ ] T073 [US3] Implement line drawing interaction in AnnotationLayer.vue: on mousedown when activeTool is 'annotation-line', start drawing; on mousemove, update end point; on mouseup, call annotationsStore.addLine
- [ ] T074 [US3] Implement line selection and editing in AnnotationLayer.vue: on line click, call annotationsStore.selectLine; show edit and delete buttons when selected
- [ ] T075 [US3] Create text input overlay in AnnotationLayer.vue: when isEditing is true for a line, show HTML input element positioned at textPosition, bind to line.text, call updateLineText on blur
- [ ] T076 [US3] Implement line endpoint snapping logic in AnnotationLayer.vue: detect proximity to nodes or image edges, provide visual feedback (highlight/alignment guides), snap endpoints within 10px threshold
- [ ] T077 [US3] Calculate and display line length in AnnotationLineRenderer: compute distance between start and end points, format as readable text (e.g., "120px")
- [ ] T078 [US3] Update AnnotationTools component in src/components/image-editor/toolbar/AnnotationTools.vue to include line style controls (color picker, line width slider, dash style toggle)
- [ ] T079 [US3] Add arrow rendering option in AnnotationLineRenderer: render v-arrow at line endpoints when showArrows is true
- [ ] T080 [US3] Style all US3 components with Tailwind CSS and ensure line visibility and text readability on all backgrounds
- [ ] T081 [US3] Run all US3 tests and verify they pass

**Checkpoint**: All user stories 1, 2, AND 3 should now be independently functional

---

## Phase 6: User Story 4 - 画布状态导出 (Priority: P3)

**Goal**: 用户可以导出画布为图片文件，保存项目文件，重新加载项目恢复完整状态

**Independent Test**: 完成编辑后导出图片验证包含所有内容，保存项目文件后重新加载验证状态恢复

### Tests for User Story 4 (TDD Approach) ⚠️

- [ ] T082 [P] [US4] Write unit tests for useProjectStore in tests/unit/stores/project.spec.ts: saveProject, loadProjectFromJSON, serialization/deserialization logic
- [ ] T083 [P] [US4] Write unit tests for useCanvasExport composable in tests/unit/composables/useCanvasExport.spec.ts: exportCanvasAsImage with different formats
- [ ] T084 [P] [US4] Write unit tests for useProjectFile composable in tests/unit/composables/useProjectFile.spec.ts: saveProjectFile, loadProjectFile
- [ ] T085 [P] [US4] Write integration tests for export and save workflow in tests/integration/image-editor/export-save.spec.ts: export canvas → verify image file, save project → load project → verify state restoration
- [ ] T086 [P] [US4] Write E2E test for export and save in tests/e2e/image-editor/export-save.spec.ts: complete export and save/load workflow

### Implementation for User Story 4

- [ ] T087 [P] [US4] Create useProjectStore State in src/stores/image-editor/project.ts: currentProject, projectName, isSaving, isLoading
- [ ] T088 [P] [US4] Implement useProjectStore Getters in src/stores/image-editor/project.ts: hasProject, projectFileName, estimatedProjectSize
- [ ] T089 [US4] Implement useProjectStore Actions for project lifecycle in src/stores/image-editor/project.ts: createNewProject, saveProject, saveProjectAs, loadProjectFromFile, loadProjectFromJSON, closeProject
- [ ] T090 [US4] Create useCanvasExport composable in src/composables/image-editor/useCanvasExport.ts: exportCanvasAsImage function using Konva Stage.toDataURL, hide control layers before export, restore after export, trigger browser download
- [ ] T091 [US4] Create useProjectFile composable in src/composables/image-editor/useProjectFile.ts: saveProjectFile function serializing all stores to ProjectFile JSON, loadProjectFile function parsing JSON and restoring all stores
- [ ] T092 [US4] Create serializer utility in src/utils/image-editor/serializer.ts: serializeProjectFile converting stores to ProjectFile object, deserializeProjectFile parsing ProjectFile and returning state objects
- [ ] T093 [US4] Create file-handler utility in src/utils/image-editor/file-handler.ts: downloadFile triggering browser download with blob, readFileAsText reading File object as text, readFileAsDataURL for images
- [ ] T094 [US4] Implement project save flow in useProjectStore.saveProject: collect canvas config from canvasStore, collect images from imagesStore, collect annotations from annotationsStore, serialize to JSON, call file-handler.downloadFile
- [ ] T095 [US4] Implement project load flow in useProjectStore.loadProjectFromFile: read file with file-handler, deserialize JSON with serializer, restore canvasStore state, restore imagesStore state (re-create HTMLImageElements), restore annotationsStore state, call canvasStore.markAsSaved
- [ ] T096 [US4] Implement Base64 embedding option in serializer.ts: for small projects (<5MB), convert image src to Base64 Data URL before serialization
- [ ] T097 [US4] Add export controls in EditorToolbar.vue: "Export as PNG" button, "Export as JPEG" button (with quality slider), "Save Project" button, "Load Project" button with file input
- [ ] T098 [US4] Implement export progress feedback in ImageEditor.vue: show loading indicator during export, show progress bar during project save/load for large files
- [ ] T099 [US4] Add auto-save feature in useProjectStore: enableAutoSave and disableAutoSave actions with setInterval, save to localStorage every N seconds, restore on page reload
- [ ] T100 [US4] Handle export errors in useCanvasExport: try-catch blocks, user-friendly error messages via Element Plus notification
- [ ] T101 [US4] Handle project file errors in useProjectFile: validate file format, check version compatibility, migrate old versions if needed, error messages for corrupted files
- [ ] T102 [US4] Style all US4 components with Tailwind CSS
- [ ] T103 [US4] Run all US4 tests and verify they pass

**Checkpoint**: All user stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - 编辑模式与查看模式切换 (Priority: P3)

**Goal**: 用户可以在编辑模式和查看模式之间切换，查看模式下所有内容只读

**Independent Test**: 切换到查看模式验证所有控制隐藏且内容不可修改，切换回编辑模式验证功能恢复

### Tests for User Story 5 (TDD Approach) ⚠️

- [ ] T104 [P] [US5] Write unit tests for useCanvasStore mode switching in tests/unit/stores/canvas.spec.ts: setMode, toggleMode, verify side effects (clearSelection, setActiveTool)
- [ ] T105 [P] [US5] Write integration tests for mode switching in tests/integration/image-editor/mode-switching.spec.ts: edit mode → modify content → switch to view mode → verify no modifications → switch back to edit mode → verify modifications work
- [ ] T106 [P] [US5] Write E2E test for mode switching in tests/e2e/image-editor/mode-switching.spec.ts: complete mode switching workflow with all features

### Implementation for User Story 5

- [ ] T107 [US5] Enhance useCanvasStore.setMode action in src/stores/image-editor/canvas.ts: when switching to 'view' mode, automatically call clearSelection and setActiveTool('pan'), emit mode change event
- [ ] T108 [US5] Update ImageLayer component in src/components/image-editor/canvas/ImageLayer.vue to respect mode: bind draggable to isEditMode, bind listening to isEditMode
- [ ] T109 [US5] Update TransformerControls component in src/components/image-editor/canvas/TransformerControls.vue: hide transformer in view mode using v-if with isEditMode
- [ ] T110 [US5] Update AnnotationLayer component in src/components/image-editor/canvas/AnnotationLayer.vue: disable click handlers for creating annotations in view mode, disable delete buttons in view mode
- [ ] T111 [US5] Create ModeSwitch component in src/components/image-editor/toolbar/ModeSwitch.vue with toggle switch (Element Plus el-switch) binding to canvasStore.mode, labels "编辑模式" and "查看模式"
- [ ] T112 [US5] Add ModeSwitch component to EditorToolbar.vue in prominent position
- [ ] T113 [US5] Update EditorToolbar.vue to conditionally hide editing tools (ImageTools, AnnotationTools) in view mode using v-if with isEditMode
- [ ] T114 [US5] Update ImageList panel in src/components/image-editor/panels/ImageList.vue to hide delete buttons in view mode
- [ ] T115 [US5] Update AnnotationList panel in src/components/image-editor/panels/AnnotationList.vue to hide edit/delete buttons in view mode
- [ ] T116 [US5] Ensure canvas zoom and pan still work in view mode: verify EditorCanvas.vue allows view transformations regardless of mode
- [ ] T117 [US5] Add visual indication of current mode in ImageEditor.vue: show badge or banner indicating "查看模式" when in view mode
- [ ] T118 [US5] Implement project file loading with mode preference: when loading project file with mode='view' in metadata, call setMode('view') after loading
- [ ] T119 [US5] Style all US5 components with Tailwind CSS ensuring mode indicator is prominent
- [ ] T120 [US5] Run all US5 tests and verify they pass

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T121 [P] Create useHistoryStore in src/stores/image-editor/history.ts with State: past, present, future, maxHistorySize
- [ ] T122 [P] Implement useHistoryStore Getters in src/stores/image-editor/history.ts: canUndo, canRedo, historyCount, currentAction
- [ ] T123 Implement useHistoryStore Actions in src/stores/image-editor/history.ts: pushSnapshot, undo, redo, clearHistory, setMaxHistorySize
- [ ] T124 Integrate history tracking: call historyStore.pushSnapshot after every modification action in imagesStore and annotationsStore
- [ ] T125 Implement undo/redo in ImageEditor.vue: add toolbar buttons, keyboard shortcuts (Ctrl+Z, Ctrl+Y), call historyStore.undo/redo
- [ ] T126 [P] Create useCanvasInteraction composable in src/composables/image-editor/useCanvasInteraction.ts: handle zoom (mouse wheel), pan (middle mouse button drag), fit to screen
- [ ] T127 Integrate useCanvasInteraction in EditorCanvas.vue: bind wheel event for zoom, bind mouse events for pan, update canvasStore view state
- [ ] T128 [P] Create useKeyboardShortcuts composable in src/composables/image-editor/useKeyboardShortcuts.ts: centralized keyboard shortcut management (Delete, Ctrl+Z, Ctrl+Y, Ctrl+S, Escape, Arrow keys)
- [ ] T129 Integrate useKeyboardShortcuts in ImageEditor.vue: register all shortcuts, handle Ctrl+S for save, Escape for clearSelection
- [ ] T130 [P] Implement image thumbnail generation in image-processor.ts: create smaller preview images for ImageList panel, cache thumbnails in memory
- [ ] T131 Optimize canvas rendering performance: implement layer caching in EditorCanvas.vue, use Konva layer.batchDraw() for multiple updates, throttle drag and transform events
- [ ] T132 Implement lazy loading for images: load thumbnails first, full resolution on demand in useImageLoader.ts
- [ ] T133 [P] Add loading states and progress indicators: use Element Plus el-loading directive for async operations, show progress bars for multi-file uploads
- [ ] T134 [P] Implement error boundaries: add error handling in all stores, display user-friendly error messages with Element Plus el-notification
- [ ] T135 [P] Add accessibility improvements: ARIA labels on all interactive elements, keyboard navigation support, focus management with useFocusManagement composable
- [ ] T136 [P] Implement responsive design adjustments: test on tablet sizes (1024x768), adjust panel widths, collapsible panels on smaller screens
- [ ] T137 [P] Add tooltips to toolbar buttons using Element Plus el-tooltip for better UX
- [ ] T138 [P] Create PropertiesPanel component in src/components/image-editor/panels/PropertiesPanel.vue showing selected object properties (position, rotation, scale, style)
- [ ] T139 Add quick actions: double-click to edit text on annotation lines, right-click context menu for common actions
- [ ] T140 [P] Implement clipboard support: copy/paste selected objects (Ctrl+C, Ctrl+V) with useClipboard composable
- [ ] T141 [P] Add grid and guides overlay: optional grid lines on canvas, alignment guides when dragging objects
- [ ] T142 [P] Documentation updates in README.md and quickstart.md with usage instructions and screenshots
- [ ] T143 Code cleanup and refactoring: remove console.logs, extract magic numbers to constants, ensure consistent code style
- [ ] T144 Performance optimization review: run Lighthouse audit, optimize bundle size with Vite code splitting, analyze and optimize re-renders

### Quality Gates (Constitution Compliance)

- [ ] T145 TypeScript 类型检查通过（无错误）: run `npm run type-check` and fix all errors
- [ ] T146 ESLint 和 Prettier 检查通过: run `npm run lint` and `npm run format`, fix all issues
- [ ] T147 [P] Lighthouse 性能评分验证 (> 90): run Lighthouse audit on demo page, optimize if score < 90
- [ ] T148 [P] Web Vitals 指标验证 (LCP < 2.5s, FID < 100ms, CLS < 0.1): measure with Chrome DevTools, optimize if not meeting targets
- [ ] T149 [P] 可访问性审计 (WCAG 合规): run axe DevTools, fix all critical and serious issues
- [ ] T150 响应式设计验证（移动端、平板、桌面）: test on different viewport sizes, fix layout issues
- [ ] T151 Run all unit tests and achieve >80% coverage: `npm run test:unit -- --coverage`
- [ ] T152 Run all integration tests and verify they pass: `npm run test:integration`
- [ ] T153 Run all E2E tests and verify they pass: `npm run test:e2e`
- [ ] T154 Run quickstart.md validation: follow quickstart guide step-by-step, verify all code examples work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (uses same canvas foundation)
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Slight dependency on US2 for annotation infrastructure (optional snapping to nodes), but independently testable
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (works with any canvas state)
- **User Story 5 (P3)**: Can start after Foundational (Phase 2) - No dependencies on other stories (mode switching affects all features equally)

### Within Each User Story

- Tests (TDD approach) MUST be written and FAIL before implementation
- Type definitions before stores
- Stores before composables
- Composables before components
- Base components before specialized components
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002-T009, T011-T012)
- All Foundational tasks marked [P] can run in parallel (T017-T018, T022, T026-T028 for tests)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Within a story, tasks marked [P] (different files) can run in parallel
- Different user stories can be worked on in parallel by different team members
- All polish tasks marked [P] can run in parallel (T122, T126, T128, T130, T133-T138, T140-T141, T147-T150)

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (write before implementation):
T026: Unit tests for useImagesStore
T027: Integration tests for image loading workflow
T028: E2E test for complete image editing workflow

# After tests fail, launch these implementation tasks in parallel:
T029: Create useImagesStore State
T030: Implement useImagesStore Getters
T037: Create useImageLoader composable
T038: Create image-processor utility

# Then these (depend on store being created):
T031-T036: Implement useImagesStore Actions sequentially
T039-T041: Implement canvas components (after Actions ready)
T042-T044: Implement toolbar and panels (after canvas ready)
T045-T046: Add keyboard shortcuts and styling
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (T026-T047)
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Add Polish phase → Final release

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T025)
2. Once Foundational is done:
   - Developer A: User Story 1 (T026-T047)
   - Developer B: User Story 2 (T048-T064)
   - Developer C: User Story 3 (T065-T081)
3. Stories complete and integrate independently
4. Continue with User Story 4 and 5
5. Team reconvenes for Polish phase (T121-T154)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests FIRST (TDD approach as per constitution requirement)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Total Tasks: 154 tasks across 8 phases
- Estimated Timeline:
  - Setup: 1 day
  - Foundational: 2-3 days
  - User Story 1 (MVP): 5-6 days
  - User Story 2: 3-4 days
  - User Story 3: 3-4 days
  - User Story 4: 3-4 days
  - User Story 5: 2-3 days
  - Polish: 4-5 days
  - **Total: ~25-32 days (5-6 weeks)** for single developer sequential work
  - **~10-15 days (2-3 weeks)** with 3 developers working in parallel on user stories

---

## Task Summary

**Total Tasks**: 154
- **Setup**: 15 tasks (T001-T015)
- **Foundational**: 10 tasks (T016-T025)
- **User Story 1 (P1 MVP)**: 22 tasks (T026-T047)
- **User Story 2 (P2)**: 17 tasks (T048-T064)
- **User Story 3 (P2)**: 17 tasks (T065-T081)
- **User Story 4 (P3)**: 22 tasks (T082-T103)
- **User Story 5 (P3)**: 17 tasks (T104-T120)
- **Polish & Quality Gates**: 34 tasks (T121-T154)

**Parallel Opportunities**: 45+ tasks can be executed in parallel (marked with [P])

**Independent Tests**: Each user story has 3 test tasks (unit, integration, E2E) written FIRST before implementation

**MVP Scope**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (User Story 1) = **47 tasks** for minimal viable product

**Constitution Compliance**: 10 quality gate tasks (T145-T154) ensure all requirements are met
