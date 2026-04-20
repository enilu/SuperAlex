# AI Skills 目录约定

本目录是本项目 AI skills 的唯一真源（source of truth）。

## 目录结构

- `common/`：多个 AI 工具都可复用的 skill。
- `codex/`：仅 Codex 使用的 skill。
- `claude/`：仅 Claude 使用的 skill。
- `opencode/`：仅 Opencode 使用的 skill。

每个 skill 使用独立目录，最少包含一个 `SKILL.md` 文件。
成熟 skill 推荐采用以下结构：

```text
common/
  skill-name/
    SKILL.md
    references/
    scripts/
    assets/
    examples/
```

其中：

- `SKILL.md`：入口文件，只保留触发条件、目标、硬规则、下钻入口。
- `references/`：详细说明、案例、流程、Gotchas。
- `scripts/`：可执行检查、初始化、验证脚本。
- `assets/`：模板、样板、固定格式。
- `examples/`：好结果与坏结果示例。

## 设计约束

- `SKILL.md` 只保留触发条件、任务目标、硬规则、边界和下钻入口，不写成大而全说明书。
- `description` 只描述“什么时候该用这个 skill”，不要摘要完整流程。
- 复杂说明、案例、Gotchas 优先放到 `references/`，避免在入口文件与附属文件重复维护。
- 能脚本化的确定性检查优先沉淀到 `scripts/`，不要只靠自然语言提醒。
- 高频 skill 建议补 `references/gotchas.md`，沉淀容易遗漏、容易误判的坑点。
- `Prompt` 不能覆盖 `README.md` 与 skill 的硬规则；单轮模板放到 `doc/ai/prompts/`，流程型内容留在 `doc/ai/skills/`。

## 当前初始 skills

- `common/project-shared`：项目通用约束与验证清单
- `common/child-edu-game-development`：儿童教育小游戏开发规范（受众、UI、玩法、技术与检查清单）
- `codex/project-codex`：Codex 专属协作工作流
- `claude/project-claude`：Claude 专属协作工作流
- `opencode/project-opencode`：Opencode 专属协作工作流

## 命中与执行建议

1. 先读取命中 skill 的 `SKILL.md`。
2. 若 `SKILL.md` 指向 `references/` 或 `scripts/`，按需继续读取或执行。
3. 信息仍不足时，再回到 `README.md` 或向用户确认，不直接假设。

## 命名建议

- skill 目录名尽量稳定，不要频繁变更。
- 同名 skill 避免在 `common/` 与工具专属目录同时出现。
- `SKILL.md` 内容保持简洁，复杂资料拆分到 `references/`。
- `name` 建议稳定且可搜索，`description` 聚焦触发条件与适用症状。
