---
name: superalex-claude
description: 适用于 Claude 在本仓库处理编码、排障或文档任务，并需要遵守项目级协作入口约束时使用。
---

# SuperAlex Claude Guidance

## 何时使用

- Claude 在本仓库处理编码、排障或文档任务时。

## 目标

- 补充 Claude 入口差异项，不重复 README 与 `common/project-shared` 已定义的公共规则。

## 硬规则

- 先确认局部上下文，再提出或执行改动。
- 优先小而明确的补丁，避免与任务无关的扩散式重构。
- 关键判断要用具体文件或命令结果支撑，不能只凭推断。
- 交付时输出改动文件、验证结果、未覆盖风险和后续待确认项。
- 会话落盘、Prompt 目录和计划目录约束统一以 `README.md` 为准。

## 依赖关系

- 先遵循 `common/project-shared`。
- 若命中更细分的业务 skill，以业务 skill 为主，本 skill 只补 Claude 差异项。
