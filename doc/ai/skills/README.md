# Skills 目录说明

本目录存放项目内可复用的 Skill 资产，用于沉淀"多步骤、强上下文、强流程"的任务方法。

## 目录结构

```text
skills/
├── common/        # 跨工具复用的 Skill
├── codex/         # Codex 专属 Skill
├── claude/        # Claude 专属 Skill
└── README.md      # 本说明文件
```

## Skill 设计原则

- **入口轻量化**：`SKILL.md` 不写成大而全说明书
- **渐进式披露**：元数据负责触发，细节按需读取 `references/`、`scripts/`、`assets/`、`examples/`
- **description 只写触发条件**，不摘要完整流程
- **优先脚本化确定性动作**
- **优先沉淀 gotchas**，把反复踩过的坑变成默认保护

## 单个 Skill 目录标准

```text
skill-name/
  SKILL.md       # 入口文件：触发条件、目标、硬规则、下钻入口
  references/    # 详细说明、案例、流程、Gotchas
  scripts/       # 可执行检查、初始化、验证脚本
  assets/        # 模板、样板、固定格式
  examples/      # 好结果与坏结果示例
```

## Skill 命中与执行流程

1. 扫描本目录并匹配任务相关 Skill
2. 命中后先读 `SKILL.md`
3. 根据入口指引按需阅读 `references/`
4. 如存在 `scripts/`，优先运行确定性检查
5. 信息不足时先确认，不直接假设
6. 命中异常时按本 README 的备用方案处理
