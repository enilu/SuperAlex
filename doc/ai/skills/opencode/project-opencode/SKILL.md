---
name: superalex-opencode
description: 适用于 Opencode 在本仓库执行代码、配置或文档变更，并需要遵守项目级协作入口约束时使用。
---

# SuperAlex Opencode Guidance

## 何时使用

- Opencode 在本仓库编辑代码、配置或文档时。

## 目标

- 补充 Opencode 入口差异项，不重复 README 与 `common/project-shared` 已定义的公共规则。

## 硬规则

- 优先小而可回退的补丁，不做无关重构。
- 保持模块边界与接口兼容性，跨模块影响需显式说明。
- 只验证受影响模块，交付时带上简洁的验证与风险说明。
- 会话落盘、Prompt 目录和计划目录约束统一以 `README.md` 为准。

## 依赖关系

- 先遵循 `common/project-shared`。
- 若命中更细分的业务 skill，以业务 skill 为主，本 skill 只补 Opencode 差异项。
