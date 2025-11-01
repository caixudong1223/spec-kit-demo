<!--
Sync Impact Report:
- Version Change: Initial Creation → 1.0.0
- Modified Principles: N/A (new constitution)
- Added Sections:
  * I. Code Quality Excellence
  * II. Testing Standards
  * III. User Experience Consistency
  * IV. Performance Requirements
  * Development Workflow
  * Governance
- Removed Sections: None
- Templates Requiring Updates:
  ✅ plan-template.md - Updated constitution check reference
  ✅ spec-template.md - Aligned with UX consistency requirements
  ✅ tasks-template.md - Aligned with testing and quality gates
- Follow-up TODOs: None
-->

# Spec Kit Demo Constitution

## Core Principles

### I. Code Quality Excellence

**代码质量至上，保持可维护性和技术准确性**

代码必须遵循以下标准：

- **类型安全**：所有代码使用 TypeScript，优先使用 `interface` 而非 `type`（可扩展性和合并能力），避免使用 `enum`，改用 `map` 以获得更好的类型安全
- **函数式编程**：采用函数式和声明式编程模式，避免使用类；使用 `function` 关键字定义纯函数以支持提升和清晰性
- **组件规范**：始终使用 Vue Composition API 的 `<script setup>` 风格
- **命名规范**：
  - 使用小写和短横线命名目录（如 `components/auth-wizard`）
  - 使用带辅助动词的描述性变量名（如 `isLoading`、`hasError`）
  - 优先使用具名导出
- **模块化**：每个文件只包含相关内容（导出组件、子组件、辅助函数、静态内容和类型）
- **DRY 原则**：通过迭代和模块化避免代码重复

**理由**：高质量代码减少技术债务，提高团队协作效率，降低维护成本。

### II. Testing Standards

**测试驱动开发，确保代码可靠性**

测试策略必须包括：

- **测试优先**：编写功能前先编写测试，遵循红-绿-重构循环
- **测试层次**：
  - **单元测试**：测试独立函数和组件逻辑
  - **集成测试**：测试组件间交互和服务通信
  - **契约测试**：验证 API 接口和数据契约
- **测试覆盖率**：核心业务逻辑必须有测试覆盖
- **可测试性设计**：组件和函数必须设计为可独立测试，避免紧耦合
- **异步处理**：异步组件使用 `Suspense` 包裹并提供回退 UI

**理由**：测试是代码质量的保障，防止回归错误，支持重构和持续改进。

### III. User Experience Consistency

**提供一致、直观的用户体验**

用户体验标准：

- **UI 组件库**：统一使用 Headless UI、Element Plus 和 Tailwind CSS 构建组件和样式
- **响应式设计**：使用 Tailwind CSS 实现响应式设计，采用移动优先策略
- **设计规范**：遵循现代 UI/UX 最佳实践，确保界面美观且易用
- **一致性**：保持设计语言、交互模式、视觉风格的一致性
- **可访问性**：确保界面符合 WCAG 标准，支持键盘导航和屏幕阅读器
- **加载体验**：非关键组件使用动态加载，提供合理的加载状态反馈

**理由**：一致的用户体验降低学习成本，提升用户满意度和产品可用性。

### IV. Performance Requirements

**优化性能，提供流畅体验**

性能标准必须满足：

- **核心指标优化**：
  - **LCP (Largest Contentful Paint)**：< 2.5秒
  - **FID (First Input Delay)**：< 100毫秒
  - **CLS (Cumulative Layout Shift)**：< 0.1
- **性能工具**：使用 Lighthouse 或 WebPageTest 定期评估和优化 Web Vitals
- **构建优化**：
  - 使用 Vite 实现优化的代码分块策略（code splitting）
  - 生成更小的打包体积
  - 实现智能的懒加载策略
- **资源优化**：
  - 图片使用 WebP 格式
  - 包含尺寸数据，实现懒加载
  - 优化字体和静态资源加载
- **运行时优化**：适当使用 VueUse 函数增强响应性和性能

**理由**：性能直接影响用户体验和转化率，快速响应是产品竞争力的关键。

## Development Workflow

**开发流程与质量门控**

### 代码审查要求

- 所有代码变更必须通过 Pull Request 流程
- 每个 PR 必须验证符合宪章原则
- 必须通过 Linter 检查和类型检查
- 必须包含相关测试（如适用）

### 质量门控

1. **代码质量门控**：
   - TypeScript 类型检查无错误
   - ESLint 规则全部通过
   - 代码格式符合 Prettier 配置

2. **测试门控**：
   - 新功能必须包含测试
   - 所有测试必须通过
   - 不得降低测试覆盖率

3. **性能门控**：
   - Lighthouse 性能评分 > 90
   - 核心 Web Vitals 满足标准
   - 打包体积增长需要合理说明

### 复杂性管理

- 复杂性必须有充分理由和文档说明
- 优先选择简单方案，遵循 YAGNI（You Aren't Gonna Need It）原则
- 技术选型需要与团队讨论并记录决策

## Governance

**宪章管理与合规**

### 修订程序

- 宪章修订需要团队共识
- 重大修改（MAJOR 版本）需要正式审批
- 每次修订必须更新版本号并记录修改内容
- 修订必须包含迁移计划（如影响现有代码）

### 版本规则

- **MAJOR**：不兼容的治理/原则移除或重新定义
- **MINOR**：新增原则/部分或实质性扩展指南
- **PATCH**：澄清、措辞、错别字修正、非语义性改进

### 合规审查

- 所有 PR/审查必须验证宪章合规性
- 定期审查代码库是否符合宪章原则
- 持续改进和更新最佳实践
- 新成员入职时必须学习和理解本宪章

### 参考文档

- 运行时开发指导请参考 `.specify/templates/agent-file-template.md`
- 功能规划流程请参考 `.specify/templates/commands/*.md`

**Version**: 1.0.0 | **Ratified**: 2025-10-31 | **Last Amended**: 2025-10-31
