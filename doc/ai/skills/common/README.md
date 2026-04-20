# Common Skills 说明

本目录用于沉淀多个 AI 工具都可复用的项目级通用 skill。

## 适用边界

以下内容适合放到 `doc/ai/skills/common/`：

- 不依赖某个特定 AI 工具能力，多个工具都应遵循的工作方法。
- 明显依赖项目结构、模块边界、代码模式、验证方式的流程型任务。
- 已经不是“一个 Prompt 模板”就能稳定完成，而需要固定步骤、下钻文档、脚本或检查清单的任务。

以下内容不建议放在这里：

- 只对某个工具有效的专属规则，这类应放在 `codex/`、`claude/`、`opencode/`。
- 单轮、轻流程、输入输出清晰的模板型内容，这类更适合放到 `doc/ai/prompts/`。
- 一次性应急经验或没有稳定复用价值的临时说明。

## 命中顺序建议

1. 先命中 `project-shared`
2. 再命中更具体的领域 skill
3. 最后根据任务需要补验证型 skill

## 当前已沉淀主题

- [project-shared/SKILL.md](./project-shared/SKILL.md)
- [child-edu-game-development/SKILL.md](./child-edu-game-development/SKILL.md)
