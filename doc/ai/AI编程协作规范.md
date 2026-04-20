# SuperAlex AI 编程协作规范（项目版）

> 基于《AI编程协作规范-V3》落地到本仓库的执行版。

## 1. 目标与范围

- 目标：统一 SuperAlex 仓库内 AI 协作的规则真源、执行顺序、产物目录、交付格式与验证标准。
- 范围：适用于 Codex、Claude、Cursor、Opencode 等可读写仓库文件的 AI 工具。
- 原则：仓库内规则优先、最小改动优先、验证闭环优先。

## 2. 规则真源与优先级

### 2.1 真源定义

- `README.md`：项目公共规则唯一真源。
- `doc/ai/skills/`：可复用流程型能力真源（多步骤任务）。
- `doc/ai/prompts/`：可复用模板型能力真源（单轮任务）。
- 工具入口文件（如 `AGENTS.md`、`CLAUDE.md`）：仅保留工具差异项。

### 2.2 冲突优先级

1. `README.md`
2. 命中的 `doc/ai/skills/**/SKILL.md`
3. 命中的 `doc/ai/prompts/**`
4. 工具入口文件（`AGENTS.md`、`CLAUDE.md` 等）

## 3. 仓库目录约定

### 3.1 AI 资产目录

```text
doc/
  ai/
    AI编程协作规范.md
    skills/
      common/
      codex/
      claude/
      opencode/
    prompts/
      project/
      tech/
      business/
      templates/
    sessions/
      yyyyMMdd/
        <git-user>.md
  superpowers/
    plans/
```

### 3.2 目录治理要求

- 同类资产必须放同类目录，不允许散落在仓库根目录。
- 复杂任务计划统一放 `doc/superpowers/plans/`。
- 会话沉淀统一放 `doc/ai/sessions/`。
- 目录或命名规则变化后，必须同步更新 README 与索引文档。

## 4. 执行顺序（强制）

1. 阅读 `README.md` 关键章节（项目结构、运行方式、约束）。
2. 扫描并命中 `doc/ai/skills/`。
3. 需要固定输出模板时复用 `doc/ai/prompts/`。
4. 最后读取工具入口差异项（`AGENTS.md` / `CLAUDE.md`）。
5. 实施最小必要改动并做定向验证。
6. 输出改动说明、风险、影响范围。
7. 完成会话落盘。

## 5. SuperAlex 项目实施约束

### 5.1 通用改动约束

- 项目为静态网页游戏集合，默认不引入框架与构建链。
- 优先保持现有模块模式：`config + app + manager`。
- 非需求驱动不得做跨游戏目录的大规模重构。
- 一次交付聚焦一个问题，避免同时改多个子项目核心逻辑。

### 5.2 代码与文案约束

- 代码注释与文档默认中文。
- 面向儿童的界面文本保持简洁、鼓励式、低认知负担。
- 兼容移动端优先，避免引入复杂交互手势依赖。

### 5.3 数据与存储约束

- 使用 `localStorage` 时必须保持项目前缀隔离：
  - `morngo_*`
  - `tangpoem_*`
  - 其他子项目新增键名需定义统一前缀
- 变更缓存键、配置键、题库结构时，必须说明迁移与兼容影响。

## 6. Skill 与 Prompt 的边界

- 满足“多步骤 + 多文件 + 需验证闭环”的任务，沉淀为 Skill。
- 满足“单轮输入 -> 固定结构输出”的任务，沉淀为 Prompt。
- 不把流程型任务硬塞成长 Prompt。
- 不把一次性对话沉淀为长期资产。

## 7. 会话沉淀规范

### 7.1 落盘路径与命名

- 路径：`doc/ai/sessions/yyyyMMdd/<git-user>.md`
- 若无法确定 `<git-user>`，先确认再写入。

### 7.2 写入格式

每轮追加：

```md
## YYYY-MM-DD HH:mm:ss <主题>
- 用户：...
- AI：...
- 关键改动：...
- 验证结果：...
- 待确认项：...
```

### 7.3 交付前校验

- 最终回复前，必须执行：

```bash
tail -n 20 doc/ai/sessions/yyyyMMdd/<git-user>.md
```

- 最终回复必须包含：

```text
会话落盘：已完成/失败 + 文件路径 + 时间戳
```

## 8. 验证与交付标准

### 8.1 最小验证要求

- 静态页面改动：至少验证对应页面可打开、无明显脚本报错。
- 脚本改动：至少执行与改动直接相关的最小命令。
- 无法验证时，必须明确原因与潜在风险。

### 8.2 最终输出最少包含

1. 关键改动文件
2. 每个关键文件的改动目的
3. 已执行验证与结果
4. 未执行验证项及原因（如有）
5. 未覆盖风险 / 待确认项
6. 影响范围
7. 会话落盘信息

## 9. 资产治理节奏

- 先完善高频任务 Prompt 与高风险任务 Skill。
- 定期清理低频、失效、重复资产。
- 每个成熟 Skill/Prompt 建议补充：owner、适用范围、更新时间、状态（draft/active）。

## 10. 本项目首批建议沉淀项

### 10.1 建议 Skill（流程型）

- `static-game-feature-delivery`：静态小游戏功能交付流程（需求分解 -> 最小改动 -> 页面验证）。
- `localstorage-schema-change`：本地存储键与结构变更流程（兼容策略与回滚说明）。
- `new-game-bootstrap`：基于 `templates/light-game-template/` 创建新游戏流程。

### 10.2 建议 Prompt（模板型）

- `bugfix-report-cn`：缺陷修复结果报告模板。
- `ui-copy-kids-cn`：儿童产品中文文案优化模板。
- `mini-test-checklist`：静态页面最小回归检查模板。

---

维护说明：本文件为 SuperAlex 仓库内 AI 协作规范真源之一；若与 `README.md` 冲突，以 `README.md` 为准。
