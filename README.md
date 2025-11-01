# Spec Kit Demo

基于 Vue.js + TypeScript 的高质量项目演示

## 项目宪章

本项目遵循严格的开发标准和原则，详见 [项目宪章](.specify/memory/constitution.md)。

### 核心原则

1. **代码质量至上** - TypeScript、函数式编程、模块化设计
2. **测试驱动开发** - 测试优先、多层次测试策略
3. **用户体验一致性** - 统一 UI、响应式设计、可访问性
4. **性能要求** - Web Vitals 优化、构建优化、资源优化

## 技术栈

- **框架**: Vue.js 3 with Composition API
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router
- **工具库**: VueUse
- **UI 组件**: Headless UI, Element Plus
- **样式**: Tailwind CSS

## 开发指南

### 代码规范

- 使用 TypeScript 的 `interface`（避免 `type` 和 `enum`）
- 使用 Composition API 的 `<script setup>` 风格
- 目录命名使用 kebab-case
- 变量命名使用描述性名称（如 `isLoading`, `hasError`）
- 遵循函数式编程范式，避免使用类

### 质量门控

所有代码变更必须满足：

- ✅ TypeScript 类型检查无错误
- ✅ ESLint 规则全部通过
- ✅ 测试通过且覆盖核心逻辑
- ✅ Lighthouse 性能评分 > 90
- ✅ Web Vitals 达标（LCP < 2.5s, FID < 100ms, CLS < 0.1）

## Spec Kit 工作流

本项目使用 Spec Kit 进行功能规划和任务管理：

- `.specify/memory/constitution.md` - 项目宪章
- `.specify/templates/` - 各类模板文件
- `specs/` - 功能规范和计划（待创建）

## 开始开发

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 类型检查
npm run type-check

# Linting
npm run lint

# 测试
npm run test

# 构建
npm run build
```

## 贡献指南

1. 阅读并理解 [项目宪章](.specify/memory/constitution.md)
2. 创建功能分支
3. 测试优先开发
4. 确保通过所有质量门控
5. 提交 Pull Request

## 许可证

[待定]
