---
name: superalex-codex
description: 适用于 Codex 在本仓库执行代码改动、排障或文档更新，并需要遵守项目级协作入口约束时使用。
---

# SuperAlex Codex Guidance

## 何时使用

- Codex 在本仓库执行实现、修复、排障或文档任务时。

## 目标

- 补充 Codex 入口差异项，不重复 README 与 `common/project-shared` 已定义的公共规则。

## 硬规则

- 搜索与定位优先使用 `rg` / `rg --files`。
- 先做局部上下文确认，再进行最小化改动。
- 优先执行受影响模块的定向验证，不做无关全量命令。
- 交付时至少说明改动文件、验证命令与结果、未覆盖验证项和风险。
- 若在本仓库生成复杂任务计划文档，统一放到 `doc/superpowers/plans/`。

## 依赖关系

- 先遵循 `common/project-shared`。
- 若命中更细分的业务 skill，以业务 skill 为主，本 skill 只补 Codex 差异项。
